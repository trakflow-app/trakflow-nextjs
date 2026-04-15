-- =============================================================================
-- MIGRATION 5: make accounts.role nullable with no default
-- =============================================================================
-- Role is now null until the user either creates an org (→ OWNER via create_org()) or joins one
-- (→ FOREMAN/CREW via claim_org_invite() or join_org_by_code()).

alter table public.accounts
  alter column role drop default,
  alter column role drop not null;

update public.accounts
set role = null
where org_id is null;

alter table public.accounts
  add constraint accounts_role_org_consistency_check
    check (
      (org_id is null and role is null)
      or (org_id is not null and role is not null)
    );

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public, extensions
as $$
declare
  new_name text;
begin
  new_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    new.id::text
  );

  insert into public.accounts (id, org_id, name, email, role)
  values (new.id, null, new_name, lower(new.email), null);

  return new;
end;
$$;
