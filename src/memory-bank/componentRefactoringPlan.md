# Component Refactoring Plan (May 8, 2025)

Objective: Analyze component files for size (lines of code - LOC) and propose refactoring strategies for components exceeding ideal limits (300-400 LOC ideal, 500 LOC max).

## Current Findings:

1.  **`src/app/(main)/components/LogScoreForm.tsx`**:

    - **LOC:** 571
    - **Status:** Too big (exceeds 500 LOC limit).
    - **Initial Analysis:** This form handles various score types (time, reps, load, rounds), conditional rendering based on WOD type and timecaps, validation, API submission for new and edited scores, and an auth overlay. It's a complex component with many responsibilities.

2.  **`src/app/(main)/components/WodTable.tsx`**:

    - **LOC:** 609
    - **Status:** Too big (exceeds 500 LOC limit).
    - **Initial Analysis:** The main driver of its size is the `createColumns` function (approx. 250 LOC itself) which defines all cell rendering (including tooltips, badges, links, favorite stars) and custom sorting logic. The component also manages dialogs for logging/editing/deleting scores and row virtualization.

3.  **`src/app/(main)/components/WodViewer.tsx`**:

    - **LOC:** 506
    - **Status:** Slightly too big (just over 500 LOC limit).
    - **Initial Analysis:** This component has already been partially refactored by extracting logic into `useWodViewerFilters` and `useWodViewerData` hooks. However, it still manages different data sources (initial props vs. API), loading/error states, renders a complex filter bar, and handles responsive rendering of `WodTable` or `WodListMobile`. The numerous `useEffect` calls for debugging also contribute to its size.

4.  **`src/app/(main)/components/WodListMobile.tsx`**:

    - **LOC:** 500
    - **Status:** At the 500 LOC limit, could benefit from refactoring.
    - **Initial Analysis:** Renders WODs as expandable cards, displaying details, scores, and actions (log, edit, delete, favorite, share). Manages state for expanded cards, a drawer for `LogScoreForm`, and a dialog for delete confirmation. The rendering logic for each card is substantial.

5.  **`src/app/import/components/ScoreImportWizard.tsx`**:
    - **LOC:** 147
    - **Status:** Good.
    - **Initial Analysis:** This component is well-structured, utilizing custom hooks and separate step components, serving as a good example.

## Plan for Refactoring Analysis:

For each identified large component (`LogScoreForm`, `WodTable`, `WodViewer`, `WodListMobile`), specific refactoring strategies are proposed:

### 1. `LogScoreForm.tsx` (571 LOC):

- **Extract Form Sections:** Break down conditional rendering for score types (time, reps, load, rounds, timecap handling) into smaller sub-components (e.g., `TimeInputFields`, `RepsInputFields`, `TimecapResultFields`).
- **Custom Hook for Form Logic:** Extract core form state (`form`), validation (`validate`), payload building (`buildPayload`), and submission handlers (`handleSubmit`, `handleChange`, etc.) into a `useLogScoreForm` custom hook.
- **Auth Overlay Component:** Make the login prompt overlay a separate, reusable component.
- **Helper Functions:** Move generic helper functions (like `formatTimecap`) to utility files (e.g., `src/utils/wodUtils.ts`).

### 2. `WodTable.tsx` (609 LOC):

**Overall Strategy:** The primary goal is to significantly reduce the size of `WodTable.tsx` by modularizing its largest part, the `createColumns` function, and by extracting dialog management logic into a custom hook.

**A. Modularize `createColumns` (Primary Focus):**

*   **New Directory for Column Logic:** Create `src/app/(main)/components/WodTableColumns/`.
*   **Individual Column Definition Files:** Each current column definition within `createColumns` will be moved to its own file within the new directory. These files will export functions that return the `ColumnDef` for that specific column. These functions will accept necessary parameters (e.g., sort handlers, `searchTerm`, `scoresByWodId`, dialog openers).
    *   `src/app/(main)/components/WodTableColumns/wodNameColumn.ts`: Defines the "Workout" column, including the star icon for favorites and the WOD name link/text with highlighting.
    *   `src/app/(main)/components/WodTableColumns/categoryAndTagsColumn.ts`: Defines the "Category / Tags" column, rendering badges for category and tags with highlighting.
    *   `src/app/(main)/components/WodTableColumns/difficultyColumn.ts`: Defines the "Difficulty" column, including its complex header tooltip and cell rendering.
    *   `src/app/(main)/components/WodTableColumns/countLikesColumn.ts`: Defines the "Likes" column.
    *   `src/app/(main)/components/WodTableColumns/descriptionColumn.ts`: Defines the "Description" column, including its movement tooltip and description highlighting.
    *   `src/app/(main)/components/WodTableColumns/resultsColumn.ts`: Defines the "Your scores" column. It will continue to use the existing `ScoresCell` component and will encapsulate the `sortByLatestScoreLevel` custom sorting logic.
*   **Column Utilities:**
    *   `src/app/(main)/components/WodTableColumns/columnUtils.ts`: This file will contain shared helper functions like `getSortIndicator` and the `performanceLevelValues` constant. The `sortByLatestScoreLevel` sorting function could also reside here (if it can be generalized) or be co-located with `resultsColumn.ts`.
*   **Refined `createColumns` in `WodTable.tsx`:** The main `createColumns` function in `WodTable.tsx` will become a concise assembler. It will import and call the functions from the individual column definition files, passing the necessary props to each.

**B. Extract Complex Cell/Header Rendering into Dedicated Components:**

While the individual column definition files will encapsulate much of the rendering logic, some particularly complex UI parts within cells or headers can be further extracted into their own React components. These would likely reside in a subdirectory like `src/app/(main)/components/WodTableColumns/Cells/` or directly in `src/app/(main)/components/WodTableColumns/` if they are primarily for headers.
*   **`DifficultyHeaderTooltip.tsx`**: A new component specifically for rendering the detailed tooltip content found in the "Difficulty" column's header.
    *   Proposed Location: `src/app/(main)/components/WodTableColumns/DifficultyHeaderTooltip.tsx`
*   **Potentially other cell components (to be created if their complexity warrants it during implementation):**
    *   `WodNameCell.tsx` (for the WOD name, star icon, and link)
    *   `CategoryAndTagsCell.tsx` (for category and tag badges)
    *   `DescriptionCell.tsx` (for the description text and movement tooltip)
    *   (Note: `ScoresCell.tsx` is already well-encapsulated at `src/app/(main)/components/WodTableCells/ScoresCell.tsx`. We can evaluate moving it or standardizing locations if many new cell components are created under `WodTableColumns/Cells/`.)

**C. Dialog Management via Custom Hook:**

*   **`useWodTableDialogs` Hook:** Extract the state management and handler functions for both the `LogScoreDialog` and `DeleteScoreDialog` into a new custom hook.
    *   Proposed Location: `src/app/(main)/components/hooks/useWodTableDialogs.ts`
    *   Responsibilities:
        *   Manage `logScoreDialogState` (tracking `isOpen`, the target `wod`, and any `score` being edited).
        *   Manage `deleteScoreDialogState` (tracking the `score` and `wod` for deletion confirmation).
        *   Encapsulate the `deleteScoreMutation` logic, including API calls, query invalidation, and toast notifications.
        *   Provide clear handler functions: `openLogDialog`, `openEditDialog`, `handleLogScoreDialogChange` (for opening/closing the log/edit dialog), `handleDeleteScoreRequest` (to initiate deletion), `confirmDeleteScore`, and `cancelDeleteScore`.
*   **`WodTable.tsx` Update:** The main `WodTable` component will utilize this hook, significantly simplifying its internal logic related to dialog interactions.

**Expected Outcome:**
*   The Line of Code (LOC) count for `WodTable.tsx` will be substantially reduced.
*   Column definitions will be more modular, readable, and maintainable in their respective files.
*   Dialog management logic will be better separated and encapsulated within the custom hook.
*   Overall, the `WodTable` component will have improved separation of concerns, making it easier to understand, test, and modify in the future.

### 3. `WodViewer.tsx` (506 LOC):

- **Filter Bar Component:** Extract the entire filter bar section into its own `FilterBar.tsx` component.
- **Loading/Error/Empty States:** Simplify rendering logic for these states, possibly with a wrapper component.
- **Reduce Debugging Code:** Remove or conditionally compile out `console.log` statements and debugging `useEffect` hooks.
- **`WodListMobileWrapper`:** Evaluate if this internal wrapper can be merged into `WodListMobile.tsx`.

### 4. `WodListMobile.tsx` (500 LOC):

- **`WodMobileCard.tsx` Component:** Extract the rendering logic for an individual WOD card into a `WodMobileCard.tsx` component.
- **Dialog/Drawer State Management:** Further encapsulate or streamline state management for the `LogScoreForm` drawer and delete confirmation dialog.
- **Helper Functions:** Move generic helper functions (`checkWodMatch`, `getWodBlurb`) to utility files or within the new `WodMobileCard` if specific to it.

## Next Steps (for user confirmation):

1.  Proceed with a more detailed breakdown and proposed code structure for refactoring one of these components as an example.
2.  Identify if other specific components or directories should be prioritized for analysis.
3.  Confirm agreement with the general LOC limits (300-400 ideal, 500 max).
