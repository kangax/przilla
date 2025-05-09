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

- **Modularize `createColumns`:**
  - Define complex column definitions in separate files or a dedicated `columnDefinitions.ts`.
  - Extract complex cell rendering logic into dedicated cell components (e.g., `DifficultyTooltipCell.tsx`).
- **Dialog Management:** Improve encapsulation of `LogScoreDialog` and `DeleteScoreDialog` state and handlers.
- **Hook for Table State/Interactions:** Consider a `useWodTableInteractions` hook for complex table interaction logic.

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
