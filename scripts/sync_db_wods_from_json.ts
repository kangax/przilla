import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq, and, InferSelectModel, is } from "drizzle-orm"; // Import InferSelectModel
import { distance } from "fastest-levenshtein";
import inquirer from "inquirer";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { wods, movements, wodMovements } from "../src/server/db/schema";
import { WodJsonSchema, WodJson } from "../src/types/wodJsonTypes";

// --- Constants ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WODS_JSON_PATH = path.join(__dirname, "../public/data/wods.json");
const LEVENSHTEIN_THRESHOLD = 2; // Max distance for considering a "close match"

// --- Types ---
// Using Wod from ../src/types/wodTypes
type ExistingMovement = {
  id: string;
  name: string;
  normalizedName: string; // Pre-calculate for efficiency
};

// --- Helper Functions ---
function normalizeString(str: string): string {
  return str.trim().toLowerCase();
}

// Define update type based on schema
type WodSchema = typeof wods;
type WodUpdateValues = Partial<InferSelectModel<WodSchema>>;

// --- Main Logic ---
async function main() {
  // --- Argument Parsing ---
  const argv = await yargs(hideBin(process.argv))
    .option("dry-run", {
      alias: "d",
      type: "boolean",
      description: "Run script without making database changes",
      default: false,
    })
    .option("update-category", {
      alias: "u",
      type: "string",
      description: "Specify a category to update existing WODs",
      default: undefined, // No default category to update
    })
    .help()
    .alias("help", "h").argv;

  const dryRun = argv["dry-run"];
  const categoryToUpdateRaw = argv["update-category"];
  const categoryToUpdate = categoryToUpdateRaw
    ? normalizeString(categoryToUpdateRaw)
    : undefined;

  console.log(`Starting WOD import script... ${dryRun ? "[DRY RUN]" : ""}`);
  if (categoryToUpdate) {
    console.log(`Targeting category for updates: "${categoryToUpdate}"`);
  }

  // 1. Initialize DB Connection
  const dbUrl = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN; // Optional, for Turso
  if (!dbUrl) {
    console.error("❌ Error: DATABASE_URL environment variable is not set.");
    process.exit(1);
  }
  console.log(`Connecting to database: ${dbUrl.split("@")[1] ?? dbUrl}`); // Avoid logging potential credentials
  const client = createClient({ url: dbUrl, authToken });
  const db = drizzle(client);
  console.log("✅ Database connection established.");

  // 2. Load Data
  console.log(`Loading WODs from ${WODS_JSON_PATH}...`);
  let wodsFromJson: WodJson[] = [];
  try {
    const fileContent = fs.readFileSync(WODS_JSON_PATH, "utf8");
    const rawWods: unknown[] = JSON.parse(fileContent);

    // Validate and collect only schema-compliant WODs
    let invalidCount = 0;
    for (const wod of rawWods) {
      const parsed = WodJsonSchema.safeParse(wod);
      if (parsed.success) {
        wodsFromJson.push(parsed.data);
      } else {
        invalidCount++;
        console.error(
          "Invalid WOD JSON object:",
          parsed.error.format(),
          "\nObject:",
          wod,
        );
        // In dry run mode, still add the raw object for reporting
        if (dryRun) {
          wodsFromJson.push(wod as any);
        }
      }
    }
    if (invalidCount > 0) {
      console.warn(
        `⚠️ Skipped ${invalidCount} invalid WOD(s) from wods.json due to schema mismatch.${dryRun ? " (Included for dry run reporting)" : ""}`,
      );
    }
    console.log(
      `✅ Loaded ${wodsFromJson.length} valid${dryRun && invalidCount > 0 ? " (or included for dry run)" : ""} WODs from JSON.`,
    );
  } catch (error) {
    console.error(`❌ Error reading or parsing ${WODS_JSON_PATH}:`, error);
    process.exit(1);
  }

  console.log("Fetching existing WOD names and IDs from database...");
  let existingWodsMap: Map<string, string>; // Map<wodName, wodId>
  try {
    const existingWodsData = await db
      .select({ wodName: wods.wodName, id: wods.id })
      .from(wods);
    existingWodsMap = new Map(existingWodsData.map((w) => [w.wodName, w.id]));
    console.log(`✅ Found ${existingWodsMap.size} existing WODs.`);
  } catch (error) {
    console.error("❌ Error fetching existing WODs:", error);
    process.exit(1);
  }

  console.log("Fetching existing movements from database...");
  let existingMovements: ExistingMovement[];
  try {
    const dbMovements = await db.select().from(movements);
    existingMovements = dbMovements.map((m) => ({
      id: m.id,
      name: m.name,
      normalizedName: normalizeString(m.name),
    }));
    console.log(`✅ Found ${existingMovements.length} existing movements.`);
  } catch (error) {
    console.error("❌ Error fetching existing movements:", error);
    process.exit(1);
  }

  // 3. Process WODs
  console.log("\n--- Processing WODs ---");
  let processedWods = 0;
  let insertedWods = 0;
  let updatedWods = 0; // Added counter for updates
  let skippedWods = 0;
  let newMovementsCreated = 0;
  let movementsMatched = 0;
  let associationsCreated = 0;
  let errorsEncountered = 0;
  const wodsToInsertNames: string[] = []; // For dry run summary
  const wodsToUpdateNames: string[] = []; // For dry run summary
  const movementsToCreateNames: string[] = []; // For dry run summary

  for (const wodJson of wodsFromJson) {
    processedWods++;
    // console.log(
    //   `\n[${processedWods}/${wodsFromJson.length}] Processing WOD: "${wodJson.wodName}"`,
    // );

    let newWodId: string | null = null; // Will hold ID if inserted
    const existingWodId = existingWodsMap.get(wodJson.wodName);

    // --- GENERIC WOD UPDATE LOGIC ---
    if (existingWodId) {
      // WOD exists in DB: fetch all current fields for comparison
      let dbWod: any = null;
      try {
        const [row] = await db
          .select()
          .from(wods)
          .where(eq(wods.id, existingWodId));
        dbWod = row;
      } catch (error) {
        console.error(
          `   ❌ Error fetching full WOD row for "${wodJson.wodName}" (ID: ${existingWodId}):`,
          error,
        );
        errorsEncountered++;
        skippedWods++;
        continue;
      }

      // List of all updatable fields (add/remove as schema evolves)
      const fieldsToCheck = [
        "levels",
        "difficultyExplanation",
        "countLikes",
        "description",
        "benchmarks",
        "category",
        "tags",
        "difficulty",
        "timecap",
        "wodUrl",
      ];

      const updates: Record<string, any> = {};
      const changedFields: string[] = [];

      // Special handling for "benchmarks" field: compare type and levels separately
      let benchmarksChanged = false;
      let benchmarksTypeChanged = false;
      let benchmarksLevelsChanged = false;
      let newBenchmarks: any = undefined;
      let oldBenchmarks: any = undefined;

      for (const field of fieldsToCheck) {
        if (field === "benchmarks") {
          let jsonVal = (wodJson as any)[field];
          let dbVal = dbWod ? dbWod[field] : undefined;

          // Parse both as objects (handle null/undefined)
          try {
            newBenchmarks =
              jsonVal && typeof jsonVal === "string"
                ? JSON.parse(jsonVal)
                : jsonVal;
          } catch {
            newBenchmarks = jsonVal;
          }
          try {
            oldBenchmarks =
              dbVal && typeof dbVal === "string" ? JSON.parse(dbVal) : dbVal;
          } catch {
            oldBenchmarks = dbVal;
          }

          // If both are null/undefined, skip
          if (!newBenchmarks && !oldBenchmarks) continue;

          // Compare "type"
          const newType = newBenchmarks ? newBenchmarks.type : null;
          const oldType = oldBenchmarks ? oldBenchmarks.type : null;
          if (newType !== oldType) {
            changedFields.push("benchmarks.type");
            benchmarksTypeChanged = true;
            benchmarksChanged = true;
          }

          // Compare "levels"
          const newLevels = newBenchmarks ? newBenchmarks.levels : null;
          const oldLevels = oldBenchmarks ? oldBenchmarks.levels : null;
          if (JSON.stringify(newLevels) !== JSON.stringify(oldLevels)) {
            changedFields.push("benchmarks.levels");
            benchmarksLevelsChanged = true;
            benchmarksChanged = true;
          }
        } else {
          let jsonVal = (wodJson as any)[field];
          let dbVal = dbWod ? dbWod[field] : undefined;

          // Normalize undefined/null for comparison
          if (jsonVal === undefined) jsonVal = null;
          if (dbVal === undefined) dbVal = null;

          // For objects/arrays, use deep equality
          let isEqual: boolean;
          if (field === "tags") {
            // Robust logic for tags comparison
            let jsonTags = jsonVal as string[] | null | undefined;
            let dbTagsRaw = dbVal as string[] | string | null | undefined; // DB value might be string or array

            // Normalize undefined to null
            if (jsonTags === undefined) jsonTags = null;
            if (dbTagsRaw === undefined) dbTagsRaw = null;

            let dbTagsParsed: string[] | null = null;
            if (dbTagsRaw !== null) {
              if (Array.isArray(dbTagsRaw)) {
                dbTagsParsed = dbTagsRaw; // Already an array
              } else if (typeof dbTagsRaw === "string") {
                try {
                  const parsed = JSON.parse(dbTagsRaw);
                  if (Array.isArray(parsed)) {
                    dbTagsParsed = parsed; // Successfully parsed string to array
                  } else {
                    // Parsed but not an array - treat as unequal
                    console.warn(
                      `   ⚠️ DB 'tags' value for ${wodJson.wodName} parsed from string but was not an array:`,
                      dbTagsRaw,
                    );
                    isEqual = false; // Force inequality if parse result isn't array
                  }
                } catch (e) {
                  // Failed to parse string - treat as unequal
                  console.warn(
                    `   ⚠️ Failed to parse DB 'tags' string for ${wodJson.wodName}:`,
                    dbTagsRaw,
                    e,
                  );
                  isEqual = false; // Force inequality on parse error
                }
              } else {
                // Neither string nor array - treat as unequal
                console.warn(
                  `   ⚠️ Unexpected DB 'tags' type for ${wodJson.wodName}:`,
                  typeof dbTagsRaw,
                );
                isEqual = false;
              }
            }

            // Only proceed with comparison if parsing was successful (or value was already array/null)
            if (isEqual !== false) {
              // Check if inequality was already forced
              // Handle null cases
              if (jsonTags === null && dbTagsParsed === null) {
                isEqual = true;
              } else if (jsonTags === null || dbTagsParsed === null) {
                isEqual = false; // One is null, the other isn't
              } else {
                // Both are arrays, sort and compare stringified versions
                const sortedJsonTags = [...jsonTags].sort();
                const sortedDbTags = [...dbTagsParsed].sort();
                isEqual =
                  JSON.stringify(sortedJsonTags) ===
                  JSON.stringify(sortedDbTags);
              }
            }
          } else {
            // Existing logic for other fields (handles null/undefined normalization above)
            isEqual = jsonVal === dbVal;
          }

          if (!isEqual) {
            // Explicitly stringify tags before adding to updates, as Drizzle's $type might not handle it in .set()
            if (field === "tags") {
              updates[field as keyof WodUpdateValues] = jsonVal
                ? JSON.stringify(jsonVal)
                : null;
            } else {
              // Keep other fields as they are (Drizzle handles primitives, benchmarks is already stringified)
              updates[field as keyof WodUpdateValues] = jsonVal;
            }
            changedFields.push(field);
          }
        }
      }

      // If any part of benchmarks changed, update the full benchmarks field
      if (benchmarksChanged) {
        // Build the updated benchmarks object
        let updatedBenchmarks = { ...(oldBenchmarks || {}) };
        if (benchmarksTypeChanged) {
          updatedBenchmarks.type = newBenchmarks ? newBenchmarks.type : null;
        }
        if (benchmarksLevelsChanged) {
          updatedBenchmarks.levels = newBenchmarks
            ? newBenchmarks.levels
            : null;
        }
        // Remove undefined keys if newBenchmarks is null
        if (!newBenchmarks) {
          updatedBenchmarks = null;
        }
        updates["benchmarks"] = updatedBenchmarks
          ? JSON.stringify(updatedBenchmarks)
          : null;
      }

      if (changedFields.length > 0) {
        if (!dryRun) {
          try {
            await db
              .update(wods)
              .set(updates)
              .where(eq(wods.id, existingWodId));
            updatedWods++;
            console.log(
              `   ✅ Updated WOD "${wodJson.wodName}" (ID: ${existingWodId}) [fields: ${changedFields.join(", ")}]`,
            );
          } catch (error) {
            console.error(
              `   ❌ Error updating WOD "${wodJson.wodName}" (ID: ${existingWodId}):`,
              error,
            );
            errorsEncountered++;
          }
        } else {
          updatedWods++;
          wodsToUpdateNames.push(wodJson.wodName);
          console.log(
            `   [DRY RUN] Would update WOD: "${wodJson.wodName}" (ID: ${existingWodId}) [fields: ${changedFields.join(", ")}]`,
          );
          // Output the changed fields in a table
          const tableRows = changedFields.map((field) => {
            let dbVal, jsonVal;
            if (field === "benchmarks.type") {
              dbVal = oldBenchmarks ? oldBenchmarks.type : null;
              jsonVal = newBenchmarks ? newBenchmarks.type : null;
            } else if (field === "benchmarks.levels") {
              dbVal = oldBenchmarks ? oldBenchmarks.levels : null;
              jsonVal = newBenchmarks ? newBenchmarks.levels : null;
            } else {
              dbVal = dbWod ? dbWod[field] : undefined;
              jsonVal = (wodJson as any)[field];
            }
            // Normalize undefined/null for display
            if (dbVal === undefined) dbVal = null;
            if (jsonVal === undefined) jsonVal = null;

            // For objects/arrays, pretty print (with special handling for tags display)
            let dbValStr: string;
            let jsonValStr: string;

            if (field === "tags") {
              // Display sorted tags for consistency with comparison logic
              let dbTagsForDisplay: string[] | null = null;
              if (dbVal !== null) {
                if (Array.isArray(dbVal)) {
                  dbTagsForDisplay = [...dbVal].sort();
                } else if (typeof dbVal === "string") {
                  try {
                    const parsed = JSON.parse(dbVal);
                    if (Array.isArray(parsed)) {
                      dbTagsForDisplay = [...parsed].sort();
                    } else {
                      dbTagsForDisplay = ["<Invalid DB Tag Data>"]; // Indicate parsing issue
                    }
                  } catch {
                    dbTagsForDisplay = ["<Unparseable DB Tag String>"]; // Indicate parsing issue
                  }
                } else {
                  dbTagsForDisplay = ["<Unexpected DB Tag Type>"]; // Indicate type issue
                }
              }
              const jsonTagsForDisplay = Array.isArray(jsonVal)
                ? [...jsonVal].sort()
                : jsonVal;

              dbValStr = JSON.stringify(dbTagsForDisplay);
              jsonValStr = JSON.stringify(jsonTagsForDisplay);
            } else {
              // Default stringification for other fields
              dbValStr =
                typeof dbVal === "object" && dbVal !== null
                  ? JSON.stringify(dbVal)
                  : String(dbVal);
              jsonValStr =
                typeof jsonVal === "object" && jsonVal !== null
                  ? JSON.stringify(jsonVal)
                  : String(jsonVal);
            }

            // Truncate long strings for readability
            if (dbValStr.length > 200)
              dbValStr = dbValStr.slice(0, 200) + "...";
            if (jsonValStr.length > 200)
              jsonValStr = jsonValStr.slice(0, 200) + "...";
            return {
              Field: field,
              "DB Value": dbValStr,
              "JSON Value": jsonValStr,
            };
          });
          if (tableRows.length > 0) {
            console.table(tableRows);
          }
        }
        continue; // Skip insertion logic after update
      } else {
        console.log(
          `   -> WOD "${wodJson.wodName}" (ID: ${existingWodId}) is up-to-date. No changes needed.`,
        );
        skippedWods++;
        continue;
      }
    } else {
      // --- WOD Insertion Logic (WOD does not exist in DB) ---
      console.log(`   -> WOD not found in DB. Processing insertion...`);
      const benchmarksString = // Prepare values regardless of dry run
        wodJson.benchmarks && typeof wodJson.benchmarks === "object"
          ? JSON.stringify(wodJson.benchmarks) // Keep stringify for benchmarks as it's just text() in schema
          : null;
      // Drizzle handles JSON stringification for text().$type<string[] | null>()
      // Pass the array or null directly.

      const valuesToInsert = {
        wodName: wodJson.wodName,
        wodUrl: wodJson.wodUrl ?? null,
        description: wodJson.description ?? null,
        benchmarks: benchmarksString,
        category: wodJson.category ?? null,
        tags: wodJson.tags ? JSON.stringify(wodJson.tags) : null, // Explicitly stringify for insert
        difficulty: wodJson.difficulty ?? null,
        // Map JSON property to DB camelCase column
        difficultyExplanation: (wodJson as any).difficultyExplanation ?? null, // Updated
        // Map JSON property to DB camelCase column
        countLikes: (wodJson as any).countLikes ?? 0, // Updated
        timecap: wodJson.timecap ?? null,
      };

      if (!dryRun) {
        // Actual Insertion
        try {
          console.log(`      -> Attempting database insert...`);
          const [insertedWod] = await db
            .insert(wods)
            .values(valuesToInsert)
            .returning({ id: wods.id });

          if (!insertedWod?.id) {
            throw new Error("Insertion did not return an ID.");
          }
          newWodId = insertedWod.id; // Assign the real ID
          insertedWods++; // Increment actual insertion counter
          console.log(
            `      ✅ Successfully inserted WOD with ID: ${newWodId}`,
          );
        } catch (error) {
          console.error(
            `      ❌ Error inserting WOD "${wodJson.wodName}" into DB:`,
            error,
          );
          errorsEncountered++;
          continue; // Skip movement processing for this WOD if DB insert fails
        }
      } else {
        // Dry Run Simulation
        // Simulate ID for dry run to allow movement processing simulation
        newWodId = `dry-run-wod-${wodJson.wodName.replace(/\s+/g, "-")}`;
        insertedWods++; // Count as 'would be inserted'
        wodsToInsertNames.push(wodJson.wodName); // Collect name for summary
        console.log(
          `      [DRY RUN] Would insert WOD: "${wodJson.wodName}" (Simulated ID: ${newWodId})`,
        );
        // No actual DB call, so no try/catch needed here for DB errors
      }
    } // End of WOD Insertion block

    // --- Movement Processing & Association (Only if WOD was newly inserted) ---
    if (newWodId && wodJson.movements && wodJson.movements.length > 0) {
      console.log(
        `   -> Processing ${wodJson.movements.length} movements for new WOD ID: ${newWodId}`,
      );
      const movementIdsToAssociate: string[] = [];

      for (const movementName of wodJson.movements) {
        const originalMovementName = movementName.trim();
        if (!originalMovementName) continue; // Skip empty strings

        const normalizedMovementName = normalizeString(originalMovementName);
        let bestMatch: ExistingMovement | null = null;
        let minDistance = Infinity;

        // Find best fuzzy match
        for (const existing of existingMovements) {
          const dist = distance(
            normalizedMovementName,
            existing.normalizedName,
          );
          if (dist < minDistance) {
            minDistance = dist;
            bestMatch = existing;
          }
          // Exact match optimization (case-insensitive)
          if (dist === 0) break;
        }

        let movementIdToAdd: string | null = null;

        if (bestMatch && minDistance === 0) {
          // Exact match found
          console.log(
            `      -> Exact match found for "${originalMovementName}": "${bestMatch.name}" (ID: ${bestMatch.id})`,
          );
          movementIdToAdd = bestMatch.id;
          movementsMatched++; // Count exact matches here (even in dry run)
        } else if (bestMatch && minDistance <= LEVENSHTEIN_THRESHOLD) {
          // Close match found
          console.log(
            `      -> Close match found for "${originalMovementName}": "${bestMatch.name}" (Distance: ${minDistance})`,
          );

          if (!dryRun) {
            // Ask user only if not dry run
            const { useExisting } = await inquirer.prompt([
              {
                type: "list",
                name: "useExisting",
                message: `Use existing movement "${bestMatch.name}" for "${originalMovementName}"?`,
                choices: [
                  { name: `Yes, use "${bestMatch.name}"`, value: "yes" },
                  { name: `No, create "${originalMovementName}"`, value: "no" },
                  { name: "Skip this movement", value: "skip" },
                ],
              },
            ]);

            if (useExisting === "yes") {
              movementIdToAdd = bestMatch.id;
              movementsMatched++;
              console.log(
                `         -> User chose to use existing: ${bestMatch.id}`,
              );
            } else if (useExisting === "no") {
              console.log(`         -> User chose to create new.`);
              // Proceed to create new movement logic below
            } else {
              console.log(`         -> User chose to skip.`);
              continue; // Skip to next movement
            }
          } else {
            // Dry run: Assume we use the best match
            movementIdToAdd = bestMatch.id;
            movementsMatched++;
            console.log(
              `         [DRY RUN] Would match with existing: "${bestMatch.name}" (ID: ${bestMatch.id})`,
            );
          }
        }

        // Create new movement if:
        // - No match found OR
        // - Close match found BUT (dryRun is false AND user chose 'no')
        let shouldAttemptCreate =
          !movementIdToAdd &&
          (!bestMatch || minDistance > LEVENSHTEIN_THRESHOLD);
        let confirmCreate = false; // Default for dry run or if user said 'no' above

        if (
          !movementIdToAdd &&
          bestMatch &&
          minDistance <= LEVENSHTEIN_THRESHOLD &&
          !dryRun
        ) {
          // This case happens only if !dryRun and user chose 'no' for close match
          shouldAttemptCreate = true;
        }

        if (shouldAttemptCreate) {
          if (!bestMatch || minDistance > LEVENSHTEIN_THRESHOLD) {
            console.log(
              `      -> No close match found for "${originalMovementName}".`,
            );
          }

          if (!dryRun) {
            // Ask user only if not dry run
            const { userConfirmCreate } = await inquirer.prompt([
              {
                type: "confirm",
                name: "userConfirmCreate",
                message: `Create new movement "${originalMovementName}"?`,
                default: true,
              },
            ]);
            confirmCreate = userConfirmCreate;
          } else {
            // Dry run: Assume we would create
            confirmCreate = true;
            console.log(
              `         [DRY RUN] Would create new movement: "${originalMovementName}"`,
            );
          }

          if (confirmCreate) {
            console.log(
              `         -> Attempting to create new movement: "${originalMovementName}"`,
            );
            if (!dryRun) {
              try {
                const [newMovement] = await db
                  .insert(movements)
                  .values({ name: originalMovementName }) // Use original case
                  .returning({ id: movements.id, name: movements.name });

                if (!newMovement?.id) {
                  throw new Error("Insertion did not return ID.");
                }
                movementIdToAdd = newMovement.id;
                newMovementsCreated++;
                existingMovements.push({
                  id: newMovement.id,
                  name: newMovement.name,
                  normalizedName: normalizeString(newMovement.name),
                });
                console.log(
                  `         ✅ Created new movement with ID: ${movementIdToAdd}`,
                );
              } catch (error: any) {
                if (error.message?.includes("UNIQUE constraint failed")) {
                  console.warn(
                    `         ⚠️ Movement "${originalMovementName}" likely created concurrently. Fetching existing.`,
                  );
                  const existing = await db
                    .select()
                    .from(movements)
                    .where(eq(movements.name, originalMovementName))
                    .get();
                  if (existing) {
                    movementIdToAdd = existing.id;
                    console.log(
                      `            -> Found existing ID: ${movementIdToAdd}`,
                    );
                  } else {
                    console.error(
                      `         ❌ Error creating movement "${originalMovementName}" and failed to fetch after UNIQUE constraint error:`,
                      error,
                    );
                    errorsEncountered++;
                  }
                } else {
                  console.error(
                    `         ❌ Error creating movement "${originalMovementName}":`,
                    error,
                  );
                  errorsEncountered++;
                }
              }
            } else {
              // Dry run simulation
              movementIdToAdd = `dry-run-mov-${originalMovementName.replace(/\s+/g, "-")}`;
              newMovementsCreated++; // Count as 'would be created'
              movementsToCreateNames.push(originalMovementName); // Collect name for summary
              // Simulate adding to in-memory list for subsequent checks
              existingMovements.push({
                id: movementIdToAdd,
                name: originalMovementName,
                normalizedName: normalizeString(originalMovementName),
              });
            }
          } else {
            console.log(`         -> User chose not to create.`);
          }
        }

        /* OLD BLOCK - Replaced by logic above
        // Create new movement if no match, or user chose 'no' for close match
        if (
          !movementIdToAdd &&
          (!bestMatch ||
            minDistance > LEVENSHTEIN_THRESHOLD ||
            (
              await inquirer.prompt([
                // confirm create //
              ])
            ).confirmCreate)
        ) {
          if (!bestMatch || minDistance > LEVENSHTEIN_THRESHOLD) {
            console.log(
              `      -> No close match found for "${originalMovementName}".`,
            );
          }
          const { confirmCreate } = await inquirer.prompt([
            {
              type: "confirm",
              name: "confirmCreate",
*/ // End of replaced block

        // Add the determined ID (if any) to the list for association
        if (movementIdToAdd) {
          movementIdsToAssociate.push(movementIdToAdd);
        }
      } // End loop through movementNames

      // --- Association Insertion ---
      if (movementIdsToAssociate.length > 0) {
        console.log(
          `   -> Associating ${movementIdsToAssociate.length} movements with WOD ID: ${newWodId}`,
        );
        for (const movementId of movementIdsToAssociate) {
          try {
            // Check if association already exists (safety check, should be redundant for new WOD)
            const existingAssoc = await db
              .select()
              .from(wodMovements)
              .where(
                and(
                  eq(wodMovements.wodId, newWodId),
                  eq(wodMovements.movementId, movementId),
                ),
              )
              .get();

            if (!existingAssoc) {
              if (!dryRun) {
                await db
                  .insert(wodMovements)
                  .values({ wodId: newWodId, movementId });
                associationsCreated++; // Only count if not dry run
                // console.log(`      -> Associated movement ID: ${movementId}`);
              } else {
                associationsCreated++; // Count as 'would be associated'
                // console.log(`      [DRY RUN] Would associate movement ID: ${movementId}`);
              }
            } else {
              // console.log(`      -> Association already exists for movement ID: ${movementId}`);
            }
          } catch (error) {
            console.error(
              `      ❌ Error associating WOD ${newWodId} with Movement ${movementId}:`,
              error,
            );
            errorsEncountered++;
          }
        }
        console.log(`      -> Finished associating movements.`);
      } else {
        console.log(`   -> No movements to associate for WOD ID: ${newWodId}`);
      }
    } else if (newWodId) {
      console.log(
        `   -> No movements listed in JSON for WOD ID: ${newWodId}. Skipping association.`,
      );
    } // End movement processing block
  } // End loop through wodsFromJson

  // 4. Summary
  // 4. Summary
  console.log(`\n--- Import Summary ${dryRun ? "[DRY RUN]" : ""} ---`);
  console.log(`Total WODs in JSON: ${wodsFromJson.length}`);
  console.log(`WODs Processed:     ${processedWods}`);
  console.log(
    `WODs ${dryRun ? "Would be Inserted:" : "Inserted:"}  ${insertedWods}`,
  );
  if (dryRun && wodsToInsertNames.length > 0) {
    // Print WOD names if dry run
    console.log("    WODs to Insert:");
    wodsToInsertNames.forEach((name) => console.log(`      - ${name}`));
  }
  console.log(
    `WODs ${dryRun ? "Would be Updated:" : "Updated:"}   ${updatedWods}`,
  );
  if (dryRun && wodsToUpdateNames.length > 0) {
    // Print WOD names if dry run
    // console.log("    WODs to Update:");
    // wodsToUpdateNames.forEach((name) => console.log(`      - ${name}`));
  }
  console.log(`WODs Skipped:       ${skippedWods}`); // Skipped = Existed but not updated
  console.log(
    `New Movements ${dryRun ? "Would be Added:" : "Added:"} ${newMovementsCreated}`,
  );
  // Print Movement names if dry run
  if (dryRun && movementsToCreateNames.length > 0) {
    console.log("    Movements to Create:");
    movementsToCreateNames.forEach((name) => console.log(`      - ${name}`));
  }
  console.log(`Movements Matched:  ${movementsMatched}`); // Matched includes fuzzy + exact
  console.log(
    `Associations ${dryRun ? "Would be Made:" : "Made:"}  ${associationsCreated}`,
  );
  console.log(`Errors Encountered: ${errorsEncountered}`);
  console.log("----------------------");
  if (dryRun) {
    console.log("NOTE: No changes were made to the database.");
  }

  // 5. Close DB Connection
  console.log("Closing database connection...");
  await client.close();
  console.log("✅ Script finished.");
}

main().catch((err) => {
  console.error("\n❌ Unhandled error during script execution:", err);
  process.exit(1);
});
