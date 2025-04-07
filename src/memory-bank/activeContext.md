# Active Context

## Current Focus

- Expanding the WOD dataset in `public/data/wods.json` by transforming data from `public/data/wodwell_workouts.json`.
- Documenting the WOD transformation process in the Memory Bank.

## Recent Changes

- **WOD Data Transformation:** Identified missing Open workouts (11.x, 13.x, 14.x, 15.x, 16.x, 17.x, 18.x, 19.2, 25.x) and numerous Benchmark workouts by comparing `wodwell_workouts.json` and `wods.json`.
- **Data Transformation Process:**
  - Retrieved source data for missing WODs (preferring verified entries).
  - Transformed data to match `Wod` type in `src/types/wodTypes.ts`.
  - Inferred `category` and `tags`.
  - Estimated `benchmarks` and `difficulty` based on allowed values ("Easy", "Medium", "Hard", "Very Hard").
  - Corrected benchmark estimation logic for time-capped WODs (e.g., Open 25.2) to use `reps` type.
  - Filtered missing benchmarks to exclude existing "Girl" WODs and ensure only verified source WODs were considered.
- **Script Generation:** Created Node.js scripts (`scripts/add_benchmarks_*.js`) to batch-add transformed WODs and sort `wods.json`. Execution of these scripts was deferred/skipped by user request.
- Memory Bank initialization and population based on project analysis and `previous_clinerules.md`.

## Next Steps

0. **Complete WOD Data Expansion:** Finish processing and potentially adding the remaining missing benchmark WODs using the generated scripts or manually.
1. **Database Migration:** Migrate data storage from static JSON files to a database (LibSQL/Turso using Drizzle ORM) as the primary focus after data expansion.

   - Design Database Schema (`src/server/db/schema.ts`).
   - Implement DB Logic (Repository Pattern).
   - Update tRPC Routers.
   - Migrate Existing Data (script needed).
   - Update Frontend Components.
   - Implement Score Logging.

1. **Design Database Schema:** Define the necessary tables (users, wods, scores, etc.) in `src/server/db/schema.ts`.
1. **Implement DB Logic:** Create functions (potentially using Repository Pattern) to interact with the database (CRUD operations for WODs, scores).
1. **Update tRPC Routers:** Modify existing or create new tRPC routers/procedures to use the database logic instead of static JSON files.
1. **Migrate Existing Data:** Write a script to migrate data from `public/data/*.json` into the new database structure.
1. **Update Frontend Components:** Adjust frontend components (`WodTable`, `WodViewer`, etc.) to fetch and display data via the updated tRPC hooks.
1. **Implement Score Logging:** Add UI and backend logic for users to log their scores against WODs in the database.

## Active Decisions & Considerations

- **Database Schema Details:** Finalizing the exact structure and relationships for the database schema.
- **Authentication Provider:** Whether to stick with NextAuth.js or switch to BetterAuth (as noted in `todo.md`). This decision might impact the user schema design.
- **Data Migration Strategy:** How to handle the one-time migration of existing JSON data into the database smoothly.

## Important Patterns & Preferences

_Are there any specific coding patterns, style preferences, or architectural choices to keep in mind for the current work?_

- **JSX/TSX Comments:** Do not add comments explaining changes directly within JSX/TSX code. Use commit messages or other documentation methods.
- **Commit Messages:** Use meaningful commit messages. (Approval is implicit via the command approval process).

## Learnings & Insights

- As an AI, you are trained on a large crossfit dataset and are perfectly capable of estimating workout scores based on their description. You've done it many times in the past.
- The project relies heavily on WOD data, and managing this data effectively (moving from JSON to DB) is the most critical next step for enabling core functionality like personalized progress tracking.
- The tech stack is modern (Next.js 15, tRPC, Drizzle, Radix) but includes some beta components (NextAuth v5) that require monitoring.
