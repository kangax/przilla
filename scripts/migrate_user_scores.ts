#!/usr/bin/env node
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import * as schema from "../src/server/db/schema";
import fs from "fs";
import readline from "readline";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Define types based on changes.md and the NEW schema
type SourceResult = {
  date: string; // Assuming ISO string format
  notes?: string | null;
  score_time_seconds?: number | null;
  score_reps?: number | null;
  score_load?: number | null;
  score_rounds_completed?: number | null;
  score_partial_reps?: number | null;
  rxStatus?: string | null; // Added rxStatus from original JSON structure
};

type SourceWod = {
  wodName: string;
  results?: SourceResult[] | null;
  // Other WOD fields...
};

const TARGET_USER_EMAIL = "kangax@gmail.com";
const JSON_FILE_PATH = path.resolve(process.cwd(), "public/data/wods.json");
const BATCH_SIZE = 100; // Insert scores in batches

async function migrateScores() {
  console.log(`Starting score migration for user: ${TARGET_USER_EMAIL}...`);

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }

  // Use createClient directly to avoid potential issues with shared instance
  const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN, // May be undefined for local file DB
  });
  const db = drizzle(client, { schema });

  console.log(`Fetching user ID for ${TARGET_USER_EMAIL}...`);
  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, TARGET_USER_EMAIL),
    columns: { id: true },
  });

  if (!user) {
    console.error(`Error: User with email ${TARGET_USER_EMAIL} not found.`);
    process.exit(1); // Exit if user not found
  }
  const userId = user.id;
  console.log(`User ID found: ${userId}`);

  // --- Clear existing scores for the user ---
  console.log(`Deleting existing scores for user ID: ${userId}...`);
  try {
    await db.delete(schema.scores).where(eq(schema.scores.userId, userId));
    console.log("Existing scores deleted successfully.");
  } catch (deleteError) {
    console.error("Error deleting existing scores:", deleteError);
    process.exit(1); // Exit if deletion fails
  }
  // --- End clearing scores ---

  // --- Efficiently process large JSON file ---
  console.log(`Reading JSON file: ${JSON_FILE_PATH}`);
  const fileStream = fs.createReadStream(JSON_FILE_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let jsonData = "";
  for await (const line of rl) {
    jsonData += line;
  }
  // --- End JSON processing ---

  let wodsData: SourceWod[] = [];
  try {
    wodsData = JSON.parse(jsonData);
    console.log(`Successfully parsed ${wodsData.length} WODs from JSON.`);
  } catch (error) {
    console.error("Error parsing JSON data:", error);
    process.exit(1); // Exit if JSON parsing fails
  }

  // Explicitly define the type for insertion, including nullable fields
  type ScoreInsert = {
    userId: string;
    wodId: string;
    time_seconds: number | null;
    reps: number | null;
    load: number | null;
    rounds_completed: number | null;
    partial_reps: number | null;
    is_rx: boolean;
    scoreDate: Date;
    notes: string | null;
  };

  const scoresToInsert: ScoreInsert[] = []; // Use the explicit type
  const wodIdCache: Record<string, string | null> = {}; // Cache WOD IDs (null if not found)
  let processedWods = 0;
  let processedResults = 0;
  let skippedResultsInvalidData = 0;
  let skippedResultsWodNotFound = 0;
  let totalSourceResults = 0;

  console.log("Processing WODs and results...");

  // Pre-fetch all WOD names and IDs from DB for faster lookup
  console.log("Fetching all WOD IDs from database...");
  const allDbWods = await db.query.wods.findMany({
    columns: { id: true, wodName: true },
  });
  for (const dbWod of allDbWods) {
    wodIdCache[dbWod.wodName] = dbWod.id;
  }
  console.log(`Cached ${Object.keys(wodIdCache).length} WOD IDs.`);

  for (const wod of wodsData) {
    processedWods++;
    if (!wod.results || wod.results.length === 0) {
      continue;
    }

    totalSourceResults += wod.results.length;

    const wodId = wodIdCache[wod.wodName];

    if (!wodId) {
      // WOD name from JSON not found in our cache (meaning not in DB)
      console.warn(
        `WOD named "${wod.wodName}" not found in database cache. Skipping ${wod.results.length} results.`,
      );
      skippedResultsWodNotFound += wod.results.length;
      continue; // Skip all results for this WOD
    }

    for (const result of wod.results) {
      processedResults++;
      let scoreDate: Date | null = null;

      // Parse date
      try {
        scoreDate = new Date(result.date);
        if (isNaN(scoreDate.getTime())) {
          throw new Error("Invalid date format");
        }
      } catch (dateError) {
        console.warn(
          `Invalid date format "${result.date}" for WOD "${wod.wodName}". Skipping result.`,
        );
        skippedResultsInvalidData++;
        continue;
      }

      // Check if at least one score component exists
      const hasScore = [
        result.score_time_seconds,
        result.score_reps,
        result.score_load,
        result.score_rounds_completed,
        // partial_reps can be 0, so don't check it for existence
      ].some((val) => val != null);

      if (!hasScore) {
        console.warn(
          `No score value found for a result in WOD "${wod.wodName}" on date ${result.date}. Skipping result.`,
        );
        skippedResultsInvalidData++;
        continue;
      }

      const typedResult = result as SourceResult; // Explicitly cast result

      scoresToInsert.push({
        userId: userId,
        wodId: wodId,
        // Map source fields directly to new columns, using typedResult
        time_seconds: typedResult.score_time_seconds ?? null,
        reps: typedResult.score_reps ?? null,
        load: typedResult.score_load ?? null,
        rounds_completed: typedResult.score_rounds_completed ?? null,
        partial_reps: typedResult.score_partial_reps ?? null,
        // Original fields
        scoreDate: scoreDate,
        notes: typedResult.notes ?? null,
        is_rx: typedResult.rxStatus === "Rx" ? true : false, // Explicitly map to true/false
        // id, createdAt, updatedAt will be handled by DB defaults/triggers
      });
    }
    if (processedWods % 100 === 0) {
      console.log(`Processed ${processedWods}/${wodsData.length} WODs...`);
    }
  }

  console.log(`\nFinished processing JSON.`);
  console.log(` - Total results found in JSON: ${totalSourceResults}`);
  console.log(
    ` - Valid scores prepared for insertion: ${scoresToInsert.length}`,
  );
  console.log(
    ` - Skipped results (WOD not in DB): ${skippedResultsWodNotFound}`,
  );
  console.log(
    ` - Skipped results (Invalid date/score): ${skippedResultsInvalidData}`,
  );

  if (scoresToInsert.length > 0) {
    console.log(
      `Inserting ${scoresToInsert.length} scores into the database in batches of ${BATCH_SIZE}...`,
    );
    try {
      for (let i = 0; i < scoresToInsert.length; i += BATCH_SIZE) {
        const batch = scoresToInsert.slice(i, i + BATCH_SIZE);
        await db.insert(schema.scores).values(batch).onConflictDoNothing(); // Added onConflictDoNothing just in case
        console.log(
          `  Inserted batch ${i / BATCH_SIZE + 1}/${Math.ceil(scoresToInsert.length / BATCH_SIZE)}`,
        );
      }
      console.log(`Successfully inserted ${scoresToInsert.length} scores.`);
    } catch (error) {
      console.error("Error inserting scores into database:", error);
      process.exit(1); // Exit if insertion fails
    }
  } else {
    console.log("No valid scores found to insert.");
  }

  console.log("Score migration finished successfully.");
}

migrateScores().catch((error) => {
  console.error("Migration script failed:", error);
  process.exit(1);
});
