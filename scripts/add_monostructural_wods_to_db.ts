import dotenv from "dotenv";
dotenv.config();

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import * as schema from "../src/server/db/schema";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const ALLOWED_TAGS = [
  "Chipper",
  "Couplet",
  "Triplet",
  "EMOM",
  "AMRAP",
  "For Time",
  "Ladder",
];

// --- Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NEW_WODS_PATH = path.join(__dirname, "new_monostructural_wods.json");

function normalizeTags(tags: any): string[] {
  if (!Array.isArray(tags)) return ["For Time"];
  const filtered = tags.filter((tag) => ALLOWED_TAGS.includes(tag));
  return filtered.length > 0 ? filtered : ["For Time"];
}

function mapWodJsonToDb(wod: any) {
  return {
    wodUrl: wod.wodUrl === "" ? null : wod.wodUrl,
    wodName: wod.wodName,
    description: wod.description,
    benchmarks: wod.benchmarks ? JSON.stringify(wod.benchmarks) : null,
    category: wod.category,
    tags: wod.tags
      ? JSON.stringify(normalizeTags(wod.tags))
      : JSON.stringify(["For Time"]),
    difficulty: wod.difficulty,
    difficultyExplanation:
      wod.difficultyExplanation || wod.difficulty_explanation || null,
    timecap: null,
    countLikes: wod.countLikes ?? wod.count_likes ?? 0,
  };
}

// Only use canonical wodName for deduplication
function getAllNames(wods: any[]): Set<string> {
  const names = new Set<string>();
  for (const wod of wods) {
    if (wod.wodName) names.add(wod.wodName.trim().toLowerCase());
  }
  return names;
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

  // Read and parse new monostructural WODs
  const newWodsData = await fs.readFile(NEW_WODS_PATH, "utf-8");
  const newWodsRaw = JSON.parse(newWodsData);

  // Fetch all existing WODs from DB to deduplicate
  const existingWods = await db.select().from(schema.wods);
  const existingNames = getAllNames(existingWods);

  // Prepare new WODs: filter tags, deduplicate
  const newWods = [];
  for (const wod of newWodsRaw) {
    const name = wod.wodName?.trim().toLowerCase();
    const isDuplicate = existingNames.has(name);
    if (isDuplicate) {
      console.log(`Skipping duplicate: ${wod.wodName}`);
      continue;
    }
    // Normalize tags for DB
    wod.tags = normalizeTags(wod.tags);
    newWods.push(mapWodJsonToDb(wod));
  }

  if (newWods.length === 0) {
    console.log("No new monostructural WODs to insert.");
    process.exit(0);
  }

  // Insert with onConflictDoNothing to avoid duplicates
  try {
    await db
      .insert(schema.wods)
      .values(newWods)
      .onConflictDoNothing()
      .execute();
    console.log(
      `Attempted to insert ${newWods.length} new monostructural WODs to Turso prod.`,
    );
    console.log("Done.");
  } catch (error) {
    console.error("Error inserting new monostructural WODs:", error);
    process.exit(1);
  }
}

main();
