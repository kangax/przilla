- **Lint, Type Safety, and Code Cleanup (Apr 2025):**

  - **Goal:** Resolve all outstanding TypeScript/ESLint errors and warnings related to unsafe `any` usage, floating promises, and unused variables/imports.
  - **Implementation:**
    - **Frontend:**
      - Updated `LogScorePopover` (`src/app/_components/LogScorePopover.tsx`):
        - Replaced all `any` usage with explicit, type-safe payload and error types.
        - Used type guards for error handling.
        - Ensured all member accesses and mutation arguments are type-safe.
      - Updated `WodTable` (`src/app/_components/WodTable.tsx`):
        - Removed unused `Info` import.
      - Updated `WodViewer` (`src/app/_components/WodViewer.tsx`):
        - Fixed floating promise by prefixing cache invalidation with `void`.
    - **Backend:**
      - Updated `scoreRouter` (`src/server/api/routers/score.ts`):
        - Removed unused `result` variable in `importScores`.
        - Replaced `Record<string, any>` with a specific type for update data in `updateScore`.
        - Ensured all update logic is type-safe.
  - **Outcome:** All TypeScript/ESLint errors and warnings related to unsafe types, floating promises, and unused code are resolved. The codebase is now fully type-safe and clean, in line with project standards.

  - **April 14, 2025: Lint/Type Safety Batch Fixes**
    - **Test files:** Added `// eslint-disable-next-line @typescript-eslint/no-empty-function` above all empty `mutate` and `reset` mock methods in:
      - `src/app/_components/WodTable.actions.test.tsx`
      - `src/app/_components/WodTable.headers.test.tsx`
      - `src/app/_components/WodTable.links.test.tsx`
      - `src/app/_components/WodTable.rows.test.tsx`
    - **test-utils.tsx:**
      - Replaced all `any` usage with `Record<string, unknown>`.
      - Added eslint-disable comments for empty mock methods.
      - Replaced `@ts-ignore` with `@ts-expect-error` and then removed the directive when it was unused.
      - Ensured all assignments are type-safe.
    - **WodTable.tsx:**
      - Refactored to call `useVirtualizer` unconditionally, fixing the "React Hook called conditionally" lint error.
      - Restored the full `createColumns` function to resolve missing reference error.
      - Confirmed all code is type-safe and passes lint/typecheck.
    - **Outcome:** All reported ESLint and TypeScript errors are resolved. The codebase is now fully type-safe and clean, with all test mocks and hooks compliant with project linting rules.

# Recent Changes

- **Score Tooltip & Info Icon Update (Apr 2025):**

  - **Goal:** Remove the info icon (with benchmark breakdown tooltip) from the "your score" cell and instead include the benchmark breakdown in the main tooltip for each score, along with user level, notes, and date.
  - **Implementation:**
    - Updated `WodTable` (`src/app/_components/WodTable.tsx`):
      - Removed the info icon and its tooltip from the "your score" cell when no scores are present.
      - The tooltip for each score badge now includes:
        - Logged date
        - Notes (or "-")
        - User level
        - Full benchmark breakdown (from `getPerformanceLevelTooltip`)
        - All formatted as specified in the product requirements.
      - If there are no scores, only the LogScorePopover is shown (no icon, no tooltip).
    - Ensured the new tooltip is accessible, minimal, and consistent with project UI/UX patterns.
  - **Outcome:** The UI is now more concise and context-rich, with all relevant score and benchmark information available in a single tooltip, and no redundant info icon.

- **Edit/Delete Score & Validation Improvements (Apr 2025):**

  - **Goal:** Allow users to edit or delete any logged score directly from the WOD table, and prevent empty/invalid results from being logged.
  - **Implementation:**
    - **Backend:**
      - Added `deleteScore` and `updateScore` protected tRPC mutations to `scoreRouter` (`src/server/api/routers/score.ts`), allowing users to delete or update their own scores.
    - **Frontend:**
      - Updated `WodTable` (`src/app/_components/WodTable.tsx`):
        - For each score, displays edit (pencil) and delete (trash) icons to the right.
        - Edit icon opens `LogScorePopover` in edit mode, pre-filled with the score's data, and calls `updateScore` on submit.
        - Delete icon opens a confirmation dialog and calls `deleteScore` on confirm, with UI refresh.
      - Updated `LogScorePopover` (`src/app/_components/LogScorePopover.tsx`):
        - Supports both log and edit modes, with correct button labeling and form pre-fill.
        - Validation logic prevents submitting empty or invalid results for all score types (time, reps, load, etc.).
        - Cancel button for edit mode.
    - **UI/UX:**
      - Edit/delete icons are accessible, have tooltips, and are styled minimally.
      - All error and loading states are handled gracefully.
  - **Outcome:** Users can now edit or delete any score directly from the table, and cannot log empty/invalid results. The implementation is modular, context-aware, and follows project UI/UX patterns.

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
