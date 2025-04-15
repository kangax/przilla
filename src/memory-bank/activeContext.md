# Active Context

## Current Focus

- **Log Score UI Refactor: Popover to Dialog (Apr 15, 2025):** Replaced the score logging/editing Popover (`LogScorePopover.tsx`) with a centered Modal Dialog (`LogScoreDialog.tsx`) using Radix UI Dialog components. This provides a more focused user experience. The parent component (`WodTable.tsx`) now manages the dialog state. The core form logic, validation, and state handling (including recent fixes for state reset) were preserved in the new dialog component. **Update:** Ensured the dialog renders within the Radix Theme context by adding an ID to `PageLayout.tsx` and using the `container` prop on `Dialog.Portal` in `LogScoreDialog.tsx`.
- **Log Score Popover Behavior Fix (Apr 15, 2025):** Resolved issues with the _previous_ `LogScorePopover`:
  1.  Fixed a bug where the popover would retain data from a previous edit session when opened to log a new score. The form state is now correctly reset after successful submissions (both log and update) and when the cancel button is clicked or the popover is closed.
  2.  Ensured the "+ Log score" trigger button always displays "+ Log score" text and opens the popover in a clean "log" state, even if an edit action was previously initiated for a score on the same row. Edit mode is now only triggered programmatically via the edit icon.
- **Lint, Type Safety, and Code Cleanup (Apr 2025):** All outstanding TypeScript/ESLint errors and warnings have been resolved. The codebase is now fully type-safe and clean, with no unsafe `any` usage, floating promises, or unused variables/imports. This ensures a robust foundation for future development and aligns with project standards.
  - As of April 14, 2025: All test files, test-utils, and WodTable.tsx are fully compliant with lint and type safety rules. All test mocks use proper eslint-disable comments for empty methods, test-utils is type-safe, and WodTable.tsx unconditionally calls all hooks. The codebase passes lint and typecheck with zero errors or warnings.
- **Score Tooltip & Info Icon Update (Apr 2025):** The "your score" cell in the WOD table no longer displays an info icon for benchmark breakdown. Instead, the benchmark breakdown is now included in the main tooltip for each score badge, along with the user's level, notes, and date, in a clear, multi-line format. If there are no scores, only the Log Score trigger is shown (no icon, no tooltip). This change streamlines the UI and ensures all relevant context is available in a single, accessible tooltip.
- **Score Edit/Delete & Validation (Apr 2025):** Users can now edit or delete any logged score directly from the WOD table. Edit and delete icons are shown for each score. The edit icon opens the log score dialog in edit mode, pre-filled with the score's data, and updates the score on submit. The delete icon opens a confirmation dialog and deletes the score on confirm. Validation now prevents empty or invalid results from being logged for all score types.
- **Log Score (Apr 2025):** Users can now log a score for any WOD directly from the main table via a minimal dialog form (`LogScoreDialog.tsx`). The scores list refreshes automatically after logging. Next: implement the always-visible log score button in the mobile list view.
  - The dialog allows direct input of minutes and seconds (e.g., "35min 24sec") for time-based WODs, matching the requested input format and improving clarity.
- **CSV/SugarWOD Score Import (Apr 2025):** The dedicated import route (`/import`) and UI (`ScoreImportWizard`) are functional, including backend insertion via the `importScores` tRPC mutation.
- **Wodwell icon link in mobile view:** Implemented a circular Wodwell icon (white "w" on black) as a link to the WOD's Wodwell.com page, shown to the left of the likes count in each mobile WOD card header. The icon is accessible, styled for both themes, and does not interfere with card expand/collapse.
- **Authentication Migration:** Completed migration from NextAuth.js to Better Auth.

## Next Steps

### Must have

- Performance chart should show values relative to WOD difficulty
  - and also display in a tooltip how a value was derived (which workouts were used)
- Tag pills are white in dark mode on mobile
- Add sorting to mobile view
- Implement always-visible log score button in mobile list view

### Maybe

- Wodwell
  - write a script for scraping
  - bookmarklet so users can use? (this has been difficult)

## Learnings & Insights

- Using a centered Dialog for score logging/editing provides a more focused interaction compared to a Popover attached to a trigger element.
- Radix UI Portals need a specified `container` within the Theme provider to inherit theme styles correctly.
- Consolidating all relevant score and benchmark information into a single tooltip improves clarity and reduces UI clutter.
- Removing redundant icons aligns with the project's minimal UI philosophy and enhances accessibility.
- Tooltip formatting should always be clear, multi-line, and context-rich, especially for performance/benchmark data.
- Ensuring shared components like dialog forms correctly reset their state between different modes (e.g., log vs. edit) is crucial for predictable UI behavior. Resetting state after successful actions or cancellation is a reliable pattern.
- Trigger elements for actions like "Log Score" should maintain consistent appearance and behavior, independent of other states (like editing) managed within the same component instance. Separate trigger logic (e.g., dedicated onClick handlers) can achieve this.

## Recent Changes

See [recentChanges.md](./recentChanges.md) for the full, detailed changelog.
