# Trakflow - Migration Plan (Locked v1)

Target: 3 migration files under `supabase/migrations/`.
Write them in order and never reorder them after they run.

---

## Migration Overview

| File                                    | Purpose                                                              |
| --------------------------------------- | -------------------------------------------------------------------- |
| `20260327000000_initial_schema.sql`     | enums, tables, constraints, indexes, helper functions, triggers, RLS |
| `20260327000001_workflow_functions.sql` | multi-step business workflow functions                               |
| `20260327000002_reporting_views.sql`    | reporting views                                                      |

Rule of thumb:

- simple entity CRUD -> direct RLS-backed access
- multi-step business flows -> DB workflow function only
- reporting -> views in the last migration

---

## Locked Decisions

### Roles

- `OWNER`, `FOREMAN`, `CREW`
- one `OWNER` per org in v1
- no ownership transfer in v1

### Onboarding

- org creation -> `OWNER`
- targeted foreman invite -> `FOREMAN`
- join code or crew invite -> `CREW`

### Org creation gating

- env-based org creation gating lives in the Next.js server layer
- it does not belong in SQL
- the SQL function still validates org-less caller, but allowlist/domain checks happen before calling it

### Join code

- format: `XXXX-XXXX`
- regex: `^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$`
- uppercase only
- generated server-side / workflow-side only

### Tool media storage

- use `image_path`, not `image_url`, for tool images
- use `return_image_path`, not `return_image_url`, for return evidence
- store private bucket paths only
- signed URLs are generated at read time

### Checkout model

- use `checkout_sessions`
- every checkout action gets one session row
- single-tool and multi-tool checkout share the same model
- `tool_management.session_id` is `NOT NULL`

### Tool state model

- `tool_status`: `AVAILABLE`, `CHECKEDOUT`, `OUT_OF_SERVICE`, `ARCHIVED`
- `tool_condition`: `GOOD`, `FAIR`, `DAMAGED`, `OUT_OF_SERVICE`
- condition updates at checkout and at return

### Materials model

- `materials.project_id` is nullable
- `NULL` means org inventory
- non-null means project-specific stock
- project-specific materials may only be consumed by that same project in v1
- `material_usage.project_id` is always required

### Same-org integrity

- use composite unique `(id, org_id)` anchors
- use composite foreign keys for cross-table references
- this prevents cross-org relationships even through privileged paths

### Workflow-function-only writes

No direct INSERT/UPDATE policies on:

- `organizations`
- `org_invites`
- `checkout_sessions`
- `tool_management`
- `material_usage`

### low_stock_materials

- create in migration 3
- use `security_invoker = true`

---

## Migration 1 - `20260327000000_initial_schema.sql`

### Write sections in this order

```text
1. Extensions
2. Enums
3. Base tables
4. Composite unique constraints
5. Composite foreign keys
6. Check constraints
7. Indexes
8. Helper functions
9. Triggers
10. RLS
```

---

### 1. Extensions

Use:

```sql
create extension if not exists pgcrypto;
```

`pgcrypto` is enough for:

- `gen_random_uuid()`
- `gen_random_bytes()`

---

### 2. Enums

```sql
create type public.user_role as enum ('OWNER', 'FOREMAN', 'CREW');
create type public.project_status as enum ('ACTIVE', 'COMPLETED');
create type public.tool_status as enum ('AVAILABLE', 'CHECKEDOUT', 'OUT_OF_SERVICE', 'ARCHIVED');
create type public.tool_condition as enum ('GOOD', 'FAIR', 'DAMAGED', 'OUT_OF_SERVICE');
```

---

### 3. Base tables

#### 3a. `organizations`

Purpose: tenant/company

Columns:

- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `join_code text not null unique`
- `created_by uuid not null`
- `created_at timestamptz not null default now()`

Rules:

- `name` must be nonblank
- `join_code` must match the locked regex
- `created_by` is required by data model
- FK to `accounts(id)` is added later after `accounts` exists

#### 3b. `org_tool_counters`

Purpose: per-org tool tag counter

Columns:

- `org_id uuid primary key`
- `next_tag integer not null default 1`

Rules:

- one row per org
- only touched by tag-generation trigger
- `next_tag >= 1`

#### 3c. `accounts`

Purpose: app-side profile for each auth user

Columns:

- `id uuid primary key`
- `org_id uuid null`
- `name text not null`
- `email text not null`
- `role public.user_role not null default 'CREW'`
- `created_at timestamptz not null default now()`

Rules:

- `id` references `auth.users(id) on delete cascade`
- `org_id` nullable until onboarding
- `name` nonblank

#### 3d. `org_invites`

Purpose: onboarding token table

Columns:

- `id uuid primary key default gen_random_uuid()`
- `org_id uuid not null`
- `token text not null unique`
- `role public.user_role not null`
- `invited_email text`
- `created_by uuid not null`
- `expires_at timestamptz not null`
- `used_at timestamptz`
- `used_by uuid`
- `created_at timestamptz not null default now()`

Rules:

- `role` must be constrained to `FOREMAN` or `CREW` at the DB level
- foreman invites must require a nonblank `invited_email`
- `(used_at, used_by)` must be both null or both set
- `expires_at > created_at`

#### 3e. `projects`

Purpose: org project / job site

Columns:

- `id uuid primary key default gen_random_uuid()`
- `org_id uuid not null`
- `project_name text not null`
- `start_date date not null`
- `end_date date`
- `status public.project_status not null default 'ACTIVE'`
- `budget_amount numeric(12,2)`
- `created_at timestamptz not null default now()`

Rules:

- `project_name` nonblank
- `end_date is null or end_date >= start_date`
- `budget_amount is null or budget_amount > 0`

#### 3f. `tools`

Purpose: current-state tool table

Columns:

- `id uuid primary key default gen_random_uuid()`
- `org_id uuid not null`
- `project_id uuid`
- `name text not null`
- `tag_number integer not null`
- `status public.tool_status not null default 'AVAILABLE'`
- `condition public.tool_condition not null default 'GOOD'`
- `image_path text`
- `notes text`
- `created_at timestamptz not null default now()`

Rules:

- `project_id` nullable
- `(org_id, tag_number)` unique
- `tag_number >= 1`
- `name` nonblank

#### 3g. `checkout_sessions`

Purpose: one row per checkout action

Columns:

- `id uuid primary key default gen_random_uuid()`
- `org_id uuid not null`
- `user_id uuid not null`
- `session_name text`
- `checked_out_at timestamptz not null default now()`
- `checked_in_at timestamptz`

Rules:

- exists for every checkout action, even single-tool checkout

#### 3h. `tool_management`

Purpose: checkout / return audit table

Columns:

- `id uuid primary key default gen_random_uuid()`
- `org_id uuid not null`
- `tool_id uuid not null`
- `user_id uuid not null`
- `session_id uuid not null`
- `condition_checkout public.tool_condition not null`
- `condition_return public.tool_condition`
- `checked_out timestamptz not null default now()`
- `checked_in timestamptz`
- `return_image_path text`
- `notes text`

Rules:

- `(checked_in, condition_return)` must be both null or both set
- one active checkout per tool at a time
- `return_image_path` is optional and stores a private storage path for return evidence only

#### 3i. `materials`

Purpose: current-state inventory table

Columns:

- `id uuid primary key default gen_random_uuid()`
- `org_id uuid not null`
- `project_id uuid`
- `name text not null`
- `unit_qty numeric(12,2) not null default 0`
- `unit_cost numeric(12,2) not null`
- `low_stock_threshold numeric(12,2) not null default 0`
- `created_at timestamptz not null default now()`

Rules:

- `project_id` nullable
- `NULL` means org inventory
- non-null means project-specific stock
- `name` nonblank
- `unit_qty >= 0`
- `unit_cost > 0`
- `low_stock_threshold >= 0`

#### 3j. `material_usage`

Purpose: immutable material consumption history

Columns:

- `id uuid primary key default gen_random_uuid()`
- `org_id uuid not null`
- `material_id uuid not null`
- `project_id uuid not null`
- `user_id uuid not null`
- `quantity_used numeric(12,2) not null`
- `total_cost numeric(12,2) not null`
- `logged_at timestamptz not null default now()`
- `notes text`

Rules:

- `quantity_used > 0`
- `total_cost > 0`
- consumption always has project context

---

### 4. Composite unique constraints

Add `(id, org_id)` unique anchors to:

- `accounts`
- `projects`
- `tools`
- `checkout_sessions`
- `materials`

Also add:

- unique owner per org via partial unique index:
  - one row in `accounts` per `org_id` where `role = 'OWNER'`

---

### 5. Composite foreign keys

Use same-org composite references:

- `organizations.created_by -> accounts(id)` standard FK after `accounts` exists
- `accounts.org_id -> organizations(id)`
- `org_tool_counters.org_id -> organizations(id)`

- `org_invites.org_id -> organizations(id)`
- `org_invites(created_by, org_id) -> accounts(id, org_id)`
- `org_invites(used_by, org_id) -> accounts(id, org_id)`

- `projects.org_id -> organizations(id)`

- `tools(project_id, org_id) -> projects(id, org_id)`
- `tools.org_id -> organizations(id)`

- `checkout_sessions(user_id, org_id) -> accounts(id, org_id)`

- `tool_management(tool_id, org_id) -> tools(id, org_id)`
- `tool_management(user_id, org_id) -> accounts(id, org_id)`
- `tool_management(session_id, org_id) -> checkout_sessions(id, org_id)`

- `materials(project_id, org_id) -> projects(id, org_id)`
- `materials.org_id -> organizations(id)`

- `material_usage(material_id, org_id) -> materials(id, org_id)`
- `material_usage(project_id, org_id) -> projects(id, org_id)`
- `material_usage(user_id, org_id) -> accounts(id, org_id)`

Use `DEFERRABLE INITIALLY DEFERRED` only where transaction ordering truly needs it.

---

### 6. Check constraints

Required checks:

- `organizations`
  - nonblank `name`
  - `join_code` regex

- `org_tool_counters`
  - `next_tag >= 1`

- `accounts`
  - nonblank `name`

- `org_invites`
  - `role in ('FOREMAN', 'CREW')`
  - `role = 'FOREMAN'` requires nonblank `invited_email`
  - `used_at/used_by` paired
  - `expires_at > created_at`

- `projects`
  - nonblank `project_name`
  - `end_date is null or end_date >= start_date`
  - `budget_amount is null or budget_amount > 0`

- `tools`
  - nonblank `name`
  - `tag_number >= 1`

- `tool_management`
  - `checked_in/condition_return` paired
  - `checked_in is null or checked_in >= checked_out`

- `materials`
  - nonblank `name`
  - `unit_qty >= 0`
  - `unit_cost > 0`
  - `low_stock_threshold >= 0`

- `material_usage`
  - `quantity_used > 0`
  - `total_cost > 0`

---

### 7. Indexes

Must-have indexes:

- `accounts(org_id)`

- `projects(org_id, status)`

- `tools(org_id, status)`
- `tools(project_id)`

- partial unique active checkout:
  - `tool_management(tool_id) where checked_in is null`

- `tool_management(org_id, tool_id) where checked_in is null`
- `tool_management(user_id) where checked_in is null`

- `materials(org_id)`
- `materials(project_id)`

- `material_usage(org_id, project_id)`

- `checkout_sessions(user_id) where checked_in_at is null`

Do not add redundant indexes where a unique constraint or left-prefix composite index already covers the query shape.

---

### 8. Helper functions

Use `SECURITY DEFINER` with locked `search_path`.

Recommended helpers:

- `get_my_org_id() -> uuid`
- `get_my_role() -> public.user_role`
- `can_manage_ops() -> boolean`
  - true for `OWNER` or `FOREMAN`

Reason:

- project/tool/material write policies should allow `OWNER` and `FOREMAN`
- org-level admin behavior can remain owner-only at the app/function level

---

### 9. Triggers

Use only these triggers in migration 1:

#### `handle_new_user()`

- `AFTER INSERT ON auth.users`
- creates matching `accounts` row
- `org_id = null`
- default-safe role value on insert
- onboarding changes role later

#### `generate_tool_tag()`

- `BEFORE INSERT ON tools`
- upserts `org_tool_counters`
- assigns next `tag_number`
- use `insert ... on conflict (org_id) do update ... returning`
- atomic and safe for concurrent inserts

No other triggers required in migration 1.

---

### 10. RLS

Enable RLS on every org-bound table.

#### Direct CRUD tables

Direct RLS-backed writes allowed on:

- `projects`
- `tools` metadata
- `materials` metadata

#### Function-only write tables

No direct INSERT/UPDATE policies on:

- `organizations`
- `org_invites`
- `checkout_sessions`
- `tool_management`
- `material_usage`

#### Policy intent by table

| Table               | SELECT                                                                        | INSERT             | UPDATE                                  | DELETE                  |
| ------------------- | ----------------------------------------------------------------------------- | ------------------ | --------------------------------------- | ----------------------- |
| `organizations`     | org member                                                                    | via function only  | via function only                       | -                       |
| `accounts`          | own row for all, full same-org member visibility for `OWNER` / `FOREMAN` only | via trigger only   | via `update_my_profile()` function only | -                       |
| `org_invites`       | owner/foreman view org invites                                                | via function only  | via function only                       | owner/foreman as needed |
| `projects`          | org members                                                                   | `can_manage_ops()` | `can_manage_ops()`                      | `can_manage_ops()`      |
| `tools`             | org members                                                                   | `can_manage_ops()` | `can_manage_ops()`                      | `can_manage_ops()`      |
| `checkout_sessions` | org members, org-wide visibility for owner/foreman                            | no direct policy   | no direct policy                        | -                       |
| `tool_management`   | own rows + org-wide for owner/foreman                                         | no direct policy   | no direct policy                        | -                       |
| `materials`         | `can_manage_ops()` only                                                       | `can_manage_ops()` | `can_manage_ops()`                      | `can_manage_ops()`      |
| `material_usage`    | `can_manage_ops()` only                                                       | no direct policy   | -                                       | -                       |
| `org_tool_counters` | -                                                                             | trigger only       | trigger only                            | -                       |

For `org_tool_counters`, use an explicit deny-all direct-access policy so the trigger-only intent is visible to security tooling.

For `accounts`, keep direct `UPDATE` policies closed and use a required narrow profile workflow instead.

---

## Migration 2 - `20260327000001_workflow_functions.sql`

All workflow functions should:

- use `auth.uid()` internally
- run atomically
- avoid trusting passed `user_id`
- enforce role/business rules close to the data

### Org onboarding functions

#### `create_org(name text) -> uuid`

Behavior:

1. read caller via `auth.uid()`
2. ensure caller has an `accounts` row
3. ensure caller has no org yet
4. create organization with valid join code and `created_by = auth.uid()`
5. update caller account:
   - set `org_id`
   - set `role = 'OWNER'`
6. return org id

Note:

- org creation gating by env is checked in the Next.js server layer before calling this function

#### `join_org_by_code(code text) -> uuid`

Behavior:

1. uppercase input
2. validate format
3. find organization
4. ensure caller has no org yet
5. update caller account:
   - set `org_id`
   - set `role = 'CREW'`
6. return org id

#### `create_org_invite(role public.user_role, invited_email text default null) -> text`

Behavior:

1. derive caller via `auth.uid()`
2. load caller org and role
3. enforce invite rules:
   - `OWNER` may invite `FOREMAN` or `CREW`
   - `FOREMAN` may invite `CREW` only
4. if inviting `FOREMAN`, require `invited_email`
5. optionally allow targeted `CREW` invite
6. create secure token
7. insert invite with 7-day expiry
8. return token

#### `claim_org_invite(token text) -> uuid`

Behavior:

1. read caller via `auth.uid()`
2. load invite by token
3. ensure invite exists, unused, unexpired
4. ensure caller has no org yet
5. if invite has `invited_email`, require email match
6. update caller account:
   - set `org_id`
   - set `role` from invite
7. mark invite used
8. return org id

#### `regenerate_join_code() -> text`

Behavior:

1. read caller via `auth.uid()`
2. require caller role = `OWNER`
3. generate a new valid join code
4. update organization
5. return new code

### Checkout functions

#### `checkout_tools(tool_ids uuid[], condition public.tool_condition, notes text, session_name text default null) -> uuid`

Behavior:

1. read caller via `auth.uid()`
2. ensure caller belongs to an org
3. validate non-empty tool array
4. reject duplicate tool ids in the same request
5. validate all tools belong to caller org
6. validate all tools are checkoutable
7. create one `checkout_sessions` row
8. for each tool:
   - insert one `tool_management` row
   - update `tools.status = 'CHECKEDOUT'`
   - update `tools.condition = condition`
9. return session id

#### `return_tool(tool_management_id uuid, condition_return public.tool_condition, notes text default null, return_image_path text default null) -> void`

Behavior:

1. read caller via `auth.uid()`
2. load open `tool_management` row
3. allow if:
   - caller owns the checkout
   - or caller is `OWNER` / `FOREMAN`
4. set:
   - `checked_in = now()`
   - `condition_return`
   - optional `return_image_path`
   - append/update notes as desired
5. update current tool row:
   - `tools.condition = condition_return`
   - `tools.status = 'AVAILABLE'` for `GOOD` / `FAIR`
   - `tools.status = 'OUT_OF_SERVICE'` for `DAMAGED` / `OUT_OF_SERVICE`
6. if all rows in session are returned:
   - set `checkout_sessions.checked_in_at = now()`

Note:

- no dedicated "restore to available" workflow function in v1
- `OWNER` / `FOREMAN` may later restore a tool through direct metadata update when there is no open checkout
- return evidence photos are supported in v1
- checkout photos are intentionally out of scope for v1

### Material usage function

#### `log_material_usage(material_id uuid, project_id uuid, quantity_used numeric, notes text default null) -> uuid`

Behavior:

1. read caller via `auth.uid()`
2. require caller role = `OWNER` or `FOREMAN`
3. validate material belongs to caller org
4. validate project belongs to caller org
5. if material is project-specific:
   - require `materials.project_id = project_id`
6. ensure enough stock
7. compute `total_cost = quantity_used * unit_cost`
8. decrement `materials.unit_qty`
9. insert `material_usage`
10. return usage id

### Required profile function

#### `update_my_profile(name text) -> void`

Behavior:

1. read caller via `auth.uid()`
2. update only caller `accounts.name`
3. do not allow org or role changes

---

## Migration 3 - `20260327000002_reporting_views.sql`

### `low_stock_materials`

Create with:

- `security_invoker = true`

Definition:

- selects rows from `materials`
- flags rows where `unit_qty <= low_stock_threshold`

Purpose:

- low-stock reporting
- feeds dashboard and export flows

### Future reporting views

Do not include yet, but reserve for later migrations:

- `open_checkouts`
- `tool_history`
- `overdue_checkouts`
- `material_usage_by_project`
- `budget_vs_actual_materials`

---

## What Stays Outside Migrations

These do not belong in SQL migrations:

| Item                                 | Where it belongs                             |
| ------------------------------------ | -------------------------------------------- |
| org-creation allowlist/domain gating | Next.js server layer / env config            |
| storage bucket creation              | Supabase dashboard or CLI/config             |
| signed URL generation                | `lib/storage/**`                             |
| storage cleanup / retention jobs     | Edge Function or server cron / scheduled job |
| auth email templates                 | Supabase dashboard                           |
| seed data                            | `supabase/seed.sql`                          |
| API response DTOs                    | DAL / route layer                            |
| request validation                   | `lib/validations/**`                         |

---

## Generation Order Summary

```text
Migration 1:
  extensions
  -> enums
  -> organizations
  -> org_tool_counters
  -> accounts
  -> org_invites
  -> projects
  -> tools
  -> checkout_sessions
  -> tool_management
  -> materials
  -> material_usage
  -> composite uniques
  -> composite foreign keys
  -> checks
  -> indexes
  -> helper functions
  -> triggers
  -> RLS

Migration 2:
  create_org
  -> join_org_by_code
  -> create_org_invite
  -> claim_org_invite
  -> regenerate_join_code
  -> checkout_tools
  -> return_tool
  -> log_material_usage
  -> update_my_profile

Migration 3:
  low_stock_materials
```

---

## Remaining Open Decisions

- email provider for T012 alerts
