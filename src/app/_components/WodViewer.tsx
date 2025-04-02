"use client";

import { useState } from "react";
import { Box, Flex, SegmentedControl, Tooltip } from "@radix-ui/themes";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, TableIcon, List } from "lucide-react";
import WodTable from "./WodTable";
import WodTimeline from "./WodTimeline";
import WodDistributionChart from './WodDistributionChart'; // Import the new chart component

// Type definitions for our data
export type WodResult = {
  date?: string;
  rxStatus?: string | null;
  notes?: string;
  // New score fields replacing the old 'score' field
  score_time_seconds: number | null;
  score_reps: number | null;
  score_load: number | null;
  score_rounds_completed: number | null;
  score_partial_reps: number | null;
};

export type BenchmarkLevel = {
  min: number | null;
  max: number | null;
};

export type Benchmarks = {
  type: "time" | "rounds" | "reps" | "load";
  levels: {
    elite: BenchmarkLevel;
    advanced: BenchmarkLevel;
    intermediate: BenchmarkLevel;
    beginner: BenchmarkLevel;
  };
};

export type Wod = {
  wodUrl: string;
  wodName: string;
  description?: string;
  benchmarks?: Benchmarks;
  results: WodResult[];
  // New fields for categorization
  category?: 'Girl' | 'Hero' | 'Games' | 'Open' | 'Benchmark' | 'Other';
  tags?: Array<'Chipper' | 'Couplet' | 'Triplet' | 'EMOM' | 'AMRAP' | 'For Time' | 'Ladder'>;
};

// Helper function to get the color for a performance level
export const getPerformanceLevelColor = (level: string | null): string => {
  // Using darker shades for better contrast in light mode
  switch (level) {
    case "elite":
      return "text-purple-600 dark:text-purple-400";
    case "advanced":
      return "text-green-600 dark:text-green-400";
    case "intermediate":
      return "text-yellow-600 dark:text-yellow-400"; // yellow-600 might still be tricky, consider dark:text-yellow-300?
    case "beginner":
      return "text-red-600 dark:text-red-400";
    default:
      // Use a slightly less faded color for default/scaled in light mode
      return "text-foreground/70 dark:text-foreground/60";
  }
};

// Helper function to format seconds to MM:SS
export const formatSecondsToMMSS = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Helper function to get the tooltip content showing all performance levels
export const getPerformanceLevelTooltip = (wod: Wod, currentLevel: string | null): string => {
  if (!wod.benchmarks) return "No benchmark data available";

  const { levels, type } = wod.benchmarks;
  const levelOrder: Array<keyof typeof levels> = ['elite', 'advanced', 'intermediate', 'beginner'];
  const tooltipLines: string[] = [];

  levelOrder.forEach(levelName => {
    const levelData = levels[levelName];
    let formattedRange = "";

    if (type === "time") {
      // Lower is better for time
      const min = levelData.min !== null ? formatSecondsToMMSS(levelData.min) : "0:00"; // Usually 0 for time min
      const max = levelData.max !== null ? formatSecondsToMMSS(levelData.max) : "∞";
      formattedRange = `${min} - ${max}`; // Show range like 0:00 - 2:00
    } else {
      // Higher is better for reps, load, rounds
      const min = levelData.min !== null ? levelData.min.toString() : "0";
      const max = levelData.max !== null ? levelData.max.toString() : "∞";
      formattedRange = `${min} - ${max} ${type}`; // Show range like 25 - ∞ rounds
    }
    
    // Capitalize level name
    const capitalizedLevelName = levelName.charAt(0).toUpperCase() + levelName.slice(1);
    tooltipLines.push(`${capitalizedLevelName}: ${formattedRange}`);
  });

  return tooltipLines.join("\n"); // Join with newline for multi-line tooltip
};


// Helper function to format score based on the available score fields
export const formatScore = (result: WodResult): string => {
  if (result.score_time_seconds !== null) {
    return formatSecondsToMMSS(result.score_time_seconds);
  } else if (result.score_reps !== null) {
    return `${result.score_reps} reps`;
  } else if (result.score_load !== null) {
    return `${result.score_load} lbs`;
  } else if (result.score_rounds_completed !== null) {
    if (result.score_partial_reps !== null && result.score_partial_reps > 0) {
      return `${result.score_rounds_completed}+${result.score_partial_reps}`;
    } else {
      return `${result.score_rounds_completed}`;
    }
  }
  return "";
};

// Helper function to get numeric score for performance level calculation
export const getNumericScore = (wod: Wod, result: WodResult): number | null => {
  if (!wod.benchmarks) return null;

  if (wod.benchmarks.type === "time" && result.score_time_seconds !== null) {
    return result.score_time_seconds;
  } else if (wod.benchmarks.type === "reps" && result.score_reps !== null) {
    return result.score_reps;
  } else if (wod.benchmarks.type === "load" && result.score_load !== null) {
    return result.score_load;
  } else if (wod.benchmarks.type === "rounds" && result.score_rounds_completed !== null) {
    // Convert rounds+reps to a decimal number (e.g., 5+10 becomes 5.1)
    const partialReps = result.score_partial_reps || 0;
    return result.score_rounds_completed + (partialReps / 100);
  }

  return null;
};

export const getPerformanceLevel = (wod: Wod, result: WodResult): string | null => {
  if (!wod.benchmarks) return null;

  const numericScore = getNumericScore(wod, result);
  if (numericScore === null) return null;

  // Determine the performance level based on the benchmarks
  const { levels } = wod.benchmarks;

  if (wod.benchmarks.type === "time") {
    // For time-based workouts, lower is better
    if (levels.elite.max !== null && numericScore <= levels.elite.max) return "elite";
    if (levels.advanced.max !== null && numericScore <= levels.advanced.max) return "advanced";
    if (levels.intermediate.max !== null && numericScore <= levels.intermediate.max) return "intermediate";
    return "beginner";
  } else {
    // For rounds/reps/load-based workouts, higher is better
    if (levels.elite.min !== null && numericScore >= levels.elite.min) return "elite";
    if (levels.advanced.min !== null && numericScore >= levels.advanced.min) return "advanced";
    if (levels.intermediate.min !== null && numericScore >= levels.intermediate.min) return "intermediate";
    return "beginner";
  }
};

// Helper function to check if a result has any score
export const hasScore = (result: WodResult): boolean => {
  return result.score_time_seconds !== null ||
         result.score_reps !== null ||
         result.score_load !== null ||
          result.score_rounds_completed !== null;
 };

 // Define the type for sorting columns including the new one
 type SortByType = "wodName" | "date" | "level" | "attempts" | "latestLevel";

 // Update function signature to use SortByType
 export const sortWods = (wodsToSort: Wod[], sortBy: SortByType, sortDirection: "asc" | "desc"): Wod[] => {
   return [...wodsToSort].sort((a, b) => {
     const directionMultiplier = sortDirection === "asc" ? 1 : -1;

    if (sortBy === "wodName") {
      const nameA = a.wodName.toUpperCase();
      const nameB = b.wodName.toUpperCase();
      if (nameA < nameB) return -1 * directionMultiplier;
      if (nameA > nameB) return 1 * directionMultiplier;
       return 0;
     } else if (sortBy === "date") {
       // Find the earliest valid date for comparison (matching test description)
       const earliestDateA = [...a.results]
         .filter(r => r.date && hasScore(r)) // Ensure result has date and score
         .map(r => new Date(r.date).getTime())
         .sort((d1, d2) => d1 - d2)[0] ?? Infinity; // Use Infinity if no valid date (sorts last asc, first desc)
       const earliestDateB = [...b.results]
         .filter(r => r.date && hasScore(r)) // Ensure result has date and score
         .map(r => new Date(r.date).getTime())
         .sort((d1, d2) => d1 - d2)[0] ?? Infinity; // Use Infinity if no valid date

       // Handle Infinity cases correctly based on sort direction
       if (earliestDateA === Infinity && earliestDateB === Infinity) {
         // If both have no date, sort by name
         return a.wodName.localeCompare(b.wodName);
       } else if (earliestDateA === Infinity) {
         return 1 * directionMultiplier; // No date sorts after dates
       } else if (earliestDateB === Infinity) {
         return -1 * directionMultiplier; // No date sorts after dates
       }

       // If dates are different, sort by date
       if (earliestDateA !== earliestDateB) {
         return (earliestDateA - earliestDateB) * directionMultiplier;
       } else {
         // If dates are the same (or both Infinity), sort by name ascending for stability
         return a.wodName.localeCompare(b.wodName);
       }

     } else if (sortBy === "attempts") {
      // Sort by the number of attempts (results array length)
      const attemptsA = a.results.filter(r => r.date && hasScore(r)).length;
      const attemptsB = b.results.filter(r => r.date && hasScore(r)).length;
          return (attemptsA - attemptsB) * directionMultiplier;
    } else if (sortBy === "level" || sortBy === "latestLevel") { // Combine level and latestLevel logic slightly
      // --- Logic to find the result to compare ---
      // Explicitly type resultA and resultB
      let resultA: WodResult | null = null;
      let resultB: WodResult | null = null;

      // Find the relevant result based on sort type
      const findResult = (wod: Wod): WodResult | null => {
        const validResults = wod.results.filter(r => r.date && hasScore(r));
        if (validResults.length === 0) return null;

        if (sortBy === "level") {
          // 'level' uses the *first* result chronologically
          return validResults.sort((r1, r2) => new Date(r1.date).getTime() - new Date(r2.date).getTime())[0];
        } else { // sortBy === "latestLevel"
          // 'latestLevel' uses the *last* result chronologically
          return validResults.sort((r1, r2) => new Date(r2.date).getTime() - new Date(r1.date).getTime())[0];
        }
      };

      resultA = findResult(a);
      resultB = findResult(b);

      // --- Comparison logic using resultA and resultB ---

      // --- Revised Comparison Logic ---
      // Get levels and scores, handling null results (treat as lowest level: 0)
      const levelA = resultA ? getPerformanceLevel(a, resultA) : null;
      const levelB = resultB ? getPerformanceLevel(b, resultB) : null;

      // Assign numerical values for levels (higher is better)
      const levelValues: Record<string, number> = { elite: 4, advanced: 3, intermediate: 2, beginner: 1 };
      const levelValueA = levelA ? levelValues[levelA] ?? 0 : 0;
      const levelValueB = levelB ? levelValues[levelB] ?? 0 : 0;

      // Assign a base score for Rx vs Scaled (Rx is much higher)
      // Add null checks for resultA/B before accessing rxStatus
      const isScaledA = resultA && resultA.rxStatus && resultA.rxStatus !== "Rx";
      const isScaledB = resultB && resultB.rxStatus && resultB.rxStatus !== "Rx";
      const baseScoreA = resultA ? (isScaledA ? 0 : 10) : 0; // Score 0 if no result
      const baseScoreB = resultB ? (isScaledB ? 0 : 10) : 0; // Score 0 if no result

      // Calculate final sort score
      const finalScoreA = baseScoreA + levelValueA;
      const finalScoreB = baseScoreB + levelValueB;

      // Compare final scores
      if (finalScoreA !== finalScoreB) {
         return (finalScoreA - finalScoreB) * directionMultiplier;
       }

       // If scores are the same, sort by name, respecting the overall direction
       const nameCompare = a.wodName.localeCompare(b.wodName);
       if (nameCompare !== 0) {
           return nameCompare * directionMultiplier; // Directly use localeCompare result
       }
       return 0; // Names are identical
     }
    return 0;
  });
};


// Categories and tags for filtering
const CATEGORIES = ['Girl', 'Hero', 'Games', 'Open', 'Benchmark', 'Other'];
// Define the structure for chart data points
type ChartDataPoint = {
  name: string;
  value: number;
};

interface WodViewerProps {
  wods: Wod[];
  tagChartData: ChartDataPoint[];
  categoryChartData: ChartDataPoint[];
  categoryOrder: string[];
  tagOrder: string[]; // Add prop for desired tag order
}

// Remove the hardcoded TAGS constant
// const TAGS = ['Chipper', 'Couplet', 'Triplet', 'EMOM', 'AMRAP', 'For Time', 'Ladder'];


export default function WodViewer({ wods, tagChartData, categoryChartData, categoryOrder, tagOrder }: WodViewerProps) { // Destructure new props
  const [view, setView] = useState<"table" | "timeline">("table"); // Default to table view
  const [sortBy, setSortBy] = useState<SortByType>("date"); // Default sort by date
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc"); // Default sort direction desc
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [completionFilter, setCompletionFilter] = useState<"all" | "done" | "notDone">("done"); // Default filter to done

  // Calculate counts for categories
  const categoryCounts = wods.reduce((acc, wod) => {
    if (wod.category) {
      acc[wod.category] = (acc[wod.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  const totalWodCount = wods.length;

  // Calculate counts for each filter option based on the *original* wods list
  const doneWodsCount = wods.filter(wod =>
    wod.results.some(r => r.date && hasScore(r)) // Check if *any* result is valid
  ).length;
  const notDoneWodsCount = totalWodCount - doneWodsCount;


  // Filter wods by completion status - apply universally
  let filteredByCompletionWods = wods;
  if (completionFilter === "done") {
    filteredByCompletionWods = wods.filter(wod => wod.results.some(r => r.date && hasScore(r)));
  } else if (completionFilter === "notDone") {
    filteredByCompletionWods = wods.filter(wod => !wod.results.some(r => r.date && hasScore(r)));
  }
  // No 'else' needed, 'all' shows everything by default

  // Filter wods by selected categories and tags
  const filteredWods = filteredByCompletionWods.filter(wod => {
    const categoryMatch = selectedCategories.length === 0 ||
      (wod.category && selectedCategories.includes(wod.category));
    const tagMatch = selectedTags.length === 0 ||
      (wod.tags && wod.tags.some(tag => selectedTags.includes(tag)));

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
      }
      else {
        setSortDirection("asc"); // Default others to ascending
      }
    }
  };

  // Toggle tag selection (multiple tags can be selected)
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const sortedWods = sortWods(filteredWods, sortBy, sortDirection);

  return (
          <Box>
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
                <Select.Trigger
                  className="min-w-[130px] flex items-center justify-between px-3 py-2 mr-2 rounded-md border border-border bg-card text-card-foreground hover:bg-accent text-xs"
                >
                  <Select.Value placeholder="Select category" className="text-xs">
                    {selectedCategories.length > 0
                      ? `${selectedCategories[0]} (${categoryCounts[selectedCategories[0]] || 0})`
                      : `All Categories (${totalWodCount})`}
                  </Select.Value>
                  <Select.Icon>
                    <ChevronDown className="h-4 w-4 opacity-70 ml-2" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content
                    className="bg-popover border border-border rounded-md shadow-md z-50"
                    position="popper"
                  >
                    <Select.Viewport>
                      <Select.Item
                        value="all"
                        className="px-3 py-2 cursor-pointer text-popover-foreground hover:bg-accent data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground outline-none text-xs"
                      >
                        <Select.ItemText>All Categories ({totalWodCount})</Select.ItemText>
                      </Select.Item>
                      {/* Use categoryOrder prop for dropdown items */}
                      {categoryOrder.map(category => (
                        <Select.Item
                          key={category}
                          value={category}
                          className="px-3 py-2 cursor-pointer text-popover-foreground hover:bg-accent data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground outline-none text-xs"
                        >
                          <Select.ItemText>{category} ({categoryCounts[category] || 0})</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
              {/* Tags section - wrap if needed */}
              <Flex wrap="wrap" gap="1" className="flex-grow">
                 {/* Use tagOrder prop for filter buttons */}
                {tagOrder.map(tag => (
                  <Box
                    key={tag}
                    className={`px-3 py-1 rounded-full text-xs border cursor-pointer ${
                      selectedTags.includes(tag)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-card-foreground border-border hover:bg-accent'
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
                onValueChange={(value) => setCompletionFilter(value as "all" | "done" | "notDone")}
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
              {/* Removed the closing parenthesis for the conditional rendering */}

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

            </Flex> {/* End of Filter Bar Flex */}

            {/* Render the Distribution Chart */}
            <WodDistributionChart tagData={tagChartData} categoryData={categoryChartData} />

            {view === "table" ? (
              <WodTable wods={sortedWods} sortBy={sortBy} sortDirection={sortDirection} handleSort={handleSort} />
            ) : (
              <WodTimeline wods={sortedWods} sortBy={sortBy} sortDirection={sortDirection} handleSort={handleSort} />
            )}
          </Box>
  );
}
