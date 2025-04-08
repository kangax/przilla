import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env file

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url"; // Import necessary function
// import { db } from "../src/server/db"; // REMOVED: Use local DB instance instead
import * as schema from "../src/server/db/schema"; // Adjust path relative to scripts/
// import { normalizeMovementName } from "../src/utils/movementMapping"; // Removed movement logic
import type { Wod, Benchmarks, WodTag } from "../src/types/wodTypes"; // Adjust path relative to scripts/
import { eq, type SQL } from "drizzle-orm"; // Added SQL type import if needed later
import { createClient } from "@libsql/client"; // ADDED: For local client
import { drizzle } from "drizzle-orm/libsql"; // ADDED: For local drizzle instance

// --- Configuration ---
// Get current directory in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WODS_JSON_PATH = path.join(__dirname, "../public/data/wods.json"); // Use corrected __dirname
const BATCH_SIZE = 100; // Adjust batch size as needed for inserts

// Define allowed tags based on the WodTag type
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

/**
 * Inserts data in batches.
 * NOTE: Removed conflict handling as duplicates are pre-filtered now.
 * Throws error if any batch fails.
 */
async function batchInsert<T extends Record<string, any>>(
  localDb: ReturnType<typeof drizzle>, // ADDED: Pass local DB instance
  table: typeof schema.wods | typeof schema.scores, // Updated table types
  values: T[],
  // conflictTarget?: keyof T | (keyof T)[], // Removed conflict target
) {
  if (values.length === 0) return;

  for (let i = 0; i < values.length; i += BATCH_SIZE) {
    const batch = values.slice(i, i + BATCH_SIZE);
    try {
      // ADDED: onConflictDoNothing() to skip duplicates based on unique constraints (like wodUrl)
      await localDb.insert(table).values(batch).onConflictDoNothing().execute(); // Use localDb
    } catch (error) {
      // Enhanced error logging (keep for other potential errors)
      console.error(
        `--- Batch Insert Error Details (items ${i} to ${i + BATCH_SIZE - 1}) ---`,
      );
      console.error("Error Type:", typeof error);
      console.error("Error Object:", error); // Log the raw object
      console.error("Error String:", String(error)); // Force string conversion
      try {
        // Attempt to stringify, might fail for non-plain objects
        console.error("Error JSON:", JSON.stringify(error, null, 2));
      } catch (stringifyError) {
        console.error("Could not stringify error object:", stringifyError);
      }

      // Log the first item in the failing batch for inspection
      if (batch.length > 0) {
        console.error("First item in failing batch:", batch[0]);
      }
      console.error("--- End Batch Insert Error Details ---");
      // Re-throw the error to stop the migration if a batch fails
      throw error;
    }
  }
}

// --- Migration Logic ---

async function migrateData() {
  console.log("🚀 Starting WOD data migration (WODs only)...");

  // Create a local DB client and drizzle instance for this script
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set.");
    process.exit(1);
  }
  const localClient = createClient({
    url: process.env.DATABASE_URL,
    authToken: undefined, // Ensure local file handling
  });
  const localDb = drizzle(localClient, { schema }); // Use the imported schema

  try {
    // 0. Clear existing WOD table using localDb
    console.log("🗑️ Attempting to clear existing WOD data from database...");
    await localDb.delete(schema.wods);
    console.log("✅ WOD table cleared successfully.");

    // 1. Read JSON data
    console.log(`📄 Reading WOD data from ${WODS_JSON_PATH}...`);
    const jsonData = await fs.readFile(WODS_JSON_PATH, "utf-8");
    // Use any[] to reflect the raw JSON structure before mapping
    const wodsData = JSON.parse(jsonData) as any[];
    console.log(`✅ Found ${wodsData.length} WODs in JSON file.`);

    // 1b. Fetch existing WOD names and URLs from DB (Should be empty now)
    // console.log("🔍 Fetching existing WOD names and URLs from database...");
    // const existingWods = await db
    //   .select({ wodName: schema.wods.wodName, wodUrl: schema.wods.wodUrl }) // Select both name and URL
    //   .from(schema.wods);
    // const existingWodNames = new Set(existingWods.map((w) => w.wodName));
    // const existingWodUrls = new Set(
    //   existingWods.map((w) => w.wodUrl).filter((url) => url),
    // );
    // console.log(
    //   `✅ Found ${existingWodNames.size} existing WOD names and ${existingWodUrls.size} unique URLs in the database.`,
    // );

    // 2. Prepare and insert *new* WODs, checking for duplicates within the JSON source
    console.log(
      "🏋️ Preparing and inserting WOD data (checking for internal duplicates)...",
    );
    const wodsToInsert: (typeof schema.wods.$inferInsert)[] = [];
    const namesInCurrentBatch = new Set<string>(); // Track names added in this run
    const urlsInCurrentBatch = new Set<string>(); // Track URLs added in this run
    let skippedCount = 0;
    let duplicateInJsonCount = 0;

    for (const wod of wodsData) {
      if (!wod.wodName) {
        console.warn("Skipping WOD with missing name:", wod.wodUrl);
        skippedCount++;
        continue;
      }

      // Skip if WOD name OR non-empty URL already exists *in this batch*
      const nameExists = namesInCurrentBatch.has(wod.wodName);
      const urlExists = wod.wodUrl && urlsInCurrentBatch.has(wod.wodUrl); // Check only if URL is present and non-empty

      if (nameExists || urlExists) {
        console.log(
          `   -> Skipping duplicate within JSON: Name='${wod.wodName}', URL='${wod.wodUrl}' (Reason: ${nameExists ? "Name exists" : ""}${nameExists && urlExists ? " & " : ""}${urlExists ? "URL exists" : ""})`,
        ); // ADDED: Log skipped duplicates
        duplicateInJsonCount++;
        continue;
      }

      // Filter tags based on the allowed list
      const validTags =
        wod.tags?.filter((tag): tag is WodTag => ALLOWED_TAGS.has(tag)) ?? null;

      // Ensure empty string URLs are treated as null for UNIQUE constraint
      const finalWodUrl = wod.wodUrl === "" ? null : wod.wodUrl;

      const wodInsertData = {
        wodUrl: finalWodUrl, // Use the potentially nulled URL
        wodName: wod.wodName,
        description: wod.description,
        // Stringify JSON fields for SQLite text columns
        benchmarks: wod.benchmarks ? JSON.stringify(wod.benchmarks) : null,
        category: wod.category,
        tags: validTags ? JSON.stringify(validTags) : null, // Stringify the filtered array
        difficulty: wod.difficulty,
        // Map from snake_case (JSON source) to camelCase (DB schema target)
        difficultyExplanation: wod.difficulty_explanation,
        countLikes: wod.count_likes,
      };
      wodsToInsert.push(wodInsertData);
      // Add name and URL to tracking sets for this run
      namesInCurrentBatch.add(wod.wodName);
      if (wod.wodUrl) {
        urlsInCurrentBatch.add(wod.wodUrl);
      }
    }

    console.log(`ℹ️ Skipped ${skippedCount} WODs (missing name).`);
    console.log(
      `ℹ️ Skipped ${duplicateInJsonCount} WODs (duplicate name/URL within JSON source).`,
    );

    if (wodsToInsert.length > 0) {
      console.log(`💾 Inserting ${wodsToInsert.length} unique WODs...`);
      await batchInsert(
        // Pass localDb to batchInsert
        localDb,
        schema.wods,
        wodsToInsert,
        // Removed conflict target
      );
      console.log(`✅ Finished inserting ${wodsToInsert.length} unique WODs.`);
    } else {
      console.log("✅ No unique WODs found in JSON to insert.");
    }

    // Steps for fetching WOD IDs and inserting links removed as per user request.

    console.log("🎉 WOD migration completed successfully!");
  } catch (error) {
    // Enhanced outer error logging
    console.error("--- Migration Script Error Details ---");
    console.error("Error Type:", typeof error);
    console.error("Error Object:", error); // Log the raw object
    console.error("Error String:", String(error)); // Force string conversion
    try {
      // Attempt to stringify, might fail for non-plain objects
      console.error("Error JSON:", JSON.stringify(error, null, 2));
    } catch (stringifyError) {
      console.error("Could not stringify error object:", stringifyError);
    }
    console.error("--- End Migration Script Error Details ---");
    console.error("❌ Migration failed."); // Simplified final message
    process.exit(1); // Exit with error code
  }
}

// --- Execute Migration ---
migrateData();
