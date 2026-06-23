-- Enables indexes for partial text search with ilike('%term%').
create extension if not exists pg_trgm with schema extensions;

-- Speeds up tools list filtering by status while preserving tag-number order.
create index if not exists tools_org_id_status_tag_number_idx
  on public.tools (org_id, status, tag_number);

-- Assignment type is derived from whether project_id is null.
create index if not exists tools_org_id_inventory_tag_number_idx
  on public.tools (org_id, tag_number)
  where project_id is null;

create index if not exists tools_org_id_assigned_tag_number_idx
  on public.tools (org_id, tag_number)
  where project_id is not null;

-- Speeds up tool name searches using partial text matching.
create index if not exists tools_name_trgm_idx
  on public.tools using gin (name extensions.gin_trgm_ops);

-- Speeds up the default materials list for one organization, newest first.
create index if not exists materials_org_id_created_at_idx
  on public.materials (org_id, created_at desc);

-- Speeds up material name searches using partial text matching.
create index if not exists materials_name_trgm_idx
  on public.materials using gin (name extensions.gin_trgm_ops);
