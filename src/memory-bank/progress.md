# Progress

## What Works

- **Scaled badge display:** All non-Rx (scaled) scores now show a "Scaled" badge in grey, both in table and mobile views, ensuring accurate and consistent level display.
- **PageLayout:** Consistent page structure with Header component now implemented across all pages via `PageLayout` component. Includes standardized content container styling and ensures uniform header display.
- **Initial Load Performance:** WOD data is now fetched server-side in `src/app/page.tsx` and passed as a prop (`initialWods`) to `WodViewer`, significantly improving initial load time and LCP.
- **WOD Display:**
  - Core components for displaying WOD information (`WodViewer`, `WodTable`, `WodListMobile`) are functional.
  - `WodViewer` uses initial data from props for the first render and fetches scores client-side via tRPC (`api.score.getAllByUser`). The `api.wod.getAll` query remains for caching/updates.
  - **Mobile View (`WodListMobile.tsx`):** - Displays WODs as cards. - Cards are expandable via click on the header area (chevron icon indicates state). - **Search Highlighting & Auto-Expand:** Cards automatically expand if their content (name, tags, description) matches the active search term. Matching text is highlighted using the shared `HighlightMatch` component (`src/utils/uiUtils.tsx`). - Expanded view shows WOD description and user scores (with correct dates). - Includes a visual separator between description and scores. - **Score Notes:** Displays score notes (if they exist) below the score/Rx/date line in a smaller font.
    ...
