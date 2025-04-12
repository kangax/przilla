import { Box, Container, Flex } from "@radix-ui/themes";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import WodDistributionChart from "~/app/_components/WodDistributionChart";
import WodTimelineChart from "~/app/_components/WodTimelineChart";
import MovementFrequencyChart from "~/app/_components/MovementFrequencyChart";
import Header from "~/app/_components/Header";
import { normalizeMovementName } from "~/utils/movementMapping";
import { type Wod } from "~/types/wodTypes";
import { DESIRED_TAG_ORDER, DESIRED_CATEGORY_ORDER } from "~/config/constants";
import { isWodDone, parseTags } from "~/utils/wodUtils";

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

  // Protected data - only fetched when signed in
  const tagCounts: Record<string, number> = {};
  let categoryCounts: Record<string, number> = {};
  let frequencyData: { month: string; count: number }[] = [];
  let performanceData: { month: string; averageLevel: number }[] = [];

  if (session?.user) {
    try {
      const chartData = await api.wod.getChartData();
      categoryCounts = chartData.categoryCounts;
      const chartTagCounts = chartData.tagCounts;
      const monthlyScores = chartData.monthlyData;

      DESIRED_TAG_ORDER.forEach((tag) => {
        if (chartTagCounts[tag]) {
          tagCounts[tag] = chartTagCounts[tag];
        }
      });

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
    }
  }

  // Process movement data (uses public WOD data)
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

  // Prepare chart data
  const tagChartData = DESIRED_TAG_ORDER.map((tagName) => ({
    name: tagName,
    value: tagCounts[tagName] || 0,
  }));
  const categoryChartData = DESIRED_CATEGORY_ORDER.map((categoryName) => ({
    name: categoryName,
    value: categoryCounts[categoryName] || 0,
  }));

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
          {session?.user && (
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
          )}
          <MovementFrequencyChart data={topMovementsData} />
        </Flex>
      </Container>
    </Box>
  );
}
