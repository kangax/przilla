# Recent Changes

- **Time Input Update in LogScorePopover (Apr 2025):**

  - **Goal:** Allow users to input time in the popover UI as a combination of minutes and seconds (e.g., "35min 24sec"), not AM/PM or a single seconds field.
  - **Implementation:**
    - Replaced the single seconds input with two fields: "Minutes" and "Seconds" for time-based WODs in `LogScorePopover` (`src/app/_components/LogScorePopover.tsx`).
    - On submit, the values are converted to total seconds for backend compatibility.
    - Ensures clarity and matches product UI/UX goals for concise, minimal, and user-friendly input.
  - **Outcome:** Users can now enter their time in the requested format when logging scores for "For Time" WODs.

- **Log Score Functionality for WODs (Apr 2025):**

  - **Goal:** Allow users to log a score for any WOD directly from the main table, with a minimal, context-aware form and automatic UI refresh.
  - **Implementation:**
    - **Backend:**
      - Added a new protected tRPC mutation `logScore` to `scoreRouter` (`src/server/api/routers/score.ts`), accepting a single score object (validated with `scoreImportSchema`) and inserting it into the `scores` table.
    - **Frontend:**
      - Created `LogScorePopover` component (`src/app/_components/LogScorePopover.tsx`):
        - Renders a "Log Score" button (plus icon) that appears on row hover in the WOD table.
        - Clicking the button opens a Radix UI popover with a minimal form.
        - The form adapts fields based on WOD type/tags (For Time, AMRAP, Load, etc.), using only relevant fields.
        - Submits the score via `api.score.logScore.useMutation`.
        - On success, closes the popover, resets the form, and triggers a callback to refresh scores.
      - Updated `WodTable` (`src/app/_components/WodTable.tsx`):
        - Added a new column for the log score action, rendering `LogScorePopover` for each row.
        - Passed a callback to `LogScorePopover` to trigger a scores refetch after logging.
      - Updated `WodViewer` (`src/app/_components/WodViewer.tsx`):
        - Uses tRPC utils to invalidate the `getAllByUser` scores query after a score is logged, ensuring the table updates automatically.
    - **UI/UX:**
      - Button is only visible on row hover (desktop), always visible in mobile list view (to be implemented in mobile component).
      - Popover form is minimal, responsive, and uses Tailwind + Radix UI.
      - All error and loading states are handled gracefully.
  - **Outcome:** Users can now log a score for any WOD directly from the table, with the scores list updating automatically. The implementation is modular, context-aware, and follows project UI/UX patterns.

...
