# Recent Changes

- **WOD Time Cap Field Added & Backfilled (Apr 16, 2025):**

  - **Goal:** Add a structured `timecap` (seconds, nullable) field to the WODs table in the database and backfill it using real data.
  - **Implementation:**
    - Updated `src/server/db/schema.ts` to add a new `timecap` integer column to the WODs table.
    - Generated and applied a Drizzle migration to update the database schema.
    - Created `scripts/backfill_timecaps.js` to parse and backfill the `timecap` field for 62 WODs using `public/data/wods_with_timecaps.json`.
      - The script parses timecap strings (e.g., "Time Cap: 20", "12 min cap") into seconds.
      - For each WOD, it matches by name and updates the new field.
      - Most WODs matched directly; a few may require manual review for naming mismatches or ambiguous timecap values.
    - Ran the script with the correct environment and database, successfully updating 62 WODs.
  - **Outcome:** The `timecap` field is now present and populated for all WODs with a known time cap. This enables robust score logging, validation, and future analytics based on timecap data.

- **WOD Time Cap Extraction & Structured Data (Apr 16, 2025):**

  - **Goal:** Identify all WODs with a time cap and create a structured dataset for further processing and UI improvements.
  - **Implementation:**
    - Used regex-based search on `public/data/wods.json` to detect time cap patterns in the description field.
    - Extracted all matching WODs (64 total) and created a new file: `public/data/wods_with_timecaps.json`.
    - Each entry includes: `wodName`, the matched `timecap_string`, and the full `description`.
    - This enables review, parsing, and backfilling of a structured `timecap` (seconds) field in the main dataset.
  - **Outcome:** All WODs with a time cap are now easily reviewable and ready for structured data migration. This supports robust score logging logic and future analytics.

- **WOD Table Score Sorting (Apr 16, 2025):**

  - **Goal:** Implement sorting for the "Your Scores" column in the desktop `WodTable` component (`src/app/(main)/components/WodTable.tsx`) based on the calculated performance level of the user's latest score for each WOD.
  - **Implementation:**
    - Updated `src/types/wodTypes.ts`:
      - Added `'results'` to the `SortByType` union type.
    - Updated `src/app/(main)/components/WodTable.tsx`:
      - Defined a constant `performanceLevelValues` mapping levels (Elite, Advanced, Intermediate, Beginner, Rx, Scaled, No Score) to numeric values (4 down to -2) for sorting.
      - Defined a custom TanStack Table `sortingFn` named `sortByLatestScoreLevel` _inside_ the `createColumns` function. This function accesses `scoresByWodId` via closure, finds the latest score for each row, determines its numeric level using `performanceLevelValues` and `getPerformanceLevel` (from `wodUtils`), and compares the levels.
      - Modified the column definition for "Your Scores" (`id: 'results'`):
        - Set `enableSorting: true`.
        - Assigned `sortingFn: sortByLatestScoreLevel`.
        - Made the `header` a clickable `<span>` that calls `handleSort('results')` and displays the sort indicator.
      - Updated the `isValidSortBy` helper function to include `'results'` in its validation array.
      - Removed the unnecessary passing of `scoresByWodId` via `meta` in `useReactTable` options, as the sorting function now uses closure.
  - **Outcome:** The "Your Scores" column in the desktop WOD table is now sortable. Clicking the header toggles sorting based on the performance level of the user's latest score for each WOD (Elite > Advanced > Intermediate > Beginner > Rx > Scaled > No Score).

<!-- ...rest of file unchanged... -->
