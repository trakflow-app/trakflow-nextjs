-- =============================================================================
-- MIGRATION: reconcile handle_new_user with nullable accounts.role
-- =============================================================================
-- Standard signups should create an accounts row with org_id = null and role = null.
-- If metadata includes both a valid org_id and a valid role, preserve them together.
-- This keeps the trigger compatible with accounts_role_org_consistency_check.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_name text;
  user_meta jsonb;
  metadata_org_id text;
  metadata_role text;
  new_org_id uuid;
  new_role public.user_role;
begin
  if new.raw_user_meta_data ? 'metadata' then
    user_meta := new.raw_user_meta_data -> 'metadata';
  else
    user_meta := new.raw_user_meta_data;
  end if;

  new_name := coalesce(
    nullif(btrim(user_meta ->> 'name'), ''),
    nullif(btrim(user_meta ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    new.id::text
  );

  metadata_org_id := nullif(btrim(user_meta ->> 'organization_id'), '');
  metadata_role := nullif(btrim(user_meta ->> 'role'), '');

  if metadata_org_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    new_org_id := metadata_org_id::uuid;
  else
    new_org_id := null;
  end if;

  if metadata_role in ('OWNER', 'FOREMAN', 'CREW') then
    new_role := metadata_role::public.user_role;
  else
    new_role := null;
  end if;

  -- Only keep org-linked metadata when both values are present and valid.
  -- Normal signups should remain org-less until workflow functions attach them later.
  if new_org_id is null or new_role is null then
    new_org_id := null;
    new_role := null;
  end if;

  insert into public.accounts (id, org_id, name, email, role)
  values (new.id, new_org_id, new_name, lower(new.email), new_role);

  return new;
end;
$$;
