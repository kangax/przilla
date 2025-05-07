# Favorites Feature Bug Investigation Log (2025-05-06)

This document logs the investigation and troubleshooting steps for a bug related to the favorites feature in the WOD tracking application.

## 1. The Problem

Two main issues were observed after an optimization to directly update the TanStack Query cache for favorites instead of invalidating a large query:

- **Main Page (`/`):** Clicking an empty star icon (to favorite a WOD) did not update the UI to show a full star immediately (optimistic update failure).
- **Favorites Page (`/favorites`):** Clicking a full star icon (to unfavorite a WOD) did not remove the WOD from the list immediately.

## 2. Initial Hypothesis & Plan

- **Main Page:** Suspected query key mismatch for the `wod.getAll` query between server-side hydration (`src/app/(main)/page.tsx`), client-side `useQuery` (`WodViewer.tsx`), and the optimistic update logic (`useFavoriteWod.ts`).
- **Favorites Page:** Suspected that client-side invalidation of `wod.getFavoritesByUser` was insufficient for a server-rendered page, requiring `router.refresh()` from `next/navigation`.

## 3. Progress & Findings

### 3.1. Favorites Page (`/favorites`) - RESOLVED

- **Fix:** Added `router.refresh()` in the `onSuccess` callbacks of `addFavoriteMutation` and `removeFavoriteMutation` within `src/app/(main)/components/hooks/useFavoriteWod.ts`.
- Also ensured `utils.wod.getFavoritesByUser.invalidate({});` was called with an explicit empty input.
- **Outcome:** The user confirmed that this resolved the issue on the favorites page. WODs are now correctly removed/added from the list UI.

### 3.2. Main Page (`/`) - Icon Update Issue (Ongoing)

This issue has required more extensive debugging.

#### Step 1: Initial Query Key Alignment Attempt

- **Action:** Ensured `searchQuery: undefined` was used consistently for empty searches in:
  - `src/app/(main)/page.tsx` (server-side fetch and hydration for `wod.getAll`).
  - `src/app/(main)/components/WodViewer.tsx` (client-side `useQuery` for `wod.getAll`).
  - `src/app/(main)/components/hooks/useFavoriteWod.ts` (for `getAllWodsQueryKey` used in optimistic updates).
- **Outcome:** This did not resolve the issue.

#### Step 2: Identifying Query Key Structural Mismatch (Diagnostic Logging)

- **Action:** Added extensive `console.log` statements in `useFavoriteWod.ts`, `WodViewer.tsx`, and `FavoritesPage.tsx`.
- **Key Finding (from logs):** The manually constructed query keys for `wod.getAll` in `page.tsx` and `useFavoriteWod.ts` had a structural difference compared to the keys TanStack Query would generate for tRPC:
  - Manual attempt: `["wod.getAll", { input: { searchQuery: ... }, type: "query" }]` (string path, wrapped input).
  - Expected tRPC/TanStack Query structure: `[ ['wod', 'getAll'], { searchQuery: ... } ]` (array of path parts, direct input object).
- This mismatch meant the optimistic update was targeting a different cache entry than what `WodViewer.tsx` was subscribed to.

#### Step 3: Correcting Query Key Structure

- **Action:**
  - Modified `src/app/(main)/page.tsx`: Changed hydration key to `[ ['wod', 'getAll'], { searchQuery: undefined } ]`.
  - Modified `src/app/(main)/components/hooks/useFavoriteWod.ts`: Changed `getAllWodsQueryKey` to `[ ['wod', 'getAll'], { searchQuery: searchTerm || undefined } ]`.
- **Verification (from logs):**
  - Log from `useFavoriteWod.ts`: `addFavorite onMutate - getAllWodsQueryKey: [["wod","getAll"],{}]` (correctly shows `searchQuery: undefined` stringified to `{}`).
  - Log from `WodViewer.tsx`: `About to call api.wod.getAll.useQuery. Current searchTerm: Effective input for query: {searchQuery: undefined}`.
  - **Conclusion:** The query keys used for optimistic updates and for the main display query are now structurally identical.
- **Outcome:** Despite identical keys, the main page icon **still did not update optimistically**.

#### Step 4: Testing Invalidation as a Fallback

- **Action:** Modified `useFavoriteWod.ts`'s `onSuccess` handlers to invalidate the `wod.getAll` query (i.e., `utils.wod.getAll.invalidate(...)`). The optimistic `setQueryData` in `onMutate` was kept.
- **Outcome (reported by user):** The UI _did_ update, but after a delay (due to the refetch from invalidation). This confirmed:
  - The data _can_ be updated correctly in the UI via a refetch.
  - The optimistic update in `onMutate` (direct `setQueryData`) is the part that's failing to trigger an immediate UI refresh, even with matching keys.

## 4. Current State & Next Test

- **Problem:** The optimistic update via `queryClient.setQueryData` in `useFavoriteWod.ts`'s `onMutate` callback is not causing an immediate UI re-render for the favorite icon on the main page, despite using a query key that now correctly matches the one used by `WodViewer.tsx`.
- **Latest Change (Awaiting User Test):**
  - Modified `src/app/(main)/components/hooks/useFavoriteWod.ts` again.
  - In the `onSuccess` callbacks for `addFavoriteMutation` and `removeFavoriteMutation`, the `utils.wod.getAll.invalidate(...)` line was **removed**.
  - This change makes the `onMutate`'s `setQueryData` call solely responsible for the optimistic UI update on the main page. The goal is to see if this isolated optimistic update can work.
- **Suspicion:** The issue is highly localized to why `queryClient.setQueryData` in `onMutate` isn't triggering the expected re-render in `WodViewer` or its children, despite correct keys and immutable data update patterns (`.map`, spread syntax) being used.

## 5. Remaining Diagnostic Logs

All previously added diagnostic logs in:

- `src/app/(main)/components/hooks/useFavoriteWod.ts`
- `src/app/(main)/components/WodViewer.tsx`
- `src/app/favorites/page.tsx`
  are still in place to aid further debugging if the latest change also fails to produce an immediate optimistic update.
