import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../src/server/db/schema.js";
import { isNull } from "drizzle-orm";
import dotenv from "dotenv";
import chalk from "chalk";

dotenv.config({ path: ".env" });

let db;
try {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }
  const client = createClient({ url: DATABASE_URL });
  db = drizzle(client, { schema });
  console.log(
    "Database connection established. Connecting to DB:",
    DATABASE_URL,
  );
} catch (error) {
  console.error("Failed to connect to the database:", error);
  process.exit(1);
}

async function fixNullTimecaps() {
  console.log(chalk.yellow("Starting to fix null timecaps..."));

  // Count WODs with null timecap before update
  const wodsWithNullTimecap = await db.query.wods.findMany({
    where: isNull(schema.wods.timecap),
    columns: { id: true },
  });

  const nullCount = wodsWithNullTimecap.length;
  console.log(chalk.blue(`Found ${nullCount} WOD(s) with null timecap.`));

  if (nullCount === 0) {
    console.log(
      chalk.green("No WODs with null timecap found. No update needed."),
    );
    return;
  }

  // Perform the update
  await db
    .update(schema.wods)
    .set({ timecap: 0 })
    .where(isNull(schema.wods.timecap));

  // Confirm update
  const afterUpdate = await db.query.wods.findMany({
    where: isNull(schema.wods.timecap),
    columns: { id: true },
  });
  const afterCount = afterUpdate.length;

  console.log(
    chalk.green(`Updated ${nullCount} WOD(s) with null timecap to 0.`),
  );
  if (afterCount > 0) {
    console.log(
      chalk.red(
        `Warning: ${afterCount} WOD(s) still have null timecap after update.`,
      ),
    );
  } else {
    console.log(chalk.green("All WODs now have non-null timecap."));
  }
}

fixNullTimecaps().catch((err) => {
  console.error(chalk.red("Error updating WODs:"), err);
  process.exit(1);
});
