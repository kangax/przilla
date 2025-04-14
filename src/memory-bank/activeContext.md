# Active Context

## Current Focus

- **CSV/SugarWOD Score Import (Apr 2025):** The dedicated import route (`/import`) and UI (`ScoreImportWizard`) are functional, including backend insertion via the `importScores` tRPC mutation.
- **Wodwell icon link in mobile view:** Implemented a circular Wodwell icon (white "w" on black) as a link to the WOD's Wodwell.com page, shown to the left of the likes count in each mobile WOD card header. The icon is accessible, styled for both themes, and does not interfere with card expand/collapse.
- **Authentication Migration:** Completed migration from NextAuth.js to Better Auth.

## Next Steps

### Must have

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
