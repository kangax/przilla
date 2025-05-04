import dotenv from "dotenv";
// Defensive, verbose script for exporting/importing user scores as CSV
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { parse as csvParse } from "csv-parse/sync";
import { stringify as csvStringify } from "csv-stringify/sync";
import { scores, wods, user } from "../src/server/db/schema";

// --- Constants ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CLI Argument Parsing ---
const argv = yargs(hideBin(process.argv))
  .command("export", "Export all scores for a user to CSV")
  .command("import", "Import scores for a user from CSV")
  .option("env", {
    type: "string",
    describe: "Path to .env file for DB connection",
    demandOption: true,
  })
  .option("user", {
    type: "string",
    describe: "User email (required)",
    demandOption: true,
  })
  .option("out", {
    type: "string",
    describe: "Output CSV file (for export)",
    default: "scores.csv",
  })
  .option("in", {
    type: "string",
    describe: "Input CSV file (for import)",
  })
  .option("dry-run", {
    type: "boolean",
    describe: "Dry run (simulate import, no DB writes)",
    default: false,
  })
  .demandCommand(1)
  .help()
  .alias("help", "h")
  .parseSync();

const MODE = argv._[0];
const ENV_PATH = argv.env;
const USER_EMAIL = argv.user;
const OUT_FILE = argv.out;
const IN_FILE = argv.in;
const DRY_RUN = argv["dry-run"];

// --- Defensive Logging ---
console.log("==== scores_export_import.ts ====");
console.log(`Mode: ${MODE}`);
console.log(`Env file: ${ENV_PATH}`);
console.log(`User email: ${USER_EMAIL}`);
if (MODE === "export") {
  console.log(`Output file: ${OUT_FILE}`);
} else if (MODE === "import") {
  console.log(`Input file: ${IN_FILE}`);
  console.log(`Dry run: ${DRY_RUN}`);
}
console.log("===============================");

dotenv.config({ path: path.resolve(process.cwd(), ENV_PATH) });

// --- DB Connection ---
const dbUrl = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!dbUrl) {
  console.error("❌ Error: DATABASE_URL environment variable is not set.");
  process.exit(1);
}
console.log(`Connecting to database: ${dbUrl.split("@")[1] ?? dbUrl}`);
const client = createClient({ url: dbUrl, authToken });
const db = drizzle(client);

// --- Main Logic ---
async function main() {
  if (MODE === "export") {
    await exportScores();
  } else if (MODE === "import") {
    await importScores();
  } else {
    console.error("❌ Error: Unknown mode. Use 'export' or 'import'.");
    process.exit(1);
  }
  await client.close();
  console.log("✅ Script finished.");
}

// --- Export Logic ---
async function exportScores() {
  console.log("Looking up user by email...");
  const userRow = await db.select().from(user).where(eq(user.email, USER_EMAIL)).limit(1);
  if (!userRow || userRow.length === 0) {
    console.error(`❌ Error: User with email '${USER_EMAIL}' not found.`);
    process.exit(1);
  }
  const userId = userRow[0].id;
  console.log(`✅ Found user ID: ${userId}`);

  console.log("Fetching scores for user...");
  const scoreRows = await db
    .select({
      wodUrl: wods.wodUrl,
      wodName: wods.wodName,
      scoreDate: scores.scoreDate,
      is_rx: scores.is_rx,
      notes: scores.notes,
      time_seconds: scores.time_seconds,
      reps: scores.reps,
      load: scores.load,
      rounds_completed: scores.rounds_completed,
      partial_reps: scores.partial_reps,
    })
    .from(scores)
    .innerJoin(wods, eq(scores.wodId, wods.id))
    .where(eq(scores.userId, userId));

  console.log(`✅ Found ${scoreRows.length} scores for user.`);

  // Write to CSV
  try {
    const csv = csvStringify(scoreRows, {
      header: true,
      columns: [
        "wodUrl",
        "wodName",
        "scoreDate",
        "is_rx",
        "notes",
        "time_seconds",
        "reps",
        "load",
        "rounds_completed",
        "partial_reps",
      ],
    });
    fs.writeFileSync(OUT_FILE, csv, "utf8");
    console.log(`✅ Exported scores to ${OUT_FILE}`);
  } catch (err) {
    console.error(`❌ Error writing to CSV:`, err);
    process.exit(1);
  }
}

// --- Import Logic ---
async function importScores() {
  if (!IN_FILE) {
    console.error("❌ Error: --in (input CSV file) is required for import.");
    process.exit(1);
  }
  console.log("Looking up user by email...");
  const userRow = await db.select().from(user).where(eq(user.email, USER_EMAIL)).limit(1);
  if (!userRow || userRow.length === 0) {
    console.error(`❌ Error: User with email '${USER_EMAIL}' not found.`);
    process.exit(1);
  }
  const userId = userRow[0].id;
  console.log(`✅ Found user ID: ${userId}`);

  // Delete all existing scores for this user before import
  try {
    const existingScores = await db.select().from(scores).where(eq(scores.userId, userId));
    const deleted = await db.delete(scores).where(eq(scores.userId, userId));
    console.log(`🗑️  Deleted ${existingScores.length} existing scores for user before import.`);
  } catch (err) {
    console.error(`❌ Error deleting existing scores for user:`, err);
    process.exit(1);
  }

  // Read CSV
  let csvRows: any[];
  try {
    const csvContent = fs.readFileSync(IN_FILE, "utf8");
    csvRows = csvParse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    });
    console.log(`✅ Read ${csvRows.length} rows from ${IN_FILE}`);
  } catch (err) {
    console.error(`❌ Error reading/parsing CSV:`, err);
    process.exit(1);
  }

  // Fetch all WODs for fast lookup (by url and by name)
  let wodUrlToId: Record<string, string> = {};
  let wodNameToIds: Record<string, string[]> = {};
  try {
    const allWods = await db.select({ id: wods.id, wodUrl: wods.wodUrl, wodName: wods.wodName }).from(wods);
    wodUrlToId = Object.fromEntries(allWods.filter(w => w.wodUrl).map((w) => [w.wodUrl, w.id]));
    for (const w of allWods) {
      if (!wodNameToIds[w.wodName]) wodNameToIds[w.wodName] = [];
      wodNameToIds[w.wodName].push(w.id);
    }
    console.log(`✅ Loaded ${allWods.length} WODs for lookup.`);
  } catch (err) {
    console.error("❌ Error fetching WODs from DB:", err);
    process.exit(1);
  }

  // Process and insert
  let processed = 0, inserted = 0, skipped = 0, errors = 0;
  for (const row of csvRows) {
    processed++;
    const wodUrl = row.wodUrl;
    const wodName = row.wodName;
    let wodId: string | undefined;
    if (wodUrl && wodUrlToId[wodUrl]) {
      wodId = wodUrlToId[wodUrl];
    } else if (wodName && wodNameToIds[wodName]) {
      if (wodNameToIds[wodName].length === 1) {
        wodId = wodNameToIds[wodName][0];
        console.warn(`⚠️  Row ${processed}: Matched by wodName '${wodName}' (no url).`);
      } else {
        console.warn(`⚠️  Skipping row ${processed}: Multiple WODs found with name '${wodName}'.`);
        skipped++;
        continue;
      }
    } else {
      console.warn(`⚠️  Skipping row ${processed}: WOD not found by url or name (url: '${wodUrl}', name: '${wodName}').`);
      skipped++;
      continue;
    }
    // Defensive: parse/validate fields
    let scoreDateNum = Number(row.scoreDate);
    if (isNaN(scoreDateNum)) {
      console.warn(`⚠️  Skipping row ${processed}: Invalid scoreDate '${row.scoreDate}'.`);
      skipped++;
      continue;
    }
    const scoreDate = new Date(scoreDateNum);
    const scoreData = {
      userId,
      wodId,
      scoreDate,
      is_rx: row.is_rx === "true" || row.is_rx === "1" || row.is_rx === 1,
      notes: row.notes ?? null,
      time_seconds: row.time_seconds ? Number(row.time_seconds) : null,
      reps: row.reps ? Number(row.reps) : null,
      load: row.load ? Number(row.load) : null,
      rounds_completed: row.rounds_completed ? Number(row.rounds_completed) : null,
      partial_reps: row.partial_reps ? Number(row.partial_reps) : null,
    };
    // Insert unless dry-run
    if (!DRY_RUN) {
      try {
        await db.insert(scores).values(scoreData);
        inserted++;
        console.log(`✅ Inserted score for WOD '${wodUrl || wodName}' (row ${processed})`);
      } catch (err) {
        console.error(`❌ Error inserting row ${processed}:`, err);
        errors++;
      }
    } else {
      console.log(`[DRY RUN] Would insert score for WOD '${wodUrl || wodName}' (row ${processed})`);
      inserted++;
    }
  }
  // Summary
  console.log("\n--- Import Summary ---");
  console.log(`Rows processed: ${processed}`);
  console.log(`Rows inserted:  ${inserted}`);
  console.log(`Rows skipped:   ${skipped}`);
  console.log(`Errors:         ${errors}`);
  if (DRY_RUN) {
    console.log("NOTE: No changes were made to the database (dry run).");
  }
}

main().catch((err) => {
  console.error("\n❌ Unhandled error during script execution:", err);
  process.exit(1);
});
