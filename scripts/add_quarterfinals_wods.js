import fs from "fs/promises";
import path from "path";

const ALLOWED_TAGS = [
  "Chipper",
  "Couplet",
  "Triplet",
  "EMOM",
  "AMRAP",
  "For Time",
  "Ladder",
];
const BENCHMARK_LEVELS = ["elite", "advanced", "intermediate", "beginner"];

// --- Estimation Functions (Leveraging AI Knowledge) ---

function inferTags(description) {
  const tags = new Set();
  const lowerDesc = description.toLowerCase();

  if (lowerDesc.includes("for time")) tags.add("For Time");
  if (
    lowerDesc.includes("amrap") ||
    lowerDesc.includes("as many rounds as possible") ||
    lowerDesc.includes("as many reps as possible")
  )
    tags.add("AMRAP");
  if (
    lowerDesc.includes("emom") ||
    lowerDesc.includes("every minute on the minute")
  )
    tags.add("EMOM");
  if (lowerDesc.includes("ladder")) tags.add("Ladder");
  // Chipper/Couplet/Triplet might need more complex analysis based on movement count,
  // but for Quarterfinals, the primary scoring type is usually more prominent.
  // We'll prioritize the main scoring tags for now.

  const inferred = [...tags].filter((tag) => ALLOWED_TAGS.includes(tag));
  // If no primary tag found, default to 'For Time' as a common fallback,
  // but Quarterfinals usually have explicit scoring. Review might be needed.
  return inferred.length > 0 ? inferred : ["For Time"];
}

function inferBenchmarkType(tags, description) {
  const lowerDesc = description.toLowerCase();
  if (tags.includes("AMRAP") || tags.includes("EMOM")) return "reps";
  if (tags.includes("For Time")) return "time";
  if (lowerDesc.includes("max lift") || lowerDesc.includes("max load"))
    return "load";
  // Default based on common Quarterfinals structure
  return "time";
}

// Placeholder for AI-driven benchmark level estimation
// In a real scenario, this would involve complex analysis based on movements,
// weights, reps, duration, etc. For this script, we'll return null levels.
// The previous scripts (apply_estimated_levels.js, fix_incorrect_type_levels.js)
// show a pattern where analysis was done beforehand and mapped.
// A more advanced implementation could call an external service or use a local model.
function estimateBenchmarkLevels(wodName, description, benchmarkType) {
  console.warn(
    `WARN: Benchmark levels estimation needed for: ${wodName}. Returning null.`,
  );
  // TODO: Implement actual estimation logic or use pre-analyzed data
  return null; // Requires manual review or more sophisticated estimation
}

// Placeholder for AI-driven difficulty estimation
function estimateDifficulty(wodName, description) {
  console.warn(
    `WARN: Difficulty estimation needed for: ${wodName}. Returning null.`,
  );
  // TODO: Implement actual estimation logic
  return null; // Requires manual review or more sophisticated estimation
}

// Placeholder for AI-driven difficulty explanation generation
function generateDifficultyExplanation(wodName, description, difficulty) {
  console.warn(
    `WARN: Difficulty explanation needed for: ${wodName}. Returning null.`,
  );
  // TODO: Implement actual explanation generation
  return null; // Requires manual review or more sophisticated estimation
}

// --- Main Script Logic ---

async function addQuarterfinalsWods() {
  const missingWodsPath = path.resolve("missing_quarterfinals_wods.json");
  const existingWodsPath = path.resolve("public/data/wods.json");
  let missingWods = [];
  let existingWods = [];

  console.log("Starting script: Add Quarterfinals WODs");

  // 1. Read missing WODs
  try {
    const missingData = await fs.readFile(missingWodsPath, "utf-8");
    missingWods = JSON.parse(missingData);
    console.log(
      `Read ${missingWods.length} missing Quarterfinals WODs from ${path.basename(missingWodsPath)}`,
    );
  } catch (error) {
    console.error(
      `Error reading missing WODs file (${missingWodsPath}):`,
      error,
    );
    process.exit(1);
  }

  // 2. Read existing WODs
  try {
    const existingData = await fs.readFile(existingWodsPath, "utf-8");
    existingWods = JSON.parse(existingData);
    console.log(
      `Read ${existingWods.length} existing WODs from ${path.basename(existingWodsPath)}`,
    );
  } catch (error) {
    console.error(
      `Error reading existing WODs file (${existingWodsPath}):`,
      error,
    );
    process.exit(1);
  }

  // 3. Transform and add new WODs
  const newWods = [];
  for (const sourceWod of missingWods) {
    // Use source 'title' for target 'wodName' and source 'workout' array for 'description'
    const description = Array.isArray(sourceWod.workout)
      ? sourceWod.workout.join("\n")
      : "";
    const wodName = sourceWod.title;

    if (!wodName || !description) {
      console.warn(
        `Skipping WOD due to missing title or workout array: ${JSON.stringify(sourceWod)}`,
      );
      continue;
    }

    const tags = inferTags(description);
    const benchmarkType = inferBenchmarkType(tags, description);
    const benchmarkLevels = estimateBenchmarkLevels(
      wodName,
      description,
      benchmarkType,
    );
    const difficulty = estimateDifficulty(wodName, description);
    const difficultyExplanation = generateDifficultyExplanation(
      wodName,
      description,
      difficulty,
    );

    const transformedWod = {
      wodUrl: sourceWod.url || null, // Use source 'url'
      wodName: wodName, // Use source 'title'
      description: description, // Use joined 'workout' array
      benchmarks: benchmarkType
        ? {
            type: benchmarkType,
            levels: benchmarkLevels,
          }
        : null,
      results: [], // Initialize empty results
      category: "Quarterfinals", // Explicitly set category
      tags: tags,
      difficulty: difficulty,
      difficultyExplanation: difficultyExplanation, // Updated
      countLikes: sourceWod.countLikes ?? null, // Updated (assuming source might also be updated later)
    };
    newWods.push(transformedWod);
  }

  console.log(`Transformed ${newWods.length} new Quarterfinals WODs.`);

  // 4. Combine and sort
  const combinedWods = [...existingWods, ...newWods];
  combinedWods.sort((a, b) => a.wodName.localeCompare(b.wodName));
  console.log(
    `Combined list contains ${combinedWods.length} WODs. Sorted alphabetically.`,
  );

  // 5. Write back to file
  try {
    await fs.writeFile(
      existingWodsPath,
      JSON.stringify(combinedWods, null, 2),
      "utf-8",
    );
    console.log(`Successfully updated ${path.basename(existingWodsPath)}.`);
  } catch (error) {
    console.error(
      `Error writing updated WODs file (${existingWodsPath}):`,
      error,
    );
    process.exit(1);
  }

  // 6. Cleanup temporary files (optional, but good practice)
  try {
    await fs.unlink(missingWodsPath);
    console.log(`Removed temporary file: ${path.basename(missingWodsPath)}`);
    // Also remove the names file from the corrected step 1
    const existingNamesPath = path.resolve("existing_wod_names.json");
    await fs.unlink(existingNamesPath);
    console.log(`Removed temporary file: ${path.basename(existingNamesPath)}`);
  } catch (error) {
    console.warn(`Warning: Could not remove temporary file(s):`, error.message);
  }

  console.log("Script finished successfully.");
}

addQuarterfinalsWods();
