"use client";

import { useState } from "react";
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
};

type PerformanceDataPoint = {
  month: string; // YYYY-MM format
  averageLevel: number; // 0-4 scale
};

interface WodTimelineChartProps {
  frequencyData: FrequencyDataPoint[];
  performanceData: PerformanceDataPoint[];
}

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
  if (active && payload && payload.length) {
    // const data = payload[0].payload; // Removed: Fixes unsafe-assignment and unused-vars
    const value = payload[0].value;
    const name = payload[0].name; // 'count' or 'averageLevel'

    let displayValue = "Invalid data"; // Default string value, type inferred

    // Ensure value is primitive before using it
    if (
      name === "count" &&
      (typeof value === "number" || typeof value === "string")
    ) {
      displayValue = `${value} WODs`;
    } else if (name === "averageLevel" && typeof value === "number") {
      // Format average level to 2 decimal places and get descriptive level
      const numericLevel = value.toFixed(2); // Use value directly
      const descriptiveLevel = getDescriptiveLevel(value);
      displayValue = `${descriptiveLevel} (${numericLevel})`;
    } else if (typeof value === "string" || typeof value === "number") {
      // Handle other potential primitive values safely
      displayValue = String(value);
    }
    // If value is an array or object, displayValue remains "Invalid data"

    return (
      <Box className="rounded bg-gray-700 p-2 text-xs text-white shadow-lg dark:bg-gray-800 dark:text-gray-200">
        {/* Ensure label is also treated as a string */}
        <Text className="font-bold">{String(label)}</Text> {/* Month */}
        <Text>: {displayValue}</Text> {/* displayValue is guaranteed string */}
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

  const chartData = view === "frequency" ? frequencyData : performanceData;
  const dataKey = view === "frequency" ? "count" : "averageLevel";
  const chartTitle =
    view === "frequency"
      ? "Workout Frequency Over Time"
      : "Performance Over Time";
  const yAxisLabel = view === "frequency" ? "WODs / Month" : "Avg Level";
  // Only set Y-axis domain for performance view
  const yDomain = view === "performance" ? [0, 4] : undefined;

  // Check if there's data to display
  if (!chartData || chartData.length === 0) {
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
          data={chartData}
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
            // Conditionally apply domain only for performance view
            {...(yDomain && { domain: yDomain })}
            allowDecimals={view === "performance"} // Allow decimals for performance axis
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
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
