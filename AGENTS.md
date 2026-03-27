# AGENTS.md

This file contains all coding conventions and project guidelines for TrakFlow. All contributors must follow these rules to ensure code quality, maintainability, and team consistency.

---

## Coding Conventions

- **No hardcoded strings:**
  All user-facing text and repeated strings must be stored in constants or localization files.

- **No magic numbers:**
  Use named constants for all numbers except 0, 1, or -1 when their meaning is obvious.

- **Colors:**
  Define all UI colors in a single colors constant file (e.g., `lib/colors.ts` or `constants/colors.ts`). Use these variables throughout the app.

- **Naming conventions:**
  - Components: `PascalCase` (e.g., `UserCard.tsx`)
  - Variables & functions: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Types & interfaces: `PascalCase`
  - Files & folders: `kebab-case` or `camelCase` (pick one and be consistent)

- **JSDoc comments:**
  - All exported functions, components, and complex types must have a JSDoc comment.
  - Use the multi-line format:
    ```
    /**
     * Brief description of what this does.
     */
    ```

- **.env.example:**
  - Keep a `.env.example` file up to date with all required environment variables.
  - Never commit secrets—only templates and example values.

- **AGENTS.md:**
  - This markdown file (AGENTS.md) is the single source of truth for coding conventions and can be used by AI tools and contributors.

- **Use of constants:**
  - All repeated values (strings, numbers, colors, etc.) should be defined in a constants file and imported where needed.

- **Component logic:**
  - Encapsulate logic within components. Avoid spreading logic across unrelated files.
  - Use hooks for reusable logic, but keep component-specific logic inside the component.

- **Folder structure:**
  - `app/` — Main app routes and pages.
  - `components/` — Reusable UI components.
  - `lib/` — Utilities, constants, and helpers.
  - `public/` — Static assets.
  - `constants/` — (if used) for shared constants like colors, numbers, etc.

---

**All team members must read and follow these conventions. For questions or suggestions, update this file so the whole team stays in sync.**
