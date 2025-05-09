# LogScoreForm Refactoring Plan (May 8, 2025)

## Objective

Refactor `LogScoreForm.tsx` (currently 571 LOC) to improve maintainability, readability, and testability by modularizing form sections, extracting logic into a custom hook, and isolating stateless helpers.

---

## Proposed Directory Structure

```
src/app/(main)/components/LogScoreForm/
  LogScoreForm.tsx           // Main orchestrator
  TimeInputFields.tsx        // Minutes/seconds fields
  RepsInputFields.tsx        // Reps field
  LoadInputFields.tsx        // Load field
  RoundsInputFields.tsx      // Rounds + partial reps fields
  TimecapResultFields.tsx    // Timecap radio + conditional fields
  AuthOverlay.tsx            // Sign-in overlay
  useLogScoreForm.ts         // Custom hook for all form logic
  index.ts                   // (optional) Barrel export
```

- Move stateless helpers (`formatTimecap`, `getTimecapNoLabel`, etc.) to `src/utils/wodUtils.ts`.

---

## Responsibilities & API

- **LogScoreForm.tsx**: Imports and orchestrates all subcomponents, uses `useLogScoreForm` for state/logic.
- **TimeInputFields.tsx**: Receives value and onChange handler props for minutes/seconds.
- **RepsInputFields.tsx**: Receives value and onChange handler for reps.
- **LoadInputFields.tsx**: Receives value and onChange handler for load.
- **RoundsInputFields.tsx**: Receives value and onChange handler for rounds/partial reps.
- **TimecapResultFields.tsx**: Handles the timecap radio and conditional rendering of relevant fields.
- **AuthOverlay.tsx**: Receives an `onSignIn` handler, displays the sign-in prompt overlay.
- **useLogScoreForm.ts**: Encapsulates all form state, validation, payload building, and handlers. Exposes state and handlers to the main component.

---

## Migration Steps

1. Move helpers to `wodUtils.ts` (if not already present).
2. Create `useLogScoreForm.ts` and move all form state, validation, and handlers there.
3. Extract `AuthOverlay.tsx` (sign-in overlay).
4. Extract each form section as a subcomponent, passing only the necessary props.
5. Refactor `LogScoreForm.tsx` to orchestrate the above.
6. Test after each step to ensure correctness.

---

**This plan provides a clear, incremental roadmap for refactoring `LogScoreForm.tsx` to achieve better modularity and maintainability.**
