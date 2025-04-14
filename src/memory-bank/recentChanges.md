- **Wodwell Icon Link in Mobile View (Apr 2025):**

  - **Feature:** Added a circular Wodwell icon (white "w" on black) as a link to the WOD's Wodwell.com page, rendered to the left of the "XX likes" text in each mobile WOD card header.
  - **Behavior:** The icon only appears if `wod.wodUrl` exists. Tapping/clicking the icon opens the link in a new tab and does not toggle the card (event propagation is stopped). The icon is accessible and styled for both light and dark mode.
  - **Implementation:**
    - Modified `src/app/_components/WodListMobile.tsx`:
      - Inserted the icon/link in the header's right-side area, before the likes count.
      - Used an inline SVG for a crisp, circular "w" icon.
      - Ensured accessibility and proper event handling.
  - **Outcome:** Users can quickly access the WOD's Wodwell.com page from mobile view without interfering with card expand/collapse.

# Recent Changes

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
