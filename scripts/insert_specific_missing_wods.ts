import dotenv from "dotenv";
dotenv.config(); // Load environment variables

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import * as schema from "../src/server/db/schema"; // Adjust path as needed
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, inArray } from "drizzle-orm";
import chalk from "chalk"; // For colored logging
import type { WodTag } from "../src/types/wodTypes"; // Import WodTag

// --- Configuration ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WODS_JSON_PATH = path.join(__dirname, "../public/data/wods.json"); // Path to your source JSON

// List of WOD names we intend to insert if missing by NAME
const MISSING_WOD_NAMES = [
  "Open 15.1A",
  "Open 18.2A",
  "Open 21.4",
  "Open 23.2B",
];

// Use the definition from constants.ts or wodTypes.ts
const ALLOWED_TAGS: Set<WodTag> = new Set([
  "Chipper",
  "Couplet",
  "Triplet",
  "EMOM",
  "AMRAP",
  "For Time",
  "Ladder",
]);

// --- Helper Functions ---

// Normalize tags: filter out disallowed tags and ensure it's an array
function normalizeTags(tags: any): string[] {
  if (!Array.isArray(tags)) return []; // Return empty if not an array
  const filtered = tags.filter((tag): tag is WodTag =>
    ALLOWED_TAGS.has(tag as WodTag),
  );
  return filtered;
}

// Map JSON WOD structure to Database structure
function mapWodJsonToDb(wod: any) {
  const validTags = normalizeTags(wod.tags);
  let benchmarksString: string | null = null;
  if (wod.benchmarks) {
    try {
      benchmarksString = JSON.stringify(wod.benchmarks);
    } catch (e) {
      console.warn(
        chalk.yellow(
          `⚠️ Could not stringify benchmarks for WOD: ${wod.wodName}`,
        ),
      );
    }
  }
  let tagsString: string | null = null;
  if (validTags) {
    try {
      tagsString = JSON.stringify(validTags);
    } catch (e) {
      console.warn(
        chalk.yellow(`⚠️ Could not stringify tags for WOD: ${wod.wodName}`),
      );
    }
  }

  return {
    wodUrl: wod.wodUrl === "" || wod.wodUrl === undefined ? null : wod.wodUrl, // Treat empty string as null
    wodName: wod.wodName,
    description: wod.description,
    benchmarks: benchmarksString,
    category: wod.category,
    tags: tagsString,
    difficulty: wod.difficulty,
    difficultyExplanation:
      wod.difficultyExplanation || wod.difficulty_explanation || null,
    timecap: wod.timecap ?? null,
    countLikes: wod.countLikes ?? wod.count_likes ?? 0,
  };
}

// --- Main Script Logic ---
async function insertMissingWods() {
  console.log(
    chalk.blue(
      "🚀 Starting FINAL script to insert specific missing WODs (URL conflicts allowed)...",
    ),
  );

  // 1. Read and parse the source JSON file
  let allWodsFromJson: any[] = [];
  try {
    const jsonData = await fs.readFile(WODS_JSON_PATH, "utf-8");
    allWodsFromJson = JSON.parse(jsonData);
    console.log(
      chalk.green(
        `✅ Successfully read ${allWodsFromJson.length} WODs from ${path.basename(WODS_JSON_PATH)}.`,
      ),
    );
  } catch (error) {
    console.error(
      chalk.red(`❌ Failed to read or parse ${WODS_JSON_PATH}:`),
      error,
    );
    process.exit(1);
  }

  // 2. Filter the JSON data to find the specific WODs we need
  const targetWodsData = allWodsFromJson.filter((wod) =>
    MISSING_WOD_NAMES.includes(wod?.wodName),
  );
  console.log(
    chalk.cyan(
      `ℹ️ Found ${targetWodsData.length} matching WODs in the JSON file.`,
    ),
  );

  // Verify all target WODs were found in the JSON
  if (targetWodsData.length !== MISSING_WOD_NAMES.length) {
    const foundNames = targetWodsData.map((w) => w.wodName);
    const notFoundNames = MISSING_WOD_NAMES.filter(
      (name) => !foundNames.includes(name),
    );
    console.warn(
      chalk.yellow(
        `⚠️ Warning: Could not find data for the following WODs in ${path.basename(WODS_JSON_PATH)}:`,
      ),
    );
    notFoundNames.forEach((name) => console.warn(chalk.yellow(`   - ${name}`)));
    if (targetWodsData.length === 0) {
      console.error(
        chalk.red(
          `❌ No WOD data found for any of the target names. Ensure they exist in ${path.basename(WODS_JSON_PATH)}. Exiting.`,
        ),
      );
      process.exit(1);
    }
    console.warn(chalk.yellow("Continuing with the WODs that were found..."));
  }

  // 3. Connect to the database
  const dbUrl = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;
  const dbAuthToken =
    process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

  if (!dbUrl) {
    console.error(
      chalk.red("❌ DATABASE_URL environment variable is not set."),
    );
    process.exit(1);
  }
  if (!dbUrl.startsWith("file:")) {
    console.warn(
      chalk.yellow(
        `⚠️ WARNING: DATABASE_URL is not a file path (${dbUrl}). Ensure this is the intended database.`,
      ),
    );
  } else {
    console.log(chalk.cyan(`ℹ️ Targeting local database file: ${dbUrl}`));
  }

  let client;
  try {
    client = createClient({ url: dbUrl, authToken: dbAuthToken });
    console.log(chalk.green("✅ Successfully created database client."));
  } catch (error) {
    console.error(
      chalk.red("❌ Failed to create database client or connect:"),
      error,
    );
    process.exit(1);
  }
  const db = drizzle(client, { schema });
  console.log(chalk.green("✅ Successfully initialized Drizzle ORM."));

  // 4. Check which of the target WODs already exist in the database by NAME only
  const namesToCheck = targetWodsData.map((wod) => wod.wodName);
  let existingWodsByName: { wodName: string }[] = [];
  if (namesToCheck.length > 0) {
    try {
      existingWodsByName = await db
        .select({ wodName: schema.wods.wodName })
        .from(schema.wods)
        .where(inArray(schema.wods.wodName, namesToCheck));
      console.log(
        chalk.cyan(
          `ℹ️ Found ${existingWodsByName.length} of the target WODs already in the database by NAME.`,
        ),
      );
    } catch (error) {
      console.error(
        chalk.red("❌ Error checking for existing WOD names in database:"),
        error,
      );
    }
  }
  const existingWodNamesSet = new Set(
    existingWodsByName.map((wod) => wod.wodName),
  );

  // 5. Prepare list, filtering ONLY by NAME conflict
  const wodsToInsertMapped = targetWodsData
    .filter((wodData) => {
      const nameExists = existingWodNamesSet.has(wodData.wodName);
      // REMOVED URL conflict check logic here
      if (nameExists) {
        console.log(
          chalk.gray(`   - Skipping (Name already in DB): ${wodData.wodName}`),
        );
        return false;
      }
      // If name doesn't exist, include it for insertion regardless of URL
      return true;
    })
    .map(mapWodJsonToDb); // Map to DB schema

  console.log(
    chalk.cyan(
      `ℹ️ Prepared ${wodsToInsertMapped.length} WODs for final insertion (only checks for existing names).`,
    ),
  );

  // 6. Perform insertion
  if (wodsToInsertMapped.length > 0) {
    console.log(
      chalk.blue(
        `💾 Inserting ${wodsToInsertMapped.length} WODs into the database...`,
      ),
    );
    try {
      const result = await db
        .insert(schema.wods)
        .values(wodsToInsertMapped)
        // Using onConflictDoNothing as a safeguard against unforeseen name conflicts
        // that might arise between the check and insert in rare cases.
        .onConflictDoNothing()
        .returning({
          insertedId: schema.wods.id,
          insertedName: schema.wods.wodName,
        });

      console.log(
        chalk.green(
          `✅ Drizzle insert command completed. Returned ${result.length} rows (may be less than prepared due to onConflictDoNothing).`,
        ),
      );

      if (result.length > 0) {
        console.log(
          chalk.green("✅ Successfully inserted WODs based on returning data:"),
        );
        result.forEach((wod) =>
          console.log(
            chalk.green(
              `   - Confirmed Inserted: ${wod.insertedName} (ID: ${wod.insertedId})`,
            ),
          ),
        );

        // Optional verification query
        console.log(chalk.blue("🔍 Verifying insertion immediately..."));
        const verifyNames = result.map((r) => r.insertedName);
        const verifiedWods = await db
          .select({ name: schema.wods.wodName })
          .from(schema.wods)
          .where(inArray(schema.wods.wodName, verifyNames));
        console.log(
          chalk.cyan(
            `✅ Verification query found ${verifiedWods.length} of the inserted WODs in DB.`,
          ),
        );
        if (verifiedWods.length !== result.length) {
          console.warn(
            chalk.yellow(
              `⚠️ Verification count mismatch! Expected ${result.length}, found ${verifiedWods.length}.`,
            ),
          );
        }
      } else if (wodsToInsertMapped.length > 0) {
        console.warn(
          chalk.yellow(
            `⚠️ Insert command returned 0 rows, but ${wodsToInsertMapped.length} were prepared. This might indicate all WODs already existed by name.`,
          ),
        );
      }
    } catch (error) {
      console.error(chalk.red("❌ Error during insert execution:"), error);
      if (error instanceof Error) {
        console.error(chalk.red(`   Error Message: ${error.message}`));
      }
    }
  } else {
    console.log(
      chalk.yellow(
        "✅ No new WODs needed insertion (either not found in JSON or already exist by name).",
      ),
    );
  }

  console.log(chalk.blue("🎉 Script finished."));
}

// --- Execute Script ---
insertMissingWods().catch((error) => {
  console.error(
    chalk.red("❌ Unhandled error during script execution:"),
    error,
  );
  process.exit(1);
});
