# Progress

## What Works

- **Lint, Type Safety, and Code Cleanup (Apr 2025):** All TypeScript/ESLint errors and warnings related to unsafe `any` usage, floating promises, and unused variables/imports have been resolved. The codebase is now fully type-safe and clean, providing a robust foundation for future development.
  - As of April 14, 2025: All test files, test-utils, and WodTable.tsx are fully compliant with lint and type safety rules. All test mocks use proper eslint-disable comments for empty methods, test-utils is type-safe, and WodTable.tsx unconditionally calls all hooks. The codebase passes lint and typecheck with zero errors or warnings.
- **Score Tooltip & Info Icon Update (Apr 2025):** The "your score" cell in the WOD table now shows all relevant information (logged date, notes, user level, and benchmark breakdown) in a single tooltip for each score badge. The info icon and its tooltip have been removed. If there are no scores, only the LogScorePopover is shown. This streamlines the UI and improves clarity.
- **Score Edit/Delete & Validation (Apr 2025):** Users can now edit or delete any logged score directly from the WOD table. Edit and delete icons are shown for each score. The edit icon opens the log score popover in edit mode, pre-filled with the score's data, and updates the score on submit. The delete icon opens a confirmation dialog and deletes the score on confirm. Validation now prevents empty or invalid results from being logged for all score types.
- **Log Score (Apr 2025):** Users can log a score for any WOD directly from the main table via a minimal popover form. The form adapts to WOD type, and the scores list refreshes automatically after logging. (Next: implement always-visible log score button in mobile list view.)
- **CSV/SugarWOD Score Import:** The full import flow is functional. Users can upload a CSV file via the dedicated `/import` route, review matched scores in `ScoreReviewTable`, confirm selections in `ImportConfirmation`, and the `ScoreImportWizard` component handles the process, submitting selected scores to the backend via the `api.score.importScores` tRPC mutation for insertion into the database. Includes client-side parsing, WOD matching (case-insensitive), validation, and UI feedback for loading/success/error states.
- **Authentication Migration:** Successfully migrated from NextAuth.js to Better Auth, including database schema updates, API routes, client/server integration, and new login/signup/password reset pages.
- **Wodwell icon link in mobile view:** A circular Wodwell icon (white "w" on black) now appears to the left of the likes count in each mobile WOD card header if `wod.wodUrl` exists. The icon links to the WOD's Wodwell.com page, opens in a new tab, is accessible, and does not interfere with card expand/collapse.
- **Scaled badge display:** All non-Rx (scaled) scores now show a "Scaled" badge in grey, both in table and mobile views, ensuring accurate and consistent level display.
- **PageLayout:** Consistent page structure with Header component now implemented across all pages via `PageLayout` component. Includes standardized content container styling and ensures uniform header display.
- **Initial Load Performance:** WOD data is now fetched server-side in `src/app/page.tsx` and passed as a prop (`initialWods`) to `WodViewer`, significantly improving initial load time and LCP.
- **WOD Display:**
  - Core components for displaying WOD information (`WodViewer`, `WodTable`, `WodListMobile`) are functional.
  - `WodViewer` uses initial data from props for the first render and fetches scores client-side via tRPC (`api.score.getAllByUser`). The `api.wod.getAll` query remains for caching/updates.
  - **Mobile View (`WodListMobile.tsx`):** - Displays WODs as cards. - Cards are expandable via click on the header area (chevron icon indicates state). - **Search Highlighting & Auto-Expand:** Cards automatically expand if their content (name, tags, description) matches the active search term. Matching text is highlighted using the shared `HighlightMatch` component (`src/utils/uiUtils.tsx`). - Expanded view shows WOD description and user scores (with correct dates). - Includes a visual separator between description and scores. - **Score Notes:** Displays score notes (if they exist) below the score/Rx/date line in a smaller font.
    ...

## What's Left / Next Steps

- Implement always-visible log score button in mobile list view.
- Performance chart should show values relative to WOD difficulty, and display in a tooltip how a value was derived (which workouts were used).
- Tag pills are white in dark mode on mobile.
- Add sorting to mobile view.
- (Maybe) Wodwell scraping/bookmarklet.

## Known Issues

- None related to score logging, editing, or deletion as of Apr 2025.
