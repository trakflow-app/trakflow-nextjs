create or replace function public.get_project_manager_page(
  target_org_id uuid,
  search_query text default '',
  status_filter public.project_status default null,
  page_limit integer default 6,
  page_offset integer default 0
)
returns table (
  total_count bigint,
  projects jsonb
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with filtered_projects as (
    select
      project_rows.id,
      project_rows.org_id,
      project_rows.project_name,
      project_rows.status,
      project_rows.start_date,
      project_rows.end_date,
      project_rows.budget_amount,
      project_rows.created_at
    from public.projects as project_rows
    where project_rows.org_id = target_org_id
      and project_rows.org_id = public.get_my_org_id()
      and public.can_manage_ops()
      and (search_query = '' or project_rows.project_name ilike '%' || search_query || '%')
      and (status_filter is null or project_rows.status = status_filter)
  ),
  paged_projects as (
    select *
    from filtered_projects
    order by created_at desc
    limit page_limit
    offset page_offset
  )
  select
    (select count(*) from filtered_projects) as total_count,
    coalesce(
      (
        select jsonb_agg(to_jsonb(paged_projects) order by paged_projects.created_at desc)
        from paged_projects
      ),
      '[]'::jsonb
    ) as projects;
$$;

revoke execute on function public.get_project_manager_page(
  uuid,
  text,
  public.project_status,
  integer,
  integer
) from public;

grant execute on function public.get_project_manager_page(
  uuid,
  text,
  public.project_status,
  integer,
  integer
) to authenticated;
