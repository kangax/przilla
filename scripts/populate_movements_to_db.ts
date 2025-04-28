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
  "../public/data/wods_with_movements.json",
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
  const client = createClient({ url: dbUrl });
  const db = drizzle(client);

  // 3. Build movement name -> id map (deduplication)
  const movementNameToId: Record<string, string> = {};
  const insertedMovements: string[] = [];

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
          movementNameToId[movement] = existing.id;
        } else {
          // Insert new movement
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

  // 5. For each WOD, associate movements
  let associations = 0;
  let missingWods = 0;
  for (const wod of wodsWithMovements) {
    // Find WOD in DB by name
    const dbWod = await db
      .select()
      .from(wods)
      .where(eq(wods.wodName, wod.wodName))
      .get();
    if (!dbWod) {
      console.warn(`WOD not found in DB: ${wod.wodName}`);
      missingWods++;
      continue;
    }
    for (const movement of wod.movements) {
      const movementId = movementNameToId[movement];
      if (!movementId) continue;
      // Check if association already exists
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
        await db
          .insert(wodMovements)
          .values({ wodId: dbWod.id, movementId })
          .run();
        associations++;
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
