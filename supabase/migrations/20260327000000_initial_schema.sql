-- =============================================================================
-- MIGRATION 1: base schema — enums, tables, constraints, indexes, helpers,
--              triggers, RLS
-- =============================================================================

-- gen_random_bytes() requires pgcrypto even on Postgres 15+
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('OWNER', 'FOREMAN', 'CREW');
create type public.project_status as enum ('ACTIVE', 'COMPLETED');
create type public.tool_status as enum (
  'AVAILABLE',
  'CHECKEDOUT',
  'OUT_OF_SERVICE',
  'ARCHIVED'
);
create type public.tool_condition as enum (
  'GOOD',
  'FAIR',
  'DAMAGED',
  'OUT_OF_SERVICE'
);

-- ---------------------------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------------------------

create table public.organizations (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  join_code  text        not null unique,
  created_by uuid        not null, -- FK to accounts added after accounts exists
  created_at timestamptz not null default now()
);

-- per-org sequential tool tag counter; only touched by generate_tool_tag()
create table public.org_tool_counters (
  org_id   uuid    primary key,
  next_tag integer not null default 1
);

create table public.accounts (
  id         uuid             primary key,
  org_id     uuid,            -- null until onboarding
  name       text             not null,
  email      text             not null,
  role       public.user_role not null default 'CREW',
  created_at timestamptz      not null default now()
);

create table public.org_invites (
  id            uuid             primary key default gen_random_uuid(),
  org_id        uuid             not null,
  token         text             not null unique,
  role          public.user_role not null,
  invited_email text,
  created_by    uuid             not null,
  expires_at    timestamptz      not null,
  used_at       timestamptz,
  used_by       uuid,
  created_at    timestamptz      not null default now()
);

create table public.projects (
  id            uuid                  primary key default gen_random_uuid(),
  org_id        uuid                  not null,
  project_name  text                  not null,
  start_date    date                  not null,
  end_date      date,
  status        public.project_status not null default 'ACTIVE',
  budget_amount numeric(12, 2),
  created_at    timestamptz           not null default now()
);

-- current-state snapshot; history lives in tool_management
create table public.tools (
  id          uuid                  primary key default gen_random_uuid(),
  org_id      uuid                  not null,
  project_id  uuid,                 -- null = org inventory
  name        text                  not null,
  tag_number  integer               not null,
  status      public.tool_status    not null default 'AVAILABLE',
  condition   public.tool_condition not null default 'GOOD',
  image_path  text,                 -- storage path, not a URL
  notes       text,
  created_at  timestamptz           not null default now()
);

create table public.checkout_sessions (
  id             uuid        primary key default gen_random_uuid(),
  org_id         uuid        not null,
  user_id        uuid        not null,
  session_name   text,
  checked_out_at timestamptz not null default now(),
  checked_in_at  timestamptz -- null while any tool in the session is still out
);

-- one row per tool per checkout; closed by return_tool()
create table public.tool_management (
  id                 uuid                  primary key default gen_random_uuid(),
  org_id             uuid                  not null,
  tool_id            uuid                  not null,
  user_id            uuid                  not null,
  session_id         uuid                  not null,
  condition_checkout public.tool_condition not null,
  condition_return   public.tool_condition,          -- null until returned
  checked_out        timestamptz           not null default now(),
  checked_in         timestamptz,                    -- null until returned
  return_image_path  text,
  notes              text
);

-- current-state inventory; unit_qty decremented by log_material_usage()
create table public.materials (
  id                  uuid          primary key default gen_random_uuid(),
  org_id              uuid          not null,
  project_id          uuid,         -- null = org inventory
  name                text          not null,
  unit_qty            numeric(12,2) not null default 0,
  unit_cost           numeric(12,2) not null,
  low_stock_threshold numeric(12,2) not null default 0,
  created_at          timestamptz   not null default now()
);

-- immutable; never updated or deleted after insert
create table public.material_usage (
  id            uuid          primary key default gen_random_uuid(),
  org_id        uuid          not null,
  material_id   uuid          not null,
  project_id    uuid          not null,
  user_id       uuid          not null,
  quantity_used numeric(12,2) not null,
  total_cost    numeric(12,2) not null, -- frozen at log time: qty * unit_cost
  logged_at     timestamptz   not null default now(),
  notes         text
);

-- ---------------------------------------------------------------------------
-- COMPOSITE UNIQUE CONSTRAINTS
-- ---------------------------------------------------------------------------
-- (id, org_id) anchors on each table are required so composite foreign keys
-- can reference (id, org_id) and enforce same-org integrity at the DB level.

alter table public.accounts
  add constraint accounts_id_org_id_unique unique (id, org_id);
alter table public.projects
  add constraint projects_id_org_id_unique unique (id, org_id);
alter table public.tools
  add constraint tools_id_org_id_unique         unique (id, org_id),
  add constraint tools_org_id_tag_number_unique  unique (org_id, tag_number);
alter table public.checkout_sessions
  add constraint checkout_sessions_id_org_id_unique unique (id, org_id);
alter table public.materials
  add constraint materials_id_org_id_unique unique (id, org_id);

-- one OWNER per org enforced as a partial unique index
create unique index accounts_one_owner_per_org_unique
  on public.accounts (org_id)
  where role = 'OWNER';

-- ---------------------------------------------------------------------------
-- FOREIGN KEYS
-- ---------------------------------------------------------------------------
-- organizations and accounts reference each other (circular). Resolution:
--   1. organizations created first (no created_by FK yet)
--   2. accounts created with FK to organizations
--   3. organizations.created_by FK added here after accounts exists

alter table public.accounts
  add constraint accounts_id_fkey
    foreign key (id) references auth.users (id) on delete cascade,
  add constraint accounts_org_id_fkey
    foreign key (org_id) references public.organizations (id);

-- resolves the circular dependency
alter table public.organizations
  add constraint organizations_created_by_fkey
    foreign key (created_by) references public.accounts (id);

alter table public.org_tool_counters
  add constraint org_tool_counters_org_id_fkey
    foreign key (org_id) references public.organizations (id);

alter table public.org_invites
  add constraint org_invites_org_id_fkey
    foreign key (org_id) references public.organizations (id),
  add constraint org_invites_created_by_org_id_fkey
    foreign key (created_by, org_id) references public.accounts (id, org_id),
  add constraint org_invites_used_by_org_id_fkey
    foreign key (used_by, org_id) references public.accounts (id, org_id);

alter table public.projects
  add constraint projects_org_id_fkey
    foreign key (org_id) references public.organizations (id);

alter table public.tools
  add constraint tools_org_id_fkey
    foreign key (org_id) references public.organizations (id),
  add constraint tools_project_id_org_id_fkey
    foreign key (project_id, org_id) references public.projects (id, org_id);

alter table public.checkout_sessions
  add constraint checkout_sessions_user_id_org_id_fkey
    foreign key (user_id, org_id) references public.accounts (id, org_id);

alter table public.tool_management
  add constraint tool_management_tool_id_org_id_fkey
    foreign key (tool_id, org_id) references public.tools (id, org_id),
  add constraint tool_management_user_id_org_id_fkey
    foreign key (user_id, org_id) references public.accounts (id, org_id),
  add constraint tool_management_session_id_org_id_fkey
    foreign key (session_id, org_id) references public.checkout_sessions (id, org_id);

alter table public.materials
  add constraint materials_org_id_fkey
    foreign key (org_id) references public.organizations (id),
  add constraint materials_project_id_org_id_fkey
    foreign key (project_id, org_id) references public.projects (id, org_id);

alter table public.material_usage
  add constraint material_usage_material_id_org_id_fkey
    foreign key (material_id, org_id) references public.materials (id, org_id),
  add constraint material_usage_project_id_org_id_fkey
    foreign key (project_id, org_id) references public.projects (id, org_id),
  add constraint material_usage_user_id_org_id_fkey
    foreign key (user_id, org_id) references public.accounts (id, org_id);

-- ---------------------------------------------------------------------------
-- CHECK CONSTRAINTS
-- ---------------------------------------------------------------------------
-- nullif(btrim(col), '') is not null rejects blank/whitespace-only strings.

alter table public.organizations
  add constraint organizations_name_not_blank_check
    check (nullif(btrim(name), '') is not null),
  add constraint organizations_join_code_format_check
    check (join_code ~ '^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$');

alter table public.org_tool_counters
  add constraint org_tool_counters_next_tag_check
    check (next_tag >= 1);

alter table public.accounts
  add constraint accounts_name_not_blank_check
    check (nullif(btrim(name), '') is not null);

alter table public.org_invites
  add constraint org_invites_role_check
    check (role in ('FOREMAN', 'CREW')),
  add constraint org_invites_foreman_email_check
    check (role <> 'FOREMAN' or nullif(btrim(invited_email), '') is not null),
  add constraint org_invites_used_pair_check
    check (
      (used_at is null and used_by is null)
      or (used_at is not null and used_by is not null)
    ),
  add constraint org_invites_expires_after_created_check
    check (expires_at > created_at);

alter table public.projects
  add constraint projects_name_not_blank_check
    check (nullif(btrim(project_name), '') is not null),
  add constraint projects_end_date_check
    check (end_date is null or end_date >= start_date),
  add constraint projects_budget_amount_check
    check (budget_amount is null or budget_amount > 0);

alter table public.tools
  add constraint tools_name_not_blank_check
    check (nullif(btrim(name), '') is not null),
  add constraint tools_tag_number_check
    check (tag_number >= 1);

alter table public.tool_management
  add constraint tool_management_return_pair_check
    check (
      (checked_in is null and condition_return is null)
      or (checked_in is not null and condition_return is not null)
    ),
  add constraint tool_management_checked_in_after_checked_out_check
    check (checked_in is null or checked_in >= checked_out);

alter table public.materials
  add constraint materials_name_not_blank_check
    check (nullif(btrim(name), '') is not null),
  add constraint materials_unit_qty_check
    check (unit_qty >= 0),
  add constraint materials_unit_cost_check
    check (unit_cost > 0),
  add constraint materials_low_stock_threshold_check
    check (low_stock_threshold >= 0);

alter table public.material_usage
  add constraint material_usage_quantity_used_check
    check (quantity_used > 0),
  add constraint material_usage_total_cost_check
    check (total_cost > 0);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------
create index accounts_org_id_idx
  on public.accounts (org_id);

create index projects_org_id_status_idx
  on public.projects (org_id, status);

-- (org_id, status) covers org-only lookups via index prefix; no separate org_id index needed
create index tools_org_id_status_idx
  on public.tools (org_id, status);

create index tools_project_id_idx
  on public.tools (project_id);

-- unique partial: DB-enforced one active checkout per tool at a time
create unique index tool_management_one_active_checkout_per_tool_idx
  on public.tool_management (tool_id)
  where checked_in is null;

create index tool_management_org_id_tool_id_active_idx
  on public.tool_management (org_id, tool_id)
  where checked_in is null;

create index tool_management_user_id_active_idx
  on public.tool_management (user_id)
  where checked_in is null;

create index materials_org_id_idx
  on public.materials (org_id);

create index materials_project_id_idx
  on public.materials (project_id);

create index material_usage_org_id_project_id_idx
  on public.material_usage (org_id, project_id);

create index checkout_sessions_user_id_active_idx
  on public.checkout_sessions (user_id)
  where checked_in_at is null;

-- ---------------------------------------------------------------------------
-- HELPER FUNCTIONS
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER + locked search_path: runs as migration owner so RLS
-- policies can call these without the caller needing direct table access.

create or replace function public.get_my_org_id()
returns uuid
language sql stable security definer
set search_path = public, extensions
as $$
  select org_id from public.accounts where id = auth.uid();
$$;

create or replace function public.get_my_role()
returns public.user_role
language sql stable security definer
set search_path = public, extensions
as $$
  select role from public.accounts where id = auth.uid();
$$;

-- true for OWNER or FOREMAN; false (never null) when caller has no account yet
create or replace function public.can_manage_ops()
returns boolean
language sql stable security definer
set search_path = public, extensions
as $$
  select coalesce(public.get_my_role() in ('OWNER', 'FOREMAN'), false);
$$;

-- ---------------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------------

-- Creates an accounts row for every new auth signup.
-- Tries metadata['name'], metadata['full_name'], email prefix, then uuid fallback.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public, extensions
as $$
declare
  new_name text;
begin
  new_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    new.id::text
  );

  insert into public.accounts (id, org_id, name, email, role)
  values (new.id, null, new_name, lower(new.email), 'CREW');

  return new;
end;
$$;

-- Assigns the next sequential tag_number for the tool's org.
-- Upsert pattern: first tool creates the counter row (next_tag = 2, returns 1).
-- Each subsequent tool bumps next_tag by 1 and returns next_tag - 1.
create or replace function public.generate_tool_tag()
returns trigger language plpgsql security definer
set search_path = public, extensions
as $$
declare
  assigned_tag integer;
begin
  if new.org_id is null then
    raise exception 'Tool org_id is required before tag generation.';
  end if;

  insert into public.org_tool_counters (org_id, next_tag)
  values (new.org_id, 2)
  on conflict (org_id) do update
    set next_tag = public.org_tool_counters.next_tag + 1
  returning next_tag - 1
  into assigned_tag;

  new.tag_number := assigned_tag;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists on_tools_generate_tag on public.tools;
create trigger on_tools_generate_tag
  before insert on public.tools
  for each row execute function public.generate_tool_tag();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
-- RLS is the hard tenant-isolation boundary. Tables that are written only by
-- workflow functions (organizations, org_invites, checkout_sessions,
-- tool_management, material_usage) have no INSERT/UPDATE policies — the only
-- write path into those tables is through the SECURITY DEFINER functions in
-- migration 2.

alter table public.organizations     enable row level security;
alter table public.accounts          enable row level security;
alter table public.org_tool_counters enable row level security;
alter table public.org_invites       enable row level security;
alter table public.projects          enable row level security;
alter table public.tools             enable row level security;
alter table public.checkout_sessions enable row level security;
alter table public.tool_management   enable row level security;
alter table public.materials         enable row level security;
alter table public.material_usage    enable row level security;

-- organizations: read-only for org members; writes via workflow functions only
create policy organizations_select_same_org
  on public.organizations for select to authenticated
  using (id = public.get_my_org_id());

-- accounts: everyone sees their own row; OWNER/FOREMAN see all org members
create policy accounts_select_visible_rows
  on public.accounts for select to authenticated
  using (
    id = (select auth.uid())
    or (org_id = public.get_my_org_id() and public.can_manage_ops())
  );

-- org_tool_counters: no direct access; trigger is SECURITY DEFINER so it bypasses this
create policy org_tool_counters_no_direct_access
  on public.org_tool_counters for all to public
  using (false) with check (false);

-- org_invites: OWNER/FOREMAN can read and delete; writes via workflow functions only
create policy org_invites_select_manageable_rows
  on public.org_invites for select to authenticated
  using (org_id = public.get_my_org_id() and public.can_manage_ops());

create policy org_invites_delete_manageable_rows
  on public.org_invites for delete to authenticated
  using (org_id = public.get_my_org_id() and public.can_manage_ops());

-- projects: all org members read; OWNER/FOREMAN write
create policy projects_select_same_org
  on public.projects for select to authenticated
  using (org_id = public.get_my_org_id());

create policy projects_insert_manageable_rows
  on public.projects for insert to authenticated
  with check (org_id = public.get_my_org_id() and public.can_manage_ops());

create policy projects_update_manageable_rows
  on public.projects for update to authenticated
  using (org_id = public.get_my_org_id() and public.can_manage_ops())
  with check (org_id = public.get_my_org_id() and public.can_manage_ops());

create policy projects_delete_manageable_rows
  on public.projects for delete to authenticated
  using (org_id = public.get_my_org_id() and public.can_manage_ops());

-- tools: all org members read; OWNER/FOREMAN write
create policy tools_select_same_org
  on public.tools for select to authenticated
  using (org_id = public.get_my_org_id());

create policy tools_insert_manageable_rows
  on public.tools for insert to authenticated
  with check (org_id = public.get_my_org_id() and public.can_manage_ops());

create policy tools_update_manageable_rows
  on public.tools for update to authenticated
  using (org_id = public.get_my_org_id() and public.can_manage_ops())
  with check (org_id = public.get_my_org_id() and public.can_manage_ops());

create policy tools_delete_manageable_rows
  on public.tools for delete to authenticated
  using (org_id = public.get_my_org_id() and public.can_manage_ops());

-- checkout_sessions: OWNER/FOREMAN see all; CREW see only their own
create policy checkout_sessions_select_visible_rows
  on public.checkout_sessions for select to authenticated
  using (
    org_id = public.get_my_org_id()
    and (public.can_manage_ops() or user_id = (select auth.uid()))
  );

-- tool_management: same split as checkout_sessions
create policy tool_management_select_visible_rows
  on public.tool_management for select to authenticated
  using (
    org_id = public.get_my_org_id()
    and (public.can_manage_ops() or user_id = (select auth.uid()))
  );

-- materials: OWNER/FOREMAN only
create policy materials_select_same_org
  on public.materials for select to authenticated
  using (org_id = public.get_my_org_id() and public.can_manage_ops());

create policy materials_insert_manageable_rows
  on public.materials for insert to authenticated
  with check (org_id = public.get_my_org_id() and public.can_manage_ops());

create policy materials_update_manageable_rows
  on public.materials for update to authenticated
  using (org_id = public.get_my_org_id() and public.can_manage_ops())
  with check (org_id = public.get_my_org_id() and public.can_manage_ops());

create policy materials_delete_manageable_rows
  on public.materials for delete to authenticated
  using (org_id = public.get_my_org_id() and public.can_manage_ops());

-- material_usage: OWNER/FOREMAN read only; writes via log_material_usage() only
create policy material_usage_select_same_org
  on public.material_usage for select to authenticated
  using (org_id = public.get_my_org_id() and public.can_manage_ops());
