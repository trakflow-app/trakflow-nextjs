-- Match single-project detail queries that filter by org and project, then sort newest first.
create index if not exists tools_org_id_project_id_created_at_idx
  on public.tools (org_id, project_id, created_at desc);

create index if not exists materials_org_id_project_id_created_at_idx
  on public.materials (org_id, project_id, created_at desc);

-- Match project list pages that filter by org and sort newest first.
create index if not exists projects_org_id_created_at_idx
  on public.projects (org_id, created_at desc);
