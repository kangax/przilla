# Active Context

## Current Focus

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
- [Switch to betterAuth](https://www.better-auth.com/)
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
