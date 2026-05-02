-- =============================================================================
-- MIGRATION: Allow public users to mark an invite as used via token
-- =============================================================================

-- This function allows unauthenticated users to finalize their invite
-- without needing direct UPDATE permissions on the org_invites table.
create or replace function public.mark_invite_used(token_input text, user_id_input uuid)
returns void
language sql
security definer
set search_path = public, extensions as $$
  update public.org_invites
  set
    used_at = now()
    used_by = user_id_input
  where token = token_input;
$$;

-- Grant execute permission to anonymous and authenticated users
grant execute on function public.mark_invite_used(text) to anon, authenticated;
