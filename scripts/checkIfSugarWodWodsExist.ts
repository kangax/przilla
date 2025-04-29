// scripts/checkIfSugarWodWodsExist.ts

import * as fs from "fs";
import path, { dirname } from "path"; // Import dirname
import { fileURLToPath } from "url"; // Import fileURLToPath

// Define the structure expected in the JSON file
interface WodEntry {
  wodName: string;
  // Allow other properties if they exist
  [key: string]: any;
}

// --- List of WOD names to check ---
const wodNamesToCheck: string[] = [
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
  "30 Muscle-Ups",
  "50 Wall Balls",
  "Bar Muscle-Ups: Max Reps",
  "Box Jump: Max Height",
  "Broad Jump: Max Distance",
  "Double Unders: 2 Minute Test",
  "Double-Unders: Max Reps",
  "Handstand Hold: Max Time",
  "Handstand Push-Ups: 2 min max reps",
  "Row 100m",
  "Row 150m",
  "Row 200m",
  "Row 250m",
  "Row 500m",
  "Row 750m",
  "Row 1000m",
  "Row 1500m",
  "Row 2000m",
  "Row 5000m",
  "Row 10000m",
  "Run 100m",
  "Run 200m",
  "Run 400m",
  "Run 800m",
  "Run 1600m",
  "Run 1 mile",
  "Run 5000m",
  "Run 10000m",
  "Ski 100m",
  "Ski 250m",
  "Ski 500m",
  "Ski 750m",
  "Ski 1000m",
  "Ski 2000m",
  "Ski 5000m",
  "Ski 10000m",
  "AGOQ 17.1",
  "AGOQ 17.2",
  "AGOQ 17.3",
  "AGOQ 17.4",
  "AGOQ 18.1",
  "AGOQ 18.2",
  "AGOQ 18.3",
  "AGOQ 18.4",
  "AGOQ 19.1",
  "AGOQ 19.2",
  "AGOQ 19.3",
  "AGOQ 19.4",
  "AGOQ 19.5",
  "AGOQ 21.1",
  "AGOQ 21.2",
  "AGOQ 21.3",
  "AGOQ 21.4",
  "AGOQ 21.5",
  "AGOQ 22.1",
  "AGOQ 22.2",
  "AGOQ 22.3",
  "AGOQ 22.4",
  "AGOQ 22.5",
  "AGOQ 23.1",
  "AGOQ 23.2A",
  "AGOQ 23.2B",
  "AGOQ 23.3",
  "AGOQ 23.4",
  "AGOQ 24.1",
  "AGOQ 24.2",
  "Games: Marathon Row",
  "Games: Nasty Nancy",
  "Games: Ranch Loop",
  "Games: Ringer 1 & Ringer 2",
  "Games: Ruck",
  "Games: Run Swim Run",
  "Games: Second Cut",
  "Games: Snatch Speed Triple",
  "Games: Sprint Couplet",
  "Games: Sprint Sled Sprint",
  "Games: Sprint Triplet",
  "Games: Swim 'N' Stuff",
  "Games: Swim Paddle",
  "Games: The Standard",
  "Games: Toes-to-bar/Lunge",
  "Games: Triple-G Chipper",
  "Amanda .45",
  "Fibonacci Final",
  "Games: 2007 RELOAD",
  "Games: Atalanta",
  "Games: Awful Annie",
  "Games: Bike Repeater",
  "Games: Complex Fran",
  "Games: Corn Sack Sprint",
  "Games: Damn Diane",
  "Games: Doubles and Oly",
  "Games: First Cut",
  "Games: Friendly Fran",
  "Games: Handstand Hold",
  "Games: Handstand Sprint",
  "Games: Happy Star",
  "Regional 16.1",
  "Regional 16.2 (Regional Nate)",
  "Regional 16.3",
  "Regional 16.4",
  "Regional 16.5",
  "Regional 16.6",
  "Regional 16.7",
  "Regional 17.1",
  "Regional 17.2",
  "Regional 17.3",
  "Regional 17.4",
  "Regional 17.5",
  "Regional 17.6",
  "Regional 18.3",
  "Regional 18.4",
  "Regional 18.5",
  "Regional 18.6",
  "Regional Individual 11.1",
  "Regional Individual 11.2",
  "Regional Individual 11.3",
  "Regional Individual 11.4",
  "Regional Individual 11.5",
  "Regional Individual 11.6",
  "Regional Individual 12.1",
  "Regional Individual 12.2",
  "Regional Individual 12.3",
  "Regional Individual 12.4",
  "Regional Individual 12.5",
  "Regional Individual 12.6",
  "Regional Individual 14.1",
  "Regional Individual 14.2",
  "Regional Individual 14.3",
  "Regional Individual 14.4",
  "Regional Individual 14.5",
  "Regional Individual 14.6",
  "Regional Individual 14.7",
  "Regional Individual 15.1",
  "Regional Individual 15.2",
  "Regional Individual 15.3",
  "Regional Individual 15.4",
  "Regional Individual 15.5",
  "Regional Individual 15.6",
  "Regional Individual 15.7",
  "Regional: Linda",
  "Regional: Triple 3",
  "Individual 15.5: Heavy DT",
  "Individual 16.7: Double DT",
  "Individual 16.9: The Seperator",
  "Masters Event 16.1",
  "Midline March",
];
// --- End of WOD list ---

// Get the directory name in an ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to your JSON file.
const jsonFilePath = path.resolve(__dirname, "../public/data/wods.json");

function checkWods() {
  let existingWods: WodEntry[] = [];
  let existingWodNamesSet = new Set<string>();

  // 1. Read and parse the existing wods.json file
  try {
    if (fs.existsSync(jsonFilePath)) {
      const fileContent = fs.readFileSync(jsonFilePath, "utf-8");
      const parsedData = JSON.parse(fileContent);

      // Basic validation
      if (!Array.isArray(parsedData)) {
        throw new Error(
          `File at ${jsonFilePath} does not contain a valid JSON array.`,
        );
      }
      // Further check if elements have the wodName property (optional but good)
      if (parsedData.length > 0 && typeof parsedData[0]?.wodName !== "string") {
        console.warn(
          `Warning: Some objects in ${jsonFilePath} might be missing the "wodName" string property.`,
        );
      }

      // Filter only valid entries with a wodName string property
      existingWods = parsedData.filter(
        (item) => typeof item?.wodName === "string",
      );
    } else {
      console.warn(
        `Warning: ${jsonFilePath} not found. Assuming no existing WODs.`,
      );
      // Keep existingWods as an empty array
    }
  } catch (error: any) {
    console.error(`Error reading or parsing ${jsonFilePath}:`, error.message);
    // Decide if you want to exit or continue assuming an empty list
    // process.exit(1); // Uncomment to exit on error
    console.warn("Proceeding assuming no existing WODs due to error.");
    existingWods = []; // Ensure it's an empty array on error
  }

  // 2. Create a Set for efficient lookup of existing WOD names
  existingWodNamesSet = new Set<string>(existingWods.map((wod) => wod.wodName));

  // 3. Check each WOD name from the input list
  const foundWods: string[] = [];
  const notFoundWods: string[] = [];

  // Use a Set for the input list as well to handle potential duplicates in the input
  const uniqueWodsToCheck = new Set<string>(wodNamesToCheck);

  uniqueWodsToCheck.forEach((wodName) => {
    if (existingWodNamesSet.has(wodName)) {
      foundWods.push(wodName);
    } else {
      notFoundWods.push(wodName);
    }
  });

  // 4. Report the results
  console.log("\n--- WOD Check Results ---");
  console.log(
    `Checked ${uniqueWodsToCheck.size} unique WOD names against ${jsonFilePath} (containing ${existingWodNamesSet.size} WODs).`,
  );

  if (foundWods.length > 0) {
    console.log(
      `\n[FOUND] ${foundWods.length} WODs already in ${jsonFilePath}:`,
    );
    foundWods.sort().forEach((name) => console.log(` - ${name}`)); // Sorted output
  } else {
    console.log(
      `\n[INFO] No WODs from the input list were found in ${jsonFilePath}.`,
    );
  }

  if (notFoundWods.length > 0) {
    console.log(
      `\n[NOT FOUND] ${notFoundWods.length} WODs from the input list are NOT in ${jsonFilePath}:`,
    );
    notFoundWods.sort().forEach((name) => console.log(` - ${name}`)); // Sorted output
  } else {
    console.log(
      `\n[INFO] All WODs from the input list were already present in ${jsonFilePath}.`,
    );
  }

  console.log("\n--- Check Complete ---");
}

// Run the check
checkWods();
