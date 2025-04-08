"use client";

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Label, // <-- Import Label
  type TooltipProps, // Import TooltipProps type
} from "recharts";
import { Box, Card, Heading, Tabs, Text } from "@radix-ui/themes";
import { useTheme } from "next-themes";

// Update interface to include wodNames
interface MovementData {
  name: string;
  value: number; // Frequency count
  wodNames: string[]; // List of WODs where the movement appears
}

interface MovementFrequencyChartProps {
  data: Record<string, MovementData[]>; // Keyed by category name
}

// Custom Tooltip Content Renderer
const CustomTooltip = ({
  active,
  payload,
  label: _label, // Prefix unused label prop with underscore
}: TooltipProps<number, string>) => {
  const { resolvedTheme } = useTheme();
  const textColor = resolvedTheme === "dark" ? "#cbd5e1" : "#4b5563"; // slate-300 : gray-600
  const bgColor = resolvedTheme === "dark" ? "#1f2937" : "#ffffff"; // gray-800 : white
  const borderColor = resolvedTheme === "dark" ? "#374151" : "#e5e7eb"; // gray-700 : gray-200

  if (active && payload && payload.length) {
    const data = payload[0].payload as MovementData; // Access the full payload object
    const wodList = data.wodNames.join(", ");
    const maxWodListLength = 150; // Limit length to prevent huge tooltips
    const truncatedWodList =
      wodList.length > maxWodListLength
        ? `${wodList.substring(0, maxWodListLength)}...`
        : wodList;

    return (
      <Box
        className="recharts-custom-tooltip"
        style={{
          backgroundColor: bgColor,
          border: `1px solid ${borderColor}`,
          padding: "10px",
          color: textColor,
          borderRadius: "4px",
          fontSize: "12px",
          maxWidth: "300px", // Limit width
          whiteSpace: "normal", // Allow text wrapping
        }}
      >
        <Text weight="bold">{data.name}</Text>
        <Box mt="1">
          <Text>
            Seen in {data.value} workout{data.value !== 1 ? "s" : ""}:
          </Text>
          <Text style={{ display: "block", marginTop: "4px" }}>
            {truncatedWodList}
          </Text>
        </Box>
      </Box>
    );
  }

  return null;
};

// Define the order for categories in the tabs
const CATEGORY_TAB_ORDER = [
  "Girl",
  "Hero",
  "Benchmark",
  "Open",
  "Quarterfinals",
  "Games", // Added Games category
]; // Add others as needed

export default function MovementFrequencyChart({
  data,
}: MovementFrequencyChartProps) {
  const { resolvedTheme } = useTheme();
  const axisAndTextColor = resolvedTheme === "dark" ? "#cbd5e1" : "#4b5563"; // slate-300 : gray-600

  // Filter categories that actually have data and respect the desired order
  const availableCategories = CATEGORY_TAB_ORDER.filter(
    (cat) => data[cat] && data[cat].length > 0,
  );

  const [selectedCategory, setSelectedCategory] = useState<string>(
    availableCategories[0] || "", // Default to the first available category
  );

  const chartData = data[selectedCategory] || [];

  const FrequencyHeading = (
    <Heading as="h3" size="4" mb="3">
      Top 20 Movements by Frequency
    </Heading>
  );

  if (availableCategories.length === 0) {
    return (
      <Card size="3">
        {FrequencyHeading}
        <Text>No movement frequency data available to display.</Text>
      </Card>
    );
  }

  return (
    <Card size="3">
      {FrequencyHeading}
      <Tabs.Root
        value={selectedCategory}
        onValueChange={setSelectedCategory}
        defaultValue={availableCategories[0]}
      >
        <Tabs.List size="1">
          {availableCategories.map((category) => (
            <Tabs.Trigger key={category} value={category}>
              {category}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Box pt="4">
          {availableCategories.map((category) => (
            <Tabs.Content key={category} value={category}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={600}>
                  {/* Increased height */}
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                    <XAxis type="number" stroke={axisAndTextColor}>
                      {/* Add X-axis label */}
                      <Label
                        value="Frequency (Number of Workouts)"
                        position="insideBottom"
                        offset={-5} // Adjust offset as needed
                        fill={axisAndTextColor}
                        fontSize={12}
                      />
                    </XAxis>
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={200} // Increased width for longer movement names
                      stroke={axisAndTextColor}
                      fontSize={12}
                      interval={0} // Show all labels
                    />
                    {/* Use the custom tooltip component */}
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "transparent" }}
                    />
                    <Bar
                      dataKey="value" // Still use value for bar length
                      fill="var(--accent-9)"
                      radius={[0, 4, 4, 0]}
                    >
                      <LabelList
                        dataKey="value"
                        position="right"
                        fill={axisAndTextColor}
                        fontSize={12}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Text>No data for {category}.</Text>
              )}
            </Tabs.Content>
          ))}
        </Box>
      </Tabs.Root>
    </Card>
  );
}
