// scripts/backfill_timecaps.js

/**
 * Backfill the 'timecap' column in the wods table using data from public/data/wods_with_timecaps.json.
 * Usage: node scripts/backfill_timecaps.js
 */

import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

// Adjust these paths as needed for your project structure
import { wods } from "../src/server/db/schema.js";

// Load DB connection info from env or config
console.log("====>", process.env.DATABASE_URL);

const dbUrl = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;
const dbAuthToken =
  process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

if (!dbUrl) {
  console.error(
    "DATABASE_URL or TURSO_DATABASE_URL must be set in environment",
  );
  process.exit(1);
}

const client = createClient({
  url: dbUrl,
  authToken: dbAuthToken,
});
const db = drizzle(client);

function parseTimecapString(str) {
  // Accepts formats like "Time Cap: 20", "Time cap: 14", "12 min cap", "Time Cap: 9 minutes"
  if (!str) return null;
  const minMatch = str.match(/(\d+)\s*(min|minutes)?/i);
  if (minMatch) {
    return parseInt(minMatch[1], 10) * 60;
  }
  return null;
}

async function main() {
  const jsonPath = path.resolve("public/data/wods_with_timecaps.json");
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const wodsWithTimecaps = JSON.parse(raw);

  let updated = 0;
  for (const wod of wodsWithTimecaps) {
    const { wodName, timecap_string } = wod;
    const timecapSeconds = parseTimecapString(timecap_string);
    if (!timecapSeconds) continue;

    // Try to find the WOD in the DB first
    const dbWod = await db
      .select()
      .from(wods)
      .where(eq(wods.wodName, wodName))
      .get();
    if (!dbWod) {
      console.log(`[NO MATCH] "${wodName}" not found in DB`);
      continue;
    }

    // Update the wods table where wodName matches
    const res = await db
      .update(wods)
      .set({ timecap: timecapSeconds })
      .where(eq(wods.wodName, wodName));

    updated++;
  }

  console.log(`Backfill complete. Updated ${updated} WODs with timecap.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
