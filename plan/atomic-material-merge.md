# Atomic, Concurrency-Safe Material Merge

## Context

Materials import/create now merges into an existing material (same org + project + name) by summing quantity and recomputing a weighted-average unit cost, instead of creating duplicate rows. That logic currently lives in application code (`app/services/materials-services.ts`, `app/services/project-inventory-import-services.ts`): read the existing row, compute the merge in JS, then write it back.

This has a real race condition: if two writes target the same material at nearly the same time (two people importing at once, or an import racing a manual add), both can read the same starting quantity and each write a stale result — one update silently overwrites the other's contribution instead of both being counted. Read-then-write in application code can't fix this; it needs to be atomic at the database layer.

This plan makes the merge atomic and race-free using the same pattern this codebase already uses for exactly this kind of problem: `org_tool_counters` + `generate_tool_tag()` (a trigger) and `log_material_usage()` (a `SECURITY DEFINER` RPC with row locking) in `supabase/migrations/20260327000000_initial_schema.sql` and `20260327000001_workflow_functions.sql`. We follow that same shape — a `SECURITY DEFINER` Postgres function performing an atomic `INSERT ... ON CONFLICT ... DO UPDATE` — rather than inventing a new concurrency pattern.

A useful side effect: this also **removes** the JS-side batch pre-fetch map added in `project-inventory-import-services.ts` for performance, since the atomic RPC does the read+merge+write in one round trip per row — fewer round trips than the current batch approach (N vs. the current N+1) and correct under concurrency, where the JS map was only correct for a single sequential request.

Deferred out of the CSV/OCR import PR: this is a schema migration with a different risk profile (needs a duplicate-data check against the live DB before it can apply, harder to revert than app code) and the race it fixes is real but low-probability today (single-user sequential imports are the common case). Pick this up as its own PR once the import PR is merged.

## Design

### 1. New migration — add a uniqueness guarantee + atomic merge function

New file: `supabase/migrations/<date>_atomic_material_merge.sql` (use the actual apply date).

**a. Expression unique index** so "same material" is enforced by the database, not just application logic:

```sql
create unique index materials_org_project_name_unique_idx
  on public.materials (
    org_id,
    coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid),
    lower(btrim(name))
  );
```

`project_id` is nullable (org inventory), and Postgres does not treat two NULLs as equal for uniqueness purposes — the `coalesce(...)` collapses NULL to a fixed sentinel UUID so org-inventory materials are still deduplicated by name. `lower(btrim(name))` matches the case/whitespace-insensitive matching already used in JS (`normalizeMaterialName`).

**Pre-flight check before this migration is applied**: confirm no existing duplicate `(org_id, project_id, name)` rows in the target database — the `CREATE UNIQUE INDEX` will fail loudly (not silently corrupt data) if duplicates exist, which is the correct fail-safe, but it means checking first (`select org_id, project_id, lower(btrim(name)), count(*) from materials group by 1,2,3 having count(*) > 1`) rather than being surprised by a failed migration.

**b. `merge_or_create_material` function**, modeled directly on `log_material_usage`'s structure (`SECURITY DEFINER`, `auth.uid()` check, account/role lookup, `raise exception` on invalid input) but using an atomic upsert instead of a locked read + separate write:

```sql
create or replace function public.merge_or_create_material(
  p_project_id          uuid,
  p_name                text,
  p_quantity             numeric,
  p_unit_cost            numeric,
  p_low_stock_threshold  numeric default 0
)
returns public.materials
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  caller_user_id uuid := auth.uid();
  caller_account public.accounts%rowtype;
  result_row     public.materials%rowtype;
begin
  if caller_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'Material name is required.';
  end if;

  if p_quantity is null or p_quantity < 0 then
    raise exception 'Material quantity must be zero or greater.';
  end if;

  if p_unit_cost is null or p_unit_cost <= 0 then
    raise exception 'Material unit cost must be greater than zero.';
  end if;

  select accounts.* into caller_account
  from public.accounts as accounts
  where accounts.id = caller_user_id;

  if not found or caller_account.org_id is null then
    raise exception 'Account row is required before managing materials.';
  end if;

  if caller_account.role not in ('OWNER', 'FOREMAN') then
    raise exception 'Only OWNER or FOREMAN may manage materials.';
  end if;

  if p_project_id is not null then
    perform 1 from public.projects as projects
    where projects.id = p_project_id and projects.org_id = caller_account.org_id;

    if not found then
      raise exception 'Project was not found in the caller organization.';
    end if;
  end if;

  insert into public.materials
    (org_id, project_id, name, unit_qty, unit_cost, low_stock_threshold)
  values
    (caller_account.org_id, p_project_id, btrim(p_name), p_quantity, p_unit_cost, coalesce(p_low_stock_threshold, 0))
  on conflict (org_id, coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(btrim(name)))
  do update set
    unit_qty = public.materials.unit_qty + excluded.unit_qty,
    unit_cost = round(
      (public.materials.unit_qty * public.materials.unit_cost
        + excluded.unit_qty * excluded.unit_cost)
      / nullif(public.materials.unit_qty + excluded.unit_qty, 0),
      2
    )
  returning * into result_row;

  return result_row;
end;
$$;

grant execute on function public.merge_or_create_material(uuid, text, numeric, numeric, numeric) to authenticated;
```

Key decisions baked into this:
- `org_id` is **not** a parameter — it's always derived from the caller's own account row, same as `log_material_usage`'s `project_id`-vs-`caller_account.org_id` check. No caller-supplied org override, so there's no privilege-escalation surface.
- `low_stock_threshold` is only applied on the insert branch (`excluded` values aren't referenced for it in `do update`), matching current JS behavior: merging into existing stock doesn't reset a threshold someone already configured.
- The `ON CONFLICT` target expression must be **textually identical** to the unique index definition (including the literal sentinel UUID, not a variable) for Postgres to match it against the index — this is a real implementation detail to get right, not just a style choice.
- Called via the request-scoped client (`createClient()` from `lib/supabase/server.ts`), not the service-role admin client — same as `logMaterialUsageAction` already does for `log_material_usage`. The function is `SECURITY DEFINER` so it doesn't need elevated client privileges to write; it enforces its own auth/role/org checks internally.

### 2. Update `app/services/materials-services.ts`

Replace the body of `mergeOrCreateMaterial` (the manual "Add Material" path) with a single call:

```ts
const supabase = await createClient();
const { data, error } = await supabase.rpc('merge_or_create_material', {
  p_project_id: params.projectId,
  p_name: params.name,
  p_quantity: params.quantity,
  p_unit_cost: params.unitCost,
  p_low_stock_threshold: params.lowStockThreshold,
});
if (error) throw new Error(error.message);
return data;
```

This removes the need for `createAdminClient()`, the `ilike`/`escapeIlikePattern` lookup, and the local `computeMergedMaterialQuantityAndCost` call for this path — the database now does all of it atomically. `lib/materials/material-merge.ts` (`normalizeMaterialName`, `computeMergedMaterialQuantityAndCost`) can be deleted once nothing calls it, or kept temporarily if useful for client-side preview display math — check for remaining references before deleting.

### 3. Update `app/services/project-inventory-import-services.ts`

Replace the batch pre-fetch map + per-row insert/update branch with a straightforward loop calling the same RPC per material row (still sequential, for predictable per-row error attribution in `results`):

```ts
for (const materialRow of params.materials) {
  const parsed = importMaterialRowSchema.safeParse(materialRow);
  if (!parsed.success) { /* existing invalid-row handling */ continue; }

  const { error } = await supabase.rpc('merge_or_create_material', {
    p_project_id: params.projectId,
    p_name: parsed.data.name,
    p_quantity: parsed.data.quantity,
    p_unit_cost: parsed.data.unitCost,
    p_low_stock_threshold: parsed.data.lowStockThreshold,
  });

  if (error) { /* existing per-row failure handling */ continue; }

  materialsSaved += 1;
  results.push({ id: materialRow.id, entity: 'material', success: true });
}
```

This is simpler than the current code (no `materialsByName` map, no manual existing-row bookkeeping) and correct under concurrency, including two rows with the same name in the same CSV batch — each call is now atomic against the real database row rather than an in-memory snapshot.

## Files touched

- `supabase/migrations/<date>_atomic_material_merge.sql` (new) — unique index + `merge_or_create_material` function + grant.
- `app/services/materials-services.ts` — `mergeOrCreateMaterial` becomes an RPC call; drop now-unused admin-client lookup code for this path.
- `app/services/project-inventory-import-services.ts` — materials loop becomes a sequential RPC-call loop, dropping the batch pre-fetch map.
- `lib/materials/material-merge.ts` — re-check usage after the above; delete if nothing references it, otherwise leave as-is.

## Verification

- Apply the migration locally (`supabase db reset` or the project's local migration workflow per `docs/repo-bootstrap.md`), confirm it fails cleanly if duplicate materials already exist, and succeeds on a clean/deduplicated dataset.
- `npm run type-check`, `npm run lint`, `npm run build`.
- Manual: add "2x4 Lumber" via the manual form, then import a CSV with the same name in the same project — confirm one row, summed quantity, weighted-average cost (same as before, now via the RPC).
- Concurrency check (best-effort manual test): fire two near-simultaneous requests that merge into the same material (e.g. two browser tabs submitting at once, or a quick script issuing two `rpc` calls in parallel) and confirm the final quantity reflects **both** additions, not just one.
- Confirm `logMaterialUsageAction`'s existing `log_material_usage` RPC and the checkout/return flows are unaffected — this migration only adds a new index/function, it doesn't touch existing ones.
