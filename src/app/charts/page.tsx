import { Box, Container, Flex } from "@radix-ui/themes";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import WodDistributionChart from "~/app/_components/WodDistributionChart";
import WodTimelineChart from "~/app/_components/WodTimelineChart";
import MovementFrequencyChart from "~/app/_components/MovementFrequencyChart";
import Header from "~/app/_components/Header";
import ChartLoginOverlay from "~/app/_components/ChartLoginOverlay"; // Import the overlay
import { normalizeMovementName } from "~/utils/movementMapping";
import { type Wod } from "~/types/wodTypes";
import { DESIRED_TAG_ORDER, DESIRED_CATEGORY_ORDER } from "~/config/constants";
import { isWodDone, parseTags } from "~/utils/wodUtils";
import {
  generatePlaceholderDistributionData,
  generatePlaceholderTimelineData,
} from "~/utils/placeholderData"; // Import placeholder functions

// Define types for chart data points locally or import if shared
type ChartDataPoint = {
  name: string;
  value: number;
};
type FrequencyDataPoint = {
  month: string;
  count: number;
};
type PerformanceDataPoint = {
  month: string;
  averageLevel: number;
};

export default async function ChartsPage() {
  const session = await auth();
  let wodsData: Wod[] = [];
  const movementDataByCategory: Record<
    string,
    Record<string, { count: number; wodNames: string[] }>
  > = {};

  // Public data - always fetched
  try {
    wodsData = await api.wod.getAll();
    console.log("Loaded WODs data for charts:", wodsData.length);
  } catch (error) {
    console.error("Error loading WODs data:", error);
  }

  // Initialize chart data variables
  let tagChartData: ChartDataPoint[] = [];
  let categoryChartData: ChartDataPoint[] = [];
  let frequencyData: FrequencyDataPoint[] = [];
  let performanceData: PerformanceDataPoint[] = [];

  if (session?.user) {
    // --- Logged In: Fetch real data ---
    try {
      const chartData = await api.wod.getChartData();
      const categoryCounts = chartData.categoryCounts;
      const chartTagCounts = chartData.tagCounts;
      const monthlyScores = chartData.monthlyData;

      // Prepare real data for charts
      tagChartData = DESIRED_TAG_ORDER.map((tag) => ({
        name: tag,
        value: chartTagCounts[tag] || 0,
      }));
      categoryChartData = DESIRED_CATEGORY_ORDER.map((category) => ({
        name: category,
        value: categoryCounts[category] || 0,
      }));

      const sortedMonths = Object.keys(monthlyScores).sort();
      frequencyData = sortedMonths.map((month) => ({
        month,
        count: monthlyScores[month].count,
      }));
      performanceData = sortedMonths.map((month) => ({
        month,
        averageLevel:
          monthlyScores[month].count > 0
            ? monthlyScores[month].totalLevelScore / monthlyScores[month].count
            : 0,
      }));
    } catch (error) {
      console.error("Error loading protected chart data:", error);
      // Optionally set placeholder data even on error for logged-in users?
      // For now, arrays will remain empty if fetch fails
    }
  } else {
    // --- Logged Out: Generate placeholder data ---
    tagChartData = generatePlaceholderDistributionData(DESIRED_TAG_ORDER);
    categoryChartData = generatePlaceholderDistributionData(
      DESIRED_CATEGORY_ORDER,
    );
    const placeholderTimeline = generatePlaceholderTimelineData();
    frequencyData = placeholderTimeline.frequencyData;
    performanceData = placeholderTimeline.performanceData;
  }

  // Process movement data (uses public WOD data - remains unchanged)
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
    "alternating legs",
    "over the bar",
    "bar facing",
    "dumbbell",
    "kettlebell",
    "barbell",
    "assault bike",
    "echo bike",
    "cals",
    "calories",
    "men",
    "women",
    "men use",
    "women use",
    "amanda",
    "doubles and oly",
    "ringer",
    "if you complete",
    "complete",
    "perform",
    "then rest",
    "rest",
    "each round",
    "round",
    "part",
  ]);

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
    if (wod.category && wod.description && wod.wodName) {
      if (!movementDataByCategory[wod.category]) {
        movementDataByCategory[wod.category] = {};
      }

      const lines = wod.description.split("\n");
      lines.forEach((line) => {
        const movementRegex = /([A-Z][a-zA-Z\s-]+)/g;
        let match: RegExpExecArray | null;
        const rawPhrases: string[] = [];
        while ((match = movementRegex.exec(line)) !== null) {
          if (match && typeof match[1] === "string") {
            const phrase = match[1]
              .replace(/\s+\(.*?\)/g, "")
              .replace(
                /(\d+(\.\d+)?\/?\d*(\.\d+)?)\s*(lb|kg|pood|in|meter|meters)/gi,
                "",
              )
              .replace(/[:\-.,]$/, "")
              .trim();

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
              !startsWithIntroductory
            ) {
              if (!wordsInPhrase.every((word) => commonWords.has(word))) {
                rawPhrases.push(phrase);
              }
            }
          }
        }

        const movementsInThisWod = new Set<string>();
        rawPhrases.forEach((rawPhrase) => {
          const normalized = normalizeMovementName(rawPhrase);
          if (normalized) {
            movementsInThisWod.add(normalized);
          }
        });

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
  });

  // Prepare movement chart data (remains unchanged)
  const topMovementsData: Record<
    string,
    { name: string; value: number; wodNames: string[] }[]
  > = {};
  Object.keys(movementDataByCategory).forEach((category) => {
    const movements = movementDataByCategory[category];
    topMovementsData[category] = Object.entries(movements)
      .map(([name, data]) => ({
        name,
        value: Array.from(new Set(data.wodNames)).length,
        wodNames: Array.from(new Set(data.wodNames)),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);
  });

  return (
    <Box className="min-h-screen bg-background text-foreground">
      <Header />
      <Container size="4" className="pb-8 pt-6">
        <Flex direction="column" gap="6">
          {/* Always render the container for the top two charts */}
          <Flex gap="4" direction={{ initial: "column", sm: "row" }}>
            {/* Add relative positioning and overlay for logged-out state */}
            <Box className="relative flex-1">
              <WodDistributionChart
                tagData={tagChartData}
                categoryData={categoryChartData}
              />
              {!session?.user && <ChartLoginOverlay />}
            </Box>
            {/* Add relative positioning and overlay for logged-out state */}
            <Box className="relative flex-1">
              <WodTimelineChart
                frequencyData={frequencyData}
                performanceData={performanceData}
              />
              {!session?.user && <ChartLoginOverlay />}
            </Box>
          </Flex>
          {/* Movement frequency chart remains unchanged */}
          <MovementFrequencyChart data={topMovementsData} />
        </Flex>
      </Container>
    </Box>
  );
}
