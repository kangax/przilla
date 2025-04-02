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

// Custom Tooltip for better display
const CustomTimelineTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload; // Access the full data point
    const value = payload[0].value;
    const name = payload[0].name; // 'count' or 'averageLevel'

    let displayValue: string;
    if (name === "count") {
      displayValue = `${value} WODs`;
    } else if (name === "averageLevel") {
      // Format average level to 2 decimal places
      displayValue = `Avg Level: ${Number(value).toFixed(2)}`;
    } else {
      displayValue = String(value);
    }

    return (
      <Box className="rounded bg-gray-700 p-2 text-xs text-white shadow-lg dark:bg-gray-800 dark:text-gray-200">
        <Text className="font-bold">{label}</Text> {/* Month */}
        <Text>: {displayValue}</Text>
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
