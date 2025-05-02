import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq, isNotNull } from "drizzle-orm";
import { wods } from "../src/server/db/schema";
import type { WodJson } from "../src/types/wodJsonTypes"; // Assuming WodJson type is correctly defined here

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL environment variable is not set.");
  process.exit(1);
}

const JSON_FILE_PATH = path.join(process.cwd(), "public/data/wods.json");

async function addTimecapsToJson() {
  console.log("Starting script to add timecaps from DB to wods.json...");

  let db;
  try {
    // Setup database connection
    const client = createClient({ url: process.env.DATABASE_URL });
    db = drizzle(client);
    console.log("Database connection established.");
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
  }

  let dbWodsWithTimecaps: { name: string; timecap: number }[] = [];
  try {
    // Fetch WODs with non-null timecaps from the database
    dbWodsWithTimecaps = await db
      .select({
        name: wods.wodName, // Corrected column name
        timecap: wods.timecap,
      })
      .from(wods)
      .where(isNotNull(wods.timecap)); // Filter for non-null timecaps

    // Filter out any potential nulls just in case (though isNotNull should handle this)
    // and ensure timecap is treated as number
    dbWodsWithTimecaps = dbWodsWithTimecaps
      .filter((wod) => wod.timecap !== null)
      .map((wod) => ({
        name: wod.name,
        timecap: wod.timecap as number, // Cast as number after filtering nulls
      }));

    console.log(
      `Fetched ${dbWodsWithTimecaps.length} WODs with timecaps from the database.`,
    );
  } catch (error) {
    console.error("Failed to fetch WODs from the database:", error);
    process.exit(1);
  }

  // Create a map for efficient lookup
  const timecapMap = new Map<string, number>();
  dbWodsWithTimecaps.forEach((wod) => {
    timecapMap.set(wod.name, wod.timecap);
  });

  let jsonData: WodJson[] = [];
  try {
    // Read the existing JSON file
    console.log(`Reading JSON file from: ${JSON_FILE_PATH}`);
    const fileContent = await fs.readFile(JSON_FILE_PATH, "utf-8");
    jsonData = JSON.parse(fileContent);
    console.log(
      `Successfully read and parsed ${jsonData.length} WODs from JSON file.`,
    );
  } catch (error) {
    console.error(
      `Failed to read or parse JSON file at ${JSON_FILE_PATH}:`,
      error,
    );
    process.exit(1);
  }

  let updatedCount = 0;
  try {
    // Iterate through the JSON data and update timecaps
    jsonData.forEach((wod) => {
      if (timecapMap.has(wod.wodName)) {
        const dbTimecap = timecapMap.get(wod.wodName);
        // Only update if the timecap is different or doesn't exist
        if (wod.timecap !== dbTimecap) {
          wod.timecap = dbTimecap;
          updatedCount++;
        }
      }
      // Optional: Remove timecap if it exists in JSON but not in DB map (meaning DB timecap is null)
      // else if (wod.timecap !== undefined && wod.timecap !== null) {
      //   wod.timecap = null; // Or delete wod.timecap;
      //   updatedCount++; // Count this as an update too if desired
      // }
    });

    console.log(
      `Updated timecap field for ${updatedCount} WODs in the JSON data.`,
    );
  } catch (error) {
    console.error("Error occurred while updating JSON data:", error);
    process.exit(1);
  }

  try {
    // Write the updated JSON data back to the file
    console.log(`Writing updated JSON data back to: ${JSON_FILE_PATH}`);
    const updatedJsonString = JSON.stringify(jsonData, null, 2); // Pretty print with 2 spaces
    await fs.writeFile(JSON_FILE_PATH, updatedJsonString, "utf-8");
    console.log("Successfully wrote updated JSON data to file.");
  } catch (error) {
    console.error(
      `Failed to write updated JSON file to ${JSON_FILE_PATH}:`,
      error,
    );
    process.exit(1);
  }

  console.log("Script finished successfully.");
}

addTimecapsToJson().catch((error) => {
  console.error("An unexpected error occurred:", error);
  process.exit(1);
});
