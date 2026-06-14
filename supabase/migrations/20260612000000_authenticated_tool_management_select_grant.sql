-- Allow authenticated users to read visible tool workflow rows through RLS.
-- Writes remain restricted to the checkout_tools and return_tool RPCs.
grant select on public.tool_management to authenticated;
