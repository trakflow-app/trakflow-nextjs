# Trakflow

Living document. Update ticket status as work progresses.

---

## What It Is

Trakflow is a multi-tenant SaaS for small contractors and growing field teams.
Its v1 purpose is operational accountability:

- who belongs to the company
- what tools and materials the company owns
- what project they belong to
- who checked tools out
- what was returned and in what condition
- what materials were consumed and where
- what is low stock
- what is overdue or blocked from use

This is not a full construction ERP.
The v1 wedge is tool + material accountability with lightweight project cost visibility.

---

## Product Direction (Locked)

### Primary market

Small to lower-mid-size contractors:

- specialty contractors
- trade shops
- owner-led teams
- small general contractors
- companies big enough to lose tools and waste materials, but too small for heavyweight software

### Core value proposition

Trakflow helps growing contractors keep track of:

- tools
- materials
- project accountability
- field responsibility
- light cost visibility

### What v1 is not

Do not try to turn v1 into:

- full ERP
- full accounting suite
- full estimating platform
- full enterprise construction management suite

### Best v1 positioning

Field operations and accountability first.
Profitability visibility second.

That means v1 should focus on:

- tool check-in / check-out
- tool condition tracking
- materials tracking
- low-stock visibility
- org / crew / foreman accountability
- budget vs actual material usage by project

---

## Stack

| Layer     | Choice                              |
| --------- | ----------------------------------- |
| Framework | Next.js 16.2 — App Router only      |
| Language  | TypeScript 5 — strict mode          |
| UI        | React 19, Tailwind CSS 4, shadcn/ui |
| Database  | Supabase (Postgres + RLS + Storage) |
| Auth      | Supabase Auth — email/password      |
| Deploy    | Vercel                              |

---

## Architecture Decisions (Locked)

**Next.js full-stack, same origin**

- This app is not preserving the old Vite + separate backend architecture.
- The production app should run as one same-origin Next.js application.
- API routes live under `app/api/**/route.ts`.

**`proxy.ts`, not `middleware.ts`**

- This repo is on Next.js 16.
- Use `proxy.ts` for optimistic routing/session checks only.

**DAL layer**

- All app data access goes through `lib/dal/**`.
- Route Handlers and Server Actions call DAL helpers.
- UI never talks to Supabase directly except through browser-safe auth/session cases.

**Three Supabase clients**

- `lib/supabase/client.ts` — browser only
- `lib/supabase/server.ts` — user-scoped SSR client, RLS applies
- `lib/supabase/admin.ts` — narrow server-only usage, never the default write path

**RLS + DB workflow functions**

- RLS is the hard tenant isolation layer.
- DB workflow functions handle multi-step business operations.
- DAL is the app authorization/orchestration layer.
- UI is never trusted for permissions.

**Validation**

- Use Zod in `lib/validations/**` for:
  - request body
  - query params
  - route params
  - form actions

**Server Components by default**

- Client Components only when interactivity is required.

**Private storage**

- Tool images use a private Supabase Storage bucket.
- Store `image_path`, not a signed URL.
- Generate signed URLs at read time in DAL/storage helpers.

**Money is numeric**

- All money fields use `numeric`, never `float`.
- All cost calculations happen server-side or in DB workflow logic.

**Org creation is gated during testing**

- Signup can remain open.
- Org creation is blocked unless allowed by environment rules.
- This prevents random test users from creating orgs during private development.

**Testing-only role selector**

- A role selector may exist in non-production UI for testing.
- Backend authority still comes from onboarding flows.
- Production role assignment never trusts the frontend selector.

**Tests stay light until after T008**

- Prioritize schema, auth, onboarding, tools, materials, checkouts first.
- Add integration coverage once core flows are stable.

---

## Role Model (Locked)

### Roles

- `OWNER`
- `FOREMAN`
- `CREW`

### Role meanings

**OWNER**

- exactly one per org in v1
- created only by successful org creation
- top-level org authority
- handles org settings, membership, join code, future billing/subscription
- also has all foreman permissions

**FOREMAN**

- operational manager
- manages projects, tools, materials, checkouts, reports
- invited by owner

**CREW**

- field user
- joins by code or crew invite
- uses field workflows like checkout/return

### Invitation rules

- `OWNER` can invite `FOREMAN` and `CREW`
- `FOREMAN` can invite `CREW` only
- `CREW` cannot invite anyone

### Ownership rules

- one `OWNER` per org in v1
- no ownership transfer in v1

---

## Auth And Onboarding Model (Locked)

Authentication and authorization are separate concerns.

### Authentication

Auth answers:

- who is this user?

Handled by:

- Supabase Auth
- email/password signup/login

### Authorization / membership

Authorization answers:

- what org are they in?
- what role do they have?
- what can they do?

Handled by:

- `accounts`
- `organizations`
- workflow functions
- RLS
- DAL permission checks

### User states

1. `anonymous`
2. `authenticated_no_org`
3. `owner`
4. `foreman`
5. `crew`

### State transitions

- `anonymous -> authenticated_no_org`
  - signup or login
- `authenticated_no_org -> owner`
  - create org
- `authenticated_no_org -> foreman`
  - claim targeted foreman invite
- `authenticated_no_org -> crew`
  - join by code or claim crew invite

### Important rule

Signup alone does not grant org power.
The real permission moment is onboarding.

---

## Org Creation Guardrail (Locked)

### During testing

Use app-level environment gating for org creation.

Examples:

- `ALLOW_PUBLIC_ORG_CREATION=false`
- `ORG_CREATION_ALLOWED_EMAILS=...`
- `ORG_CREATION_ALLOWED_DOMAINS=...`

### How it works

- any user may sign up
- any user may log in
- only allowed users may create orgs during testing
- other users may still join an existing org via join code or invite

### Why the gate lives in the app layer

The allowed-email/domain logic is environment/config-driven.
That belongs in the Next.js server layer before calling the DB workflow function.

---

## Onboarding Paths (Locked)

### Create Org

- available only to an authenticated user with no org
- creates a new organization
- assigns caller as `OWNER`

### Join By Code

- reusable crew onboarding path
- assigns caller as `CREW`

### Invite Claim

- targeted foreman invite
- optional targeted crew invite
- assigns caller based on invite role

### Invite policy

- foreman invites are targeted by email
- crew onboarding defaults to join code
- crew invite links are optional, controlled onboarding

---

## Join Code (Locked)

### Format

`XXXX-XXXX`

### Alphabet

Uppercase only:

- `A-H`
- `J-N`
- `P-Z`
- `2-9`

Excluded:

- `0`
- `O`
- `I`
- `1`
- `L`

### Enforcement

- DB-level regex validation
- app should uppercase before sending
- DB rejects invalid values

---

## Domain Model (Locked)

Organization
├── has many Accounts
├── has many Projects
├── has many Tools
├── has many Materials
├── has many Org Invites
└── has many Checkout Sessions / Usage Events

### Tools

- belong to the org
- may optionally be assigned to a project
- `project_id = null` means org inventory

### Materials

- belong to the org
- may optionally be assigned to a project
- `project_id = null` means org inventory
- if `project_id` is set, that material is project-specific in v1

### Material usage

- always tied to a project
- decrements current stock in the same workflow

---

## Status And Condition Model (Locked)

### tool_status

- `AVAILABLE`
- `CHECKEDOUT`
- `OUT_OF_SERVICE`
- `ARCHIVED`

### tool_condition

- `GOOD`
- `FAIR`
- `DAMAGED`
- `OUT_OF_SERVICE`

### Meaning

- status = operational availability
- condition = physical state

### Update rule

- condition updates at checkout
- condition updates again at return
- `tools.condition` stores latest known truth
- `tool_management` stores historical snapshots
- return may include optional note and photo evidence
- restoring an `OUT_OF_SERVICE` tool to `AVAILABLE` is a direct `OWNER` / `FOREMAN` metadata update in v1

---

## Role / Permission Matrix (Locked)

| Action                        | OWNER | FOREMAN |     CREW |
| ----------------------------- | ----- | ------: | -------: |
| Create org                    | Yes   |      No |       No |
| Invite foreman                | Yes   |      No |       No |
| Invite crew                   | Yes   |     Yes |       No |
| Regenerate join code          | Yes   |      No |       No |
| View org settings             | Yes   |      No |       No |
| Update org settings           | Yes   |      No |       No |
| View org members              | Yes   |     Yes | Own only |
| Create/edit/archive projects  | Yes   |     Yes |       No |
| View projects                 | Yes   |     Yes |      Yes |
| Create/edit/archive tools     | Yes   |     Yes |       No |
| View tools                    | Yes   |     Yes |      Yes |
| Create/edit/archive materials | Yes   |     Yes |       No |
| View materials                | Yes   |     Yes |       No |
| Check out tools               | Yes   |     Yes |      Yes |
| Return own tools              | Yes   |     Yes |      Yes |
| Force-return any org tool     | Yes   |     Yes |       No |
| View all org checkouts        | Yes   |     Yes |       No |
| View own checkouts            | Yes   |     Yes |      Yes |
| Log material usage            | Yes   |     Yes |       No |
| View low-stock list           | Yes   |     Yes |       No |

---

## Schema Summary

### Enums

- `user_role`: `OWNER`, `FOREMAN`, `CREW`
- `project_status`: `ACTIVE`, `COMPLETED`
- `tool_status`: `AVAILABLE`, `CHECKEDOUT`, `OUT_OF_SERVICE`, `ARCHIVED`
- `tool_condition`: `GOOD`, `FAIR`, `DAMAGED`, `OUT_OF_SERVICE`

### Core tables

| Table               | Purpose                             |
| ------------------- | ----------------------------------- |
| `organizations`     | company                             |
| `accounts`          | app-side profile for each auth user |
| `org_tool_counters` | per-org tag counter                 |
| `org_invites`       | invite links/tokens                 |
| `projects`          | org projects / job sites            |
| `tools`             | current-state tools                 |
| `checkout_sessions` | one row per checkout action         |
| `tool_management`   | checkout/return audit trail         |
| `materials`         | current-state stock                 |
| `material_usage`    | immutable usage history             |

### Important rules

- one owner per org in v1
- `tools (org_id, tag_number)` must be unique
- active checkout uniqueness enforced in DB
- same-org relationships enforced with composite keys
- `materials.project_id = null` means org inventory
- project-specific materials can only be consumed by their assigned project in v1

---

## Backend Flow Summary

### Signup

1. user signs up with email/password
2. Supabase creates `auth.users`
3. trigger creates `accounts`
4. user is `authenticated_no_org`

### Create Org

1. user passes app-level org-creation gate
2. app calls `create_org(name)`
3. org is created
4. user becomes `OWNER`

### Join By Code

1. user signs up or logs in
2. user enters join code
3. app calls `join_org_by_code(code)`
4. user becomes `CREW`

### Claim Invite

1. user signs up or logs in
2. user opens invite link
3. app calls `claim_org_invite(token)`
4. user becomes `FOREMAN` or `CREW`

### Checkout

1. app calls `checkout_tools(...)`
2. one `checkout_session` is created
3. one `tool_management` row is created per tool
4. tool status becomes `CHECKEDOUT`

### Return

1. app calls `return_tool(...)`
2. tool history row is closed
3. optional return note / photo evidence is attached
4. tool condition and status are updated
5. checkout session closes when all tools are returned

### Material usage

1. app calls `log_material_usage(...)`
2. stock is validated
3. quantity is decremented
4. `material_usage` row is inserted

---

## Folder Structure

```text
app/
  (marketing)/page.tsx
  (auth)/login/page.tsx
  (auth)/register/page.tsx
  (auth)/forgot-password/page.tsx
  (auth)/reset-password/page.tsx
  (onboarding)/create-org/page.tsx
  (onboarding)/join-org/page.tsx
  (app)/dashboard/...
  api/health/route.ts
  api/auth/...
  api/projects/...
  api/tools/...
  api/materials/...
  api/checkouts/...
  join/[token]/page.tsx
  t/[id]/page.tsx

lib/
  supabase/client.ts
  supabase/server.ts
  supabase/admin.ts
  dal/auth.ts
  dal/accounts.ts
  dal/orgs.ts
  dal/projects.ts
  dal/tools.ts
  dal/materials.ts
  dal/checkouts.ts
  validations/
  storage/
  types/database.types.ts

supabase/
  migrations/
  config.toml

docs/
  plan.md
  migration-plan.md
  github-ops.md

```
