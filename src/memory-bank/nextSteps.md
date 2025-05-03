## Next Steps

### Must have

- move WodFromDbRowSchema out of wod.ts
- Fix color highlighting in "log score" form
- Importing scores from SugarWOD should show which ones already exist (and if we they differ)
- Add remaining Games/Regionals/etc. workouts from SugarWOD
- export should be named przilla_scores_EMAIL_YYYY_MM_DD
- Search doesn't show "x" on mobile
- Fuzzy search
- Inspect deps for dev vs. not dev
- should use WOD_CATEGORIES, etc. everywhere

### Maybe

- Show difficulty adjusted to you? Does it really matter? Just do the WOD, lol.
- Import from Wodwell
  - write a script for scraping
  - bookmarklet so users can use? (this has been difficult)

## Planned Test Coverage Improvements

The following high-priority areas have been identified for new or improved unit/integration test coverage (non-E2E):

1. **Authentication Flows**

   - Unit/integration tests for login, signup, password reset, and social login logic.
   - Tests for auth-protected route guards and session expiration handling.

2. **CSV/SugarWOD Import Flow**

   - Tests for file parsing, WOD matching, error handling, and backend mutation logic.
   - Tests for UI state transitions (upload, review, confirm, error).

3. **Wodwell Icon Link**

   - Tests for presence/absence, correct URL, accessibility (aria-label), and keyboard navigation.

4. **SSR/Initial Data Hydration**

   - Tests for correct hydration of server-fetched data, fallback logic, and consistency between server/client.

5. **WOD Table (Desktop) Display Features**
   - Tests for search highlighting, notes display, and sorting logic in the desktop table.

These areas are the next focus for improving test coverage and reliability, and will be addressed in order.
