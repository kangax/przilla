# Progress

## What Works

- **WOD Display:** Core components for displaying WOD information (`WodViewer`, `WodTable`, `WodTimeline`) are functional. `WodViewer` now fetches data directly from the database via tRPC (`api.wod.getAll`).
- **WOD Visualization:** Basic charts for visualizing WOD data might be implemented (`WodTimelineChart`, `WodDistributionChart`).
- **Basic UI:** A general application layout (`src/app/layout.tsx`) and header (`Header.tsx`) exist.
- **Theme Switching:** Dark/light mode toggle (`ThemeToggle.tsx`) is present.
- **Authentication Shell:** Basic authentication controls (`AuthControls.tsx`) and setup (`src/server/auth/`) exist, though a potential switch is noted in `todo.md`.
- **WodTable UI:**
  - Notes column removed; notes shown in score tooltip.
  - Search highlighting implemented for Name, Category, Tags, Description.
  - Category and Tags columns combined into one, displaying tags below the category.
  - Variable row height enabled using `useVirtualizer`'s `measureElement` to correctly display wrapped content (like descriptions and tags).
- **Movement Frequency Chart:**
  - Displays top 20 movements by frequency per category, based on the count of _unique_ workouts the movement appears in.
  - Bar length (x-axis value) now correctly reflects the count of unique workouts.
  - Tooltip shows the count and the unique list of workouts where the movement appears.
  - Parsing logic improved to filter out structural phrases (e.g., "If You Complete...") from being counted as movements.
  - Added an X-axis label ("Frequency (Number of Workouts)") for clarity.
  - Movement normalization map (`src/utils/movementMapping.ts`) corrected to properly handle "Dumbbell Hang Power Cleans" by ensuring the map key is lowercase and includes the space (`dumbbell hang power cleans`).
  - Parsing logic in `src/app/charts/page.tsx` updated to exclude specific phrases ("Men Use") and WOD names ("Amanda") from being counted as movements.
  - Normalization rules in `src/utils/movementMapping.ts` updated to map "dumbbell push presses" to "Push Press" and "kettlebell lunges" to "Lunge".
- **WOD Data in Database:** WOD data (781 unique records) successfully migrated from `public/data/wods.json` to the SQLite database using `scripts/migrate_json_to_db.ts`.

## What's Left to Build

_(Based on `todo.md`):_

- **UI Enhancements:**
  - Refine search/filter functionality for WODs (highlighting is done, filtering logic exists, but UI/UX could be improved).
- **Data Expansion:**
  - Add Games workouts.
  - Add Benchmark workouts (e.g., King Kong).
  - Add remaining workouts from SugarWod data source.
- **Stats & Analysis:**
  - Develop features for personalized stats analysis (strengths/weaknesses).
  - Potentially integrate an AI endpoint for analysis.
- **Data Import:**
  - Implement scraping/import from Wodwell (script or bookmarklet).
  - Implement import from SugarWod exports.
- **Authentication:**
  - Evaluate and potentially switch to BetterAuth.
- **Data Storage:**
  - Migrate WOD data ~~and user scores~~ from static JSON files to a per-user database solution (using Drizzle/LibSQL). **(WOD data migration DONE)**
  - Implement storage and retrieval of user scores in the database.
  - Refactor other components (e.g., charts page) to use tRPC/database instead of static JSON.

## Current Status

- The application is in an early-to-mid stage of development.
- Core functionality for viewing WODs (`WodViewer`) now uses the database via tRPC. Other parts (e.g., charts) may still use static JSON.
- User authentication exists but might be replaced.
- Major upcoming work involves **continuing the migration away from static JSON**, implementing user score tracking in the database, expanding the WOD dataset, adding import capabilities, and building out analytical features.

## Known Issues

- **Data Scalability/Personalization:** Reliance on static JSON files for WODs is resolved for `WodViewer`. Need to implement database storage for user scores and update other components (e.g., charts).
- **Limited WOD Data:** The current dataset needs expansion (Games, Benchmarks, SugarWod). Significant progress made on identifying and preparing missing Open and Benchmark WODs from `wodwell_workouts.json`, though insertion into `wods.json` was deferred. **(Largely Addressed)** WODs with empty `benchmarks.levels` objects or incorrect benchmark types ('time' for AMRAPs/EMOMs) have been corrected for 183 + 42 = 225 WODs via scripting (see Evolution below). Some WODs (e.g., partner, complex scoring) still lack levels or have ambiguous types.
- **Authentication Provider:** Potential limitations or desire for different features driving the consideration to switch from NextAuth to BetterAuth.
- **Sorting/Filtering Limitations:** Sorting and filtering by score-related data (`date`, `attempts`, `level`, `isDone`) is temporarily disabled in `WodViewer` as score data is not yet fetched alongside WOD definitions.

## Evolution of Project Decisions

_Document significant changes in direction or decisions made over time._

Example of a wod from wods.json:

```
{
  "wodUrl": "https://wodwell.com/wod/adambrown/",
  "wodName": "AdamBrown",
  "description": "2 Rounds For Time\n24 Deadlifts (295/205 lb)\n24 Box Jumps (24/20 in)\n24 Wall Ball Shots (20/14 lb)\n24 Bench Press (195/125 lb)\n24 Box Jumps (24/20 in)\n24 Wall Ball Shots (20/14 lb)\n24 Cleans (145/100 lb)",
  "benchmarks": {
    "type": "time",
    "levels": {
      "elite": {
        "min": 0,
        "max": 1500
      },
      "advanced": {
        "min": 1500,
        "max": 2100
      },
      "intermediate": {
        "min": 2100,
        "max": 2700
      },
      "beginner": {
        "min": 2700,
        "max": null
      }
    }
  },
  "results": [],
  "category": "Hero",
  "tags": ["For Time"],
  "difficulty": "Very Hard",
  "difficulty_explanation": "Hero WOD. 2 rounds featuring very heavy deadlifts (295lb), heavy bench press (195lb), and moderately heavy cleans (145lb), interspersed with high-volume box jumps and wall balls. Extremely demanding on strength and conditioning due to heavy loads and volume.",
  "count_likes": 292
},
```

- **WOD Transformation Process (Apr 2025):**
  - Identified missing Open workouts (11.x-18.x, 19.2, 25.x) and numerous Benchmark workouts by comparing `wodwell_workouts.json` and `wods.json`.
  - Established a process to transform source data to the target `Wod` format, including inferring categories/tags and estimating benchmarks/difficulty using AI capabilities.
  - Encountered issues with shell escaping when using `jq` for batch insertions, leading to the adoption of Node.js scripts for safer data manipulation (`scripts/add_benchmarks_*.js`).
  - Generated scripts for adding large batches of benchmarks, but execution was deferred/skipped by user request.
  - Refined benchmark estimation logic for time-capped workouts (e.g., Open 25.2) to use `reps` type.
  - Corrected filtering logic to accurately identify missing, verified, non-Girl benchmarks.
- **Benchmark Level Correction (Apr 2025):**
  - Identified WODs with empty `benchmarks.levels` in `wods.json` using `jq`.
  - Realized initial script attempts (`fix_empty_levels.js`) contained overly simplistic or placeholder estimation logic, which was incorrect.
  - Performed sophisticated AI analysis for each affected WOD based on its description and type.
  - Created a new script (`apply_estimated_levels.js`) containing a map of WOD names to their pre-analyzed benchmark levels derived from the AI analysis.
  - Executed the script to update `wods.json`, successfully filling levels for 183 WODs while skipping those that were ambiguous (partner WODs, complex scoring) or not found in the initial analysis set.
- **Benchmark Type/Level Correction Round 2 (Apr 2025):**
  - Identified WODs previously skipped due to incorrect `benchmarks.type` ('time' instead of 'reps') using `jq`.
  - Performed AI analysis for these WODs.
  - Created and executed `scripts/fix_incorrect_type_levels.js` containing a map with corrected types and pre-analyzed levels, updating 42 additional WODs.
- **Quarterfinals WOD Addition (Apr 2025):**
  - Identified missing Quarterfinals workouts by comparing `title` in `wodwell_workouts.json` against `wodName` in `wods.json` using `jq`.
  - Created and executed `scripts/add_quarterfinals_wods.js` to transform and add these workouts, mapping source fields (`title`, `url`, `workout`, `count_likes`) to target fields (`wodName`, `wodUrl`, `description`, `count_likes`), setting `category` to "Quarterfinals", inferring tags, and using placeholder functions for benchmark/difficulty estimation. Added 20 WODs.
  - Subsequently, performed detailed AI-based estimation of **benchmarks.levels** (converted to seconds or reps as appropriate) for all Quarterfinal workouts.
  - Added tailored **difficulty** ratings and **difficulty_explanation** fields based on workout structure, load, and skill requirements.
  - Applied these updates via a comprehensive jq batch update targeting all ~20 Quarterfinal entries.
  - This enrichment aligned Quarterfinal workouts with the rest of the dataset, improving data quality and consistency.
- We've inferred difficulty and filled in difficulty_explanation based on your AI capabilities of assessing workout scores of a crossfit wod.
- **WOD Data Migration Execution (Apr 2025):**
  - Successfully executed `scripts/migrate_json_to_db.ts` after debugging several issues:
    - Added `tsx` and `dotenv` dependencies.
    - Bypassed environment validation (`SKIP_ENV_VALIDATION=true`).
    - Isolated DB client creation within the script to fix `ECONNREFUSED` errors.
    - Handled `SQLITE_CONSTRAINT_UNIQUE` errors by converting empty string URLs to `null` and using `.onConflictDoNothing()`.
  - Result: Migrated 781 unique WODs from JSON to the database.
- **tRPC Implementation (Apr 2025):**
  - Created `wodRouter` with `getAll` procedure to fetch WODs from DB.
  - Updated `Wod` type definition, removing `results` and aligning with DB schema.
  - Enabled `SuperJSON` transformer on client and server for proper Date serialization.
  - Refactored `WodViewer` to use `api.wod.getAll.useQuery()`.
  - Updated `wodUtils` (`isWodDone`, `sortWods`) to handle the lack of score data in `getAll` results.
