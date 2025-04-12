import { Box, Container, Flex, Text } from "@radix-ui/themes";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import WodDistributionChart from "~/app/_components/WodDistributionChart";
import WodTimelineChart from "~/app/_components/WodTimelineChart";
import MovementFrequencyChart from "~/app/_components/MovementFrequencyChart";
import Header from "~/app/_components/Header";
import { analyzeMovementFrequency } from "~/utils/movementParser.server";
import { type Wod } from "~/types/wodTypes";
import { DESIRED_TAG_ORDER, DESIRED_CATEGORY_ORDER } from "~/config/constants";
import { isWodDone, parseTags } from "~/utils/wodUtils";
import ChartLoginOverlay from "~/app/_components/ChartLoginOverlay";

// Generate random but realistic distribution data
const generateDemoDistribution = () => {
  return DESIRED_TAG_ORDER.map((tag) => ({
    name: tag,
    value: Math.floor(Math.random() * 40) + 10,
  }));
};

// Generate progress data with natural fluctuations
const generateDemoProgress = () => {
  const months = Array.from({ length: 12 }, (_, i) => `${i + 1}/2025`);
  return {
    frequencyData: months.map((month, i) => ({
      month,
      count: Math.floor(Math.random() * 10) + 5,
    })),
    performanceData: months.map((month, i) => ({
      month,
      averageLevel: 2.5 + Math.sin(i / 2) + (Math.random() * 0.5 - 0.25),
    })),
  };
};

export default async function ChartsPage() {
  const session = await auth();
  let wodsData: Wod[] = [];

  // Public data - always fetched
  try {
    const result = await api.wod.getAll();
    if (result) {
      wodsData = result;
    } else {
      console.warn("No WODs data returned from API");
    }
  } catch (error) {
    console.error("Error loading WODs data:", error);
    return (
      <Box className="min-h-screen bg-background text-foreground">
        <Header />
        <Container size="4" className="pb-8 pt-6">
          <Text color="red">
            Error loading workout data. Please try again later.
          </Text>
        </Container>
      </Box>
    );
  }

  // Protected data - only fetched when signed in
  let tagCounts: Record<string, number> = {};
  let categoryCounts: Record<string, number> = {};
  let frequencyData: { month: string; count: number }[] = [];
  let performanceData: { month: string; averageLevel: number }[] = [];

  if (session?.user) {
    try {
      const chartData = await api.wod.getChartData();
      if (!chartData) {
        throw new Error("No chart data returned");
      }

      // Validate and transform data
      categoryCounts = chartData.categoryCounts || {};
      const chartTagCounts = chartData.tagCounts || {};
      const monthlyScores = chartData.monthlyData || {};

      // Filter and sort tags
      tagCounts = DESIRED_TAG_ORDER.reduce(
        (acc, tag) => {
          if (chartTagCounts[tag] !== undefined) {
            acc[tag] = chartTagCounts[tag];
          }
          return acc;
        },
        {} as Record<string, number>,
      );

      // Process monthly data
      const sortedMonths = Object.keys(monthlyScores).sort();
      frequencyData = sortedMonths.map((month) => {
        const monthData = monthlyScores[month];
        return {
          month,
          count: monthData?.count || 0,
        };
      });

      performanceData = sortedMonths.map((month) => {
        const monthData = monthlyScores[month];
        return {
          month,
          averageLevel:
            monthData?.count > 0
              ? (monthData.totalLevelScore || 0) / monthData.count
              : 0,
        };
      });
    } catch (error) {
      console.error("Error loading protected chart data:", error);
      // Fall back to demo data but indicate it's not real
      const demoProgress = generateDemoProgress();
      frequencyData = demoProgress.frequencyData;
      performanceData = demoProgress.performanceData;
      tagCounts = Object.fromEntries(
        generateDemoDistribution().map((item) => [item.name, item.value]),
      );
      categoryCounts = Object.fromEntries(
        DESIRED_CATEGORY_ORDER.map((category) => [
          category,
          Math.floor(Math.random() * 30) + 10,
        ]),
      );
    }
  } else {
    // Use demo data when not signed in
    const demoProgress = generateDemoProgress();
    frequencyData = demoProgress.frequencyData;
    performanceData = demoProgress.performanceData;
    tagCounts = Object.fromEntries(
      generateDemoDistribution().map((item) => [item.name, item.value]),
    );
    categoryCounts = Object.fromEntries(
      DESIRED_CATEGORY_ORDER.map((category) => [
        category,
        Math.floor(Math.random() * 30) + 10,
      ]),
    );
  }

  // Process movement data using the utility function
  const movementDataByCategory = analyzeMovementFrequency(wodsData);

  // Prepare chart data
  const tagChartData = DESIRED_TAG_ORDER.map((tagName) => ({
    name: tagName,
    value: tagCounts[tagName] || 0,
  }));
  const categoryChartData = DESIRED_CATEGORY_ORDER.map((categoryName) => ({
    name: categoryName,
    value: categoryCounts[categoryName] || 0,
  }));

  // Prepare movement frequency data
  const topMovementsData: Record<
    string,
    { name: string; value: number; wodNames: string[] }[]
  > = {};
  Object.entries(movementDataByCategory).forEach(([category, movements]) => {
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
          <Flex gap="4" direction={{ initial: "column", sm: "row" }}>
            <Box className="relative flex-1">
              <WodDistributionChart
                tagData={tagChartData}
                categoryData={categoryChartData}
                isDemo={!session?.user}
              />
              {!session?.user && (
                <ChartLoginOverlay message="Log in to see your personal data" />
              )}
            </Box>
            <Box className="relative flex-1">
              <WodTimelineChart
                frequencyData={frequencyData}
                performanceData={performanceData}
                isDemo={!session?.user}
              />
              {!session?.user && (
                <ChartLoginOverlay message="Log in to see your progress" />
              )}
            </Box>
          </Flex>
          <MovementFrequencyChart data={topMovementsData} />
        </Flex>
      </Container>
    </Box>
  );
}
