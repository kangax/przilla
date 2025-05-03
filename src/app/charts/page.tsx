import { type Metadata } from "next";
import { Box, Container, Flex } from "@radix-ui/themes";
import { getSession } from "~/server/auth"; // Import getSession instead of auth
import { api } from "~/trpc/server";
import WodDistributionChart from "./components/WodDistributionChart";
import WodTimelineChart from "./components/WodTimelineChart";
import MovementFrequencyChart from "./components/MovementFrequencyChart";
import Header from "~/app/_components/Header";
import ChartLoginOverlay from "./components/ChartLoginOverlay"; // Import the overlay
import {
  type WodFromQuery,
  type WodChartDataResponse,
  type ChartDataPoint,
  type FrequencyDataPoint,
  type PerformanceDataPoint,
  type MonthlyScoreDetail,
} from "~/types/wodTypes";
import { DESIRED_TAG_ORDER, DESIRED_CATEGORY_ORDER } from "~/config/constants";
import {
  generatePlaceholderDistributionData,
  generatePlaceholderTimelineData,
} from "~/utils/placeholderData"; // Import placeholder functions

export const metadata: Metadata = {
  title: "Visualize Your Performance", // Uses template: "Visualize Your Performance | PRzilla"
  description:
    "Analyze your WOD performance over time with PRzilla's charts. Track progress, see workout distributions, and identify trends. Login required.",
};

// (removed local type definitions for chart data points, now imported from ~/types/wodTypes)

export default async function ChartsPage() {
  const session = await getSession(); // Use getSession()
  let wodsData: WodFromQuery[] = []; // Use WodFromQuery for raw data
  // Movement frequency data from backend
  let movementCountsByCategory: Record<
    string,
    Record<string, { count: number; wodNames: string[] }>
  > = {};
  // Removed unused allMovementCounts variable

  // Public data - always fetched
  try {
    wodsData = (await api.wod.getAll()) as WodFromQuery[]; // Add type assertion
    console.log("Loaded WODs data for charts:", wodsData.length);
  } catch (error) {
    console.error("Error loading WODs data:", error);
  }

  // Initialize chart data variables
  let tagChartData: ChartDataPoint[] = [];
  let categoryChartData: ChartDataPoint[] = [];
  let frequencyData: FrequencyDataPoint[] = [];
  let performanceData: PerformanceDataPoint[] = []; // Type now includes updated scores

  const isLoggedIn = !!session?.user;
  let yourTopMovementsData: {
    name: string;
    value: number;
    wodNames: string[];
  }[] = [];

  if (isLoggedIn) {
    // --- Logged In: Fetch real data ---
    try {
      const chartData: WodChartDataResponse = await api.wod.getChartData();
      const categoryCounts = chartData.categoryCounts;
      const chartTagCounts = chartData.tagCounts;
      const monthlyScores = chartData.monthlyData; // Now includes adjusted scores array per month

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
      // Update performanceData mapping to use totalAdjustedLevelScore and include the updated scores array
      performanceData = sortedMonths.map((month) => ({
        month,
        // Calculate average *adjusted* level
        averageLevel:
          monthlyScores[month].count > 0
            ? monthlyScores[month].totalAdjustedLevelScore /
              monthlyScores[month].count
            : 0,
        scores: monthlyScores[month].scores || [], // Include the updated scores array
      }));

      // --- Movement frequency data from backend ---
      if (chartData.movementCountsByCategory) {
        movementCountsByCategory = chartData.movementCountsByCategory;
      }
      // Removed assignment to unused allMovementCounts variable
      // --- Process yourMovementCounts for "Your WOD's" tab ---
      if (chartData.yourMovementCounts) {
        yourTopMovementsData = Object.entries(chartData.yourMovementCounts)
          .map(([name, data]) => ({
            name,
            value: data.count,
            wodNames: Array.from(new Set(data.wodNames)),
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 20);
      }
    } catch (error) {
      console.error("Error loading protected chart data:", error);
      // Optionally set placeholder data even on error for logged-in users?
      // For now, arrays will remain empty if fetch fails
      // Ensure performanceData is initialized with empty scores array in case of error
      performanceData = [];
      yourTopMovementsData = [];
    }
  } else {
    // --- Logged Out: Generate placeholder data ---
    tagChartData = generatePlaceholderDistributionData(DESIRED_TAG_ORDER);
    categoryChartData = generatePlaceholderDistributionData(
      DESIRED_CATEGORY_ORDER,
    );
    const placeholderTimeline = generatePlaceholderTimelineData();
    frequencyData = placeholderTimeline.frequencyData;
    // Update placeholder performance data to include an empty scores array
    // (The structure of placeholder performance data doesn't need the detailed score info)
    performanceData = placeholderTimeline.performanceData.map((p) => ({
      ...p,
      scores: [], // Placeholder scores remain empty
    }));
  }

  // Prepare movement chart data from backend
  const topMovementsData: Record<
    string,
    { name: string; value: number; wodNames: string[] }[]
  > = {};
  Object.keys(movementCountsByCategory).forEach((category) => {
    const movements = movementCountsByCategory[category];
    topMovementsData[category] = Object.entries(movements)
      .map(([name, data]) => ({
        name,
        value: data.count,
        wodNames: Array.from(new Set(data.wodNames)),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);
  });

  return (
    <Box className="min-h-screen bg-background text-foreground">
      <Header />
      <Container size="4" className="px-6 pb-8">
        <Flex direction="column">
          {/* Always render the container for the top two charts */}
          <Flex gap="4" direction={{ initial: "column", sm: "row" }}>
            {/* Add relative positioning and overlay for logged-out state */}
            <Box className="relative flex-1">
              <WodTimelineChart
                frequencyData={frequencyData}
                performanceData={performanceData} // Pass updated performanceData
              />
              {!session?.user && <ChartLoginOverlay />}
            </Box>
            {/* Add relative positioning and overlay for logged-out state */}
            <Box className="relative flex-1">
              <WodDistributionChart
                tagData={tagChartData}
                categoryData={categoryChartData}
              />
              {!session?.user && <ChartLoginOverlay />}
            </Box>
          </Flex>
          {/* Movement frequency chart remains unchanged */}
          <MovementFrequencyChart
            data={topMovementsData}
            isLoggedIn={isLoggedIn}
            yourData={yourTopMovementsData}
          />
        </Flex>
      </Container>
    </Box>
  );
}
