import fs from "fs";
import path from "path";
import Link from "next/link";
import { Box, Container, Flex, Heading } from "@radix-ui/themes";
import { auth } from "~/server/auth";

// Import the WodViewer and ThemeToggle components
import WodViewer from "~/app/_components/WodViewer";
import ThemeToggle from "~/app/_components/ThemeToggle";
// Use type import - Import WodResult as well
// Also import Benchmarks type and helper functions needed for server-side processing
import {
  type Wod,
  type WodResult,
  type Benchmarks,
  getPerformanceLevel,
} from "~/app/_components/WodViewer";

// Define allowed tags and their desired display order
const DESIRED_TAG_ORDER = [
  "For Time",
  "AMRAP",
  "Couplet",
  "Triplet",
  "Chipper",
  "Ladder",
  "EMOM",
];
const ALLOWED_TAGS = DESIRED_TAG_ORDER; // Keep ALLOWED_TAGS consistent if needed elsewhere, or remove if only order matters

// Define desired category order
const DESIRED_CATEGORY_ORDER = [
  "Girl",
  "Benchmark",
  "Hero",
  "Skill",
  "Open",
  "Quarterfinals",
  "Games",
  "Other",
];

// Define hasScore locally for server-side use
const hasScore = (result: WodResult): boolean => {
  return (
    result.score_time_seconds !== null ||
    result.score_reps !== null ||
    result.score_load !== null ||
    result.score_rounds_completed !== null
  );
};

// Helper function to check if a WOD is considered "done"
const isWodDone = (wod: Wod): boolean => {
  return wod.results.some((r) => r.date && hasScore(r));
};

export default async function Home() {
  const session = await auth();

  let wodsData: Wod[] = [];
  const tagCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  const monthlyData: Record<
    string,
    { count: number; totalLevelScore: number }
  > = {};
  const levelValues: Record<string, number> = {
    elite: 4,
    advanced: 3,
    intermediate: 2,
    beginner: 1,
  };

  try {
    const filePath = path.join(process.cwd(), "public", "data", "wods.json");
    const fileContents = fs.readFileSync(filePath, "utf8");
    wodsData = JSON.parse(fileContents) as Wod[];
    console.log("Loaded WODs data:", wodsData.length);

    // Calculate counts for DONE WODs only
    wodsData.forEach((wod) => {
      // Only count if the WOD is considered done
      if (isWodDone(wod)) {
        // Count categories
        if (wod.category) {
          categoryCounts[wod.category] =
            (categoryCounts[wod.category] || 0) + 1;
        }

        // Count allowed tags
        if (wod.tags) {
          wod.tags.forEach((tag) => {
            if (ALLOWED_TAGS.includes(tag)) {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            }
          });
        }
      }

      // Process results for timeline chart
      wod.results.forEach((result) => {
        if (result.date && hasScore(result)) {
          try {
            const date = new Date(result.date);
            const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1)
              .toString()
              .padStart(2, "0")}`; // Format as YYYY-MM

            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = { count: 0, totalLevelScore: 0 };
            }

            monthlyData[monthKey].count++;

            const level = getPerformanceLevel(wod, result);
            const levelScore = level ? (levelValues[level] ?? 0) : 0;
            monthlyData[monthKey].totalLevelScore += levelScore;
          } catch (e) {
            // Ignore results with invalid dates
            console.warn(
              `Skipping result due to invalid date format: ${result.date} for WOD ${wod.wodName}`,
            );
          }
        }
      });
    });

    console.log("Calculated Tag Counts (Done WODs):", tagCounts);
    console.log("Calculated Category Counts (Done WODs):", categoryCounts);
    console.log("Calculated Monthly Data:", monthlyData);
  } catch (error) {
    console.error("Error loading or processing WODs data:", error);
  }

  // Prepare data for the chart component (array format expected by recharts)
  // Ensure tagChartData follows the DESIRED_TAG_ORDER
  const tagChartData = DESIRED_TAG_ORDER.map((tagName) => ({
    name: tagName,
    value: tagCounts[tagName] || 0, // Use count if exists, otherwise 0
  }));
  // Ensure categoryChartData follows the DESIRED_CATEGORY_ORDER
  const categoryChartData = DESIRED_CATEGORY_ORDER.map((categoryName) => ({
    name: categoryName,
    value: categoryCounts[categoryName] || 0, // Use count if exists, otherwise 0
  }));

  // Prepare data for the timeline chart component
  const sortedMonths = Object.keys(monthlyData).sort();
  const frequencyData = sortedMonths.map((month) => ({
    month,
    count: monthlyData[month].count,
  }));
  const performanceData = sortedMonths.map((month) => ({
    month,
    // Calculate average, handle division by zero
    averageLevel:
      monthlyData[month].count > 0
        ? monthlyData[month].totalLevelScore / monthlyData[month].count
        : 0,
  }));

  return (
    <Box className="min-h-screen bg-background text-foreground">
      {/* Fixed Top Bar */}
      <Box className="fixed relative left-0 top-0 z-10 w-full border-b border-border bg-background px-6 py-4 shadow-md">
        <Container size="4">
          <Flex align="center">
            <Heading size="5" className="text-foreground">
              PRzilla
            </Heading>
          </Flex>
        </Container>
        {/* Absolutely position ThemeToggle */}
        <Box className="absolute right-6 top-4">
          <ThemeToggle />
        </Box>
      </Box>

      {/* Main Content with top margin to account for fixed header */}
      <Container size="4" className="pb-8">
        <Flex direction="column" gap="6">
          <WodViewer
            wods={wodsData} // Pass all WODs to viewer for filtering/display
            tagChartData={tagChartData}
            categoryChartData={categoryChartData}
            frequencyData={frequencyData} // Pass frequency data
            performanceData={performanceData} // Pass performance data
            categoryOrder={DESIRED_CATEGORY_ORDER}
            tagOrder={DESIRED_TAG_ORDER}
          />

          {session?.user && (
            <Flex gap="4" mt="4" justify="center">
              <Link
                href={session ? "/api/auth/signout" : "/api/auth/signin"}
                className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
              >
                {session ? "Sign out" : "Sign in"}
              </Link>
            </Flex>
          )}
        </Flex>
      </Container>
    </Box>
  );
}
