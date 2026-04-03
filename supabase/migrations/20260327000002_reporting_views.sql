-- =============================================================================
-- MIGRATION 3: reporting views
-- =============================================================================

-- security_invoker = true: view runs as the querying user, not the creator.
-- Without this, RLS is bypassed and all orgs' data would be visible to anyone.
create or replace view public.low_stock_materials
with (security_invoker = true) as
select
  materials.id,
  materials.org_id,
  materials.project_id,
  materials.name,
  materials.unit_qty,
  materials.unit_cost,
  materials.low_stock_threshold,
  materials.created_at
from public.materials as materials
where materials.unit_qty <= materials.low_stock_threshold;
