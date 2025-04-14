# Recent Changes

- **Light Theme Contrast Improvements (Apr 2025):**

  - **Problem:** Light mode had poor contrast, with white cards on a white background and low-contrast badges.
  - **Solution:** Adjusted global background color and mobile badge styles for better visibility in light mode.
  - **Implementation:**
    - Modified `src/styles/globals.css`:
      - Changed the light mode `--background` CSS variable from `0 0% 100%` (white) to `220 16% 96%` (light gray) to differentiate the page background from cards.
    - Modified `src/app/_components/WodListMobile.tsx`:
      - Updated the `difficultyStyles` map to use slightly darker background colors (e.g., `bg-orange-200` instead of `bg-orange-100`) for difficulty badges in light mode, improving their contrast against the white card background.
  - **Outcome:** Improved visual separation between page background and cards, and enhanced readability of difficulty badges in the mobile view's light theme.

- **Mobile Score Notes Display (Apr 2025):**

  - **Problem:** Score notes were not visible in the mobile list view (`WodListMobile.tsx`).
  - **Solution:** Added the display of score notes below the score details within each expanded mobile card.
  - **Implementation:**
    - Modified `src/app/_components/WodListMobile.tsx`:
      - Changed the score list item (`<li>`) layout to `flex-col`.
      - Added a conditional paragraph (`<p>`) below the score/Rx/date row to render `score.notes` if present.
      - Styled the notes text to be smaller (`text-xs text-slate-500 dark:text-slate-400`).
  - **Outcome:** Score notes are now visible in the mobile view when a WOD card is expanded.

- **Mobile Search Highlighting & Auto-Expand (Apr 2025):**

  - **Problem:** Mobile view lacked search result highlighting and didn't visually indicate matches clearly.
  - **Solution:** Implemented search term highlighting and automatic card expansion in the mobile list view.
  - **Implementation:**
    - Extracted the `HighlightMatch` component from `src/app/_components/WodTable.tsx` into a shared utility file `src/utils/uiUtils.tsx`.
    - Updated `src/app/_components/WodTable.tsx` to import `HighlightMatch` from the shared location.
    - Modified `src/app/_components/WodListMobile.tsx`:
      - Added `searchTerm` prop.
      - Imported and used the shared `HighlightMatch` component for WOD name, tags, and description.
      - Added `checkWodMatch` helper function to detect search term matches in WOD content.
      - Updated card expansion logic: cards now expand automatically if their content matches the `searchTerm`, while still allowing manual override via click. Used `useMemo` to optimize match checking.
    - Modified `src/app/_components/WodViewer.tsx`:
      - Passed the `searchTerm` state down to `WodListMobile` to enable highlighting and fix TypeScript errors.
  - **Outcome:** Mobile view now highlights search terms in WOD name, tags, and description, and automatically expands matching cards for better visibility. Code reuse improved by sharing `HighlightMatch`.

- **Mobile Card Expansion (Previous - Apr 2025):**
  - **Problem:** Mobile view (`WodListMobile.tsx`) showed basic WOD info but lacked details like description and user scores.
  - **Solution:** Implemented an expandable card interface (now enhanced with search highlighting/auto-expand).
  - **Implementation:**
    - Modified `src/app/_components/WodListMobile.tsx`:
      - Added state (`useState`) to track the currently expanded card ID (using string IDs).
      - Added a click handler to the card header to toggle expansion state.
      - Added ChevronUp/ChevronDown icons (from `lucide-react`) to indicate expansion state.
      - Conditionally rendered a section below the tags containing the WOD description and user scores when the card is expanded.
      - Fetched scores by passing `scoresByWodId` prop from `WodViewer.tsx`.
      - Used `formatScore` utility to display scores.
      - Added a separator line between description and scores.
      - Fixed initial TypeScript errors related to `wod.id` type mismatch (changed state/handler to use string).
      - Fixed runtime error by adding optional chaining (`?.`) when accessing `scoresByWodId`.
      - Fixed date display bug by using `score.scoreDate` instead of `score.createdAt`.
    - Modified `src/app/_components/WodViewer.tsx`:
      - Passed the `scoresByWodId` prop to `WodListMobile` during conditional rendering.
  - **Outcome:** Mobile view now features expandable cards showing WOD description and user scores with correct dates.
- **Mobile Header & Badge Fixes (Apr 2025):**
  - **Problem:** Top navigation links overlapped on mobile due to absolute positioning, and difficulty badges in the mobile WOD list were illegible due to text wrapping and insufficient padding. Responsive classes (`md:hidden`, `hidden md:flex`) for showing/hiding elements were not consistently applied, possibly due to CSS specificity issues.
  - **Solution Attempted:** Implemented a responsive hamburger menu for the header using responsive classes and adjusted badge styling. Further attempted to fix responsive visibility by removing an explicit `block` class that conflicted with `md:hidden`.
  - **Implementation:**
    - Modified `src/app/_components/Header.tsx`:
      - Added state (`useState`) to manage mobile menu visibility.
      - Added a hamburger `IconButton` trigger using Radix UI `DropdownMenu` and Lucide `Menu` icon, wrapped in a `Box` intended to be shown only below `md` (`md:hidden`).
      - Wrapped the desktop `PageNavigation` in a `Box` intended to be hidden below `md` (`hidden md:flex`).
      - Removed the absolute positioning for the navigation, integrating it into the flex layout.
      - Added `flex-shrink-0` to the Logo `Heading` and the right-side controls `Flex` container.
      - Adjusted padding and gaps.
      - Removed a potentially conflicting `block` class from the hamburger menu `Box`.
    - Modified `src/app/_components/PageNavigation.tsx`:
      - Added an optional `mobile` prop to adjust layout for the dropdown.
    - Modified `src/app/_components/WodListMobile.tsx`:
      - Added `whitespace-nowrap` and increased padding (`px-2.5`) to the difficulty badge `<span>`.
  - **Outcome:** Mobile difficulty badges are now fully legible. However, the responsive header navigation is **still not working correctly**; the hamburger menu remains visible on desktop, and the desktop links remain visible on mobile, indicating the Tailwind responsive classes are still being overridden or not applying as expected. Further investigation or an alternative approach (like `useMediaQuery`) may be needed.
- **Mobile View Improvements (Apr 2025):**
  - **Problem:** Table view was not optimized for mobile devices, making it difficult to use on smaller screens.
  - **Solution:** Created a responsive mobile-friendly card-based layout for smaller screens.
  - **Implementation:**
    - Created `WodListMobile.tsx` component to display workouts as cards instead of table rows on mobile.
    - Added `useMediaQuery` hook to detect mobile screen sizes.
    - Updated `WodViewer.tsx` to conditionally render either `WodTable` or `WodListMobile` based on screen size.
    - Styled mobile cards with proper spacing, borders, and shadows for better visibility.
    - Implemented horizontally scrollable tag chips for mobile view.
    - Optimized filter controls for touch interaction on mobile screens.
    - Ensured proper styling for both light and dark modes.
  - **Outcome:** Significantly improved usability on mobile devices while maintaining all functionality.
- **ESLint `no-unsafe-*` Fix in WodViewer (Apr 2025 - Final):**

  - **Problem:** Multiple `@typescript-eslint/no-unsafe-*` errors occurred in the `useMemo` hooks responsible for processing WOD and Score data in `src/app/_components/WodViewer.tsx`. Initial attempts using `any` or incorrect type assertions failed.
  - **Cause:** The data arriving from the tRPC queries (`wodsData`, `scoresData`) contained serialized representations (e.g., strings for dates, potentially stringified JSON for tags/benchmarks) that didn't match the final client-side types (`Wod`, `Score`) which expect `Date` objects and parsed structures. SuperJSON, while configured, wasn't automatically handling the deserialization as expected in this context. Trying to map directly or use `any` led to type errors or unsafe code.
  - **Solution:**
    1.  Defined intermediate types (`WodFromQuery`, `ScoreFromQuery`) in `src/types/wodTypes.ts` to accurately represent the data structure _before_ client-side transformation (e.g., `createdAt: string | Date`).
    2.  Updated the `useMemo` hooks in `src/app/_components/WodViewer.tsx` to:
        - Treat the incoming `wodsData` and `scoresData` as arrays of these intermediate types (`WodFromQuery[]`, `ScoreFromQuery[]`).
        - Explicitly type the `.map()` callback parameters with these intermediate types (e.g., `.map((wod: WodFromQuery) => ...)`).
        - Retain the existing manual transformation logic within the map (e.g., `new Date(...)`, `parseTags(...)`, `JSON.parse(...)`) to convert the intermediate types into the final `Wod` and `Score` types.
  - **Outcome:** Resolved the original ESLint errors and subsequent TypeScript errors in a type-safe manner by accurately modeling the data transformation process, without using `any`.

- **Score Data Migration Plan (kangax@gmail.com) - COMPLETED (Apr 2025):**

  **Goal:** Migrate historical workout results for user `kangax@gmail.com` from the structure previously used in `public/data/wods.json` into the `scores` database table.

  **Chosen Approach:** Store score components in separate, nullable columns within the `scores` table for better query performance and clearer schema, rather than using a single JSON column.

  **Steps:**

  1.  **Modify Database Schema (`src/server/db/schema.ts`):**
      - Remove the `scoreValue: text("score_value")...` column definition from the `scores` table.
      - Add the following new nullable integer columns to the `scores` table:
        - `time_seconds: int("time_seconds")`
        - `reps: int("reps")`
        - `load: int("load")`
        - `rounds_completed: int("rounds_completed")`
        - `partial_reps: int("partial_reps")`
  2.  **Generate SQL Migration:** Execute `npm run db:generate` to create a new SQL migration file reflecting the schema changes.
  3.  **Apply Database Migration:** Execute `npm run db:migrate` to apply the generated SQL migration to the database, altering the `scores` table structure.
  4.  **Create Score Data Migration Script (`scripts/migrate_user_scores.ts`):**
      - Create a new TypeScript script (`scripts/migrate_user_scores.ts`).
      - The script will:
        - Connect to the database using Drizzle

- **Simplified to Single Table View - COMPLETED (Apr 2025):**

**Problem**: Maintaining both table and timeline views added complexity
**Solution**: Removed timeline view to focus on table view

**Implementation**:

1. Deleted timeline component files:

   - `src/app/_components/WodTimeline.tsx`
   - `src/app/_components/WodTimeline.test.tsx`

2. Modified `WodViewer.tsx` to:
   - Remove view toggle UI
   - Remove timeline-related state and effects
   - Only render WodTable component
   - Clean up unused imports
   - Fix resulting TypeScript errors
