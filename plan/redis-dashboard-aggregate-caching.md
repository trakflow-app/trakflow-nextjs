# Redis Caching Plan For Org-Scoped Aggregate Stats

## Summary

Add Upstash Redis caching for the existing org-scoped aggregate stat reads:

- Material stats from `getServerMaterialStats(orgId)`
- Tool stats from `getToolStats(orgId)`

Use short TTL caching, fail open to Supabase if Redis is unavailable, and invalidate the affected org cache keys immediately after successful writes.

## Key Changes

- Add `@upstash/redis` as a dependency.
- Add server-only Redis helpers under `lib/cache/*`:
  - Create one Upstash Redis client from `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
  - Define cache key helpers such as `dashboard:stats:materials:${orgId}` and `dashboard:stats:tools:${orgId}`.
  - Use a shared TTL constant, defaulting to `60` seconds.
  - Provide typed helpers for `get`, `set`, and `del`, with Redis errors swallowed so database reads remain the source of truth.
- Update `.env.example` with:
  - `UPSTASH_REDIS_REST_URL=`
  - `UPSTASH_REDIS_REST_TOKEN=`

## Implementation Changes

- Wrap `getServerMaterialStats(orgId)` with Redis read-through caching:
  - Try Redis first.
  - If cache hit, return parsed `MaterialStats`.
  - If cache miss or Redis failure, query Supabase, write the result to Redis with TTL, then return it.
- Wrap `getToolStats(orgId)` the same way for `ToolStats`.
- Invalidate material stats cache after successful material writes in `app/services/materials-services.ts`:
  - `logMaterialUsageAction`
  - `createMaterialAction`
  - `updateMaterialAction`
- Invalidate tool stats cache after successful tool writes in tool services:
  - `createToolAction`
  - `updateToolAction`
  - `deleteToolAction`
  - `checkoutToolAction`
  - `returnToolAction`
- Keep `revalidatePath(...)` calls unchanged; Redis invalidation complements Next route refresh instead of replacing it.

## Test Plan

- Run `npm run type-check`.
- Run `npm run lint`.
- Add or manually verify these scenarios:
  - First stats request queries Supabase and populates Redis.
  - Second stats request for the same `orgId` reads from Redis.
  - Material create/update/usage deletes only that org's material stats key.
  - Tool create/update/delete/checkout/return deletes only that org's tool stats key.
  - Missing Upstash env vars or Redis errors do not break pages; pages fall back to Supabase.
  - Cache keys never omit `orgId`, preventing cross-org stat leakage.

## Assumptions

- Scope is stats only, not paginated list queries or project option lists.
- TTL default is `60` seconds.
- Supabase remains the source of truth.
- Redis is optional at runtime: if Upstash is not configured, the app still works without caching.
