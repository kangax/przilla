# Recent Changes

- **Performance Chart Tooltip Copy Refinement (Apr 15, 2025):**

  - **Goal:** Refine the copy and formatting of the score breakdown within the performance chart tooltip for better clarity and emphasis.
  - **Implementation:**
    - Updated `api.wod.getChartData` tRPC procedure (`src/server/api/routers/wod.ts`):
      - Modified the query to select raw score fields (`time_seconds`, `reps`, `load`, `rounds_completed`, `partial_reps`, `is_rx`).
      - Updated the `MonthlyScoreDetail` type definition to include these raw score fields.
      - Ensured raw score fields are passed in the `scores` array within `monthlyData`.
    - Updated Frontend Types (`src/app/charts/page.tsx`, `src/app/charts/components/WodTimelineChart.tsx`):
      - Updated the `MonthlyScoreDetail` type definitions to include the new raw score fields.
    - Updated `CustomTimelineTooltip` in `WodTimelineChart.tsx` (`src/app/charts/components/WodTimelineChart.tsx`):
      - Imported `formatScore` utility and `Score` type.
      - Replaced the previous multi-line breakdown with a single `Text` component per score.
      - Used `formatScore` to display the raw score value (e.g., "14:15", "353 reps").
      - Included the numeric original level alongside the descriptive level (e.g., "Beginner (1.2)").
      - Applied highlighting using `<span>` and Tailwind classes: bold score value, italic WOD name, color-coded original and adjusted levels based on `getLevelColor`.
      - Implemented conditional rendering: the "Adjusted for difficulty..." text is now omitted if `score.difficulty` is "Medium".
  - **Outcome:** The performance chart tooltip breakdown now displays each score in the format `Your score of **[Score Value]** on *[WOD Name]* is [Original Level (colored)] ([Level Num]). Adjusted for difficulty ([Difficulty]) it's [Adjusted Level Desc (colored)] ([Adjusted Level Num]).` (with the adjustment part hidden for "Medium" difficulty WODs), improving readability and highlighting key information.

- **Performance Chart Adjusted Level (Apr 15, 2025):**

  - **Goal:** Implement an "adjusted level" calculation for the performance timeline chart, factoring in WOD difficulty (`adjustedLevel = scoreLevel * difficultyMultiplier`).
  - **Implementation:**
    - Defined difficulty multipliers: Easy: 0.8, Medium: 1.0, Hard: 1.2, Very Hard: 1.5, Extremely Hard: 2.0 (Default: 1.0).
    - Updated `api.wod.getChartData` tRPC procedure (`src/server/api/routers/wod.ts`):
      - Modified the query to join `scores` with `wods` to fetch `difficulty` and `benchmarks`.
      - Calculated the original `levelScore` (0-4 scale) based on benchmarks and Rx status.
      - Determined the `difficultyMultiplier` based on the WOD's difficulty string.
      - Calculated the `adjustedLevel = levelScore * difficultyMultiplier`.
      - Aggregated the `totalAdjustedLevelScore` per month.
      - Updated the returned `scores` array within `monthlyData` to include `wodName`, `level` (original), `difficulty`, `difficultyMultiplier`, and `adjustedLevel`.
    - Updated Charts Page (`src/app/charts/page.tsx`):
      - Updated `MonthlyScoreDetail` and `PerformanceDataPoint` type definitions to include the new fields (`difficulty`, `difficultyMultiplier`, `adjustedLevel`).
      - Modified the data processing logic to calculate `averageLevel` using `totalAdjustedLevelScore`.
      - Passed the updated `performanceData` (with the new score details) to the chart component.
    - Updated `WodTimelineChart.tsx` (`src/app/charts/components/WodTimelineChart.tsx`):
      - Updated local type definitions (`MonthlyScoreDetail`, `PerformanceDataPoint`) to match the new structure.
      - Updated helper functions (`getDescriptiveLevel`, `getLevelColor`) to handle potentially higher adjusted level values (e.g., adding "Elite+").
      - Modified `CustomTimelineTooltip`:
        - Displays the main level as "Adj. Level" using the average adjusted level.
        - Displays the trend as "Adj. Trend" using the rolling average of adjusted levels.
        - Updated the "Breakdown" section title to "Breakdown (Adjusted)".
        - For each score, displays: WOD Name, Original Level (descriptive + numeric), Difficulty (string + multiplier), and Adjusted Level (numeric).
      - Updated chart title and Y-axis label to reflect "Adjusted" level.
      - Adjusted Y-axis domain (e.g., to `[0, 5]`) and tick formatting to accommodate adjusted levels.
  - **Outcome:** The performance chart now displays performance based on an adjusted level that considers WOD difficulty. The tooltip provides a clear breakdown of how the adjusted level is calculated for each score contributing to the monthly average.

- **Performance Chart Tooltip Enhancement (Apr 15, 2025):**

  - **Goal:** Enhance the performance chart tooltip to show a breakdown of individual workouts and their levels that contributed to the calculated average level for a specific month.
  - **Implementation:**
    - Updated `api.wod.getChartData` tRPC procedure (`src/server/api/routers/wod.ts`):
      - Modified the return structure for `monthlyData` to include a `scores` array for each month.
      - This `scores` array contains objects with `wodName` and calculated `level` for each score logged in that month.
    - Updated Charts Page (`src/app/charts/page.tsx`):
      - Adjusted the `PerformanceDataPoint` type definition to include the `scores: MonthlyScoreDetail[]` array.
      - Modified the data processing logic to extract the `scores` array from the API response and include it in the `performanceData` prop passed to the chart component.
      - Updated placeholder data generation to include an empty `scores` array.
    - Updated `WodTimelineChart.tsx` (`src/app/charts/components/WodTimelineChart.tsx`):
      - Updated the local `PerformanceDataPoint` type definition to match the page component.
      - Modified the `calculateRollingAverage` helper function to ensure the `scores` array is preserved when calculating averages.
      - Enhanced the `CustomTimelineTooltip` component:
        - Accesses the `scores` array from the data point payload.
        - Renders a "Breakdown:" section below the "Level" and "Trend" information.
        - Iterates through the `scores` array, displaying each `wodName` and its descriptive level (using `getDescriptiveLevel` and `getLevelColor` helpers).
        - Added a `Separator` for visual clarity.
  - **Outcome:** When hovering over a data point in the "Performance" view of the timeline chart, the tooltip now displays the average Level, the Trend (rolling average), and a detailed breakdown list of the workouts performed that month, along with the user's calculated level for each workout.

- **Dialog Background Color Fix (Apr 15, 2025):**

  - **Goal:** Fix the background color of the `LogScoreDialog` which was not respecting the Radix UI Theme.
  - **Implementation:**
    - Updated `LogScoreDialog.tsx` (`src/app/(main)/components/LogScoreDialog.tsx`):
      - Removed explicit Tailwind background classes (`bg-white`, `dark:bg-neutral-900`) from the `Dialog.Content` element.
  - **Outcome:** The `LogScoreDialog` now correctly uses the background color provided by the Radix UI Theme system, resolving the inconsistency. The delete confirmation dialog in `WodTable.tsx` still needs investigation for a similar issue.

- **Log Score UI Refactor: Popover to Dialog (Apr 15, 2025):**

  - **Goal:** Replace the score logging/editing Popover with a centered Modal Dialog for a more focused user experience, using Radix UI components, and ensure it inherits the Radix Theme context.
  - **Implementation:**
    - Created `LogScoreDialog.tsx` (`src/app/(main)/components/LogScoreDialog.tsx`) based on the logic from the previous `LogScorePopover.tsx`.
    - Replaced Radix `Popover.*` components with `Dialog.*` components (`Root`, `Portal`, `Overlay`, `Content`, `Title`, `Close`).
    - Styled `Dialog.Content` using Tailwind CSS for centering and appearance, consistent with Radix Themes.
    - Updated `PageLayout.tsx` (`src/app/_components/PageLayout.tsx`) to add an ID (`page-layout-container`) to the main wrapping `Box`.
    - Updated `LogScoreDialog.tsx` to find the container element by ID on mount and pass it to the `container` prop of `Dialog.Portal`. This ensures the dialog renders within the Radix Theme provider.
    - Corrected import paths in `LogScoreDialog.tsx` after moving the component.
    - Updated `WodTable.tsx` (`src/app/(main)/components/WodTable.tsx`):
      - Added state management (`dialogState`) to control the dialog's open state and pass the relevant WOD and optional score (`initialScore`) to `LogScoreDialog`.
      - Replaced the `LogScorePopover` component instance with `LogScoreDialog`.
      - Updated the "+ Log score" button and the "Edit" icon's `onClick` handlers to manage the new `dialogState`.
    - Deleted the old `LogScorePopover.tsx` component file.
    - **Update (Apr 15):** Replaced the Rx `Checkbox` with a Radix UI `Switch` component within `LogScoreDialog.tsx` for a toggle-style input.
    - **Update 2 (Apr 15):** Rearranged the Date and Rx fields in `LogScoreDialog.tsx`. The Date input (with label) is now on the left, and the Rx Switch is on the right, aligned on the same row using Flexbox.
    - **Update 3 (Apr 15):** Reduced the width of the "Minutes" and "Seconds" input fields in `LogScoreDialog.tsx` by applying a fixed width (`70px`) to their containing `Box` elements and removing `flexGrow`.
  - **Outcome:** The score logging and editing interface now uses a standard, centered modal dialog (`LogScoreDialog`) that correctly inherits Radix Theme styles and uses a `Switch` for the Rx input. The Date and Rx fields are laid out horizontally, and the time input fields are narrower. This improves focus and consistency with other dialogs in the application (like delete confirmation). The core form logic and state handling remain the same.

- **Delete Confirmation Dialog Button Styling Fix (Apr 15, 2025):**

  - **Goal:** Align the delete confirmation dialog buttons with the project's Radix UI Theme styling.
  - **Implementation:**
    - Updated `WodTable` (`src/app/(main)/components/WodTable.tsx`):
      - Imported `Button` from `@radix-ui/themes`.
      - Replaced standard HTML `<button>` elements with Radix `Button` components within the `Dialog.Content`.
      - Applied `variant="soft" color="gray"` to the "Cancel" button.
      - Applied `variant="solid" color="red"` to the "Delete" button.
  - **Outcome:** The delete confirmation dialog buttons now use the consistent Radix UI styling, improving visual coherence.

- **Log Score Popover Behavior Fix (Apr 15, 2025):**

  - **Goal:** Fix issues with `LogScorePopover` where state persisted between modes and the trigger button behavior was incorrect during edits.
  - **Implementation:**
    - Updated `LogScorePopover` (`src/app/(main)/components/LogScorePopover.tsx`):
      - Ensured form state is reset correctly after successful submissions (log/update), cancellation, or closing the popover (`resetForm` function, `handleOpenChange`).
      - Created a dedicated `openInLogMode` handler for the trigger button (`Popover.Trigger`) which resets the form before opening.
      - Hardcoded the trigger button's text and `aria-label` to always be "Log Score".
  - **Outcome:**
    1. The popover form state is now correctly reset, preventing data persistence between edit and log modes.
    2. The "+ Log score" trigger button consistently displays the correct text and always opens the popover in a clean "log" state, independent of any edit actions.

- **Component Refactoring (Apr 15, 2025):**

  - **Goal:** Organize main page (root route `/`) components logically using a Next.js Route Group `(main)`, aligning with project structure patterns used elsewhere (e.g., `/charts`, `/import`).
  - **Implementation:**
    - Created the route group directory `src/app/(main)/` and its components subdirectory `src/app/(main)/components/`.
    - Moved the root page file from `src/app/page.tsx` to `src/app/(main)/page.tsx`.
    - Moved the following components and their tests from their previous location (`src/app/_components/main/` or `src/app/main/components/`) to `src/app/(main)/components/`:
      - `LogScorePopover.tsx`
      - `WodListMobile.tsx`
      - `WodListMobileHeader.tsx`
      - `WodTable.tsx` (and associated `*.test.tsx` files)
      - `WodViewer.tsx` (and associated `*.test.tsx` file)
    - Updated import paths in `src/app/(main)/page.tsx` and potentially within the moved components to reflect the new location.
    - Deleted the intermediate directory `src/app/_components/main/` and the original `src/app/main/components/` directory.
  - **Outcome:** Components related to the main page (`/`) are now logically grouped within the `src/app/(main)/` route group, specifically under `src/app/(main)/components/`, improving project organization and consistency with Next.js conventions.

- **Lint, Type Safety, and Code Cleanup (Apr 2025):**

  - **Goal:** Resolve all outstanding TypeScript/ESLint errors and warnings related to unsafe `any` usage, floating promises, and unused variables/imports.
  - **Implementation:**
    - **Frontend:**
      - Updated `LogScorePopover` (`src/app/(main)/components/LogScorePopover.tsx`): // Path updated
        - Replaced all `any` usage with explicit, type-safe payload and error types.
        - Used type guards for error handling.
        - Ensured all member accesses and mutation arguments are type-safe.
      - Updated `WodTable` (`src/app/(main)/components/WodTable.tsx`): // Path updated
        - Removed unused `Info` import.
      - Updated `WodViewer` (`src/app/(main)/components/WodViewer.tsx`): // Path updated
        - Fixed floating promise by prefixing cache invalidation with `void`.
    - **Backend:**
      - Updated `scoreRouter` (`src/server/api/routers/score.ts`):
        - Removed unused `result` variable in `importScores`.
        - Replaced `Record<string, any>` with a specific type for update data in `updateScore`.
        - Ensured all update logic is type-safe.
  - **Outcome:** All TypeScript/ESLint errors and warnings related to unsafe types, floating promises, and unused code are resolved. The codebase is now fully type-safe and clean, in line with project standards.

  - **April 14, 2025: Lint/Type Safety Batch Fixes**
    - **Test files:** Added `// eslint-disable-next-line @typescript-eslint/no-empty-function` above all empty `mutate` and `reset` mock methods in:
      - `src/app/(main)/components/WodTable.actions.test.tsx` // Path updated
      - `src/app/(main)/components/WodTable.headers.test.tsx` // Path updated
      - `src/app/(main)/components/WodTable.links.test.tsx` // Path updated
      - `src/app/(main)/components/WodTable.rows.test.tsx` // Path updated
    - **test-utils.tsx:**
      - Replaced all `any` usage with `Record<string, unknown>`.
      - Added eslint-disable comments for empty mock methods.
      - Replaced `@ts-ignore` with `@ts-expect-error` and then removed the directive when it was unused.
      - Ensured all assignments are type-safe.
    - **WodTable.tsx (`src/app/(main)/components/WodTable.tsx`):** // Path updated
      - Refactored to call `useVirtualizer` unconditionally, fixing the "React Hook called conditionally" lint error.
      - Restored the full `createColumns` function to resolve missing reference error.
      - Confirmed all code is type-safe and passes lint/typecheck.
    - **Outcome:** All reported ESLint and TypeScript errors are resolved. The codebase is now fully type-safe and clean, with all test mocks and hooks compliant with project linting rules.

- **Score Tooltip & Info Icon Update (Apr 2025):**

  - **Goal:** Remove the info icon (with benchmark breakdown tooltip) from the "your score" cell and instead include the benchmark breakdown in the main tooltip for each score, along with user level, notes, and date.
  - **Implementation:**
    - Updated `WodTable` (`src/app/(main)/components/WodTable.tsx`): // Path updated
      - Removed the info icon and its tooltip from the "your score" cell when no scores are present.
      - The tooltip for each score badge now includes:
        - Logged date
        - Notes (or "-")
        - User level
        - Full benchmark breakdown (from `getPerformanceLevelTooltip`)
        - All formatted as specified in the product requirements.
      - If there are no scores, only the LogScorePopover is shown (no icon, no tooltip).
    - Ensured the new tooltip is accessible, minimal, and consistent with project UI/UX patterns.
  - **Outcome:** The UI is now more concise and context-rich, with all relevant score and benchmark information available in a single tooltip, and no redundant info icon.

- **Edit/Delete Score & Validation Improvements (Apr 2025):**

  - **Goal:** Allow users to edit or delete any logged score directly from the WOD table, and prevent empty/invalid results from being logged.
  - **Implementation:**
    - **Backend:**
      - Added `deleteScore` and `updateScore` protected tRPC mutations to `scoreRouter` (`src/server/api/routers/score.ts`), allowing users to delete or update their own scores.
    - **Frontend:**
      - Updated `WodTable` (`src/app/(main)/components/WodTable.tsx`): // Path updated
        - For each score, displays edit (pencil) and delete (trash) icons to the right.
        - Edit icon opens `LogScorePopover` in edit mode, pre-filled with the score's data, and calls `updateScore` on submit.
        - Delete icon opens a confirmation dialog and calls `deleteScore` on confirm, with UI refresh.
      - Updated `LogScorePopover` (`src/app/(main)/components/LogScorePopover.tsx`): // Path updated
        - Supports both log and edit modes, with correct button labeling and form pre-fill.
        - Validation logic prevents submitting empty or invalid results for all score types (time, reps, load, etc.).
        - Cancel button for edit mode.
    - **UI/UX:**
      - Edit/delete icons are accessible, have tooltips, and are styled minimally.
      - All error and loading states are handled gracefully.
  - **Outcome:** Users can now edit or delete any score directly from the table, and cannot log empty/invalid results. The implementation is modular, context-aware, and follows project UI/UX patterns.

- **Time Input Update in LogScorePopover (Apr 2025):**

  - **Goal:** Allow users to input time in the popover UI as a combination of minutes and seconds (e.g., "35min 24sec"), not AM/PM or a single seconds field.
  - **Implementation:**
    - Replaced the single seconds input with two fields: "Minutes" and "Seconds" for time-based WODs in `LogScorePopover` (`src/app/(main)/components/LogScorePopover.tsx`). // Path updated
    - On submit, the values are converted to total seconds for backend compatibility.
    - Ensures clarity and matches product UI/UX goals for concise, minimal, and user-friendly input.
  - **Outcome:** Users can now enter their time in the requested format when logging scores for "For Time" WODs.

- **Log Score Functionality for WODs (Apr 2025):**
  - **Goal:** Allow users to log a score for any WOD directly from the main table, with a minimal, context-aware form and automatic UI refresh.
  - **Implementation:**
    - **Backend:**
      - Added a new protected tRPC mutation `logScore` to `scoreRouter` (`src/server/api/routers/score.ts`), accepting a single score object (validated with `scoreImportSchema`) and inserting it into the `scores` table.
    - **Frontend:**
      - Created `LogScorePopover` component (`src/app/(main)/components/LogScorePopover.tsx`): // Path updated
        - Renders a "Log Score" button (plus icon) that appears on row hover in the WOD table.
        - Clicking the button opens a Radix UI popover with a minimal form.
        - The form adapts fields based on WOD type/tags (For Time, AMRAP, Load, etc.), using only relevant fields.
        - Submits the score via `api.score.logScore.useMutation`.
        - On success, closes the popover, resets the form, and triggers a callback to refresh scores.
      - Updated `WodTable` (`src/app/(main)/components/WodTable.tsx`): // Path updated
        - Added a new column for the log score action, rendering `LogScorePopover` for each row.
        - Passed a callback to `LogScorePopover` to trigger a scores refetch after logging.
      - Updated `WodViewer` (`src/app/(main)/components/WodViewer.tsx`): // Path updated
        - Uses tRPC utils to invalidate the `getAllByUser` scores query after a score is logged, ensuring the table updates automatically.
    - **UI/UX:**
      - Button is only visible on row hover (desktop), always visible in mobile list view (to be implemented in mobile component).
      - Popover form is minimal, responsive, and uses Tailwind + Radix UI.
      - All error and loading states are handled gracefully.
  - **Outcome:** Users can now log a score for any WOD directly from the table, with the scores list updating automatically. The implementation is modular, context-aware, and follows project UI/UX patterns.

...
