create or replace function public.get_paginated_project_manager_rows(
  target_org_id uuid,
  search_query text default '',
  status_filter public.project_status default null,
  page_limit integer default 6,
  page_offset integer default 0
)
returns table (
  id uuid,
  org_id uuid,
  project_name text,
  status public.project_status,
  start_date date,
  end_date date,
  budget_amount numeric,
  created_at timestamptz,
  total_count bigint
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
    projects.created_at,
    count(*) over() as total_count
  from public.projects as projects
  where projects.org_id = target_org_id
    and projects.org_id = public.get_my_org_id()
    and public.can_manage_ops()
    and (search_query = '' or projects.project_name ilike '%' || search_query || '%')
    and (status_filter is null or projects.status = status_filter)
  order by projects.created_at desc
  limit page_limit
  offset page_offset;
$$;

grant execute on function public.get_paginated_project_manager_rows(
  uuid,
  text,
  public.project_status,
  integer,
  integer
) to authenticated;
