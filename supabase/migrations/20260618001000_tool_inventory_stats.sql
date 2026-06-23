-- Aggregate tool summary cards in one query instead of four count requests.
create or replace view public.tool_inventory_stats
with (security_invoker = true) as
select
  tools.org_id,
  count(*)::bigint as total_tools,
  count(*) filter (
    where tools.status = 'AVAILABLE'
  )::bigint as available_tools,
  count(*) filter (
    where tools.status = 'CHECKEDOUT'
  )::bigint as checked_out_tools,
  count(*) filter (
    where tools.status = 'OUT_OF_SERVICE'
       or tools.condition in ('DAMAGED', 'OUT_OF_SERVICE')
  )::bigint as service_tools
from public.tools as tools
group by tools.org_id;

grant select on public.tool_inventory_stats to authenticated;
