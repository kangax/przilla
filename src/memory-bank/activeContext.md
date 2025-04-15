# Active Context

## Current Focus

- **Score Edit/Delete & Validation (Apr 2025):** Users can now edit or delete any logged score directly from the WOD table. Edit and delete icons are shown for each score. The edit icon opens the log score popover in edit mode, pre-filled with the score's data, and updates the score on submit. The delete icon opens a confirmation dialog and deletes the score on confirm. Validation now prevents empty or invalid results from being logged for all score types.
- **Log Score (Apr 2025):** Users can now log a score for any WOD directly from the main table via a minimal popover form. The scores list refreshes automatically after logging. Next: implement the always-visible log score button in the mobile list view.
  - The popover now allows direct input of minutes and seconds (e.g., "35min 24sec") for time-based WODs, matching the requested input format and improving clarity.
- **CSV/SugarWOD Score Import (Apr 2025):** The dedicated import route (`/import`) and UI (`ScoreImportWizard`) are functional, including backend insertion via the `importScores` tRPC mutation.
- **Wodwell icon link in mobile view:** Implemented a circular Wodwell icon (white "w" on black) as a link to the WOD's Wodwell.com page, shown to the left of the likes count in each mobile WOD card header. The icon is accessible, styled for both themes, and does not interfere with card expand/collapse.
- **Authentication Migration:** Completed migration from NextAuth.js to Better Auth.

## Next Steps

### Must have

- Performance chart should show values relative to WOD difficulty
  - and also display in a tooltip how a value was derived (which workouts were used)
- Tag pills are white in dark mode on mobile
- Add sorting to mobile view

### Maybe

- Wodwell
  - write a script for scraping
  - bookmarklet so users can use? (this has been difficult)

## Recent Changes

See [recentChanges.md](./recentChanges.md) for the full, detailed changelog.
