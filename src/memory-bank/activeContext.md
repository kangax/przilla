# Active Context

## Current Focus

## Learnings & Insights

- **CSV Import Validation Pattern:**

  - Zod schemas are now the single source of truth for runtime validation of imported CSV data.
  - All type guards and ad-hoc property checks for distinguishing row types have been replaced with Zod-based type narrowing.
  - This pattern ensures that runtime validation and TypeScript type inference are always in sync, reducing bugs and maintenance overhead.
  - When adding new import formats or updating CSV structures, always define/extend the Zod schema and use `.safeParse` for all runtime checks.
  - This approach is now the standard for all future runtime validation in the project.

- **Never summarize or omit code or documentation. All files must always be complete and explicit. Any omission, summarization, or use of ellipsis/comments to indicate missing content is a critical error and must be avoided.**
- When using prop-drilling for server state (e.g., scores), query invalidation alone is not enough to guarantee UI updates. The parent component must be explicitly notified to refetch data after mutations.
- Adding an `onScoreLogged` callback, passed from the parent and triggered after log/edit, ensures the parent can refetch and update the UI immediately. This pattern matches the desktop flow and is robust to future changes.
- Robust state management is essential for mobile sheet UIs: editing and deleting must be mutually exclusive, and state must reset on close to avoid stale UI.
- Testing mobile flows requires expanding cards before interacting with inner elements, and tests must be robust to UI animation and DOM retention quirks (e.g., Radix Dialog).
- Using horizontal `Flex` containers (`direction="row"`) with appropriate `gap` and `align` properties is effective for creating compact, single-line layouts for related form inputs (e.g., Reps/Rounds/Partial Reps). Adding `flexGrow: 1` to the inner elements helps distribute space evenly.
- When customizing tooltips for accessibility and theme consistency, always check for default UI library styles (e.g., Radix UI Tooltip.Content may add a border or box-shadow). Explicitly override these with `boxShadow: "none"` and `border: "none"` if a clean, borderless look is desired.
- Using a dark background and light text for tooltips (with Tailwind `bg-gray-800` and `text-gray-100`) provides a less jarring, more visually consistent experience, especially when matching charting tooltips or other dark UI elements.
- Radix UI Flex/Text components allow for precise layout and alignment, and setting a fixed minWidth on left-aligned labels ensures clean, readable columns in multi-line tooltips.
- Implementing custom sorting logic in TanStack Table (like sorting by latest score level) requires defining a custom `sortingFn`. This function needs access to the necessary data (e.g., `scoresByWodId`) which can be achieved by defining the function within a scope where the data is available (like inside `createColumns`) to leverage closures.
- Calculating adjusted performance metrics (like `level * difficulty`) requires careful handling of data fetching (joining tables), type definitions across backend/frontend, and UI updates (tooltips, axis labels, helper functions) to accurately reflect the new calculation.
- Passing detailed data structures (like the score breakdown) through multiple component layers (API -> Page -> Chart) requires careful type definition updates at each stage.
- Recharts custom tooltips provide flexibility to display complex, structured information derived from the data payload. Using helper functions (like `getDescriptiveLevel`) within the tooltip enhances readability.
- When calculating rolling averages or other derived data, ensure that the original data points (including newly added fields like `scores` and their raw values) are correctly preserved and passed along in the transformed data structure.
- Tooltip copy can be significantly enhanced by fetching necessary raw data (like score values) and using utility functions (`formatScore`, `getDescriptiveLevel`) combined with conditional rendering and inline styling (`<span>` with Tailwind classes) for clarity and emphasis.
- Conditionally rendering parts of a string based on data (e.g., hiding adjustment text for "Medium" difficulty) improves conciseness.
- When using Radix UI Themes, avoid applying explicit background color classes (like Tailwind's `bg-white` or `dark:bg-*`) to components like `Dialog.Content`, as this can override the theme's intended styling. Let the theme handle the background automatically.
- Using a centered Dialog for score logging/editing provides a more focused interaction compared to a Popover attached to a trigger element.
- Radix UI Portals need a specified `container` within the Theme provider to inherit theme styles correctly.
- Radix UI `Switch` provides a clear toggle alternative to `Checkbox`.
- Fixed widths can be used on form elements like time inputs for a more compact layout when `flexGrow` is not desired.
- Consolidating all relevant score and benchmark information into a single tooltip improves clarity and reduces UI clutter.
- Removing redundant icons aligns with the project's minimal UI philosophy and enhances accessibility.
- Tooltip formatting should always be clear, multi-line, and context-rich, especially for performance/benchmark data.
- Ensuring shared components like dialog forms correctly reset their state between different modes (e.g., log vs. edit) is crucial for predictable UI behavior. Resetting state after successful actions or cancellation is a reliable pattern.
- Trigger elements for actions like "Log Score" should maintain consistent appearance and behavior, independent of other states (like editing) managed within the same component instance. Separate trigger logic (e.g., dedicated onClick handlers) can achieve this.

## Recent Changes

See [recentChanges.md](./recentChanges.md) for the full, detailed changelog.
