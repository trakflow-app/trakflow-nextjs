# Tech Stack

This document is the quick-reference overview for the TrakFlow codebase. It summarizes the current stack, supporting tooling, project structure, and the docs already maintained in this repository.

## Product Context

TrakFlow is a full-stack Next.js app for construction teams to track tools, materials, and project accountability.

## Core Stack

| Layer             | Choice                                               | Notes                                         |
| ----------------- | ---------------------------------------------------- | --------------------------------------------- |
| Framework         | Next.js 16.2.1                                       | App Router architecture                       |
| UI Runtime        | React 19.2.4                                         | Server Components by default                  |
| Language          | TypeScript 5                                         | `tsconfig.json` is configured for strict mode |
| Styling           | Tailwind CSS 4                                       | Integrated through PostCSS                    |
| Component System  | shadcn/ui                                            | Configured through `components.json`          |
| UI Utilities      | `clsx`, `tailwind-merge`, `class-variance-authority` | Utility-first class composition               |
| Icons             | `lucide-react`                                       | Icon library for UI work                      |
| Notifications     | `sonner`                                             | Toast and notification UI                     |
| Data/Grid UI      | `@tanstack/react-table`                              | Table rendering and state                     |
| Backend Platform  | Supabase                                             | Postgres, Auth, Storage, and SQL migrations   |
| Deployment Target | Vercel                                               | Aligned with the Next.js app model            |

## Tooling

| Area            | Choice                 | Notes                                                      |
| --------------- | ---------------------- | ---------------------------------------------------------- |
| Package Manager | npm                    | Uses `package-lock.json`                                   |
| Linting         | ESLint 9               | Includes `eslint-config-next` and Prettier compatibility   |
| Formatting      | Prettier 3             | `format` and `format:check` scripts are available          |
| Type Checking   | `tsc` + `next typegen` | Run through `npm run type-check`                           |
| Database Types  | Supabase CLI           | `npm run db:types` generates `lib/types/database.types.ts` |

## App Structure

The repo follows the structure defined in `AGENTS.md`.

| Path          | Purpose                                                  |
| ------------- | -------------------------------------------------------- |
| `app/`        | Routes, layouts, pages, and API route handlers           |
| `components/` | Reusable UI components                                   |
| `lib/`        | Utilities, helpers, app logic, and shared types          |
| `public/`     | Static assets                                            |
| `docs/`       | Product, bootstrap, migration, and project documentation |
| `supabase/`   | Database config, migrations, and seed files              |
| `scripts/`    | One-off project scripts such as hosted bootstrap         |

## Environment And Data Layer

- Local development uses `.env.local` derived from `.env.example`.
- Supabase is the active backend service for database access, auth, and storage.
- Hosted bootstrap support exists for shared dev data through `scripts/bootstrap-hosted-dev.mjs`.
- SQL migrations are maintained under `supabase/migrations/`.

## Available Scripts

| Command                                               | Purpose                                          |
| ----------------------------------------------------- | ------------------------------------------------ |
| `npm run dev`                                         | Start the local Next.js dev server               |
| `npm run build`                                       | Create a production build                        |
| `npm run start`                                       | Run the production server                        |
| `npm run lint`                                        | Run ESLint                                       |
| `npm run lint:fix`                                    | Run ESLint with auto-fixes                       |
| `npm run type-check`                                  | Generate Next.js types and run TypeScript checks |
| `npm run format`                                      | Format the repo with Prettier                    |
| `npm run format:check`                                | Validate formatting without writing changes      |
| `npm run check`                                       | Run type-check, lint, and format checks together |
| `npm run db:types`                                    | Generate TypeScript DB types from local Supabase |
| `npm run db:bootstrap:hosted -- --confirm-hosted-dev` | Seed or normalize the shared hosted dev dataset  |

## Documentation Map

| Document                 | Purpose                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| `README.md`              | Primary setup and local development guide                          |
| `docs/tech-stack.md`     | High-level stack and documentation overview                        |
| `docs/repo-bootstrap.md` | Hosted dev and local Supabase bootstrap workflows                  |
| `docs/plan.md`           | Product direction, architecture decisions, and implementation plan |
| `docs/migration-plan.md` | Locked migration sequencing and database rules                     |
| `AGENTS.md`              | Repository coding conventions and contributor rules                |

## Recommended Reading Order

1. `README.md`
2. `docs/tech-stack.md`
3. `docs/repo-bootstrap.md`
4. `docs/plan.md`
5. `docs/migration-plan.md`
6. `AGENTS.md`
