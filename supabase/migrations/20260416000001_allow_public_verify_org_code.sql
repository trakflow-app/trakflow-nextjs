-- =============================================================================
-- MIGRATION: Allow public/unauthenticated users to verify org join codes
-- =============================================================================
-- This migration creates public functions that allow anyone (including
-- unauthenticated users) to verify org join codes during signup.
-- Needed for crew signup flow where user isn't authenticated yet.

-- Function to verify if org join code exists
create or replace function public.verify_org_code(join_code_input text)
returns boolean
language sql stable security definer
set search_path = public, extensions
as $$
  select exists(
    select 1 from public.organizations
    where join_code = upper(join_code_input)
  );
$$;

grant execute on function public.verify_org_code(text) to anon, authenticated;

-- Function to get org ID by join code (returns NULL if not found)
create or replace function public.get_org_id_by_code(join_code_input text)
returns uuid
language sql stable security definer
set search_path = public, extensions
as $$
  select id from public.organizations
  where join_code = upper(join_code_input)
  limit 1;
$$;

grant execute on function public.get_org_id_by_code(text) to anon, authenticated;

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

-- RLS policy: Allow public users to read organizations (needed for signup verification)
create policy organizations_anon_select
  on public.organizations for select to anon
  using (true);
