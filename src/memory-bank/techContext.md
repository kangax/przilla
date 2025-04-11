# Tech Context

ALways use `write_to_file`, never `replace_in_file`

## Technologies Used

- **Language:** TypeScript
- **Framework:** Next.js (v15)
- **UI Framework/Libraries:** React (v18), Radix UI Themes, Radix UI Select, Radix UI Icons, Lucide Icons
- **Styling:** Tailwind CSS, PostCSS
- **State Management/Data Fetching:** tRPC, TanStack Query (React Query)
- **Database ORM:** Drizzle ORM
- **Database:** LibSQL/Turso (inferred from `@libsql/client`)
- **Authentication:** NextAuth.js (v5 beta)
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
- **Environment Variables:** Managed via `.env` files and validated using `@t3-oss/env-nextjs`. See `.env.example`.
- Use `;` to string commands in the terminal (e.g., `cd some/dir ; npm install`) as `&&` can have escaping issues.
- Do not create backup files; rely on the version control system (Git).

## Technical Constraints

- **NextAuth Beta:** Using a beta version (`5.0.0-beta.25`) might introduce instability or breaking changes upon updates. Need to monitor its development.
- **Static Data Source:** Reliance on static JSON files (`public/data/`) for WODs is being phased out. `WodViewer` now uses the database via tRPC. Other parts of the app (e.g., charts page) may still use JSON and need updating.
- **LibSQL/Turso:** If using a free tier, be mindful of potential usage limits (storage, read/write operations, connections).
- **tRPC:** While providing type safety, it tightly couples the frontend and backend, requiring careful consideration during refactoring. `SuperJSON` is now enabled as the transformer to handle complex types like Dates.

## Dependencies

- **Core:** Next.js, React, tRPC, Drizzle ORM, NextAuth.js, TanStack Query, Zod
- **UI:** Radix UI (Themes, Select, Icons), Tailwind CSS, Lucide Icons, Recharts, TanStack Table/Virtual, `react-dropzone`
- **Database:** `@libsql/client`
- **Utility:** `superjson` (enabled as tRPC transformer), `geist`, `server-only`, `papaparse`
- **Dev/Build:** TypeScript, ESLint, Prettier, Vitest, Husky, lint-staged, PostCSS, `@t3-oss/env-nextjs`
- **Scripts/Internal Tools:** `axios`, `chalk`, `cheerio`, `fs-extra`, `dotenv`, `tsx` (used in `scripts/`)

## Tool Usage Patterns

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
    "difficulty_explanation": "A descending pyramid chipper version of 'Helen', increasing the volume significantly. Tests running, kettlebell endurance, and pull-up capacity.",
    "count_likes": 51
  },
```
