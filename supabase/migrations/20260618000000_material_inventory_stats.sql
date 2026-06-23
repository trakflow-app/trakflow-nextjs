-- Aggregate material summary cards in PostgreSQL so list pages do not download
-- every material row. security_invoker preserves the underlying material RLS.
create or replace view public.material_inventory_stats
with (security_invoker = true) as
select
  materials.org_id,
  count(*)::bigint as total_materials,
  coalesce(sum(materials.unit_qty * materials.unit_cost), 0) as inventory_value,
  count(*) filter (
    where materials.unit_qty <= materials.low_stock_threshold
  )::bigint as low_stock_count
from public.materials as materials
group by materials.org_id;

grant select on public.material_inventory_stats to authenticated;
