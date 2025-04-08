# Product Context

## Problem Solved

- Provides a dedicated platform for users (likely CrossFit athletes or fitness enthusiasts) to track their performance on various WODs (Workouts of the Day).
- Centralizes WOD information (description, difficulty, type) and personal progress (scores, times, notes).
- Helps users monitor their fitness journey and identify improvements or areas needing focus.

## How It Works

- Users can view a list or database of WODs (sourced from the database via tRPC in `WodViewer`, previously `public/data/wods.json`).
- (not yet) Users can select a WOD to see its details (description, type, etc.).
- (not yet) Users can log their scores/times/results for specific WODs, likely associated with a date.
- The application displays progress over time, through charts (`WodTimelineChart`, `WodDistributionChart`) or tables (`WodTable`, `WodTimeline`).
- (not yet) Users might be able to add personal notes to their logged scores.
- (not yet) Authentication (`AuthControls`, NextAuth) allows users to manage their personal data.

- **WOD Data:** Never guess information about WODs (Workouts of the Day). Always use or request real data if unsure.
- **Allowed WOD Tags:** The only permitted tags for WODs are: 'Chipper', 'Couplet', 'Triplet', 'EMOM', 'AMRAP', 'For Time', 'Ladder'.

## User Experience Goals

- **Clarity:** Present WOD information and user progress clearly and concisely.
- **Efficiency:** Allow users to log scores and view progress quickly and easily.
- **Insightful:** Provide meaningful visualizations and data points to help users understand their performance.
- **Minimal UI:** Prefer concise UI elements. For example, use separators like "|" instead of verbose toggles (e.g., "Categories | Tags" instead of "Show Categories" / "Show Tags").
- **Theme Support:** The application must support both dark and light modes effectively.
- **Responsive Design:** Ensure the UI layout flows well and is usable across different screen sizes.
