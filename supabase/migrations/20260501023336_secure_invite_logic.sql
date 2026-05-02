-- =============================================================================
-- MIGRATION: Allow public users to mark an invite as used via token & email
-- This is also replacement of the old function
-- =============================================================================
-- Ensure FOREMAN invites have an email
DROP FUNCTION IF EXISTS public.mark_invite_used(text);
alter table public.org_invites
add constraint org_invites_foreman_email_required
check (role != 'FOREMAN' or (invited_email is not null));

-- Secure the mark_invite_used function
create or replace function public.mark_invite_used(token_input text, user_id_input uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    actual_email text;
begin
    -- Get the email associated with the new User ID from Supabase Auth
    select email into actual_email from auth.users where id = user_id_input;

    -- Update only if the email matches the invite (for Foremen)
    update public.org_invites
    set
        used_at = now(),
        used_by = user_id_input
    where token = token_input
      and (role != 'FOREMAN' or lower(invited_email) = lower(actual_email))
      and used_at is null
      and expires_at > now();

    if not found then
        raise exception 'Invite validation failed: Link is invalid, expired, or unauthorized.';
    end if;
end;
$$;

grant execute on function public.mark_invite_used(text, uuid) to anon, authenticated;
