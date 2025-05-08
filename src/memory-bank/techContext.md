# Tech Context

## Scripting and Data Migration Best Practices

- **TypeScript for Scripts:** All new scripts should be written in TypeScript (`.ts`). Run scripts using `npx tsx path/to/script.ts`. Avoid `.cjs` for new scripts; legacy scripts may remain in `.cjs` for compatibility, but all new work should be `.ts`.
- **ESM Compatibility:** Scripts use ESM (`"type": "module"` in package.json). For `__dirname`/`__filename`, use:
  ```ts
  import { fileURLToPath } from "url";
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  ```
- **Drizzle ORM with libSQL:** For SQLite/Turso, use `drizzle-orm/libsql` and `@libsql/client`:
  ```ts
  import { drizzle } from "drizzle-orm/libsql";
  import { createClient } from "@libsql/client";
  const client = createClient({ url: process.env.DATABASE_URL });
  const db = drizzle(client);
  ```
  Do **not** use `drizzle-orm/sqlite` or `better-sqlite3` for new scripts.
- **Environment Variables:** Use `import "dotenv/config";` at the top of scripts to automatically load environment variables from `.env`. This ensures scripts work seamlessly in both local and production environments.
- **Idempotent, Robust Scripts:** Data migration and population scripts must:
  - Be idempotent (safe to rerun).
  - Log all actions and outcomes.
  - Check for existing records before inserting (e.g., use `.where()` and `and()` for composite keys).
  - Handle missing or mismatched data gracefully, logging any issues for review.
- **Production vs. Local/Dev Database:** Always use the `DATABASE_URL` environment variable to control which database scripts target. For production, run scripts with `DATABASE_URL=... npx tsx ...` or update `.env` temporarily. Never hardcode database URLs in scripts.
- **Migration Workflow:** Always run Drizzle migrations (`drizzle-kit push`) against the target database before running any population or data-modifying scripts. Confirm schema changes are present in production before attempting to write new data.
- **Logging and Error Handling:** Scripts should log:
  - Number of records inserted/updated.
  - Any records not found or skipped.
  - Summary of actions at the end.
  - Use `try/catch` or `.catch()` on main functions to log and exit on error.

### WOD Data Management Scripts

The project uses several scripts to manage WOD data, primarily sourced from `public/data/wods.json`. Understanding their roles is crucial for maintaining data integrity:

- **`scripts/migrate_json_to_db.ts` (The "Full Reset" Script):**

  - **Role:** Performs a complete wipe and reload of WODs from `public/data/wods.json`. It first **deletes all WODs** from the database, then re-inserts them. This process assigns **new unique IDs (UUIDs)** to all WODs.
  - **Use Case:** Intended for initial database setup or when a total, clean-slate refresh from `wods.json` is necessary.
  - **WARNING:** Due to changing all WOD IDs, this script breaks all existing foreign key relationships to WODs (e.g., in `scores`, `userFavoriteWods`, `wodMovements`).
  - **Mandatory Follow-up:** After running this script, `scripts/sync_db_wods_from_json.ts` (see below) **must** be run immediately to correctly populate WOD details and re-establish all movement associations using the new WOD IDs.

- **`scripts/sync_db_wods_from_json.ts` (The "Comprehensive Sync & Populate" Script):**

  - **Role:** This is the primary script for ongoing synchronization of WOD data and their movement associations from `public/data/wods.json`.
  - **Behavior:**
    - Updates existing WOD details (matched by `wodName`) or inserts new WODs if they don't exist.
    - For **every WOD processed (new or existing)**, if `public/data/wods.json` provides a `movements` array for it:
      1. It first **deletes all existing movement associations** for that WOD from the `przilla_wod_movement` table.
      2. It then ensures all listed movements exist in the `przilla_movement` table (creating new ones if necessary, potentially with user interaction for fuzzy matches).
      3. Finally, it creates fresh, correct associations in `przilla_wod_movement` linking the WOD to its current set of movements.
  - **Use Cases:**
    - For regular, ongoing updates to keep the database WODs and their movements aligned with `public/data/wods.json`.
    - As the essential follow-up step immediately after running `scripts/migrate_json_to_db.ts`.
  - **Idempotency:** Designed to be idempotent for both WOD data and movement associations.

- **`scripts/populate_movements_to_db.ts` (The "Movement Link Refresher"):**
  - **Role:** Specifically focuses on populating the `przilla_wod_movement` table based on `public/data/wods.json` (which it now correctly points to) and current WOD IDs (looked up by name). It does not alter other WOD attributes.
  - **Use Case:** Can be used if only movement associations need to be refreshed or repaired without running a full WOD data sync. With the enhanced `sync_db_wods_from_json.ts`, this script may become less frequently needed for the main workflow but remains a useful utility.

**Recommended NPM Script Wrappers:**

To simplify execution and enforce correct sequencing, the following npm scripts are recommended (to be added to `package.json`):

```json
"scripts": {
  // ... other scripts ...
  "db:seed:wods": "tsx scripts/migrate_json_to_db.ts && tsx scripts/sync_db_wods_from_json.ts",
  "db:sync:wods": "tsx scripts/sync_db_wods_from_json.ts"
  // ... other scripts ...
}
```

- `npm run db:seed:wods`: Use for a full reset and re-seed. Runs the destructive `migrate_json_to_db.ts` then immediately follows with the comprehensive `sync_db_wods_from_json.ts` to ensure all data and associations are correctly established with new WOD IDs.
- `npm run db:sync:wods`: Use for regular updates. Runs the `sync_db_wods_from_json.ts` script to update WOD details and ensure movement associations are correctly maintained.

---

If `replace_in_file` fails once, immediately start using `write_to_file` from now on.
Never truncate files for brevity, you must always output full file contents.

## Technologies Used

- **Language:** TypeScript. We have @typescript-eslint/no-explicit-any enabled so DO NOT use `any` unless absolutely necessary.
- **Framework:** Next.js (v15)
- **UI Framework/Libraries:** React (v18), Radix UI Themes, Radix UI Select, Radix UI Icons, Lucide Icons
- **Styling:** Tailwind CSS, PostCSS
- **State Management/Data Fetching:** tRPC, TanStack Query (React Query)
- **Database ORM:** Drizzle ORM
- **Database:** LibSQL/Turso (inferred from `@libsql/client`)
- **Authentication:** Better Auth (v1.2.7) - Replaced NextAuth.js
- **Schema Validation:** Zod
- **Charting:** Recharts
- **Tables:** TanStack Table
- **Virtualization:** TanStack Virtual
- **Fonts:** Geist

## Development Setup

- **Package Manager:** npm (v11.2.0 specified in `package.json`)
- **Run Development Server:** `npm run dev` (uses Next.js with Turbopack)
- **Build Project:** `npm run build`
- **Start Production Server:** `npm run start` or `npm run preview`
- **Database Migrations:** Use `drizzle-kit` scripts (`db:generate`, `db:migrate`, `db:push`, `db:studio`).
- **Environment Variables:** Managed via `.env` files and validated using `@t3-oss/env-nextjs`. Requires `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`. Optionally uses `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` for social login. See `.env.example`.
- Use `;` to string commands in the terminal (e.g., `cd some/dir ; npm install`) as `&&` can have escaping issues.
- Do not create backup files; rely on the version control system (Git).

## Technical Constraints

- **Static Data Source:** Reliance on static JSON files (`public/data/`) for WODs is being phased out. `WodViewer` now uses the database via tRPC. Other parts of the app (e.g., charts page) may still use JSON and need updating.
- **LibSQL/Turso:** If using a free tier, be mindful of potential usage limits (storage, read/write operations, connections).
- **tRPC:** While providing type safety, it tightly couples the frontend and backend, requiring careful consideration during refactoring. `SuperJSON` is now enabled as the transformer to handle complex types like Dates.

## Dependencies

- **Core:** Next.js, React, tRPC, Drizzle ORM, Better Auth, Oslo, TanStack Query, Zod
- **UI:** Radix UI (Themes, Select, Icons), Tailwind CSS, Lucide Icons, Recharts, TanStack Table/Virtual, `react-dropzone`
- **Database:** `@libsql/client`, `better-auth/adapters/drizzle`
- **Utility:** `superjson` (enabled as tRPC transformer), `geist`, `server-only`, `papaparse`
- **Dev/Build:** TypeScript, ESLint, Prettier, Vitest, Husky, lint-staged, PostCSS, `@t3-oss/env-nextjs`, `@better-auth/cli`
- **Scripts/Internal Tools:** `axios`, `chalk`, `cheerio`, `fs-extra`, `dotenv`, `tsx` (used in `scripts/`)

## Tool Usage Patterns

### Zod Usage Patterns

- **Runtime Validation:** Use Zod schemas for all runtime validation and parsing of complex types, especially when handling unknown or parsed data (e.g., from JSON, API responses, or user input).
- **Pattern:** Prefer `ZodSchema.safeParse(value)` over hand-written type guards. If validation succeeds, use `result.data` (cast to the appropriate type if needed); otherwise, handle as invalid.
- **Example:** See `BenchmarksSchema` in `src/types/wodTypes.ts` and its usage in `src/app/(main)/page.tsx` for validating parsed JSON. This replaces the need for a custom `isBenchmarks` type guard.
- **Benefits:** This approach ensures type safety, maintainability, and linter compliance, and should be the default for all future runtime type validation.

- **Linting:** ESLint with Next.js config and TypeScript/Drizzle plugins (`npm run lint`, `npm run lint:fix`).
- **Formatting:** Prettier with Tailwind CSS plugin (`npm run format:check`, `npm run format:write`).
- **Type Checking:** TypeScript (`npm run typecheck` or `npm run check`).
- **Git Hooks:** Husky and lint-staged are set up (`prepare` script, `lint-staged` config) to run linters on pre-commit.
- **Large JSON:** Use `jq` to process or view large JSON files (e.g., in `public/data/`) to avoid loading them entirely into memory.
- **Testing:**
  - Run tests: `npm run test` (uses Vitest).
  - Unit tests required for business logic (Vitest + React Testing Library).
  - Integration tests for API endpoints.
  - E2E tests for critical user flows.
  - Ensure tests exist for additions/changes.

## Testing Best Practices

- **Keep Test Files Small:** Extract mocks, test data, and test utilities into separate files to keep test files focused on test cases.
  - Place mocks in `__tests__/utils/` or `__mocks__/` directories.
  - Create utility functions for common test setup and assertions.
  - Use factory functions to generate test data.
- **Mock Organization:**

  - Define mock types in a separate `mockTypes.ts` file.
  - Create mock context builders in a separate `makeCtx.ts` file.
  - Store test data in a separate `testData.ts` file.
  - This improves maintainability and allows reuse across multiple test files.

- **Test Structure:**

  - Each test file should focus on testing a single component or module.
  - Use `describe` blocks to group related tests.
  - Use `beforeEach` to set up common test state.
  - Keep individual test cases (`it` blocks) small and focused on a single assertion or related assertions.

- **Mock Database Operations:**

  - Create mock implementations of database operations that return predictable test data.
  - Avoid connecting to real databases in unit tests.
  - Use in-memory databases or mock the database client for integration tests.

- **Testing tRPC Routers:**
  - Create a mock context that simulates the tRPC context.
  - Mock database queries to return predefined test data.
  - Test the router by calling it directly with the mock context.
  - Verify that the router returns the expected data and handles errors correctly.

## Example of a wod/workout from wodwell_workouts.json

```
{
    "id": 29321,
    "title": "Quarterfinals 21.1",
    "url": "https://wodwell.com/wod/quarterfinals-21-1/",
    "has_video": true,
    "posted_by": {
      "text": "CrossFit Games Quarterfinals Test 1",
      "avatar": "",
      "coach": false
    },
    "posted_date": "2021-04-08",
    "days_since_posted": 1446,
    "workout": [
      "For Time",
      "3 Rounds of:",
      "10 Strict Handstand Push-Ups",
      "10 Dumbbell Hang Power Cleans (2x50/35 lb)",
      "50 Double-Unders",
      "",
      "Rest 1 minute",
      "",
      "Then, 3 Rounds of:",
      "10 Kipping Handstand Push-Ups",
      "10 Dumbbell Shoulder-to-Overheads  (2x50/35 lb)",
      "50 Double-Unders",
      "",
      "Time Cap: 10 minutes"
    ],
    "date": 1617907473,
    "relevance": 0,
    "popularity": 49,
    "terms": [],
    "preview_class": "wod-preview",
    "thumbnail": "https://wodwell.com/wp-content/uploads/2023/11/garage-gym-med.jpg",
    "count_likes": "8",
    "count_comments": 6,
    "is_verified_wod": true,
    "is_allowed_flag": false,
    "is_allowed_edit": false,
    "edit_link": "",
    "collection_buttons": {
      "allowed": false,
      "favorite": {
        "title": ""
      },
      "add": {
        "title": ""
      }
    }
  },
```

### Example of a wod/workout in wods.json:

```
{
    "wodUrl": "https://wodwell.com/wod/pyramid-double-helen/",
    "wodName": "Pyramid Double Helen",
    "description": "For Time\n1200 meter Run\n63 Kettlebell Swings (1.5/1 pood)\n36 Pull-Ups\n800 meters Run\n42 Kettlebell Swings (1.5/1 pood)\n24 Pull-Ups\n400 meters Run\n21 Kettlebell Swings (1.5/1 pood)\n12 Pull-Ups\n\nTime Cap: 22 minutes",
    "benchmarks": {
      "type": "time",
      "levels": {
        "elite": {
          "min": null,
          "max": 960
        },
        "advanced": {
          "min": 961,
          "max": 1140
        },
        "intermediate": {
          "min": 1141,
          "max": 1320
        },
        "beginner": {
          "min": 1321,
          "max": null
        }
      }
    },
    "results": [],
    "category": "Benchmark",
    "tags": ["For Time", "Chipper"],
    "difficulty": "Hard",
    "difficultyExplanation": "A descending pyramid chipper version of 'Helen', increasing the volume significantly. Tests running, kettlebell endurance, and pull-up capacity.",
    "countLikes": 51
  },
```
