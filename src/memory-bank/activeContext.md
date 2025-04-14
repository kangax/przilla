# Active Context

## Current Focus

- CSV Score Import UI Migration (Apr 2025): Dedicated import route and UI for score import is functional; backend insertion logic is pending.
- **Wodwell icon link in mobile view:** Implemented a circular Wodwell icon (white "w" on black) as a link to the WOD's Wodwell.com page, shown to the left of the likes count in each mobile WOD card header. The icon is accessible, styled for both themes, and does not interfere with card expand/collapse.
- **Authentication Migration:** Completed migration from NextAuth.js to Better Auth.

## Next Steps

### Must have

- Sugarwod (allows export!)
  - write import functionality --> IN PROGRESS (UI built)
- **CSV Score Import UI Migration (Apr 2025):**
  - Moved all ScoreImport components to dedicated `/import` route (`src/app/import/components/`)
  - Created new import page (`src/app/import/page.tsx`) to host ScoreImportWizard
  - Added Import link to main navigation in Header
  - Removed ScoreImportWizard from home page
  - Implemented case-insensitive WOD name matching
  - Added debug logging for WOD matching process
  - **Status:** UI flow is fully functional via new route. Backend insertion logic is pending.
- Log score
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
