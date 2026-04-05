# Repo Bootstrap

This repo supports two Supabase workflows:

- hosted dev for day-to-day app work
- local Supabase + Docker for migration authoring and schema validation

The database source of truth is always:

- `supabase/migrations/*`

## Team Default: Hosted Dev

This is the recommended path to not run Docker locally.

### What to do

1. Copy `.env.example` to `.env.local`.
2. Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Run the app normally with `npm run dev`.
4. Sign in with the shared hosted dev accounts after the hosted bootstrap has been run.

### Shared hosted bootstrap

The hosted bootstrap script is:

- `scripts/bootstrap-hosted-dev.mjs`

Run it with:

```bash
npm run db:bootstrap:hosted -- --confirm-hosted-dev
```

Required server-side env values for the bootstrap script:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `SUPABASE_PROJECT_ID`

Required to run the bootstrap (set the real value in your local `.env.local`, never commit it):

- `TRAKFLOW_BOOTSTRAP_TEST_PASSWORD`

### What the hosted bootstrap creates

- 1 organization
- 1 owner account
- 1 foreman account
- 3 crew accounts
- 2 projects
- 3 tools (Impact Driver, Rotary Hammer, Jobsite Table Saw)

### Shared test accounts

- `owner@trakflow.test`
- `foreman@trakflow.test`
- `crew1@trakflow.test`
- `crew2@trakflow.test`
- `crew3@trakflow.test`

The hosted bootstrap resets these shared users to the configured common password on every rerun.

### Rerun behavior

The hosted bootstrap is intentionally rerunnable.

On rerun it will:

- recreate any missing shared test users
- reset the shared test users to the configured common password
- normalize the seeded org, accounts, projects, and tools

Do not run it against production.

The script requires the `--confirm-hosted-dev` flag and refuses to run against `localhost`.

## Local Workflow: Migration Authoring

This path is mainly for schema work.

### What you do locally

1. Start local Supabase.
2. Apply migrations locally.
3. Validate schema and workflow functions.
4. Generate local DB types if needed.
5. Push approved migrations to the hosted dev project.

Key files:

- `supabase/config.toml`
- `supabase/migrations/*`
- `supabase/seed.sql`

### Local seed strategy

`supabase/seed.sql` is intentionally minimal.

Reason:

- the shared realistic team data lives in the hosted bootstrap flow
- local reset should stay lightweight and stable

## Suggested Flow

1. Author or update migrations locally.
2. Validate with local Supabase.
3. Commit migrations.
4. Apply migrations to hosted dev.
5. Run the hosted bootstrap if the shared dev dataset needs to be created or normalized.
6. Teammates use hosted dev and shared test accounts without Docker.

## Useful Commands

```bash
npm run dev
npm run db:types
npm run db:bootstrap:hosted -- --confirm-hosted-dev
```
