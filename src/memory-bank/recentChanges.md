# Recent Changes

- **CSV/SugarWOD Score Import Backend (Apr 2025):**

  - **Goal:** Implement the backend logic to receive and store imported scores from the CSV/SugarWOD import UI.
  - **Implementation:**
    - Defined Zod schemas (`scoreImportSchema`, `importScoresInputSchema`) in `src/server/api/routers/score.ts` to validate the incoming array of score data.
    - Added a new protected tRPC mutation `importScores` to `scoreRouter` (`src/server/api/routers/score.ts`).
    - The mutation retrieves the `userId` from the session, maps the input score data (including `wodId`, `scoreDate`, `isRx`, `notes`, and score components like `time_seconds`, `reps`, etc.) to the database schema, and performs a bulk insert into the `scores` table using `ctx.db.insert(scores).values(...)`. Includes basic error handling and logging.
    - Integrated the frontend `ScoreImportWizard` component (`src/app/import/components/ScoreImportWizard.tsx`) with the new mutation:
      - Added `api.score.importScores.useMutation` hook.
      - Updated the `handleConfirm` function to filter selected rows, ensure `scoreDate` is a `Date` object, and call `importScoresMutation.mutate` with the prepared data.
      - Implemented UI feedback for loading (`isPending`), success (`onSuccess`), and error (`onError`) states, updating the wizard step accordingly.
      - Added state (`importSuccessCount`) to display the number of successfully imported scores on the completion step.
      - Fixed a TypeScript error by using `isPending` instead of `isLoading` for the mutation status check.
  - **Outcome:** The score import feature is now fully functional end-to-end. Users can upload a CSV, review/select scores, and confirm the import, which triggers the backend mutation to save the scores to the database.

- **Authentication Migration to Better Auth (Apr 2025):**

  - **Goal:** Replaced NextAuth.js with Better Auth for handling user authentication.
  - **Implementation:**
    - Installed `better-auth`, `oslo`, and `better-auth/adapters/drizzle`. Uninstalled `next-auth`.
    - Updated environment variables (`.env`, `.env.example`, `src/env.js`) for Better Auth secrets and social providers (GitHub, Google).
    - Generated new Drizzle schema definitions for auth tables (`user`, `session`, `account`, `verification`) using `@better-auth/cli`.
    - Replaced old NextAuth tables with new Better Auth tables in `src/server/db/schema.ts`, adapting syntax for SQLite.
    - Reset local SQLite database (`db.sqlite`, `drizzle/meta/_journal.json`) and recreated schema using `drizzle-kit push` due to migration complexities. Backed up scores to `scores_backup.json` beforehand.
    - Configured Better Auth instance in `src/server/auth.ts` with Drizzle adapter, email/password provider, social providers, and `getSession` helper.
    - Created new API route handler `src/app/api/auth/[...all]/route.ts` using `toNextJsHandler`.
    - Updated tRPC context (`src/server/api/trpc.ts`) to use the new `getSession`.
    - Created client-side helpers `src/lib/auth-client.ts` and `src/lib/social-login.ts`.
    - Updated `AuthControls.tsx` to use `useSession` and `signOut` from `auth-client`.
    - Created new pages and components for Login, Sign Up, Forget Password, and Reset Password flows under `src/app/(auth)/`, `src/components/`, `src/app/forget-password/`, `src/app/reset-password/`.
    - Updated server-side session checks in `src/app/charts/page.tsx` to use `getSession`.
    - Removed old NextAuth files (`src/server/auth/*`, `src/app/api/auth/[...nextauth]/*`).
  - **Outcome:** Authentication is now handled by Better Auth, providing email/password and social login capabilities integrated with the existing Drizzle/tRPC stack.

- **Wodwell Icon Link in Mobile View (Apr 2025):**

  - **Feature:** Added a circular Wodwell icon (white "w" on black) as a link to the WOD's Wodwell.com page, rendered to the left of the "XX likes" text in each mobile WOD card header.
  - **Behavior:** The icon only appears if `wod.wodUrl` exists. Tapping/clicking the icon opens the link in a new tab and does not toggle the card (event propagation is stopped). The icon is accessible and styled for both light and dark mode.
  - **Implementation:**
    - Modified `src/app/_components/WodListMobile.tsx`:
      - Inserted the icon/link in the header's right-side area, before the likes count.
      - Used an inline SVG for a crisp, circular "w" icon.
      - Ensured accessibility and proper event handling.
  - **Outcome:** Users can quickly access the WOD's Wodwell.com page from mobile view without interfering with card expand/collapse.

- **Scaled Level Badge Fix (Apr 2025):**

  - **Problem:** Marston (and other WODs) showed "Advanced" (green) even when completed as "Scaled" (should be "Scaled" and grey).
  - **Solution:** Updated logic to display a "Scaled" badge (grey) for all non-Rx scores, regardless of benchmark level.
  - **Implementation:**
    - Modified `src/utils/wodUtils.ts`:
      - Updated `getPerformanceBadgeDetails` to return `{ displayLevel: "Scaled", color: "gray" }` for any score where `isRx` is false.
    - Modified `src/app/_components/WodListMobile.tsx`:
      - Updated score display to use `getPerformanceBadgeDetails`, showing the correct badge and color for both Rx and Scaled scores.
    - Confirmed `WodTable.tsx` already uses the centralized logic.
  - **Outcome:** All non-Rx (scaled) scores now display a "Scaled" badge in grey, ensuring accurate and consistent level display across both desktop and mobile views.

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
  ...
