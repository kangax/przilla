import fs from "fs";
import path from "path";
import { Box, Container, Flex } from "@radix-ui/themes"; // Removed Heading

import WodDistributionChart from "~/app/_components/WodDistributionChart";
import WodTimelineChart from "~/app/_components/WodTimelineChart";
import MovementFrequencyChart from "~/app/_components/MovementFrequencyChart"; // Import the new chart
// Removed ThemeToggle import
import Header from "~/app/_components/Header";
import { normalizeMovementName } from "~/utils/movementMapping";
import { type Wod } from "~/types/wodTypes";
import {
  DESIRED_TAG_ORDER,
  ALLOWED_TAGS, // Keep ALLOWED_TAGS if still used, remove if not
  DESIRED_CATEGORY_ORDER,
  PERFORMANCE_LEVEL_VALUES,
} from "~/config/constants";
import {
  hasScore,
  getPerformanceLevel,
  isWodDone,
  calculateCategoryCounts, // Import the new function
} from "~/utils/wodUtils";

export default async function ChartsPage() {
  let wodsData: Wod[] = [];
  const tagCounts: Record<string, number> = {}; // For existing chart
  let categoryCounts: Record<string, number> = {}; // Initialize categoryCounts here
  const monthlyData: Record<
    // For existing chart
    string,
    { count: number; totalLevelScore: number }
  > = {};
  // Update structure to hold count and WOD names
  const movementDataByCategory: Record<
    string,
    Record<string, { count: number; wodNames: string[] }>
  > = {}; // For new chart

  try {
    const filePath = path.join(process.cwd(), "public", "data", "wods.json");
    const fileContents = fs.readFileSync(filePath, "utf8");
    wodsData = JSON.parse(fileContents) as Wod[];
    console.log("Loaded WODs data for charts:", wodsData.length);

    // Calculate category counts using the new utility function and assign
    categoryCounts = calculateCategoryCounts(wodsData);

    // --- Start: Movement Frequency Calculation ---
    const commonWords = new Set([
      "for",
      "time",
      "reps",
      "rounds",
      "of",
      "min",
      "rest",
      "between",
      "then",
      "amrap",
      "emom",
      "in",
      "minutes",
      "seconds",
      "with",
      "meter",
      "meters",
      "lb",
      "kg",
      "pood",
      "bodyweight",
      "alternating",
      "legs",
      "unbroken",
      "max",
      "needed",
      "set",
      "score",
      "is",
      "load",
      "the",
      "a",
      "and",
      "or",
      "each",
      "total",
      "cap",
      "as",
      "many",
      "possible",
      "on",
      "every",
      "minute",
      "from",
      "if",
      "completed",
      "before",
      // Add more structural/non-movement phrases to exclude
      "rounds for time",
      "reps for time",
      "rep for time",
      "for time",
      "amrap in",
      "emom in",
      "time cap",
      "with a",
      "minute rest",
      "rest between rounds",
      "alternating legs", // Often part of pistol description, but not the movement itself
      "over the bar", // Often part of burpee description
      "bar facing", // Often part of burpee description
      "dumbbell", // Often a modifier, handle via normalization map
      "kettlebell", // Often a modifier, handle via normalization map
      "barbell", // Often implied or a modifier
      "assault bike", // Normalize to Bike
      "echo bike", // Normalize to Bike
      "cals", // Often follows Bike/Row/Ski
      "calories", // Often follows Bike/Row/Ski
      "men",
      "women",
      "men use", // Exclude specific phrase
      "women use", // Exclude specific phrase
      "amanda", // Exclude specific WOD name
      "doubles and oly",
      "ringer",
      // Add introductory words that might start a line but aren't movements
      "if you complete",
      "complete",
      "perform",
      "then rest",
      "rest",
      "each round",
      "round",
      "part",
    ]);

    // Set of words that often start structural phrases, even if capitalized
    const introductoryWords = new Set([
      "if",
      "for",
      "then",
      "rest",
      "each",
      "complete",
      "perform",
      "round",
      "rounds",
    ]);

    wodsData.forEach((wod) => {
      // Process for existing charts (if WOD is done)
      if (isWodDone(wod)) {
        // Removed categoryCounts calculation here

        if (wod.tags) {
          wod.tags.forEach((tag) => {
            if (ALLOWED_TAGS.includes(tag)) {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            }
          });
        }
      }

      // Process description for movement frequency (regardless of done status)
      if (wod.category && wod.description && wod.wodName) {
        // Ensure wodName exists
        if (!movementDataByCategory[wod.category]) {
          movementDataByCategory[wod.category] = {};
        }

        const lines = wod.description.split("\n");
        lines.forEach((line) => {
          // Attempt to extract potential movement names from each line
          // Regex to find potential multi-word movements (often capitalized)
          // or single capitalized words. Very heuristic.
          const movementRegex = /([A-Z][a-zA-Z\s-]+)/g;
          let match: RegExpExecArray | null; // Add type annotation
          const rawPhrases: string[] = [];
          while ((match = movementRegex.exec(line)) !== null) {
            // Ensure match and match[1] are valid strings before proceeding
            if (match && typeof match[1] === "string") {
              // Further clean the matched phrase
              const phrase = match[1]
                .replace(/\s+\(.*?\)/g, "") // Remove trailing parenthesized text
                .replace(
                  /(\d+(\.\d+)?\/?\d*(\.\d+)?)\s*(lb|kg|pood|in|meter|meters)/gi,
                  "",
                ) // Remove weights/units
                .replace(/[:\-.,]$/, "") // Remove trailing punctuation
                .trim();

              // Additional check to exclude phrases that are *only* common words after cleaning
              const phraseLower = phrase.toLowerCase();
              const wordsInPhrase = phraseLower.split(/\s+/);
              const allCommon = wordsInPhrase.every(
                (word) => commonWords.has(word) || word.length <= 1,
              );
              const startsWithIntroductory =
                wordsInPhrase.length > 0 &&
                introductoryWords.has(wordsInPhrase[0]);

              if (
                phrase.length > 2 &&
                !commonWords.has(phraseLower) &&
                !allCommon &&
                !startsWithIntroductory // <-- Add this check
              ) {
                // Check if the entire phrase is just common words (e.g., "Rounds For Time")
                // This check might be redundant now with the introductory check, but keep for safety
                if (!wordsInPhrase.every((word) => commonWords.has(word))) {
                  rawPhrases.push(phrase);
                }
              }
            } // End of check for valid match[1]
          }

          // Normalize and count the found phrases
          // Keep track of unique normalized movements found in *this* WOD description
          const movementsInThisWod = new Set<string>();
          rawPhrases.forEach((rawPhrase) => {
            const normalized = normalizeMovementName(rawPhrase);
            if (normalized) {
              movementsInThisWod.add(normalized);
            }
          });

          // Add this WOD name to the list for each unique movement found
          movementsInThisWod.forEach((normalizedMovement) => {
            if (!movementDataByCategory[wod.category][normalizedMovement]) {
              movementDataByCategory[wod.category][normalizedMovement] = {
                count: 0,
                wodNames: [],
              };
            }
            movementDataByCategory[wod.category][normalizedMovement].count++;
            movementDataByCategory[wod.category][
              normalizedMovement
            ].wodNames.push(wod.wodName);
          });
        });
      }

      // Process results for timeline chart (existing logic)
      wod.results.forEach((result) => {
        if (result.date && hasScore(result)) {
          try {
            const date = new Date(result.date);
            const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1)
              .toString()
              .padStart(2, "0")}`;

            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = { count: 0, totalLevelScore: 0 };
            }

            monthlyData[monthKey].count++;

            const level = getPerformanceLevel(wod, result);
            const levelScore = level
              ? (PERFORMANCE_LEVEL_VALUES[level] ?? 0)
              : 0;
            monthlyData[monthKey].totalLevelScore += levelScore;
          } catch (e) {
            console.warn(
              `Skipping result due to invalid date format: ${result.date} for WOD ${wod.wodName}. Error: ${e}`,
            );
          }
        }
      });
    });

    console.log("Calculated Tag Counts (Done WODs) for charts:", tagCounts);
    console.log(
      "Calculated Category Counts (Done WODs) for charts:",
      categoryCounts,
    );
    console.log("Calculated Monthly Data for charts:", monthlyData);
    console.log(
      "Calculated Movement Data by Category (with WOD names):",
      movementDataByCategory,
    ); // Log new data
  } catch (error) {
    console.error("Error loading or processing WODs data for charts:", error);
  }

  // --- Prepare data for existing charts ---
  const tagChartData = DESIRED_TAG_ORDER.map((tagName) => ({
    name: tagName,
    value: tagCounts[tagName] || 0,
  }));
  const categoryChartData = DESIRED_CATEGORY_ORDER.map((categoryName) => ({
    name: categoryName,
    value: categoryCounts[categoryName] || 0,
  }));

  const sortedMonths = Object.keys(monthlyData).sort();
  const frequencyData = sortedMonths.map((month) => ({
    month,
    count: monthlyData[month].count,
  }));
  const performanceData = sortedMonths.map((month) => ({
    month,
    averageLevel:
      monthlyData[month].count > 0
        ? monthlyData[month].totalLevelScore / monthlyData[month].count
        : 0,
  }));

  // --- Prepare data for new movement frequency chart ---
  // Update structure to include wodNames
  const topMovementsData: Record<
    string,
    { name: string; value: number; wodNames: string[] }[]
  > = {};
  Object.keys(movementDataByCategory).forEach((category) => {
    const movements = movementDataByCategory[category];
    topMovementsData[category] = Object.entries(movements)
      .map(([name, data]) => {
        // Deduplicate the list of WOD names first
        const uniqueWodNames = Array.from(new Set(data.wodNames));
        return {
          name,
          // Set the value (bar length) to the count of unique WODs
          value: uniqueWodNames.length,
          // Keep the deduplicated list for the tooltip
          wodNames: uniqueWodNames,
        };
      })
      .sort((a, b) => b.value - a.value) // Sort descending by frequency (now based on unique WOD count)
      .slice(0, 20); // Take top 20
  });
  console.log("Top 20 Movements by Category:", topMovementsData); // Log processed data

  return (
    <Box className="min-h-screen bg-background text-foreground">
      <Header />
      <Container size="4" className="pb-8 pt-6">
        <Flex direction="column" gap="6">
          <Flex gap="4" direction={{ initial: "column", sm: "row" }}>
            <Box className="flex-1">
              <WodDistributionChart
                tagData={tagChartData}
                categoryData={categoryChartData}
              />
            </Box>
            <Box className="flex-1">
              <WodTimelineChart
                frequencyData={frequencyData}
                performanceData={performanceData}
              />
            </Box>
          </Flex>
          {/* Add the new chart below the existing row */}
          <MovementFrequencyChart data={topMovementsData} />
        </Flex>
      </Container>
    </Box>
  );
}
