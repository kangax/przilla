import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq, and } from "drizzle-orm";
import { wods, movements, wodMovements } from "../src/server/db/schema";

// Polyfill __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WODS_WITH_MOVEMENTS_PATH = path.join(
  __dirname,
  "../public/data/wods.json",
);

// --- MAIN ---
async function main() {
  // 1. Read WODs with movements
  const wodsWithMovements: {
    wodName: string;
    movements: string[];
  }[] = JSON.parse(fs.readFileSync(WODS_WITH_MOVEMENTS_PATH, "utf8"));

  // 2. Open DB
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }
  const client = createClient({
    url: dbUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const db = drizzle(client);

  // 3. Build movement name -> id map (deduplication)
  const movementNameToId: Record<string, string> = {};
  const insertedMovements: string[] = [];

  console.log("Starting movement insertion phase..."); // Added progress log

  // 4. Insert all unique movements
  for (const wod of wodsWithMovements) {
    for (const movement of wod.movements) {
      if (!movementNameToId[movement]) {
        // Check if movement already exists
        const existing = await db
          .select()
          .from(movements)
          .where(eq(movements.name, movement))
          .get();
        if (existing) {
          console.log(`Movement already exists: ${movement}`); // Log if movement exists
          movementNameToId[movement] = existing.id;
        } else {
          // Insert new movement
          console.log(`Inserting new movement: ${movement}`); // Log before insert attempt
          const [inserted] = await db
            .insert(movements)
            .values({ name: movement })
            .returning();
          movementNameToId[movement] = inserted.id;
          insertedMovements.push(movement);
        }
      }
    }
  }
  console.log(
    `Inserted ${insertedMovements.length} new movements. Total unique movements: ${
      Object.keys(movementNameToId).length
    }`,
  );

  console.log("Starting WOD-Movement association phase..."); // Added progress log

  // 5. For each WOD, associate movements
  let associations = 0;
  let missingWods = 0;

  console.log(wodsWithMovements);

  let dbWod;

  for (const wod of wodsWithMovements) {
    // Find WOD in DB by name
    try {
      dbWod = await db
        .select()
        .from(wods)
        .where(eq(wods.wodName, wod.wodName))
        .get();

      if (!dbWod) {
        console.warn(`WOD not found in DB: ${wod.wodName}`);
        missingWods++;
        continue;
      }

      // *** ADDED LOGGING ***
      console.log(`Processing WOD: ${wod.wodName} (Prod DB ID: ${dbWod.id})`);
      // *** END ADDED LOGGING ***
    } catch (error) {
      console.error(
        `Error fetching WOD from DB: ${wod.wodName}. Error: ${error}`,
      );
      continue;
    }

    for (const movement of wod.movements) {
      const movementId = movementNameToId[movement];

      // *** ADDED LOGGING ***
      console.log(
        `  -> Trying movement: ${movement} (Mapped Prod DB ID: ${movementId})`,
      );
      // *** END ADDED LOGGING ***

      if (!movementId) {
        // *** ADDED LOGGING ***
        console.warn(
          `     -> Skipping movement "${movement}" as its ID was not found in the map.`,
        );
        // *** END ADDED LOGGING ***
        continue;
      }

      // Check if association already exists
      // *** ADDED LOGGING ***
      console.log(
        `     -> Checking existing association: WodID=${dbWod.id}, MovementID=${movementId}`,
      );
      // *** END ADDED LOGGING ***

      const existing = await db
        .select()
        .from(wodMovements)
        .where(
          and(
            eq(wodMovements.wodId, dbWod.id),
            eq(wodMovements.movementId, movementId),
          ),
        )
        .get();

      if (!existing) {
        // *** ADDED LOGGING ***
        console.log(
          `     -> Association not found. Inserting: WodID=${dbWod.id}, MovementID=${movementId}`,
        );
        // *** END ADDED LOGGING ***
        await db
          .insert(wodMovements)
          .values({ wodId: dbWod.id, movementId })
          .run();
        associations++;
      } else {
        // *** ADDED LOGGING ***
        console.log(`     -> Association already exists. Skipping insert.`);
        // *** END ADDED LOGGING ***
      }
    }
  }
  console.log(
    `Associated movements with WODs. Associations created: ${associations}. WODs missing in DB: ${missingWods}`,
  );
  await client.close();
}

main().catch((err) => {
  console.error("Error populating movements:", err);
  process.exit(1);
});
