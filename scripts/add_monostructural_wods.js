import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Replicate __dirname behavior in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_TAGS = [
  "Chipper",
  "Couplet",
  "Triplet",
  "EMOM",
  "AMRAP",
  "For Time",
  "Ladder",
];

const wodsFilePath = path.join(__dirname, "../public/data/wods.json");
const newWodsFilePath = path.join(__dirname, "new_monostructural_wods.json");
const outputFilePath = path.join(__dirname, "../public/data/wods.json.new");

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return ["For Time"];
  const filtered = tags.filter((tag) => ALLOWED_TAGS.includes(tag));
  return filtered.length > 0 ? filtered : ["For Time"];
}

function getAllNamesAndAliases(wods) {
  const names = new Set();
  for (const wod of wods) {
    if (wod.wodName) names.add(wod.wodName.trim().toLowerCase());
    if (Array.isArray(wod.aliases)) {
      for (const alias of wod.aliases) {
        if (alias) names.add(alias.trim().toLowerCase());
      }
    }
  }
  return names;
}

try {
  // Read the existing WODs data
  const existingWodsData = fs.readFileSync(wodsFilePath, "utf8");
  const existingWods = JSON.parse(existingWodsData);

  // Read the new monostructural WODs
  const newWodsData = fs.readFileSync(newWodsFilePath, "utf8");
  const newWodsRaw = JSON.parse(newWodsData);

  // Build a set of all existing wodNames and aliases (case-insensitive)
  const existingNames = getAllNamesAndAliases(existingWods);

  // Prepare new WODs: filter tags, deduplicate
  const newWods = [];
  for (const wod of newWodsRaw) {
    const allNames = [wod.wodName, ...(wod.aliases || [])]
      .filter(Boolean)
      .map((n) => n.trim().toLowerCase());
    const isDuplicate = allNames.some((name) => existingNames.has(name));
    if (isDuplicate) {
      console.log(`Skipping duplicate: ${wod.wodName}`);
      continue;
    }
    const filteredTags = normalizeTags(wod.tags);
    newWods.push({ ...wod, tags: filteredTags });
  }

  // Append new WODs to the existing list
  const updatedWods = existingWods.concat(newWods);

  // Write to a new file for review
  fs.writeFileSync(
    outputFilePath,
    JSON.stringify(updatedWods, null, 2),
    "utf8",
  );

  console.log(
    `Added ${newWods.length} new monostructural WODs to ${outputFilePath} (skipped ${newWodsRaw.length - newWods.length} duplicates)`,
  );
} catch (error) {
  console.error("Error updating wods.json:", error);
  process.exit(1);
}
