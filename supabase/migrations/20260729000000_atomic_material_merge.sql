-- Atomic, concurrency-safe material merge.
-- Replaces the JS read-then-write merge (app/services/materials-services.ts,
-- app/services/project-inventory-import-services.ts) with a single atomic
-- upsert, so two near-simultaneous writes to the same material can't
-- silently overwrite each other's contribution.

-- Deduplicate materials with the same (org_id, project_id, name).
-- Aggregates quantities, recalculates costs, and repoints usage records.
do $$
declare
  v_dup_group record;
  v_keep_id uuid;
  v_del_id uuid;
begin
  for v_dup_group in
    select
      org_id,
      project_id,
      lower(btrim(name)) as name_normalized,
      array_agg(id order by id) as ids,
      sum(unit_qty) as total_qty,
      case
        when sum(unit_qty) > 0
        then round(sum(unit_qty * unit_cost) / sum(unit_qty), 2)
        else (array_agg(unit_cost order by id))[1]
      end as avg_cost,
      min(low_stock_threshold) as min_threshold
    from public.materials
    group by 1, 2, 3
    having count(*) > 1
  loop
    v_keep_id := v_dup_group.ids[1];

    update public.materials
    set
      unit_qty = v_dup_group.total_qty,
      unit_cost = v_dup_group.avg_cost,
      low_stock_threshold = v_dup_group.min_threshold
    where id = v_keep_id;

    for i in 2..array_length(v_dup_group.ids, 1) loop
      v_del_id := v_dup_group.ids[i];
      update public.material_usages
      set material_id = v_keep_id
      where material_id = v_del_id;

      delete from public.materials where id = v_del_id;
    end loop;
  end loop;
end $$;

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
      case
        when public.materials.unit_qty + excluded.unit_qty = 0
        then public.materials.unit_cost
        else (public.materials.unit_qty * public.materials.unit_cost
          + excluded.unit_qty * excluded.unit_cost)
          / (public.materials.unit_qty + excluded.unit_qty)
      end,
      2
    )
  returning * into result_row;

  return result_row;
end;
$$;

grant execute on function public.merge_or_create_material(uuid, text, numeric, numeric, numeric) to authenticated;
