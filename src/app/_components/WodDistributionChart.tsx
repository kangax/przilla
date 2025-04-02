"use client";

import { useState } from "react";
import { Box, Flex, SegmentedControl, Heading, Text } from "@radix-ui/themes";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps, // Import TooltipProps for typing
} from "recharts";
import {
  type NameType,
  type ValueType,
} from "recharts/types/component/DefaultTooltipContent"; // Import specific types for payload

// Define the structure for chart data points
type ChartDataPoint = {
  name: string;
  value: number;
};

interface WodDistributionChartProps {
  tagData: ChartDataPoint[];
  categoryData: ChartDataPoint[];
}

// Custom Tooltip for better display with proper types
const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) => {
  // Type guard for payload
  if (active && payload && payload.length && payload[0]?.value !== undefined) {
    return (
      <Box className="rounded bg-gray-700 p-2 text-xs text-white shadow-lg dark:bg-gray-800 dark:text-gray-200">
        <Text className="font-bold">{label}</Text>
        {/* Access value safely */}
        <Text>: {payload[0].value} WODs</Text>
      </Box>
    );
  }
  return null;
};

export default function WodDistributionChart({
  tagData,
  categoryData,
}: WodDistributionChartProps) {
  const [view, setView] = useState<"tags" | "category">("tags"); // Default to tags view

  const chartData = view === "tags" ? tagData : categoryData;
  const chartTitle =
    view === "tags" ? "Distribution by Tag" : "Distribution by Category";

  // Find the maximum value for the radius axis domain
  const maxValue = Math.max(...chartData.map((item) => item.value), 0); // Ensure domain starts at 0

  // Check if there's data to display
  if (!chartData || chartData.length === 0) {
    return <Text>No distribution data available.</Text>; // Or some placeholder
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
          onValueChange={(value) => setView(value as "tags" | "category")}
        >
          <SegmentedControl.Item value="tags">Tags</SegmentedControl.Item>
          <SegmentedControl.Item value="category">
            Category
          </SegmentedControl.Item>
        </SegmentedControl.Root>
      </Flex>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="var(--gray-a7)" /> {/* Use Radix color variable */}
          <PolarAngleAxis
            dataKey="name"
            tick={{ fill: "var(--gray-11)", fontSize: 12 }} // Use Radix color variable
          />
          {/* Adjust domain for radius axis based on max value */}
          <PolarRadiusAxis
            angle={30}
            domain={[0, Math.ceil(maxValue / 10) * 10]} // Round max value up to nearest 10 for cleaner axis
            tick={{ fill: "var(--gray-11)", fontSize: 10 }} // Use Radix color variable
          />
          <Radar
            name="WODs" // Name for the legend/tooltip
            dataKey="value"
            stroke="var(--accent-9)" // Use Radix color variable
            fill="var(--accent-9)" // Use Radix color variable
            fillOpacity={0.6}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* <Legend /> Optional: Add legend if needed */}
        </RadarChart>
      </ResponsiveContainer>
    </Box>
  );
}
