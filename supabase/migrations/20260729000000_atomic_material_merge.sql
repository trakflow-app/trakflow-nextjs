-- Atomic, concurrency-safe material merge.
-- Replaces the JS read-then-write merge (app/services/materials-services.ts,
-- app/services/project-inventory-import-services.ts) with a single atomic
-- upsert, so two near-simultaneous writes to the same material can't
-- silently overwrite each other's contribution.

-- Pre-flight: this fails loudly (not silently) if duplicate
-- (org_id, project_id, name) rows already exist. Run this check against the
-- target database before applying:
--   select org_id, project_id, lower(btrim(name)), count(*)
--   from public.materials
--   group by 1, 2, 3
--   having count(*) > 1;

create unique index materials_org_project_name_unique_idx
  on public.materials (
    org_id,
    coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid),
    lower(btrim(name))
  );

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
