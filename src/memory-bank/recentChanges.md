# Recent Changes

## 2025-05-06

- **Fix Favorite Star Display on Home Page**:

  - Updated `WodSchema` in `src/types/wodTypes.ts` to include `isFavorited: z.boolean().optional()`.
  - This prevents the `isFavorited` property (correctly returned by the `api.wod.getAll` tRPC endpoint) from being stripped during Zod parsing in `src/app/(main)/page.tsx` (server-side for initial data) and `src/app/(main)/components/WodViewer.tsx` (client-side for API response processing).
  - Ensures that the `WodTable` component on the home page receives the correct `isFavorited` status, allowing the star icon to be highlighted appropriately for favorited WODs.

- **Implemented Favorites Feature (Backend & Initial Frontend)**:
  - **Database Schema (`src/server/db/schema.ts`)**:
    - Added `userFavoriteWods` table for user-WOD favorite relationships.
    - Updated `userRelations` and `wodsRelations` for many-to-many relationships through `userFavoriteWods`.
    - Added `userFavoriteWodsRelations`.
    - Corrected primary key definition in `wodMovements` table.
    - Successfully generated database migration `drizzle/0002_flashy_hulk.sql` after resolving a Drizzle meta snapshot collision by correcting `prevId` in `drizzle/meta/0001_snapshot.json`.
  - **Types (`src/types/wodTypes.ts`)**:
    - Added optional `isFavorited?: boolean` property to `Wod` and `WodFromQuery` types to support favorite status display.
  - **tRPC API Endpoints**:
    - Created new `favoriteRouter.ts` (`src/server/api/routers/favoriteRouter.ts`) with:
      - `favorite.add`: Protected procedure to add a WOD to user's favorites.
      - `favorite.remove`: Protected procedure to remove a WOD from user's favorites.
      - `favorite.getWodIdsByUser`: Protected procedure to get all WOD IDs favorited by the current user.
    - Updated `wodRouter.ts` (`src/server/api/routers/wod.ts`):
      - Modified `wod.getAll` to fetch and include `isFavorited` status for each WOD if a user is logged in (uses internal call to `favorite.getWodIdsByUser`).
      - Added new `wod.getFavoritesByUser` protected procedure to fetch WODs favorited by the current user, with support for optional filtering (category, tags, search).
    - Updated Root Router (`src/server/api/root.ts`) to include the new `favoriteRouter`.
  - **Frontend - Navigation (`src/app/_components/PageNavigation.tsx`)**:
    - Added a "Favorites" link to the main navigation.
    - Link is visible only to logged-in users.
    - Includes active state highlighting based on the current path.
  - **Frontend - Favorite Toggle UI (`src/app/(main)/components/WodTable.tsx`, `src/app/(main)/components/WodListMobile.tsx`)**:
    - Integrated a star icon for favoriting/unfavoriting WODs in both table and mobile list views.
    - Icon state (filled/empty) reflects `isFavorited` status.
    - Toggle functionality calls `favorite.add` or `favorite.remove` tRPC mutations.
    - Implemented optimistic UI updates for the star icon.
    - Added query invalidation for `wod.getAll` and `wod.getFavoritesByUser` on mutation success.
    - Integrated toast notifications for success/failure of favorite actions.
  - **Frontend - Favorites Page (`src/app/favorites/page.tsx`)**:
    - Created the new page structure at `/favorites`.
    - Implemented authentication check; redirects to login if user is not authenticated.
    - Fetches favorited WODs using `api.wod.getFavoritesByUser`.
    - Fetches user's scores for these favorited WODs.
    - Passes fetched data to the `WodViewer` component.
  - **Frontend - Component Adaptations for Favorites Page**:
    - `PageLayout.tsx` (`src/app/_components/PageLayout.tsx`): Modified to accept and render `title` and `description` props for better page context.
    - `WodViewer.tsx` (`src/app/(main)/components/WodViewer.tsx`):
      - Updated `WodViewerProps` to accept `initialScoresByWodId` (optional) and `source` (optional, defaults to 'main').
      - Conditionally disables its internal `api.wod.getAll.useQuery` when `source` is 'favorites'.
      - Adapts data sources for `useWodViewerData` hook based on the `source` prop, using `initialWods` and `initialScoresByWodId` when on the favorites page.

## 2025-05-05

- **Fix TRPCError in Charts Page:** Added a nullish check in `src/utils/wodValidation.ts` within the `validateWodsFromDb` function. This prevents a Zod validation error (`expected: "object", received: "undefined"`) that occurred when the function received a null or undefined entry from the WOD data array fetched in `src/server/api/routers/wodChartHelpers.ts`. The function now safely skips such entries and logs a warning. This resolves the `TRPCError` encountered when loading the `/charts` page.

## 2025-05-03

- Ran `scripts/fix_null_timecaps.ts` to update all WODs in the database with `null` timecap to `0`.
- Fixed Zod validation errors caused by WODs with `null` timecap (e.g., "1/4 Mile for Humanity").
- Ensured all WODs now have a non-null, numeric timecap, matching schema requirements.
- Script logs before/after counts for traceability.
