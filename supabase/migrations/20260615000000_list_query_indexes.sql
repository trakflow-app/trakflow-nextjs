-- Enables indexes for partial text search with ilike('%term%').
create extension if not exists pg_trgm with schema extensions;

-- Speeds up the default tools list for one organization, newest first.
create index if not exists tools_org_id_created_at_idx
  on public.tools (org_id, created_at desc);

-- Speeds up tools list filtering by status within one organization.
create index if not exists tools_org_id_status_created_at_idx
  on public.tools (org_id, status, created_at desc);

-- Speeds up tools list filtering by assignment type within one organization.
create index if not exists tools_org_id_type_created_at_idx
  on public.tools (org_id, type, created_at desc);

-- Speeds up tool name searches using partial text matching.
create index if not exists tools_name_trgm_idx
  on public.tools using gin (name gin_trgm_ops);

-- Speeds up the default materials list for one organization, newest first.
create index if not exists materials_org_id_created_at_idx
  on public.materials (org_id, created_at desc);

-- Speeds up material name searches using partial text matching.
create index if not exists materials_name_trgm_idx
  on public.materials using gin (name gin_trgm_ops);
