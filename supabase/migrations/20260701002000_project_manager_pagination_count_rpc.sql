create or replace function public.count_project_manager_rows(
  target_org_id uuid,
  search_query text default '',
  status_filter public.project_status default null
)
returns bigint
language sql
stable
security definer
set search_path = public, extensions
as $$
  select count(*)
  from public.projects as projects
  where projects.org_id = target_org_id
    and projects.org_id = public.get_my_org_id()
    and public.can_manage_ops()
    and (search_query = '' or projects.project_name ilike '%' || search_query || '%')
    and (status_filter is null or projects.status = status_filter);
$$;

revoke execute on function public.get_paginated_project_manager_rows(
  uuid,
  text,
  public.project_status,
  integer,
  integer
) from public;

revoke execute on function public.count_project_manager_rows(
  uuid,
  text,
  public.project_status
) from public;

grant execute on function public.get_paginated_project_manager_rows(
  uuid,
  text,
  public.project_status,
  integer,
  integer
) to authenticated;

grant execute on function public.count_project_manager_rows(
  uuid,
  text,
  public.project_status
) to authenticated;
