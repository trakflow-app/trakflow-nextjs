-- Enforce project budget visibility at the database access boundary.
-- Authenticated clients may read non-sensitive project columns directly for
-- joins/options, but budget_amount is only exposed through a manager-checked RPC.

revoke select on table public.projects from authenticated;
grant select (
  id,
  org_id,
  project_name,
  start_date,
  end_date,
  status,
  created_at
) on table public.projects to authenticated;

grant insert, update, delete on table public.projects to authenticated;

create or replace function public.get_project_manager_rows(
  target_org_id uuid,
  target_project_id uuid default null,
  result_limit integer default null
)
returns table (
  id uuid,
  org_id uuid,
  project_name text,
  status public.project_status,
  start_date date,
  end_date date,
  budget_amount numeric,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    projects.id,
    projects.org_id,
    projects.project_name,
    projects.status,
    projects.start_date,
    projects.end_date,
    projects.budget_amount,
    projects.created_at
  from public.projects as projects
  where projects.org_id = target_org_id
    and projects.org_id = public.get_my_org_id()
    and public.can_manage_ops()
    and (target_project_id is null or projects.id = target_project_id)
  order by projects.created_at desc
  limit result_limit;
$$;

grant execute on function public.get_project_manager_rows(uuid, uuid, integer)
  to authenticated;
