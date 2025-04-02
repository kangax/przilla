"use client";

import { useState, useMemo } from "react"; // Import useMemo
import { Box, Flex, SegmentedControl, Heading, Text } from "@radix-ui/themes";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import {
  type NameType,
  type ValueType,
} from "recharts/types/component/DefaultTooltipContent";

// Define the structure for timeline data points
type FrequencyDataPoint = {
  month: string; // YYYY-MM format
  count: number;
  rollingAverage?: number; // Add optional rolling average
};

type PerformanceDataPoint = {
  month: string; // YYYY-MM format
  averageLevel: number; // 0-4 scale
  rollingAverage?: number; // Add optional rolling average
};

// Union type for data points
type DataPoint = FrequencyDataPoint | PerformanceDataPoint;

interface WodTimelineChartProps {
  frequencyData: FrequencyDataPoint[];
  performanceData: PerformanceDataPoint[];
}

// Helper function to calculate rolling average
const calculateRollingAverage = (
  data: DataPoint[],
  dataKey: "count" | "averageLevel",
  windowSize: number,
): DataPoint[] => {
  // Ensure data is sorted by month ascending for correct calculation
  const sortedData = [...data].sort((a, b) => a.month.localeCompare(b.month));

  return sortedData.map((point, index, arr) => {
    // Calculate average based on available data up to the current point
    const currentWindowSize = Math.min(index + 1, windowSize);
    const windowSlice = arr.slice(index - currentWindowSize + 1, index + 1);

    // Calculate the sum of the relevant data key in the window, ensuring values are numeric and accessed safely
    const sum = windowSlice.reduce((acc, p) => {
      let value: number | undefined;
      // Type guard to safely access the correct property based on dataKey
      if (dataKey === "count" && "count" in p) {
        value = p.count;
      } else if (dataKey === "averageLevel" && "averageLevel" in p) {
        value = p.averageLevel;
      }
      // Add to accumulator only if value is a valid number
      return acc + (typeof value === "number" ? value : 0);
    }, 0);

    // Calculate the average using the actual number of points in the slice
    // Add check for windowSlice.length to prevent division by zero, though theoretically > 0
    const average = windowSlice.length > 0 ? sum / windowSlice.length : 0;

    return { ...point, rollingAverage: average };
  });
};

// Helper function to get descriptive level from numerical average
const getDescriptiveLevel = (level: number): string => {
  if (level < 1.5) return "Beginner";
  if (level < 2) return "Beginner-Intermediate";
  if (level < 2.5) return "Intermediate";
  if (level < 3) return "Intermediate-Advanced";
  if (level < 3.5) return "Advanced";
  if (level < 4) return "Advanced-Elite";
  if (level === 4) return "Elite";
  return "Unknown"; // Should not happen with domain [0, 4]
};

// Custom Tooltip for better display
const CustomTimelineTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) => {
  // Check if the tooltip should be active and has valid data
  if (active && payload && payload.length > 0 && payload[0].payload) {
    const dataPoint = payload[0].payload as DataPoint; // Base data point for the month
    const rollingAverage = dataPoint.rollingAverage; // Rolling average is stored here

    // Determine which line's data we are hovering over (actual or average)
    // We only want to display the tooltip based on the primary data line hover
    const primaryDataPayload = payload.find(
      (p) => p.name === "count" || p.name === "averageLevel",
    );

    // If not hovering over the primary line, don't show tooltip
    if (!primaryDataPayload) {
      return null;
    }

    const value = primaryDataPayload.value; // Actual value for the month from the primary line
    const name = primaryDataPayload.name; // 'count' or 'averageLevel'

    let displayValue = "Invalid data";
    let rollingAvgDisplay = "";

    // Format the main value
    if (
      name === "count" &&
      (typeof value === "number" || typeof value === "string")
    ) {
      displayValue = `${value} WODs`;
      if (typeof rollingAverage === "number") {
        rollingAvgDisplay = ` (Avg: ${rollingAverage.toFixed(1)})`;
      }
    } else if (name === "averageLevel" && typeof value === "number") {
      const numericLevel = value.toFixed(2);
      const descriptiveLevel = getDescriptiveLevel(value);
      displayValue = `${descriptiveLevel} (${numericLevel})`;
      if (typeof rollingAverage === "number") {
        const avgNumericLevel = rollingAverage.toFixed(2);
        const avgDescriptiveLevel = getDescriptiveLevel(rollingAverage);
        rollingAvgDisplay = ` (Avg: ${avgDescriptiveLevel} (${avgNumericLevel}))`;
      }
    } else if (typeof value === "string" || typeof value === "number") {
      displayValue = String(value);
      // Optionally display rolling average for other types if needed
    }

    return (
      <Box className="rounded bg-gray-700 p-2 text-xs text-white shadow-lg dark:bg-gray-800 dark:text-gray-200">
        <Text className="font-bold">{String(label)}</Text> {/* Month */}
        <Text>
          : {displayValue}
          {rollingAvgDisplay}
        </Text>
      </Box>
    );
  }
  return null;
};

export default function WodTimelineChart({
  frequencyData,
  performanceData,
}: WodTimelineChartProps) {
  const [view, setView] = useState<"frequency" | "performance">("frequency");
  const ROLLING_WINDOW = 12; // Define window size (Updated to 12 months)

  // Reverse mapping for Y-axis ticks in performance view
  const levelTickNames: Record<number, string> = {
    1: "Beginner",
    2: "Intermediate",
    3: "Advanced",
    4: "Elite",
  };

  // Formatter function for Y-axis ticks
  const yAxisTickFormatter = (tickValue: number): string => {
    return levelTickNames[tickValue] ?? ""; // Return name or empty string
  };

  // Memoize the calculation of rolling average
  const chartDataWithAverage = useMemo(() => {
    const baseData = view === "frequency" ? frequencyData : performanceData;
    const key = view === "frequency" ? "count" : "averageLevel";
    // Ensure baseData is not empty before calculating
    if (!baseData || baseData.length === 0) {
      return [];
    }
    return calculateRollingAverage(baseData, key, ROLLING_WINDOW);
  }, [view, frequencyData, performanceData]);

  const dataKey = view === "frequency" ? "count" : "averageLevel";
  const chartTitle =
    view === "frequency"
      ? "Workout Frequency Over Time"
      : "Performance Over Time";
  const yAxisLabel = view === "frequency" ? "WODs / Month" : "Avg Level";
  // Only set Y-axis domain for performance view
  const yDomain = view === "performance" ? [0, 4] : undefined;

  // Check if there's data to display (use the calculated data)
  if (!chartDataWithAverage || chartDataWithAverage.length === 0) {
    return <Text>No timeline data available.</Text>;
  }

  return (
    <Box className="my-6 rounded-lg border border-border bg-card p-4 shadow">
      <Flex justify="between" align="center" mb="4">
        <Heading size="4" className="text-card-foreground">
          {chartTitle}
        </Heading>
        <SegmentedControl.Root
          size="1"
          value={view}
          onValueChange={(value) =>
            setView(value as "frequency" | "performance")
          }
        >
          <SegmentedControl.Item value="frequency">
            Frequency
          </SegmentedControl.Item>
          <SegmentedControl.Item value="performance">
            Performance
          </SegmentedControl.Item>
        </SegmentedControl.Root>
      </Flex>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartDataWithAverage} // Use data with calculated average
          margin={{
            top: 5,
            right: 20, // Add margin for labels
            left: 0, // Adjust left margin if needed
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a7)" />
          <XAxis
            dataKey="month"
            tick={{ fill: "var(--gray-11)", fontSize: 10 }}
            angle={-30} // Angle ticks for better readability if many months
            textAnchor="end" // Adjust anchor for angled ticks
            height={40} // Increase height to accommodate angled labels
            interval="preserveStartEnd" // Show first and last tick
          />
          <YAxis
            tick={{ fill: "var(--gray-11)", fontSize: 10 }}
            label={{
              value: yAxisLabel,
              angle: -90,
              position: "insideLeft",
              style: {
                textAnchor: "middle",
                fill: "var(--gray-11)",
                fontSize: 12,
              },
              dx: -10, // Adjust position if needed
            }}
            // Conditionally apply domain and formatter only for performance view
            {...(yDomain && { domain: yDomain })}
            allowDecimals={view === "performance"} // Allow decimals for performance axis
            tickFormatter={
              view === "performance" ? yAxisTickFormatter : undefined
            }
          />
          <Tooltip content={<CustomTimelineTooltip />} />
          <Line
            type="monotone"
            dataKey={dataKey}
            name={dataKey} // Use dataKey for the name in tooltip
            stroke="var(--accent-9)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--accent-9)" }}
            activeDot={{ r: 6, fill: "var(--accent-10)" }}
          />
          {/* Add the rolling average line */}
          <Line
            type="monotone"
            dataKey="rollingAverage"
            name="Rolling Avg" // Name for tooltip identification if needed
            stroke="var(--orange-9)" // Different color for trend line
            strokeWidth={2}
            strokeDasharray="5 5" // Dashed line style
            dot={false} // No dots for the trend line
            activeDot={false} // No active dots for the trend line
            connectNulls={true} // Connect points even if some averages were initially approximated
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
