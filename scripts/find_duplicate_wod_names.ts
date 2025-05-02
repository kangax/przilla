import fs from "fs/promises";
import path from "path";
import type { WodJson } from "../src/types/wodJsonTypes"; // Import the canonical type

const JSON_FILE_PATH = path.join(process.cwd(), "public/data/wods.json");

async function findDuplicateWodNames() {
  console.log(
    "Starting script to find duplicate wodName entries in wods.json...",
  );

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

  const wodNameCounts = new Map<string, number>();
  let totalWodsProcessed = 0;

  try {
    // Iterate through the JSON data and count wodName occurrences
    jsonData.forEach((wod) => {
      if (wod.wodName) {
        const count = wodNameCounts.get(wod.wodName) || 0;
        wodNameCounts.set(wod.wodName, count + 1);
      }
      totalWodsProcessed++;
    });
    console.log(`Processed ${totalWodsProcessed} WOD entries.`);

    // Find duplicates
    const duplicates: { name: string; count: number }[] = [];
    wodNameCounts.forEach((count, name) => {
      if (count > 1) {
        duplicates.push({ name, count });
      }
    });

    if (duplicates.length > 0) {
      console.log(`\nFound ${duplicates.length} duplicate wodName(s):`);
      duplicates.forEach((dup) => {
        console.log(`- "${dup.name}" appears ${dup.count} times.`);
      });
      // Calculate total number of duplicated entries (sum of counts for duplicates)
      const totalDuplicateEntries = duplicates.reduce(
        (sum, dup) => sum + dup.count,
        0,
      );
      console.log(
        `\nTotal number of entries involved in duplicates: ${totalDuplicateEntries}`,
      );
    } else {
      console.log("\nNo duplicate wodName entries found.");
    }
  } catch (error) {
    console.error("Error occurred while processing JSON data:", error);
    process.exit(1);
  }

  console.log("\nScript finished successfully.");
}

findDuplicateWodNames().catch((error) => {
  console.error("An unexpected error occurred:", error);
  process.exit(1);
});
