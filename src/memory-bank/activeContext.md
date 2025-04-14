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
- Marston shows "Advanced" even though we did it scaled

### Maybe

- Wodwell
  - write a script for scraping
  - bookmarklet so users can use? (this has been difficult)

## Recent Changes

See [recentChanges.md](./recentChanges.md) for the full, detailed changelog.
