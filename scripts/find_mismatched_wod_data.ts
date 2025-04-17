import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../src/server/db/schema.js";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";
import chalk from "chalk";
import type { Benchmarks } from "../src/types/wodTypes"; // Import Benchmarks type

dotenv.config({ path: ".env" });

const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;

if (!TURSO_AUTH_TOKEN) {
  throw new Error("TURSO_AUTH_TOKEN environment variable is not set.");
}
if (!TURSO_DATABASE_URL) {
  throw new Error("TURSO_DATABASE_URL environment variable is not set.");
}

const client = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

const db = drizzle(client, { schema });

// Helper to safely parse JSON
function safeParseJson<T>(jsonString: string | null | undefined): T | null {
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    console.error(chalk.red("JSON parsing error:"), e);
    return null;
  }
}

async function findMismatchedWods() {
  console.log(
    chalk.blue(
      "Querying database for WODs tagged 'For Time' or with benchmark type 'time'...",
    ),
  );

  try {
    const allWods = await db.query.wods.findMany({
      columns: {
        id: true,
        wodName: true,
        description: true,
        tags: true,
        benchmarks: true, // Fetch benchmarks
      },
    });

    console.log(chalk.green(`Found ${allWods.length} total WODs.`));

    const potentiallyMismatchedWods = [];

    for (const wod of allWods) {
      const currentTags = wod.tags || [];

      // Handle potential pre-parsing by Drizzle due to $type hint
      let benchmarksData: Benchmarks | null = null;
      if (typeof wod.benchmarks === "string") {
        benchmarksData = safeParseJson<Benchmarks>(wod.benchmarks);
      } else if (wod.benchmarks && typeof wod.benchmarks === "object") {
        // Assume it's already parsed (or null)
        benchmarksData = wod.benchmarks as Benchmarks | null;
      }

      const currentBenchmarkType = benchmarksData?.type;
      const description = wod.description?.toLowerCase() || "";

      // Check if tagged 'For Time' OR benchmark type is 'time'
      if (currentTags.includes("For Time") || currentBenchmarkType === "time") {
        let suggestedTag = null;
        let suggestedBenchmarkType: Benchmarks["type"] | null = null;
        let needsCorrection = false;

        // Check description for AMRAP/EMOM keywords
        if (
          description.includes("amrap") ||
          description.includes("as many rounds as possible") ||
          description.includes("as many reps as possible")
        ) {
          suggestedTag = "AMRAP";
          // Default AMRAP benchmark type to 'rounds'
          suggestedBenchmarkType = "rounds";
          if (
            !currentTags.includes("AMRAP") ||
            currentBenchmarkType !== "rounds"
          ) {
            needsCorrection = true;
          }
          // Remove 'For Time' if present
          if (currentTags.includes("For Time")) {
            needsCorrection = true;
          }
        } else if (
          description.includes("emom") ||
          description.includes("every minute on the minute")
        ) {
          suggestedTag = "EMOM";
          // Default EMOM benchmark type to 'rounds' (as no 'emom' type exists)
          // This might need manual review later
          suggestedBenchmarkType = "rounds";
          if (
            !currentTags.includes("EMOM") ||
            currentBenchmarkType !== "rounds"
          ) {
            needsCorrection = true;
          }
          // Remove 'For Time' if present
          if (currentTags.includes("For Time")) {
            needsCorrection = true;
          }
        }

        if (needsCorrection && suggestedTag && suggestedBenchmarkType) {
          potentiallyMismatchedWods.push({
            id: wod.id,
            name: wod.wodName,
            currentTags: wod.tags,
            suggestedTag: suggestedTag,
            currentBenchmarkType: currentBenchmarkType ?? "null",
            suggestedBenchmarkType: suggestedBenchmarkType,
          });
        }
      }
    }

    if (potentiallyMismatchedWods.length > 0) {
      console.log(
        chalk.yellow(
          `\nFound ${potentiallyMismatchedWods.length} potentially mismatched WODs (Tags or Benchmark Type):`,
        ),
      );
      potentiallyMismatchedWods.forEach((wod) => {
        console.log(`----------------------------------------`);
        console.log(chalk.white(`Name: ${wod.name}`));
        console.log(chalk.white(`ID: ${wod.id}`));
        console.log(
          chalk.white(`Current Tags: ${JSON.stringify(wod.currentTags)}`),
        );
        console.log(chalk.yellow(`Suggested Tag: ${wod.suggestedTag}`));
        console.log(
          chalk.white(`Current Benchmark Type: ${wod.currentBenchmarkType}`),
        );
        console.log(
          chalk.yellow(
            `Suggested Benchmark Type: ${wod.suggestedBenchmarkType}`,
          ),
        );
      });
      console.log(`----------------------------------------`);
      console.log(
        chalk.cyan(
          "\nPlease review the list above. If you agree, the next step is to run a script to update these tags and benchmark types.",
        ),
      );
    } else {
      console.log(
        chalk.green(
          "No WODs found with 'For Time' tag or 'time' benchmark type whose descriptions suggest AMRAP or EMOM.",
        ),
      );
    }
  } catch (error) {
    console.error(chalk.red("Error querying or processing WODs:"), error);
  }
}

findMismatchedWods();
