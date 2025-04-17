# Recent Changes

- **Log/Edit Score Dialog: Horizontal Reps/Rounds Layout (Apr 17, 2025):**

  - **Goal:** Improve the layout density of the score logging/editing form (`LogScoreDialog.tsx`) by placing the Reps, Rounds, and Partial Reps input fields on a single horizontal line when applicable.
  - **Implementation:**
    - Updated `src/app/(main)/components/LogScoreDialog.tsx`:
      - Wrapped the conditional `Box` components for Reps, Rounds, and Partial Reps inputs within a parent `Flex` component (`direction="row"`, `gap="2"`, `align="end"`).
      - This parent `Flex` is only rendered when these fields are relevant (e.g., user hit timecap, or WOD type is AMRAP/ShowAll).
      - Added `style={{ flexGrow: 1 }}` to the inner `Box` components for each input field to ensure they distribute space evenly.
  - **Outcome:** The Reps, Rounds, and Partial Reps input fields now appear horizontally when needed, creating a more compact and visually organized form layout.

- **Timecap-Aware Log/Edit Score UI & Vertical Radio Group (Apr 16, 2025):**

  - **Goal:** Enable robust, user-friendly score logging for timecapped WODs, with clear UI and validation.
  - **Implementation:**
    - Updated `src/app/(main)/components/LogScoreDialog.tsx`:
      - For WODs with a timecap, users are prompted with a vertical Radix UI radio group: "Finished within [timecap] timecap?" with options for "Yes, finished within timecap (enter your time)" and "No, hit the timecap (enter reps or rounds+reps)".
      - The form dynamically shows time or reps/rounds+reps input fields based on the user's selection.
      - Validation ensures that if "Yes" is selected, the entered time must be less than the timecap; if "No" is selected, reps or rounds+reps are required.
      - All UI uses Radix UI primitives for accessibility, theme consistency, and minimalism.
    - Updated `src/types/wodTypes.ts` to include `timecap?: number | null` in the Wod type.
    - Updated `src/app/(main)/components/WodViewer.tsx` to pass the timecap field through to WOD objects.
    - Updated `src/server/api/routers/wod.ts` to return the timecap field in the getAll API.
  - **Outcome:** The log/edit score dialog now fully supports timecapped WODs with a clear, accessible, and minimal UI. Invalid entries are prevented, and the groundwork is laid for future analytics and features.

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
