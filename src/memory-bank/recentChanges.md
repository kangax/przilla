# Recent Changes

- **Delete Confirmation Dialog Button Styling Fix (Apr 15, 2025):**

  - **Goal:** Align the delete confirmation dialog buttons with the project's Radix UI Theme styling.
  - **Implementation:**
    - Updated `WodTable` (`src/app/(main)/components/WodTable.tsx`):
      - Imported `Button` from `@radix-ui/themes`.
      - Replaced standard HTML `<button>` elements with Radix `Button` components within the `Dialog.Content`.
      - Applied `variant="soft" color="gray"` to the "Cancel" button.
      - Applied `variant="solid" color="red"` to the "Delete" button.
  - **Outcome:** The delete confirmation dialog buttons now use the consistent Radix UI styling, improving visual coherence.

- **Log Score Popover Behavior Fix (Apr 15, 2025):**

  - **Goal:** Fix issues with `LogScorePopover` where state persisted between modes and the trigger button behavior was incorrect during edits.
  - **Implementation:**
    - Updated `LogScorePopover` (`src/app/(main)/components/LogScorePopover.tsx`):
      - Ensured form state is reset correctly after successful submissions (log/update), cancellation, or closing the popover (`resetForm` function, `handleOpenChange`).
      - Created a dedicated `openInLogMode` handler for the trigger button (`Popover.Trigger`) which resets the form before opening.
      - Hardcoded the trigger button's text and `aria-label` to always be "Log Score".
  - **Outcome:**
    1. The popover form state is now correctly reset, preventing data persistence between edit and log modes.
    2. The "+ Log score" trigger button consistently displays the correct text and always opens the popover in a clean "log" state, independent of any edit actions.

- **Component Refactoring (Apr 15, 2025):**

  - **Goal:** Organize main page (root route `/`) components logically using a Next.js Route Group `(main)`, aligning with project structure patterns used elsewhere (e.g., `/charts`, `/import`).
  - **Implementation:**
    - Created the route group directory `src/app/(main)/` and its components subdirectory `src/app/(main)/components/`.
    - Moved the root page file from `src/app/page.tsx` to `src/app/(main)/page.tsx`.
    - Moved the following components and their tests from their previous location (`src/app/_components/main/` or `src/app/main/components/`) to `src/app/(main)/components/`:
      - `LogScorePopover.tsx`
      - `WodListMobile.tsx`
      - `WodListMobileHeader.tsx`
      - `WodTable.tsx` (and associated `*.test.tsx` files)
      - `WodViewer.tsx` (and associated `*.test.tsx` file)
    - Updated import paths in `src/app/(main)/page.tsx` and potentially within the moved components to reflect the new location.
    - Deleted the intermediate directory `src/app/_components/main/` and the original `src/app/main/components/` directory.
  - **Outcome:** Components related to the main page (`/`) are now logically grouped within the `src/app/(main)/` route group, specifically under `src/app/(main)/components/`, improving project organization and consistency with Next.js conventions.

- **Lint, Type Safety, and Code Cleanup (Apr 2025):**

  - **Goal:** Resolve all outstanding TypeScript/ESLint errors and warnings related to unsafe `any` usage, floating promises, and unused variables/imports.
  - **Implementation:**
    - **Frontend:**
      - Updated `LogScorePopover` (`src/app/(main)/components/LogScorePopover.tsx`): // Path updated
        - Replaced all `any` usage with explicit, type-safe payload and error types.
        - Used type guards for error handling.
        - Ensured all member accesses and mutation arguments are type-safe.
      - Updated `WodTable` (`src/app/(main)/components/WodTable.tsx`): // Path updated
        - Removed unused `Info` import.
      - Updated `WodViewer` (`src/app/(main)/components/WodViewer.tsx`): // Path updated
        - Fixed floating promise by prefixing cache invalidation with `void`.
    - **Backend:**
      - Updated `scoreRouter` (`src/server/api/routers/score.ts`):
        - Removed unused `result` variable in `importScores`.
        - Replaced `Record<string, any>` with a specific type for update data in `updateScore`.
        - Ensured all update logic is type-safe.
  - **Outcome:** All TypeScript/ESLint errors and warnings related to unsafe types, floating promises, and unused code are resolved. The codebase is now fully type-safe and clean, in line with project standards.

  - **April 14, 2025: Lint/Type Safety Batch Fixes**
    - **Test files:** Added `// eslint-disable-next-line @typescript-eslint/no-empty-function` above all empty `mutate` and `reset` mock methods in:
      - `src/app/(main)/components/WodTable.actions.test.tsx` // Path updated
      - `src/app/(main)/components/WodTable.headers.test.tsx` // Path updated
      - `src/app/(main)/components/WodTable.links.test.tsx` // Path updated
      - `src/app/(main)/components/WodTable.rows.test.tsx` // Path updated
    - **test-utils.tsx:**
      - Replaced all `any` usage with `Record<string, unknown>`.
      - Added eslint-disable comments for empty mock methods.
      - Replaced `@ts-ignore` with `@ts-expect-error` and then removed the directive when it was unused.
      - Ensured all assignments are type-safe.
    - **WodTable.tsx (`src/app/(main)/components/WodTable.tsx`):** // Path updated
      - Refactored to call `useVirtualizer` unconditionally, fixing the "React Hook called conditionally" lint error.
      - Restored the full `createColumns` function to resolve missing reference error.
      - Confirmed all code is type-safe and passes lint/typecheck.
    - **Outcome:** All reported ESLint and TypeScript errors are resolved. The codebase is now fully type-safe and clean, with all test mocks and hooks compliant with project linting rules.

- **Score Tooltip & Info Icon Update (Apr 2025):**

  - **Goal:** Remove the info icon (with benchmark breakdown tooltip) from the "your score" cell and instead include the benchmark breakdown in the main tooltip for each score, along with user level, notes, and date.
  - **Implementation:**
    - Updated `WodTable` (`src/app/(main)/components/WodTable.tsx`): // Path updated
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
      - Updated `WodTable` (`src/app/(main)/components/WodTable.tsx`): // Path updated
        - For each score, displays edit (pencil) and delete (trash) icons to the right.
        - Edit icon opens `LogScorePopover` in edit mode, pre-filled with the score's data, and calls `updateScore` on submit.
        - Delete icon opens a confirmation dialog and calls `deleteScore` on confirm, with UI refresh.
      - Updated `LogScorePopover` (`src/app/(main)/components/LogScorePopover.tsx`): // Path updated
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
    - Replaced the single seconds input with two fields: "Minutes" and "Seconds" for time-based WODs in `LogScorePopover` (`src/app/(main)/components/LogScorePopover.tsx`). // Path updated
    - On submit, the values are converted to total seconds for backend compatibility.
    - Ensures clarity and matches product UI/UX goals for concise, minimal, and user-friendly input.
  - **Outcome:** Users can now enter their time in the requested format when logging scores for "For Time" WODs.

- **Log Score Functionality for WODs (Apr 2025):**
  - **Goal:** Allow users to log a score for any WOD directly from the main table, with a minimal, context-aware form and automatic UI refresh.
  - **Implementation:**
    - **Backend:**
      - Added a new protected tRPC mutation `logScore` to `scoreRouter` (`src/server/api/routers/score.ts`), accepting a single score object (validated with `scoreImportSchema`) and inserting it into the `scores` table.
    - **Frontend:**
      - Created `LogScorePopover` component (`src/app/(main)/components/LogScorePopover.tsx`): // Path updated
        - Renders a "Log Score" button (plus icon) that appears on row hover in the WOD table.
        - Clicking the button opens a Radix UI popover with a minimal form.
        - The form adapts fields based on WOD type/tags (For Time, AMRAP, Load, etc.), using only relevant fields.
        - Submits the score via `api.score.logScore.useMutation`.
        - On success, closes the popover, resets the form, and triggers a callback to refresh scores.
      - Updated `WodTable` (`src/app/(main)/components/WodTable.tsx`): // Path updated
        - Added a new column for the log score action, rendering `LogScorePopover` for each row.
        - Passed a callback to `LogScorePopover` to trigger a scores refetch after logging.
      - Updated `WodViewer` (`src/app/(main)/components/WodViewer.tsx`): // Path updated
        - Uses tRPC utils to invalidate the `getAllByUser` scores query after a score is logged, ensuring the table updates automatically.
    - **UI/UX:**
      - Button is only visible on row hover (desktop), always visible in mobile list view (to be implemented in mobile component).
      - Popover form is minimal, responsive, and uses Tailwind + Radix UI.
      - All error and loading states are handled gracefully.
  - **Outcome:** Users can now log a score for any WOD directly from the table, with the scores list updating automatically. The implementation is modular, context-aware, and follows project UI/UX patterns.

...
