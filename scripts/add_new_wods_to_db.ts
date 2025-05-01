import dotenv from "dotenv";
dotenv.config();

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import * as schema from "../src/server/db/schema";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

// --- Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WODS_JSON_PATH = path.join(__dirname, "../public/data/wods.json");

// List of the 23 new benchmark WOD names (must match exactly)
const NEW_BENCHMARK_WOD_NAMES = [
  "Handstand Push-Ups: Max Reps",
  "Handstand Push-ups (Free Standing): Max Reps",
  "Handstand Push-ups (Strict): Max Reps",
  "Handstand Walk: Max Distance",
  "L-Sit Hold: Max Time",
  "Muscle-Ups: Max Reps",
  "Pull-up (Weighted): 1RM",
  "Pull-ups (Chest-to-Bar): Max Reps",
  "Pull-ups (Kipping): Max Reps",
  "Pull-ups (Strict): Max Reps",
  "Push-Ups: Max Reps",
  "Ring Dips: Max Reps",
  "Skin the Cat: Max Reps",
  "Toes-to-Bar: Max Reps",
  "Triple-Unders: Max Reps",
  "50 Wall Balls",
  "Bar Muscle-Ups: Max Reps",
  "Box Jump: Max Height",
  "Broad Jump: Max Distance",
  "Double Unders: 2 Minute Test",
  "Double-Unders: Max Reps",
  "Handstand Hold: Max Time",
  "Handstand Push-Ups: 2 min max reps",
];

function mapWodJsonToDb(wod: any) {
  return {
    wodUrl: wod.wodUrl === "" ? null : wod.wodUrl,
    wodName: wod.wodName,
    description: wod.description,
    benchmarks: wod.benchmarks ? JSON.stringify(wod.benchmarks) : null,
    category: wod.category,
    tags: wod.tags ? JSON.stringify(wod.tags) : null,
    difficulty: wod.difficulty,
    difficultyExplanation: wod.difficultyExplanation ?? null, // Updated
    timecap: null,
    countLikes: wod.countLikes ?? 0, // Updated
  };
}

async function main() {
  // Use TURSO_DATABASE_URL and TURSO_AUTH_TOKEN from .env
  const tursoDbUrl = process.env.TURSO_DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoDbUrl) {
    console.error("❌ TURSO_DATABASE_URL is not set in .env.");
    process.exit(1);
  }

  const client = createClient({
    url: tursoDbUrl,
    authToken: tursoAuthToken,
  });
  const db = drizzle(client, { schema });

  // Read and parse wods.json
  const jsonData = await fs.readFile(WODS_JSON_PATH, "utf-8");
  const allWods = JSON.parse(jsonData);

  // Filter for the new benchmark WODs
  const newWods = allWods.filter((wod: any) =>
    NEW_BENCHMARK_WOD_NAMES.includes(wod.wodName),
  );

  if (newWods.length === 0) {
    console.log("No new benchmark WODs found in wods.json.");
    process.exit(0);
  }

  // Prepare for DB insertion
  const wodsToInsert = newWods.map(mapWodJsonToDb);

  // Insert with onConflictDoNothing to avoid duplicates
  try {
    await db
      .insert(schema.wods)
      .values(wodsToInsert)
      .onConflictDoNothing()
      .execute();
    console.log(
      `Attempted to insert ${wodsToInsert.length} new benchmark WODs to Turso prod.`,
    );
    console.log("Done.");
  } catch (error) {
    console.error("Error inserting new benchmark WODs:", error);
    process.exit(1);
  }
}

main();
