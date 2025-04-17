import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../src/server/db/schema.js";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";
import chalk from "chalk";
import type { Benchmarks } from "../src/types/wodTypes";

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

// List of WODs to update (copy from previous script output)
const wodsToUpdate = [
  {
    id: "7457cdd5-c204-462f-9d98-cd730ecdee03",
    suggestedTag: "EMOM",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "5aae337e-8290-478c-8613-3daff23c3679",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "f4408b07-8c16-4847-98c2-4dcf113982d9",
    suggestedTag: "EMOM",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "c4155f9e-9d29-484e-9f71-53dafc989a01",
    suggestedTag: "EMOM",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "1de2cc71-23cf-4ff4-a2b2-55d711c120ae",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "2f4e66e9-d95f-4ff9-96ce-184b31a988c8",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "c5e0fb99-fb24-4c63-b488-3e4119730749",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "b86ac53b-cbb9-4ced-bd41-f7ac4eab7c94",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "ee115a73-7a51-47aa-88e3-354d436db91b",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "bec35ae5-ce77-4dc0-9450-d7455987af49",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "9235ce40-2e87-4b49-8f64-6b328d68c89a",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "c1e076fa-7827-46f6-8aa5-9006fc23db36",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "e2de1b60-ed89-46a6-86dc-6019d1195f7d",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "4fcb05b5-9e00-4512-9229-3b8df000b406",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "87e35686-3088-4851-a6c8-053feb9ea5ca",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "2701a5cf-4e9b-45ff-8221-ac3b15b71952",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "f923eb7d-4462-4d3b-8ec0-95d189a37d46",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "5b345cb4-2bc3-47a8-a281-bda16d9332ff",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "960b8b63-b4cb-411e-b57d-c2dde86e73cb",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "d3e8d513-9c94-4179-8aad-48065bef3c78",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "7bb1f824-a163-47a2-9598-41b5b807bac0",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "3d03fd3b-50e2-4bff-99f5-c930692351cf",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "81c652eb-a41f-44bb-b25b-ea17e3648c3d",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "fa03208d-0c7b-4f15-ba73-ebec7272a7f6",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "fd46c212-983b-44df-b55c-49b14282fc29",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "84270060-75de-4b5c-99da-29a6ce1ce00b",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "e77dee31-fcfe-43a6-9bd1-0c9c6b68025f",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "01c1c454-35a1-4c33-ae3d-10741b84a249",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
  {
    id: "14c25d00-553c-4c13-8a81-a0c0bd04af8f",
    suggestedTag: "AMRAP",
    suggestedBenchmarkType: "rounds",
  },
];

function safeParseJson<T>(jsonString: string | null | undefined): T | null {
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    console.error(chalk.red("JSON parsing error:"), e);
    return null;
  }
}

async function updateWods() {
  console.log(chalk.blue(`Starting update for ${wodsToUpdate.length} WODs...`));
  let updatedCount = 0;
  let errorCount = 0;

  for (const wodInfo of wodsToUpdate) {
    try {
      const currentWod = await db.query.wods.findFirst({
        where: eq(schema.wods.id, wodInfo.id),
        columns: { tags: true, benchmarks: true, wodName: true },
      });

      if (!currentWod) {
        console.log(chalk.yellow(`WOD not found: (ID: ${wodInfo.id})`));
        continue;
      }

      // --- TAGS ---
      let currentTags: string[] = [];
      if (typeof currentWod.tags === "string") {
        try {
          currentTags = JSON.parse(currentWod.tags);
        } catch {
          currentTags = [];
        }
      } else if (Array.isArray(currentWod.tags)) {
        currentTags = currentWod.tags;
      }

      // Remove 'For Time'
      let newTags = currentTags.filter((tag) => tag !== "For Time");
      // Add suggested tag if not present
      if (!newTags.includes(wodInfo.suggestedTag)) {
        newTags.push(wodInfo.suggestedTag);
      }

      // --- BENCHMARKS ---
      let benchmarksData: Benchmarks | null = null;
      if (typeof currentWod.benchmarks === "string") {
        benchmarksData = safeParseJson<Benchmarks>(currentWod.benchmarks);
      } else if (
        currentWod.benchmarks &&
        typeof currentWod.benchmarks === "object"
      ) {
        benchmarksData = currentWod.benchmarks as Benchmarks | null;
      }
      if (benchmarksData) {
        benchmarksData.type =
          wodInfo.suggestedBenchmarkType as Benchmarks["type"];
      }

      // --- UPDATE ---
      await db
        .update(schema.wods)
        .set({
          // @ts-expect-error
          tags: JSON.stringify(newTags),
          benchmarks: benchmarksData ? JSON.stringify(benchmarksData) : null,
        })
        .where(eq(schema.wods.id, wodInfo.id));

      console.log(
        chalk.green(
          `Updated ${currentWod.wodName} (ID: ${wodInfo.id}) | Tags: ${JSON.stringify(currentTags)} -> ${JSON.stringify(newTags)} | Benchmarks.type: ${benchmarksData?.type}`,
        ),
      );
      updatedCount++;
    } catch (error) {
      console.error(
        chalk.red(`Error updating WOD (ID: ${wodInfo.id}):`),
        error,
      );
      errorCount++;
    }
  }

  console.log(chalk.blue("\nUpdate complete."));
  console.log(chalk.green(`Successfully updated: ${updatedCount}`));
  console.log(chalk.red(`Failed updates: ${errorCount}`));
}

updateWods();
