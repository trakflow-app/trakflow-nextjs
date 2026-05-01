-- =============================================================================
-- MIGRATION: Add get_org_name_by_code RPC function (was missing from previous migration)
-- =============================================================================

-- Function to get org name by join code (returns NULL if not found)
create or replace function public.get_org_name_by_code(join_code_input text)
returns text
language sql stable security definer
set search_path = public, extensions
as $$
  select name from public.organizations
  where join_code = upper(join_code_input)
  limit 1;
$$;

grant execute on function public.get_org_name_by_code(text) to anon, authenticated;
