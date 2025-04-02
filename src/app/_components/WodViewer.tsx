"use client";

import { useState } from "react";
import { Box, Flex, SegmentedControl, Tooltip } from "@radix-ui/themes";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, TableIcon, List } from "lucide-react";
import WodTable from "./WodTable";
import WodTimeline from "./WodTimeline";
import WodDistributionChart from "./WodDistributionChart";
import WodTimelineChart from "./WodTimelineChart"; // Import the new timeline chart
import {
  type Wod,
  // type WodResult, // Removed unused import
  type ChartDataPoint,
  type FrequencyDataPoint,
  type PerformanceDataPoint,
  type SortByType, // Import SortByType
} from "~/types/wodTypes"; // Import shared types
import {
  // getPerformanceLevelColor, // No longer defined here
  // formatSecondsToMMSS, // No longer defined here
  // getPerformanceLevelTooltip, // No longer defined here
  // formatScore, // No longer defined here
  // getNumericScore, // No longer defined here
  // getPerformanceLevel, // No longer defined here
  hasScore, // Keep hasScore import if used locally, or remove if only used in sortWods
  sortWods, // Import sortWods
} from "~/utils/wodUtils"; // Import shared utils
// import { PERFORMANCE_LEVEL_VALUES } from "~/config/constants"; // No longer needed locally

// Type definitions and helper functions are now imported from shared files

interface WodViewerProps {
  wods: Wod[];
  tagChartData: ChartDataPoint[];
  categoryChartData: ChartDataPoint[];
  frequencyData: FrequencyDataPoint[]; // Add frequency data prop
  performanceData: PerformanceDataPoint[]; // Add performance data prop
  categoryOrder: string[]; // Keep as string[] if only used for mapping keys
  tagOrder: string[]; // Keep as string[] if only used for mapping keys
}

export default function WodViewer({
  wods,
  tagChartData,
  categoryChartData,
  frequencyData, // Destructure new prop
  performanceData, // Destructure new prop
  categoryOrder,
  tagOrder,
}: WodViewerProps) {
  const [view, setView] = useState<"table" | "timeline">("table"); // Default to table view
  const [sortBy, setSortBy] = useState<SortByType>("date"); // Default sort by date
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc"); // Default sort direction desc
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [completionFilter, setCompletionFilter] = useState<
    "all" | "done" | "notDone"
  >("done"); // Default filter to done

  // Calculate counts for categories
  const categoryCounts = wods.reduce(
    (acc, wod) => {
      if (wod.category) {
        acc[wod.category] = (acc[wod.category] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );
  const totalWodCount = wods.length;

  // Calculate counts for each filter option based on the *original* wods list
  // Use imported hasScore utility
  const doneWodsCount = wods.filter((wod) =>
    wod.results.some((r) => r.date && hasScore(r)),
  ).length;
  const notDoneWodsCount = totalWodCount - doneWodsCount;

  // Filter wods by completion status - apply universally
  let filteredByCompletionWods = wods;
  if (completionFilter === "done") {
    filteredByCompletionWods = wods.filter((wod) =>
      wod.results.some((r) => r.date && hasScore(r)),
    );
  } else if (completionFilter === "notDone") {
    filteredByCompletionWods = wods.filter(
      (wod) => !wod.results.some((r) => r.date && hasScore(r)),
    );
  }

  // Filter wods by selected categories and tags
  const filteredWods = filteredByCompletionWods.filter((wod) => {
    const categoryMatch =
      selectedCategories.length === 0 ||
      (wod.category && selectedCategories.includes(wod.category));
    const tagMatch =
      selectedTags.length === 0 ||
      (wod.tags && wod.tags.some((tag) => selectedTags.includes(tag)));

    return categoryMatch && tagMatch;
  });

  // Update handleSort to accept the new type
  const handleSort = (column: SortByType) => {
    if (column === sortBy) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      // Default sort directions
      if (column === "latestLevel" || column === "level") {
        setSortDirection("desc"); // Higher level first
      } else if (column === "attempts") {
        setSortDirection("desc"); // Most attempts first
      } else if (column === "date") {
        setSortDirection("desc"); // Latest date first
      } else {
        setSortDirection("asc"); // Default others to ascending
      }
    }
  };

  // Toggle tag selection (multiple tags can be selected)
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  // Use imported sortWods utility
  const sortedWods = sortWods(filteredWods, sortBy, sortDirection);

  return (
    <Box>
      {/* Render Charts Side-by-Side */}
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
      {/* Filter Bar */}
      <Flex className="mb-4 mt-4 items-center" gap="4">
        {/* Category Select */}
        <Select.Root
          value={selectedCategories.length > 0 ? selectedCategories[0] : "all"}
          onValueChange={(value) => {
            if (value === "all") {
              setSelectedCategories([]);
            } else {
              setSelectedCategories([value]);
            }
          }}
        >
          <Select.Trigger className="mr-2 flex min-w-[130px] items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-xs text-card-foreground hover:bg-accent">
            <Select.Value placeholder="Select category" className="text-xs">
              {selectedCategories.length > 0
                ? `${selectedCategories[0]} (${categoryCounts[selectedCategories[0]] || 0})`
                : `All Categories (${totalWodCount})`}
            </Select.Value>
            <Select.Icon>
              <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content
              className="z-50 rounded-md border border-border bg-popover shadow-md"
              position="popper"
            >
              <Select.Viewport>
                <Select.Item
                  value="all"
                  className="cursor-pointer px-3 py-2 text-xs text-popover-foreground outline-none hover:bg-accent data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground"
                >
                  <Select.ItemText>
                    All Categories ({totalWodCount})
                  </Select.ItemText>
                </Select.Item>
                {/* Use categoryOrder prop for dropdown items */}
                {categoryOrder.map((category) => (
                  <Select.Item
                    key={category}
                    value={category}
                    className="cursor-pointer px-3 py-2 text-xs text-popover-foreground outline-none hover:bg-accent data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground"
                  >
                    <Select.ItemText>
                      {category} ({categoryCounts[category] || 0})
                    </Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
        {/* Tags section - wrap if needed */}
        <Flex wrap="wrap" gap="1" className="flex-grow">
          {/* Use tagOrder prop for filter buttons */}
          {tagOrder.map((tag) => (
            <Box
              key={tag}
              className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${
                selectedTags.includes(tag)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-card-foreground hover:bg-accent"
              }`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Box>
          ))}
        </Flex>
        {/* New Segmented Control Filter - always show */}
        <SegmentedControl.Root
          size="1"
          value={completionFilter}
          onValueChange={(value) =>
            setCompletionFilter(value as "all" | "done" | "notDone")
          }
          className="ml-auto" // Push to the right
        >
          <SegmentedControl.Item value="all">
            <Tooltip content="Show All Workouts">
              <span>All ({totalWodCount})</span>
            </Tooltip>
          </SegmentedControl.Item>
          <SegmentedControl.Item value="done">
            <Tooltip content="Show Done Workouts">
              <span>Done ({doneWodsCount})</span>
            </Tooltip>
          </SegmentedControl.Item>
          <SegmentedControl.Item value="notDone">
            <Tooltip content="Show Not Done Workouts">
              <span>Todo ({notDoneWodsCount})</span>
            </Tooltip>
          </SegmentedControl.Item>
        </SegmentedControl.Root>

        <Flex justify="center">
          <SegmentedControl.Root
            size="1"
            value={view}
            onValueChange={(value) => setView(value as "table" | "timeline")}
          >
            <SegmentedControl.Item value="timeline" aria-label="Timeline View">
              <Tooltip content="Timeline View">
                <List size={16} />
              </Tooltip>
            </SegmentedControl.Item>
            <SegmentedControl.Item value="table" aria-label="Table View">
              <Tooltip content="Table View">
                <TableIcon size={16} />
              </Tooltip>
            </SegmentedControl.Item>
          </SegmentedControl.Root>
        </Flex>
      </Flex>{" "}
      {/* End of Filter Bar Flex */}
      {/* Render Table or Timeline View */}
      {view === "table" ? (
        <WodTable
          wods={sortedWods}
          sortBy={sortBy}
          sortDirection={sortDirection}
          handleSort={handleSort}
        />
      ) : (
        <WodTimeline
          wods={sortedWods}
          sortBy={sortBy}
          sortDirection={sortDirection}
          handleSort={handleSort}
        />
      )}
    </Box>
  );
}
