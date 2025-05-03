# Recent Changes

## May 3, 2025

- **Fuzzy Search Multi-Word Enhancement with Term-by-Term Matching**

  - **Goal:** Fix issue with multi-word searches showing results briefly and then displaying "No WODs match the current filters"
  
  - **Implementation:**
    - Completely redesigned the multi-word search approach in `fuzzySearchWods`:
      - Now uses Fuse.js to find fuzzy matches for EACH term separately
      - Takes the intersection of the results to ensure ALL terms match (AND logic)
      - This combines the benefits of fuzzy matching with strict multi-term requirements
    - Added comprehensive debugging to track the data flow:
      - Server-side debugging in `src/server/api/routers/wod.ts` to log search queries and results
      - Enhanced `wodMatchesAllTerms` function with detailed logging for specific WODs
      - Added extensive logging to `fuzzySearchWods` function to track multi-word search processing
    
  - **Benefits:**
    - Handles abbreviations like "c2b" (matching "chest to bar") and "hspu" (matching "handstand push-up")
    - Still ensures that multi-word searches like "burpee air" find WODs containing both terms
    - Provides more intuitive search results that match user expectations
    - Fixes the issue where multi-word searches would show no results
    
  - **Next Steps:**
    - Consider architectural improvements for more efficient search handling
    - Implement server-side search with initial render for better performance
    - Add pagination for improved performance with large datasets

- **Fuzzy Search Multi-Word Search Enhancement**

  - **Goal:** Fix issue with multi-word searches returning "No WODs match the current filters" when no exact matches are found.
  
  - **Implementation:**
    - Updated `fuzzySearchWods` in `src/utils/wodFuzzySearch.ts` to add a fallback mechanism:
      - First try to find exact matches with `wodMatchesAllTerms`
      - If exact matches are found, use Fuse.js to score and highlight them
      - If no exact matches are found, fall back to Fuse.js's fuzzy matching with a higher threshold (0.4)
    
  - **Outcome:**
    - Multi-word searches like "burpee snatch" now return relevant results even when no workouts contain both exact terms
    - The search is more intuitive and forgiving, finding workouts that contain variations or similar terms
    - Users get more helpful results instead of "No WODs match the current filters"

- **Fuzzy Search Improvements (Additional Fixes)**

  - **Goal:** Fix two remaining issues with the fuzzy search functionality:
    1. Double word matching not working correctly (e.g., "thruster run" not finding all workouts with both terms)
    2. Category counts not updating correctly when text search is applied

  - **Implementation:**
    - Updated `fuzzySearchWods` in `src/utils/wodFuzzySearch.ts`:
      - Modified multi-word search approach to first filter all WODs using `wodMatchesAllTerms` and then apply Fuse.js for scoring/highlighting
      - This ensures all potential matches are found before applying fuzzy scoring
    - Updated `useWodViewerData.ts`:
      - Moved category counts calculation to be based on filtered WODs instead of the original WODs list
      - This ensures category counts reflect the filtered results and text filtering doesn't reduce category counts

  - **Outcome:**
    - Multi-word searches now correctly find all workouts containing all search terms
    - Category counts now accurately reflect the available categories after filtering
    - The filtering order now properly applies category/tag filters before calculating counts

- **Fuzzy Search Improvements**

  - **Goal:** Fix several issues with the fuzzy search functionality:
    1. Incorrect matching for "squat" showing "Shuttle Up" which doesn't contain squats
    2. "Isabel" showing up for "Squat" search despite not containing squats
    3. "thruster run" not finding workouts with both thruster AND run
    4. "thruster" highlighting matches but "thruster " (with trailing space) not highlighting
    5. Partial word matching (e.g., "Thruster" in "Thrusters") works for filtering but not highlighting
    6. Multi-word searches like "power handstand" not matching workouts containing both terms
  
  - **Implementation:**
    - Created shared utility functions in `src/utils/wodFuzzySearch.ts`:
      - `createSearchPattern`: Generates consistent regex patterns for both filtering and highlighting
      - `wodMatchesAllTerms`: Implements AND logic for multi-word searches
    - Updated `fuzzySearchWods` in `src/utils/wodFuzzySearch.ts`:
      - Lowered the threshold from 0.4 to 0.2 for stricter matching
      - Used the shared utility function for multi-word searches
      - Improved exact search mode (with quotes) to include movements
      - Added proper handling of empty search terms
    - Enhanced `HighlightMatch` component in `src/utils/uiUtils.tsx`:
      - Used the shared `createSearchPattern` function for consistency
      - Removed word boundaries to allow partial word matches
      - Improved error handling for invalid regex patterns
    - Updated `checkWodMatch` in `src/app/(main)/components/WodListMobile.tsx`:
      - Used the shared `wodMatchesAllTerms` function for multi-word searches
      - Added exact search support
      - Included movements in search scope
  
  - **Outcome:** The search functionality now provides more accurate and intuitive results:
    - Single-word searches match only relevant workouts
    - Partial word matches (like "Thruster" in "Thrusters") are both filtered and highlighted
    - Multi-word searches require all terms to be present (AND logic)
    - Exact phrase searches work as expected
    - Highlighting properly shows all matched terms
    - Trailing spaces no longer affect search results
    - Search behavior is consistent across all parts of the application

- **Pre-commit Formatting Setup**

  - **Goal:** Disable VSCode's format-on-save feature to prevent conflicts with AI agent workflows and ensure consistent code formatting using a pre-commit hook instead.
  - **Implementation:**
    - Created/updated `.vscode/settings.json` to set `"editor.formatOnSave": false`.
    - Updated the `lint-staged` configuration in `package.json` to run both `eslint --fix` and `prettier --write` on staged `src/**/*.{js,jsx,ts,tsx}` files.
    - Added a `lint-staged` rule to run `prettier --write` on staged `**/*.{md,mdx}` files.
  - **Outcome:** Format-on-save is disabled for this workspace. Code formatting (ESLint fixes and Prettier) will now be automatically applied only to staged files before they are committed, ensuring consistency without interfering with the development process.

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
