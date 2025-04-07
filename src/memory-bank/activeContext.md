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
- **Benchmark Level Correction:**
  - Identified WODs in `public/data/wods.json` with empty `benchmarks.levels` objects using `jq`.
  - Performed sophisticated analysis for each identified WOD to determine appropriate benchmark levels (Elite, Advanced, Intermediate, Beginner) based on description, type, movements, weights, etc.
  - Created a new script (`scripts/apply_estimated_levels.js`) containing a map of WOD names to their pre-analyzed benchmark levels.
  - Executed the script, successfully updating 183 WODs. 72 WODs were skipped (e.g., partner WODs, ambiguous scoring types, or those not found in the initial `jq` query results used for analysis).
  - The `wods.json` file was updated and sorted alphabetically.
- **Benchmark Type/Level Correction (Round 2):**
  - Identified WODs previously skipped due to having an incorrect `benchmarks.type` ('time' instead of 'reps' for AMRAPs/EMOMs) using `jq`.
  - Performed sophisticated analysis for these WODs.
  - Created a new script (`scripts/fix_incorrect_type_levels.js`) containing a map with the corrected `type` ('reps') and pre-analyzed benchmark levels.
  - Executed the script, successfully updating the type and levels for 42 additional WODs.
  - The `wods.json` file was updated and sorted alphabetically again.
- **WodTable UI Update:** Modified `src/app/_components/WodTable.tsx` to remove the dedicated "Notes" column. Result notes are now displayed in a tooltip when hovering over the score in the "Score" column, using Radix UI's `<Tooltip>`.
- **WodTable Search Highlighting:** Implemented search term highlighting in `WodTable.tsx`.
  - Added a `HighlightMatch` component to wrap matching text in `<mark>` tags.
  - Added a new "Description" column to the table (displayed last) and enabled highlighting within it (using full text, not truncated).
  - Enabled highlighting in "Workout", "Category", and "Tags" columns (Note: Category and Tags are now combined).
  - Passed the `searchTerm` state from `WodViewer.tsx` down to `WodTable.tsx`.
  - Added global CSS styles for the `<mark>` tag in `src/styles/globals.css` for light/dark modes.
- **WodTable Column Consolidation:** Combined the "Category" and "Tags" columns into a single column in `WodTable.tsx`. The category is displayed first, with tags listed below it. Highlighting still applies to both.
- **WodTable Variable Row Height:** Fixed virtualization in `WodTable.tsx` to support variable row heights by implementing the `measureElement` option in `useVirtualizer`. This allows rows to expand correctly for wrapped descriptions and the combined category/tags column.
- **Search Term Persistence:** Updated `WodViewer.tsx` to initialize the `searchTerm` state from the `search` URL parameter on page load, ensuring search results and highlighting persist correctly when navigating via URL.
- **WodTimeline Search Highlighting:** Added search term highlighting to `WodTimeline.tsx` to match the functionality in `WodTable.tsx`.
  - Copied the `HighlightMatch` component from `WodTable.tsx`.
  - Updated `WodTimelineProps` to accept the `searchTerm`.
  - Updated `WodViewer.tsx` to pass the `searchTerm` to `WodTimeline`.
  - Modified `createColumns` in `WodTimeline.tsx` to accept `searchTerm` and use `HighlightMatch` for the "Workout" and "Description" columns.
- **Quarterfinals WOD Addition:**
  - Identified missing Quarterfinals workouts by comparing `title` in `wodwell_workouts.json` against `wodName` in `wods.json` using `jq`.
  - Created a new script `scripts/add_quarterfinals_wods.js` to transform and add these workouts.
  - The script maps source fields (`title`, `url`, `workout`, `count_likes`) to target fields (`wodName`, `wodUrl`, `description`, `count_likes`), sets `category` to "Quarterfinals", infers tags, and uses placeholder functions for benchmark/difficulty estimation.
  - Executed the script, successfully adding 20 Quarterfinals WODs to `wods.json` and sorting the file.
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
