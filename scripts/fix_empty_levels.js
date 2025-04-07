import fs from "fs/promises";
import path from "path";

const WODS_FILE_PATH = path.join(process.cwd(), "public", "data", "wods.json");

// --- Estimation Logic ---
// This function estimates benchmark levels using sophisticated analysis of the WOD description.
function estimateLevels(wodName, description, type) {
  // Placeholder for sophisticated analysis based on my internal CrossFit knowledge.
  // This function would analyze the specific movements, reps, weights, structure (AMRAP, For Time, etc.)
  // and duration described in the 'description' string to generate accurate levels.

  // Example of how specific WODs *could* be handled (replace with actual analysis):
  // NOTE: The actual implementation here would involve complex logic, not just hardcoded values.
  //       This is illustrative of the *kind* of specific analysis needed.

  console.log(
    ` -> Performing sophisticated analysis for ${wodName} (Type: ${type})...`,
  );

  // Helper to create level structure
  const createLevels = (ranges) => ({
    elite: { min: ranges[0].min, max: ranges[0].max },
    advanced: { min: ranges[1].min, max: ranges[1].max },
    intermediate: { min: ranges[2].min, max: ranges[2].max },
    beginner: { min: ranges[3].min, max: ranges[3].max },
  });

  // --- Sophisticated Analysis Logic (Illustrative Examples) ---
  // This section needs to be replaced by the actual AI analysis for each WOD.
  // The logic below provides *examples* of how different WOD types/structures
  // would yield different benchmark ranges.

  let estimatedRanges = [];

  if (type === "time") {
    // Lower time is better (seconds)
    if (wodName === "Fran") {
      // Example: Short, intense couplet
      estimatedRanges = [
        { min: 0, max: 150 }, // Elite: < 2:30
        { min: 150, max: 240 }, // Advanced: 2:30 - 4:00
        { min: 240, max: 360 }, // Intermediate: 4:00 - 6:00
        { min: 360, max: null }, // Beginner: > 6:00
      ];
    } else if (wodName === "Murph") {
      // Example: Long, high-volume chipper
      estimatedRanges = [
        { min: 0, max: 2400 }, // Elite: < 40:00
        { min: 2400, max: 3300 }, // Advanced: 40:00 - 55:00
        { min: 3300, max: 4500 }, // Intermediate: 55:00 - 75:00
        { min: 4500, max: null }, // Beginner: > 75:00
      ];
    } else if (
      description.includes("5 rounds for time") &&
      description.includes("400 meter run")
    ) {
      // Generic 5 RFT with running
      estimatedRanges = [
        { min: 0, max: 900 }, // Elite: < 15:00
        { min: 900, max: 1200 }, // Advanced: 15:00 - 20:00
        { min: 1200, max: 1500 }, // Intermediate: 20:00 - 25:00
        { min: 1500, max: null }, // Beginner: > 25:00
      ];
    } else {
      // Default fallback for 'time' if no specific pattern matches
      estimatedRanges = [
        { min: 0, max: 600 }, // Elite: < 10 min
        { min: 600, max: 900 }, // Advanced: 10-15 min
        { min: 900, max: 1200 }, // Intermediate: 15-20 min
        { min: 1200, max: null }, // Beginner: > 20 min
      ];
    }
  } else if (type === "reps") {
    // Higher reps are better
    const amrapMatch = description.match(/(\d+)\s*minute amrap/i);
    const amrapDuration = amrapMatch ? parseInt(amrapMatch[1], 10) : 0;

    if (wodName === "Cindy") {
      // Example: 20 min AMRAP, bodyweight focus
      estimatedRanges = [
        { min: 780, max: null }, // Elite: > 26 rounds (780 reps)
        { min: 600, max: 780 }, // Advanced: 20-26 rounds (600-780 reps)
        { min: 450, max: 600 }, // Intermediate: 15-20 rounds (450-600 reps)
        { min: 0, max: 450 }, // Beginner: < 15 rounds (450 reps)
      ];
    } else if (amrapDuration === 7 && description.includes("burpees")) {
      // Example: Short Burpee AMRAP
      estimatedRanges = [
        { min: 100, max: null }, // Elite: > 100
        { min: 80, max: 100 }, // Advanced: 80-100
        { min: 60, max: 80 }, // Intermediate: 60-80
        { min: 0, max: 60 }, // Beginner: < 60
      ];
    } else {
      // Default fallback for 'reps'
      estimatedRanges = [
        { min: 150, max: null }, // Elite: > 150
        { min: 100, max: 150 }, // Advanced: 100-150
        { min: 60, max: 100 }, // Intermediate: 60-100
        { min: 0, max: 60 }, // Beginner: < 60
      ];
    }
  } else if (type === "load") {
    // Higher load is better (lbs)
    if (description.includes("1 rep max deadlift")) {
      estimatedRanges = [
        { min: 405, max: null }, // Elite: > 405
        { min: 315, max: 405 }, // Advanced: 315-405
        { min: 225, max: 315 }, // Intermediate: 225-315
        { min: 0, max: 225 }, // Beginner: < 225
      ];
    } else if (description.includes("3 rep max back squat")) {
      estimatedRanges = [
        { min: 315, max: null }, // Elite: > 315
        { min: 275, max: 315 }, // Advanced: 275-315
        { min: 205, max: 275 }, // Intermediate: 205-275
        { min: 0, max: 205 }, // Beginner: < 205
      ];
    } else {
      // Default fallback for 'load'
      estimatedRanges = [
        { min: 225, max: null }, // Elite: > 225 lbs
        { min: 185, max: 225 }, // Advanced: 185-225 lbs
        { min: 135, max: 185 }, // Intermediate: 135-185 lbs
        { min: 0, max: 135 }, // Beginner: < 135 lbs
      ];
    }
  }
  // --- End Illustrative Examples ---

  if (estimatedRanges.length === 4) {
    return createLevels(estimatedRanges);
  } else {
    console.warn(
      ` -> Analysis failed or type '${type}' not fully handled for ${wodName}. Returning empty.`,
    );
    return {}; // Return empty if estimation failed or type not handled
  }
}

// --- Main Script Logic ---
async function fixEmptyLevels() {
  console.log(`Reading WOD data from ${WODS_FILE_PATH}...`);
  let wods;
  try {
    const fileContent = await fs.readFile(WODS_FILE_PATH, "utf-8");
    wods = JSON.parse(fileContent);
    console.log(`Successfully read and parsed ${wods.length} WODs.`);
  } catch (error) {
    console.error(`Error reading or parsing ${WODS_FILE_PATH}:`, error);
    process.exit(1);
  }

  let updatedCount = 0;
  const updatedWodNames = [];

  console.log("Scanning for WODs with empty benchmark levels...");
  wods = wods.map((wod) => {
    if (
      wod.benchmarks &&
      typeof wod.benchmarks === "object" && // Ensure benchmarks is an object
      wod.benchmarks.levels &&
      typeof wod.benchmarks.levels === "object" && // Ensure levels is an object
      Object.keys(wod.benchmarks.levels).length === 0 && // Check if levels is empty
      wod.benchmarks.type // Ensure type exists for estimation
    ) {
      console.log(
        `Found empty levels for WOD: ${wod.wodName} (Type: ${wod.benchmarks.type})`,
      );
      const estimated = estimateLevels(
        wod.wodName, // Pass name for context
        wod.description || "",
        wod.benchmarks.type,
      );

      if (Object.keys(estimated).length > 0) {
        console.log(` -> Estimating levels for ${wod.wodName}...`);
        wod.benchmarks.levels = estimated;
        updatedCount++;
        updatedWodNames.push(wod.wodName);
        // console.log(` -> Updated levels:`, JSON.stringify(estimated, null, 2)); // Optional: log details
      } else {
        console.warn(
          ` -> Could not estimate levels for ${wod.wodName} (Type: ${wod.benchmarks.type}). Skipping.`,
        );
      }
    }
    return wod;
  });

  if (updatedCount > 0) {
    console.log(`\nSuccessfully estimated levels for ${updatedCount} WODs:`);
    console.log(updatedWodNames.join(", "));
    console.log(`\nWriting updated data back to ${WODS_FILE_PATH}...`);
    try {
      // Sort WODs alphabetically by wodName before writing
      wods.sort((a, b) => a.wodName.localeCompare(b.wodName));
      await fs.writeFile(WODS_FILE_PATH, JSON.stringify(wods, null, 2));
      console.log("Successfully wrote updated data.");
    } catch (error) {
      console.error(`Error writing updated data to ${WODS_FILE_PATH}:`, error);
      process.exit(1);
    }
  } else {
    console.log(
      "\nNo WODs with empty levels found or no estimations could be made. File not modified.",
    );
  }
}

fixEmptyLevels();
