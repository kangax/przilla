# Active Context

## Current Focus

- **Performance Chart Adjusted Level (Apr 15, 2025):** Implemented an "adjusted level" calculation for the performance timeline chart (`WodTimelineChart.tsx`). The chart now displays the monthly average performance based on `adjustedLevel = scoreLevel * difficultyMultiplier`, providing a better representation of performance considering WOD difficulty.
  - **Backend (`wodRouter.getChartData`):** Modified to join scores with WODs, fetch difficulty, calculate adjusted level for each score using defined multipliers (Easy: 0.8, Medium: 1.0, Hard: 1.2, Very Hard: 1.5, Extremely Hard: 2.0), and return the average adjusted level per month along with detailed score breakdown including original level, difficulty, multiplier, and adjusted level.
  - **Frontend (`ChartsPage`, `WodTimelineChart`):** Updated type definitions and data processing to handle the new structure. The chart now plots the average adjusted level. The tooltip displays the average adjusted level, the adjusted trend, and a detailed breakdown showing WOD Name, Original Level, Difficulty (with multiplier), and the final Adjusted Level for each score in that month. Helper functions (`getDescriptiveLevel`, `getLevelColor`) and Y-axis formatting were updated to accommodate potentially higher adjusted level values.
- **Performance Chart Tooltip Enhancement (Apr 15, 2025):** Updated the performance timeline chart (`WodTimelineChart.tsx`) tooltip. When hovering over a data point in the "Performance" view, the tooltip now displays a breakdown of the individual WODs and their calculated levels that contributed to the average level for that month. This involved:
  - Modifying the `api.wod.getChartData` tRPC procedure (`src/server/api/routers/wod.ts`) to return detailed score information (WOD name, level) alongside aggregated monthly data.
  - Updating the chart page (`src/app/charts/page.tsx`) to process and pass this detailed data to the chart component.
  - Enhancing the `CustomTimelineTooltip` within `WodTimelineChart.tsx` to render the breakdown list below the existing Level and Trend information.
- **Dialog Background Color Fix (Apr 15, 2025):** Removed explicit Tailwind background classes (`bg-white`, `dark:bg-neutral-900`) from `LogScoreDialog.tsx`'s `Dialog.Content`. This allows Radix UI Themes to correctly apply the theme-appropriate background color, resolving an issue where the dialog had an off-theme background. The delete confirmation dialog in `WodTable.tsx` still needs investigation as it doesn't use explicit overrides but shows an incorrect background.
- **Log Score UI Refactor: Popover to Dialog (Apr 15, 2025):** Replaced the score logging/editing Popover (`LogScorePopover.tsx`) with a centered Modal Dialog (`LogScoreDialog.tsx`) using Radix UI Dialog components. This provides a more focused user experience. The parent component (`WodTable.tsx`) now manages the dialog state. The core form logic, validation, and state handling (including recent fixes for state reset) were preserved in the new dialog component. **Update:** Ensured the dialog renders within the Radix Theme context by adding an ID to `PageLayout.tsx` and using the `container` prop on `Dialog.Portal` in `LogScoreDialog.tsx`. **Update 2:** Replaced the Rx `Checkbox` with a Radix UI `Switch` component for a toggle-style input. **Update 3:** Rearranged the Date and Rx fields in the dialog to place Date (with label) on the left and Rx Switch on the right on the same line. **Update 4:** Reduced the width of the "Minutes" and "Seconds" input fields for a more compact layout.
- **Log Score Popover Behavior Fix (Apr 15, 2025):** Resolved issues with the _previous_ `LogScorePopover`:
  1.  Fixed a bug where the popover would retain data from a previous edit session when opened to log a new score. The form state is now correctly reset after successful submissions (both log and update) and when the cancel button is clicked or the popover is closed.
  2.  Ensured the "+ Log score" trigger button always displays "+ Log score" text and opens the popover in a clean "log" state, even if an edit action was previously initiated for a score on the same row. Edit mode is now only triggered programmatically via the edit icon.
- **Lint, Type Safety, and Code Cleanup (Apr 2025):** All outstanding TypeScript/ESLint errors and warnings have been resolved. The codebase is now fully type-safe and clean, with no unsafe `any` usage, floating promises, or unused variables/imports. This ensures a robust foundation for future development and aligns with project standards.
  - As of April 14, 2025: All test files, test-utils, and WodTable.tsx are fully compliant with lint and type safety rules. All test mocks use proper eslint-disable comments for empty methods, test-utils is type-safe, and WodTable.tsx unconditionally calls all hooks. The codebase passes lint and typecheck with zero errors or warnings.
- **Score Tooltip & Info Icon Update (Apr 2025):** The "your score" cell in the WOD table no longer displays an info icon for benchmark breakdown. Instead, the benchmark breakdown is now included in the main tooltip for each score badge, along with the user's level, notes, and date, in a clear, multi-line format. If there are no scores, only the Log Score trigger is shown (no icon, no tooltip). This change streamlines the UI and ensures all relevant context is available in a single, accessible tooltip.
- **Score Edit/Delete & Validation (Apr 2025):** Users can now edit or delete any logged score directly from the WOD table. Edit and delete icons are shown for each score. The edit icon opens the log score dialog in edit mode, pre-filled with the score's data, and updates the score on submit. The delete icon opens a confirmation dialog and deletes the score on confirm. Validation now prevents empty or invalid results from being logged for all score types.
- **Log Score (Apr 2025):** Users can now log a score for any WOD directly from the main table via a minimal dialog form (`LogScoreDialog.tsx`) featuring a `Switch` for Rx input and an improved Date/Rx layout. The scores list refreshes automatically after logging. Next: implement the always-visible log score button in the mobile list view.
  - The dialog allows direct input of minutes and seconds (e.g., "35min 24sec") for time-based WODs, matching the requested input format and improving clarity. The time input fields are now narrower.
- **CSV/SugarWOD Score Import (Apr 2025):** The dedicated import route (`/import`) and UI (`ScoreImportWizard`) are functional, including backend insertion via the `importScores` tRPC mutation.
- **Wodwell icon link in mobile view:** Implemented a circular Wodwell icon (white "w" on black) as a link to the WOD's Wodwell.com page, shown to the left of the likes count in each mobile WOD card header. The icon is accessible, styled for both themes, and does not interfere with card expand/collapse.
- **Authentication Migration:** Completed migration from NextAuth.js to Better Auth.

## Next Steps

### Must have

- Add "log score"/edit/delete buttons in mobile list view
- Score logging should be one of time/load/reps/round+reps

### Good to have

- Make a separate table of movements
  - more precise chart of movements
  - can potentially use it for things like:
    "show wods with running AND thruster"
- Add sorting to mobile view
- ~~Performance chart should show values relative to WOD difficulty~~ (Done Apr 15, 2025)

### Maybe

- Show difficulty adjusted to you? Does it really matter? Just do the WOD, lol.
- Import from Wodwell
  - write a script for scraping
  - bookmarklet so users can use? (this has been difficult)
- Export your workouts as JSON/CSV

## Learnings & Insights

- Calculating adjusted performance metrics (like `level * difficulty`) requires careful handling of data fetching (joining tables), type definitions across backend/frontend, and UI updates (tooltips, axis labels, helper functions) to accurately reflect the new calculation.
- Passing detailed data structures (like the score breakdown) through multiple component layers (API -> Page -> Chart) requires careful type definition updates at each stage.
- Recharts custom tooltips provide flexibility to display complex, structured information derived from the data payload. Using helper functions (like `getDescriptiveLevel`) within the tooltip enhances readability.
- When calculating rolling averages or other derived data, ensure that the original data points (including newly added fields like `scores`) are correctly preserved and passed along in the transformed data structure.
- When using Radix UI Themes, avoid applying explicit background color classes (like Tailwind's `bg-white` or `dark:bg-*`) to components like `Dialog.Content`, as this can override the theme's intended styling. Let the theme handle the background automatically.
- Using a centered Dialog for score logging/editing provides a more focused interaction compared to a Popover attached to a trigger element.
- Radix UI Portals need a specified `container` within the Theme provider to inherit theme styles correctly.
- Radix UI `Switch` provides a clear toggle alternative to `Checkbox`.
- Fixed widths can be used on form elements like time inputs for a more compact layout when `flexGrow` is not desired.
- Consolidating all relevant score and benchmark information into a single tooltip improves clarity and reduces UI clutter.
- Removing redundant icons aligns with the project's minimal UI philosophy and enhances accessibility.
- Tooltip formatting should always be clear, multi-line, and context-rich, especially for performance/benchmark data.
- Ensuring shared components like dialog forms correctly reset their state between different modes (e.g., log vs. edit) is crucial for predictable UI behavior. Resetting state after successful actions or cancellation is a reliable pattern.
- Trigger elements for actions like "Log Score" should maintain consistent appearance and behavior, independent of other states (like editing) managed within the same component instance. Separate trigger logic (e.g., dedicated onClick handlers) can achieve this.

## Recent Changes

See [recentChanges.md](./recentChanges.md) for the full, detailed changelog.
