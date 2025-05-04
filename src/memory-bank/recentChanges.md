# Recent Changes

## 2025-05-03

- Ran `scripts/fix_null_timecaps.ts` to update all WODs in the database with `null` timecap to `0`.
- Fixed Zod validation errors caused by WODs with `null` timecap (e.g., "1/4 Mile for Humanity").
- Ensured all WODs now have a non-null, numeric timecap, matching schema requirements.
- Script logs before/after counts for traceability.