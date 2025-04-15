import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url"; // Import necessary function

import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import * as schema from "../src/server/db/schema"; // Import all schema objects

// Get the directory name in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from the project root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Ensure DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL environment variable not found.");
  process.exit(1);
}

// Create a Drizzle client instance specifically for this script
const client = createClient({ url: process.env.DATABASE_URL });
const db = drizzle(client, { schema });

// Now use the schema objects directly, e.g., schema.scores, schema.wods
const { scores, wods } = schema;

// --- Configuration ---
const JSON_FILE_PATH = path.join(__dirname, "../all_scores_apr_14_25.json"); // Use the calculated __dirname
const TARGET_USER_ID = "ddjuTYY5dwolIXnmxIHJnCdbEfMqJFlX"; // The user ID provided

// --- Types (matching the JSON structure) ---
interface ScoreResult {
  date: string;
  rxStatus: "Rx" | "Scaled";
  notes: string | null;
  score_time_seconds: number | null;
  score_reps: number | null;
  score_load: number | null;
  score_rounds_completed: number | null;
  score_partial_reps: number | null;
}

interface WodScoreEntry {
  results: ScoreResult[];
  wodUrl: string | null;
}

// --- Date Parsing Helper ---
const monthMap: { [key: string]: number } = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

function parseDateString(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.match(/(\d{1,2})\s([A-Za-z]{3})'(\d{2})/);
  if (!parts) {
    console.error(`[Error] Invalid date format encountered: ${dateStr}`);
    return null;
  }
  const day = parseInt(parts[1], 10);
  const monthStr = parts[2];
  const yearShort = parseInt(parts[3], 10);

  const month = monthMap[monthStr];
  if (month === undefined) {
    console.error(`[Error] Invalid month in date string: ${dateStr}`);
    return null;
  }

  // Assuming years '00-'49 are 20xx and '50-'99 are 19xx.
  // Given the data context ('15-'25), 20xx seems correct.
  const year = 2000 + yearShort;

  // Use local date constructor
  const date = new Date(year, month, day);

  // Validate parsed date components
  if (
    isNaN(date.getTime()) ||
    date.getDate() !== day ||
    date.getMonth() !== month ||
    date.getFullYear() !== year
  ) {
    console.error(
      `[Error] Parsed date appears invalid: ${dateStr} -> ${date.toISOString()}`,
    );
    return null;
  }
  return date;
}

// --- Main Import Logic ---
async function importScores() {
  console.log(
    `Starting score import from ${JSON_FILE_PATH} for user ${TARGET_USER_ID}...`,
  );

  let jsonData: WodScoreEntry[];
  try {
    const fileContent = await fs.readFile(JSON_FILE_PATH, "utf-8");
    jsonData = JSON.parse(fileContent);
    console.log(
      `Successfully read and parsed ${jsonData.length} WOD entries from JSON file.`,
    );
  } catch (error) {
    console.error(
      `[Fatal] Failed to read or parse JSON file: ${JSON_FILE_PATH}`,
      error,
    );
    return;
  }

  let wodEntriesProcessed = 0;
  let scoresFound = 0;
  let scoresInserted = 0;
  let scoresSkipped = 0;
  let errors = 0;
  const skippedWodDetails: {
    reason: string;
    identifier: string;
    count: number;
  }[] = []; // Store details of skipped WODs/scores

  for (const entry of jsonData) {
    wodEntriesProcessed++;
    if (!entry.wodUrl) {
      console.warn(
        `[Warning] Skipping entry ${wodEntriesProcessed} due to missing wodUrl.`,
      );
      scoresSkipped += entry.results.length;
      skippedWodDetails.push({
        reason: "Missing wodUrl",
        identifier: `Entry ${wodEntriesProcessed}, ${JSON.stringify(entry)}`,
        count: entry.results.length,
      });
      continue;
    }

    let wodId: string | null = null;
    try {
      const wodResult = await db
        .select({ id: wods.id })
        .from(wods)
        .where(eq(wods.wodUrl, entry.wodUrl))
        .limit(1);

      if (wodResult.length > 0 && wodResult[0].id) {
        wodId = wodResult[0].id;
      } else {
        console.warn(
          `[Warning] WOD not found in database for URL: ${entry.wodUrl}. Skipping ${entry.results.length} score(s).`,
        );
        scoresSkipped += entry.results.length;
        skippedWodDetails.push({
          reason: "WOD not found in DB",
          identifier: entry.wodUrl,
          count: entry.results.length,
        });
        continue; // Skip scores for this WOD if not found
      }
    } catch (dbError) {
      console.error(
        `[Error] Database error looking up WOD for URL ${entry.wodUrl}:`,
        dbError,
      );
      errors++;
      scoresSkipped += entry.results.length;
      skippedWodDetails.push({
        reason: "DB Error during WOD lookup",
        identifier: entry.wodUrl,
        count: entry.results.length,
      });
      continue; // Skip scores if DB lookup fails
    }

    for (const result of entry.results) {
      scoresFound++;
      const scoreDate = parseDateString(result.date);
      if (!scoreDate) {
        console.warn(
          `[Warning] Skipping score due to invalid date format: ${result.date} for WOD URL ${entry.wodUrl}`,
        );
        scoresSkipped++;
        skippedWodDetails.push({
          reason: "Invalid date format",
          identifier: `${entry.wodUrl} (Date: ${result.date})`,
          count: 1, // Only skipping one score here
        });
        continue; // Skip this score if date is invalid
      }

      const scoreData = {
        userId: TARGET_USER_ID,
        wodId: wodId, // Already confirmed not null here
        scoreDate: scoreDate,
        is_rx: result.rxStatus === "Rx",
        notes: result.notes,
        time_seconds: result.score_time_seconds,
        reps: result.score_reps,
        load: result.score_load, // Maps to 'load' column in schema
        rounds_completed: result.score_rounds_completed,
        partial_reps: result.score_partial_reps,
      };

      try {
        // Consider adding onConflictDoNothing() if duplicates should be ignored silently
        // await db.insert(scores).values(scoreData).onConflictDoNothing();
        await db.insert(scores).values(scoreData);
        scoresInserted++;
        // console.log(` -> Inserted score for WOD ${wodId} on ${scoreDate.toISOString().split('T')[0]}`);
      } catch (insertError) {
        console.error(
          `[Error] Failed to insert score for WOD ${wodId} (URL: ${entry.wodUrl}) on date ${result.date}:`,
          insertError,
        );
        errors++;
      }
    }
    if (wodEntriesProcessed % 10 === 0) {
      console.log(
        `Processed ${wodEntriesProcessed}/${jsonData.length} WOD entries...`,
      );
    }
  }

  console.log("\n--- Import Summary ---");
  console.log(`Total WOD entries in JSON: ${jsonData.length}`);
  console.log(`WOD entries processed: ${wodEntriesProcessed}`);
  console.log(`Total scores found in JSON: ${scoresFound}`);
  console.log(`Scores successfully inserted: ${scoresInserted}`);
  console.log(`Scores skipped (missing WOD, bad date, etc.): ${scoresSkipped}`);
  if (skippedWodDetails.length > 0) {
    console.log("\n--- Skipped Score Details ---");
    skippedWodDetails.forEach((detail) => {
      console.log(
        `- Reason: ${detail.reason}, Identifier: ${detail.identifier}, Count: ${detail.count}`,
      );
    });
    console.log("---------------------------");
  }
  console.log(`Errors encountered: ${errors}`);
  console.log("----------------------");
}

importScores().catch((error) => {
  console.error("[Fatal] Unhandled error during script execution:", error);
  process.exit(1);
});
