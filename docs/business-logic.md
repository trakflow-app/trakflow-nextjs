# TrakFlow Business Logic

This document summarizes the business rules that are enforced by the app code, Supabase RLS policies, and database functions.

## Roles

TrakFlow uses three organization roles:

- `OWNER`
- `FOREMAN`
- `CREW`

In general, all onboarded organization members can read operational data for their organization. `OWNER` and `FOREMAN` can manage day-to-day operations. `CREW` is read-only for most management surfaces.

## Organizations

- A user starts without an organization until onboarding is complete.
- Creating an organization assigns the caller to that organization as `OWNER`.
- Organization membership is stored on `accounts.org_id`.
- The organization join code is used for crew onboarding.
- Organization rows are visible only to members of the same organization.

## Projects

Projects represent construction jobs inside an organization.

- All organization members can view projects in their organization.
- Only `OWNER` and `FOREMAN` can create or update projects.
- A project requires a non-blank name and a start date.
- End date is optional, but when provided it must be on or after the start date.
- Budget is optional, but when provided it must be greater than zero.
- Projects with operational history should be completed, not deleted.

Project-linked materials, tools, and usage history are part of the audit trail. The user-facing workflow should preserve those records and use project status to close work.

## Materials

Materials represent inventory that can belong to the organization or to a specific project.

- All material management is limited to `OWNER` and `FOREMAN`.
- `materials.project_id = null` means the material is held in org inventory.
- `materials.project_id = <project id>` means the material is assigned to that project.
- Material quantity cannot be negative.
- Unit cost must be greater than zero.
- Low-stock threshold cannot be negative.
- Material usage always requires a consuming project.
- Org inventory materials can be consumed by any project in the same organization.
- Project-specific materials can only be consumed by their assigned project.
- Material usage is immutable history and is written through the `log_material_usage` database function.

### Adding materials with the same name never creates duplicates

Whether a material is added manually or through CSV/OCR import, adding a material with a name that already exists **in the same place** (same organization, and same project or same org inventory) does not create a second row — it adds to the existing one instead.

- Two materials are considered "the same" when their name matches (case and extra whitespace ignored) and they live in the same place: same project, or both unassigned to a project (org inventory). The same name in two different projects is not the same material.
- When it matches, the quantity being added is summed onto the existing quantity.
- The unit cost becomes a **quantity-weighted average** of the existing stock and the newly added stock — not a simple overwrite, and not a plain average. Example: 50 units already in stock at $4.00, and 70 more units come in at $4.50 → the new unit cost is `(50 × 4.00 + 70 × 4.50) / 120 = $4.29`, and the total value of the stock (`unit_qty × unit_cost`) stays consistent with what was actually paid for it over time.
- The low-stock threshold is left untouched when merging — it's a policy someone set on purpose, not something that should reset just because more stock arrived. It's only used when a material is first created.
- This is enforced by the database itself (`merge_or_create_material`, `supabase/migrations/20260725000000_atomic_material_merge.sql`), not just application code, so it stays correct even if two people add the same material at the same time — the database processes both additions atomically instead of one silently overwriting the other.

## Tools

Tools represent reusable equipment owned by an organization.

- All organization members can view tools in their organization.
- Only `OWNER` and `FOREMAN` can create, update, or delete tools.
- `tools.project_id = null` means the tool is in org inventory.
- `tools.project_id = <project id>` means the tool is assigned to that project.
- Tool tag numbers are generated per organization by the database.
- Tool checkout/check-in workflows should use database functions when concurrency, audit history, or status consistency must be enforced atomically.
- Tool storage paths should be treated as private storage paths, not public URLs.

## Invites

Invites allow an organization to add foremen and crew members.

- `OWNER` and `FOREMAN` can create operational invites where allowed by the specific flow.
- Foreman invites are email-based.
- Crew onboarding can use an organization join code.
- Invite claiming is handled through database functions so token validation, role assignment, organization assignment, and invite usage happen consistently.
- Invite tokens must not be exposed beyond the intended claim link.

## Code Ownership

- `lib/dal/*` owns data reads and row mapping.
- `app/services/*` owns server actions, mutations, permission checks, cache invalidation, storage coordination, and RPC orchestration.
- `supabase/migrations/*` owns schema, RLS policies, indexes, triggers, and database functions.
- Use Supabase functions for atomic, security-sensitive, or concurrency-sensitive workflows.
- Keep UI behavior and copy in components, constants, and locale files rather than DAL or database functions.
