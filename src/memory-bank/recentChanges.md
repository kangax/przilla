# Recent Changes

## 2025-05-05

- **Fix TRPCError in Charts Page:** Added a nullish check in `src/utils/wodValidation.ts` within the `validateWodsFromDb` function. This prevents a Zod validation error (`expected: "object", received: "undefined"`) that occurred when the function received a null or undefined entry from the WOD data array fetched in `src/server/api/routers/wodChartHelpers.ts`. The function now safely skips such entries and logs a warning. This resolves the `TRPCError` encountered when loading the `/charts` page.

## 2025-05-03

- Ran `scripts/fix_null_timecaps.ts` to update all WODs in the database with `null` timecap to `0`.
- Fixed Zod validation errors caused by WODs with `null` timecap (e.g., "1/4 Mile for Humanity").
- Ensured all WODs now have a non-null, numeric timecap, matching schema requirements.
- Script logs before/after counts for traceability.
