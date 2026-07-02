-- Speeds up project name searches using partial text matching.
create extension if not exists pg_trgm with schema extensions;

create index if not exists projects_project_name_trgm_idx
  on public.projects using gin (project_name extensions.gin_trgm_ops);
