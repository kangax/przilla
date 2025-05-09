# Plan: Unifying LogScoreForm and LogScorePopover

## Objective

Create a single, unified `LogScoreForm` component that encapsulates all form logic, state, validation, authentication, and timecap handling. Presentation differences (popover, modal, page) will be handled by thin wrapper components, eliminating duplication and ensuring consistent behavior.

---

## 1. Extract a Single, Pure LogScoreForm Component

- **Build a presentation-agnostic `LogScoreForm`**:
  - Contains all form logic, state, validation, and UI (including timecap and authentication overlay).
  - Accepts props for:
    - `wod`, `initialScore`, `onScoreLogged`, `onCancel`, etc.
    - Optionally, a `variant` or `presentation` prop (e.g., `"modal"`, `"popover"`, `"page"`) for minor UI tweaks.
  - Handles all logic for timecap, authentication, and field rendering internally.

---

## 2. Presentation Wrappers

- **LogScorePopover**:

  - Becomes a thin wrapper that renders the unified `LogScoreForm` inside a Radix Popover.
  - Handles only popover open/close state and trigger UI.
  - Delegates all form logic, authentication, and timecap handling to the shared form.

- **LogScoreFormPage/Modal** (if needed):
  - Thin wrapper for modal or page presentation, also rendering the unified form.

---

## 3. Shared Hooks and Utilities

- **useLogScoreForm**:

  - Encapsulates all form state, validation, and submission logic.
  - Used by the unified form.

- **Shared Input Components**:

  - Continue using extracted input field components for time, reps, load, rounds, etc.

- **AuthOverlay**:
  - Always shown when the user is not authenticated, regardless of presentation.

---

## 4. Consistent Timecap Handling

- All timecap logic (radio buttons, conditional fields, etc.) is handled in the unified form, so both popover and page/modal versions behave identically.

---

## 5. Example Structure

```
src/app/(main)/components/LogScoreForm/
  LogScoreForm.tsx         // The unified, pure form
  useLogScoreForm.ts       // Shared hook
  AuthOverlay.tsx
  TimeInputFields.tsx
  RepsInputFields.tsx
  LoadInputFields.tsx
  RoundsInputFields.tsx

src/app/(main)/components/
  LogScorePopover.tsx      // Thin wrapper: Popover + LogScoreForm
  LogScoreFormPage.tsx     // (if needed) Thin wrapper: Modal/Page + LogScoreForm
```

---

## 6. Migration Steps

1. Refactor all form logic and UI into the unified `LogScoreForm`.
2. Update `LogScorePopover` to use the unified form, removing all duplicated logic.
3. Ensure authentication and timecap handling are always present in the form.
4. Test both popover and page/modal usages for consistent behavior.

---

## Result

- All business logic, validation, and UI for logging scores is in one place.
- Presentation differences (popover, modal, page) are handled by thin wrappers.
- No duplication of timecap, authentication, or field logic.
- Future changes to the form only need to be made in one place.
