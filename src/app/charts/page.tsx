import fs from "fs";
import path from "path";
import { Box, Container, Flex, Heading } from "@radix-ui/themes";

import WodDistributionChart from "~/app/_components/WodDistributionChart";
import WodTimelineChart from "~/app/_components/WodTimelineChart";
import ThemeToggle from "~/app/_components/ThemeToggle";
import Header from "~/app/_components/Header";
import { type Wod } from "~/types/wodTypes";
import {
  DESIRED_TAG_ORDER,
  ALLOWED_TAGS,
  DESIRED_CATEGORY_ORDER,
  PERFORMANCE_LEVEL_VALUES,
} from "~/config/constants";
import { hasScore, getPerformanceLevel, isWodDone } from "~/utils/wodUtils";

export default async function ChartsPage() {
  let wodsData: Wod[] = [];
  const tagCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  const monthlyData: Record<
    string,
    { count: number; totalLevelScore: number }
  > = {};

  try {
    const filePath = path.join(process.cwd(), "public", "data", "wods.json");
    const fileContents = fs.readFileSync(filePath, "utf8");
    wodsData = JSON.parse(fileContents) as Wod[];
    console.log("Loaded WODs data for charts:", wodsData.length);

    wodsData.forEach((wod) => {
      if (isWodDone(wod)) {
        if (wod.category) {
          categoryCounts[wod.category] =
            (categoryCounts[wod.category] || 0) + 1;
        }

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
  } catch (error) {
    console.error("Error loading or processing WODs data for charts:", error);
  }

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
        </Flex>
      </Container>
    </Box>
  );
}
