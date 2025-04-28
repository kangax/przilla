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
  isLoggedIn: boolean;
  yourData?: MovementData[];
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
  isLoggedIn,
  yourData,
}: MovementFrequencyChartProps) {
  const { resolvedTheme } = useTheme();
  const axisAndTextColor = resolvedTheme === "dark" ? "#cbd5e1" : "#4b5563"; // slate-300 : gray-600

  // Build tabs: "Your WOD's" first if logged in and yourData exists, then categories with data
  const tabsToShow: { value: string; label: string }[] = [];
  if (isLoggedIn && yourData && yourData.length > 0) {
    tabsToShow.push({ value: "yourWods", label: "Your WOD's" });
  }
  CATEGORY_TAB_ORDER.forEach((cat) => {
    if (data[cat] && data[cat].length > 0) {
      tabsToShow.push({ value: cat, label: cat });
    }
  });

  // Determine default tab
  const defaultTab =
    isLoggedIn && yourData && yourData.length > 0
      ? "yourWods"
      : tabsToShow.length > 0
        ? tabsToShow[0].value
        : "";

  const [selectedTab, setSelectedTab] = useState<string>(defaultTab);

  // Chart data for the selected tab
  // Removed unused chartData variable

  const FrequencyHeading = (
    <Heading as="h3" size="4" mb="3">
      Top 20 Movements by Frequency
    </Heading>
  );

  if (tabsToShow.length === 0) {
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
        value={selectedTab}
        onValueChange={setSelectedTab}
        defaultValue={defaultTab}
      >
        <Tabs.List size="1">
          {tabsToShow.map((tab) => (
            <Tabs.Trigger key={tab.value} value={tab.value}>
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Box pt="4">
          {tabsToShow.map((tab) => (
            <Tabs.Content key={tab.value} value={tab.value}>
              {tab.value === "yourWods" ? (
                isLoggedIn ? (
                  yourData && yourData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={600}>
                      <BarChart
                        data={yourData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: -10, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          strokeOpacity={0.3}
                        />
                        <XAxis type="number" stroke={axisAndTextColor}>
                          <Label
                            value="Frequency (Number of Workouts)"
                            position="insideBottom"
                            offset={-5}
                            fill={axisAndTextColor}
                            fontSize={12}
                          />
                        </XAxis>
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={150}
                          stroke={axisAndTextColor}
                          fontSize={12}
                          interval={0}
                        />
                        <Tooltip
                          content={<CustomTooltip />}
                          cursor={{ fill: "transparent" }}
                        />
                        <Bar
                          dataKey="value"
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
                    <Text>Log scores to see your movement frequency!</Text>
                  )
                ) : null
              ) : data[tab.value] && data[tab.value].length > 0 ? (
                <ResponsiveContainer width="100%" height={600}>
                  <BarChart
                    data={data[tab.value]}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                    <XAxis type="number" stroke={axisAndTextColor}>
                      <Label
                        value="Frequency (Number of Workouts)"
                        position="insideBottom"
                        offset={-5}
                        fill={axisAndTextColor}
                        fontSize={12}
                      />
                    </XAxis>
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={150}
                      stroke={axisAndTextColor}
                      fontSize={12}
                      interval={0}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "transparent" }}
                    />
                    <Bar
                      dataKey="value"
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
                <Text>No data for {tab.label}.</Text>
              )}
            </Tabs.Content>
          ))}
        </Box>
      </Tabs.Root>
    </Card>
  );
}
