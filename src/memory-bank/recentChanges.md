# Recent Changes

## May 3, 2025

- **WodViewer Completion Filter Refactor**

  - **Goal:** Extract the completion status `SegmentedControl` (All/Done/Todo) from `WodViewer.tsx` into its own reusable component.
  - **Implementation:**
    - Created a new component `CompletionFilterControl.tsx` in `src/app/(main)/components/`.
    - Defined props (`completionFilter`, `setCompletionFilter`, counts, `isLoggedIn`, `isMobile`) for the new component.
    - Moved the `SegmentedControl` JSX and related logic (conditional rendering based on `isLoggedIn`, size/styling based on `isMobile`) into `CompletionFilterControl.tsx`. Ensured no `any` types were used.
    - Imported `CompletionFilterControl` into `WodViewer.tsx`.
    - Replaced the original inline `SegmentedControl` JSX (in both mobile and desktop conditional blocks) with the `<CompletionFilterControl />` component, passing the required props from `useWodViewerFilters`, `useWodViewerData`, and the `isMobile` flag.
  - **Outcome:** The completion filter logic is now encapsulated in `CompletionFilterControl`, making `WodViewer.tsx` cleaner and promoting reusability, similar to the previous `TagSelector` refactor.

- **WodViewer Tag Selector Enhancement & Refactor**
  - **Goal:** Improve the tag filtering UI in `WodViewer.tsx` for better visibility and usability, and refactor it into a dedicated component.
  - **Implementation:**
    - Iteratively updated the tag dropdown based on feedback:
      - Changed trigger from "Tags (X)" to display selected tags as chips.
      - Added dark mode compatibility for the chips.
      - Filtered selected tags out of the dropdown list.
      - Added remove ("×") buttons to selected tag chips for direct removal.
      - Resolved event propagation issues preventing the remove buttons from working correctly.
      - Adjusted layout to display "Tags:" label, selected chips, and dropdown trigger horizontally.
    - Created a new component `TagSelector.tsx` in `src/app/(main)/components/`.
    - Moved all tag selection logic and JSX (label, selected chips, dropdown) from `WodViewer.tsx` to `TagSelector.tsx`.
    - Defined props (`tagOrder`, `selectedTags`, `toggleTag`, `isMobile`) for `TagSelector`.
    - Replaced the original tag selection JSX in `WodViewer.tsx` with the new `<TagSelector />` component, passing the required props.
  - **Outcome:** The tag selection UI is more intuitive, allowing users to see selected tags easily and remove them directly. The dropdown only shows available tags. The logic is now encapsulated in a reusable `TagSelector` component, making `WodViewer.tsx` cleaner.
