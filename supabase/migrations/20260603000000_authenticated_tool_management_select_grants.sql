-- Allow authenticated browser clients to read checkout workflow rows through RLS.
-- RLS policies on these tables enforce org-scoping and role/owner visibility.

grant select on public.checkout_sessions to authenticated;
grant select on public.tool_management to authenticated;
