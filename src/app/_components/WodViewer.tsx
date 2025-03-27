"use client";

import { useState } from "react";
import { Box, Tabs, Flex, Badge } from "@radix-ui/themes";
import * as Select from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import WodTable from "./WodTable";
import WodTimeline from "./WodTimeline";

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
  tags?: Array<'Chipper' | 'Couplet' | 'Triplet' | 'EMOM' | 'AMRAP' | 'For Time' | 'Ladder' | 'Partner' | 'Team'>;
};

// Helper function to get the color for a performance level
export const getPerformanceLevelColor = (level: string | null): string => {
  switch (level) {
    case "elite":
      return "text-purple-400";
    case "advanced":
      return "text-green-400";
    case "intermediate":
      return "text-yellow-400";
    case "beginner":
      return "text-red-400";
    default:
      return "text-gray-500";
  }
};

// Helper function to format seconds to MM:SS
export const formatSecondsToMMSS = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Helper function to get the tooltip content for a performance level
export const getPerformanceLevelTooltip = (wod: Wod, level: string | null): string => {
  if (!wod.benchmarks || !level) return "No benchmark data available";
  
  const { levels, type } = wod.benchmarks;
  const levelData = levels[level as keyof typeof levels];
  
  if (type === "time") {
    // Format time in seconds to MM:SS
    const min = levelData.min !== null ? formatSecondsToMMSS(levelData.min) : "0:00";
    const max = levelData.max !== null ? formatSecondsToMMSS(levelData.max) : "∞";
    return `${level.charAt(0).toUpperCase() + level.slice(1)}: ${min} - ${max}`;
  } else {
    const min = levelData.min !== null ? levelData.min.toString() : "0";
    const max = levelData.max !== null ? levelData.max.toString() : "∞";
    return `${level.charAt(0).toUpperCase() + level.slice(1)}: ${min} - ${max} ${type}`;
  }
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
 
 // Update function signature to use SortByType
 const sortWods = (wodsToSort: Wod[], sortBy: SortByType, sortDirection: "asc" | "desc"): Wod[] => {
   return [...wodsToSort].sort((a, b) => {
     const directionMultiplier = sortDirection === "asc" ? 1 : -1;

    if (sortBy === "wodName") {
      const nameA = a.wodName.toUpperCase();
      const nameB = b.wodName.toUpperCase();
      if (nameA < nameB) return -1 * directionMultiplier;
      if (nameA > nameB) return 1 * directionMultiplier;
      return 0;
    } else if (sortBy === "date") {
      const dateA = a.results[0]?.date ? new Date(a.results[0].date) : new Date('1970-01-01');
      const dateB = b.results[0]?.date ? new Date(b.results[0].date) : new Date('1970-01-01');
      return (dateA.getTime() - dateB.getTime()) * directionMultiplier;
    } else if (sortBy === "attempts") {
      // Sort by the number of attempts (results array length)
      const attemptsA = a.results.filter(r => r.date && hasScore(r)).length;
      const attemptsB = b.results.filter(r => r.date && hasScore(r)).length;
          return (attemptsA - attemptsB) * directionMultiplier;
    } else if (sortBy === "level" || sortBy === "latestLevel") { // Combine level and latestLevel logic slightly
      // --- Logic to find the result to compare ---
      let resultA = null;
      let resultB = null;

      if (sortBy === "level") {
        // Original 'level' sort uses the first result
        resultA = a.results[0] ?? null;
        resultB = b.results[0] ?? null;
      } else { // sortBy === "latestLevel"
        // Find the latest valid result for 'a'
        const latestValidResultA = [...a.results]
          .filter(r => r.date && hasScore(r))
          .sort((r1, r2) => new Date(r2.date!).getTime() - new Date(r1.date!).getTime())[0];
        resultA = latestValidResultA ?? null;
        
        // Find the latest valid result for 'b'
        const latestValidResultB = [...b.results]
          .filter(r => r.date && hasScore(r))
          .sort((r1, r2) => new Date(r2.date!).getTime() - new Date(r1.date!).getTime())[0];
        resultB = latestValidResultB ?? null;
      }
      
      // --- Comparison logic using resultA and resultB ---
      
      // Handle cases where one or both results are missing
      if (!resultA && !resultB) return 0;
      if (!resultA) return 1 * directionMultiplier; // Treat missing result as lowest level
      if (!resultB) return -1 * directionMultiplier; // Treat missing result as lowest level

      // --- Revised Comparison Logic ---
      const isScaledA = resultA.rxStatus && resultA.rxStatus !== "Rx";
      const isScaledB = resultB.rxStatus && resultB.rxStatus !== "Rx";
      
      const levelA = getPerformanceLevel(a, resultA);
      const levelB = getPerformanceLevel(b, resultB);

      // Assign numerical values for levels (higher is better)
      const levelValues: { [key: string]: number } = { elite: 4, advanced: 3, intermediate: 2, beginner: 1 };
      const levelValueA = levelA ? levelValues[levelA] ?? 0 : 0;
      const levelValueB = levelB ? levelValues[levelB] ?? 0 : 0;

      // Assign a base score for Rx vs Scaled (Rx is much higher)
      const baseScoreA = isScaledA ? 0 : 10; 
      const baseScoreB = isScaledB ? 0 : 10;

      // Calculate final sort score
      const finalScoreA = baseScoreA + levelValueA;
      const finalScoreB = baseScoreB + levelValueB;

      // Compare final scores
      if (finalScoreA !== finalScoreB) {
        return (finalScoreA - finalScoreB) * directionMultiplier;
      }

      // If scores are the same, maintain original order (or sort by date?)
      return 0;

      // --- Old Comparison Logic (kept for reference) ---
      // Check if results are scaled first
      // const isScaledA = resultA.rxStatus && resultA.rxStatus !== "Rx";
      // const isScaledB = resultB.rxStatus && resultB.rxStatus !== "Rx";
      // If one is scaled and the other isn't, the non-scaled one ranks higher (adjust multiplier later)
      // if (!isScaledA && isScaledB) return -1; // a (Rx) is better than b (Scaled)
      // if (isScaledA && !isScaledB) return 1;  // b (Rx) is better than a (Scaled)
      // If both are scaled or both are Rx, sort by performance level
      // const levelA = getPerformanceLevel(a, resultA);
      // const levelB = getPerformanceLevel(b, resultB);
      // Define the order of levels for sorting (elite is best)
      // Assign numerical values for comparison (higher is better)
      // const levelValues: { [key: string]: number } = { elite: 4, advanced: 3, intermediate: 2, beginner: 1 };
      // const valueA = levelA ? levelValues[levelA] ?? 0 : 0; // Assign 0 if level is null
      // const valueB = levelB ? levelValues[levelB] ?? 0 : 0; // Assign 0 if level is null
      // Compare the values and apply direction multiplier
      // if (valueA !== valueB) {
      //   return (valueA - valueB) * directionMultiplier;
      // }
      // If levels are the same, maintain original order (or sort by date as secondary?)
      // return 0; 
      
      // --- Old level comparison logic (kept for reference) ---
      // Define the order of levels for sorting (beginner is highest in the new order)
      // const levelOrder = ["beginner", "intermediate", "advanced", "elite", null];
      // Get the index of each level in the order array
      // const indexA = levelOrder.indexOf(levelA);
      // const indexB = levelOrder.indexOf(levelB);
      // Compare the indices (lower index = higher in the sort order)
      // return (indexA - indexB) * directionMultiplier;
    }
    return 0;
  });
};

// Define the type for sorting columns including the new one
type SortByType = "wodName" | "date" | "level" | "attempts" | "latestLevel";

// Categories and tags for filtering
const CATEGORIES = ['Girl', 'Hero', 'Games', 'Open', 'Benchmark', 'Other'];
const TAGS = ['Chipper', 'Couplet', 'Triplet', 'EMOM', 'AMRAP', 'For Time', 'Ladder', 'Partner', 'Team'];

export default function WodViewer({ wods }: { wods: Wod[] }) {
  const [view, setView] = useState<"table" | "timeline">("timeline");
  // Update state type and initial value if desired (keeping 'attempts' for now, UI will trigger 'latestLevel')
  const [sortBy, setSortBy] = useState<SortByType>("attempts"); 
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [completionFilter, setCompletionFilter] = useState<"all" | "done" | "notDone">("all");

  // Calculate counts for each filter option
  const doneWods = wods.filter(wod => 
    wod.results.length > 0 && wod.results[0]?.date && hasScore(wod.results[0])
  );
  const notDoneWods = wods.filter(wod => 
    wod.results.length === 0 || !wod.results[0]?.date || !hasScore(wod.results[0])
  );
  
  // Filter wods by completion status - only apply in table view
  let filteredByCompletionWods = wods;
  if (view === "table") {
    if (completionFilter === "done") {
      filteredByCompletionWods = doneWods;
    } else if (completionFilter === "notDone") {
      filteredByCompletionWods = notDoneWods;
    }
  } else {
    // In timeline view, only show completed workouts
    filteredByCompletionWods = doneWods;
  }

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
      if (column === "latestLevel") {
        setSortDirection("desc"); // Higher level first
      } else if (column === "attempts") {
        setSortDirection("desc"); // Most attempts first
      } else {
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
    <Tabs.Root defaultValue={view}>
          <Tabs.List>
            <Tabs.Trigger value="timeline" onClick={() => setView("timeline")}>Timeline View</Tabs.Trigger>
            <Tabs.Trigger value="table" onClick={() => setView("table")}>Table View</Tabs.Trigger>
          </Tabs.List>
          
          <Box className="mt-4">
            {/* Categories Filter */}
            <Box className="mb-2 mt-4 rt-Flex items-center">
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
                  className="min-w-[130px] flex items-center justify-between px-3 py-2 mr-2 rounded-md border border-border bg-card text-card-foreground hover:bg-accent text-sm"
                >
                  <Select.Value placeholder="Select category" className="text-sm">
                    {selectedCategories.length > 0 
                      ? selectedCategories[0] 
                      : "All Categories"}
                  </Select.Value>
                  <Select.Icon>
                    <ChevronDown className="h-4 w-4 opacity-70" />
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
                        className="px-3 py-2 cursor-pointer text-popover-foreground hover:bg-accent data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground outline-none text-sm"
                      >
                        <Select.ItemText>All Categories</Select.ItemText>
                      </Select.Item>
                      {CATEGORIES.map(category => (
                        <Select.Item 
                          key={category}
                          value={category} 
                          className="px-3 py-2 cursor-pointer text-popover-foreground hover:bg-accent data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground outline-none text-sm"
                        >
                          <Select.ItemText>{category}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
              {/* Tags section */}
              <Flex wrap="wrap" gap="2">
                {TAGS.map(tag => (
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
              {/* Clear filters button */}
              {(selectedCategories.length > 0 || selectedTags.length > 0 || (view === "table" && completionFilter !== "all")) && (
                <button 
                  onClick={() => {
                    setSelectedCategories([]);
                    setSelectedTags([]);
                    setCompletionFilter("all");
                  }}
                  className="text-sm text-primary hover:underline ml-2"
                >
                  &times;
                </button>
                )}
            </Box>

            {/* Completion Status Toggle - only show in table view */}
            {view === "table" && (
              <Box className="mb-4 mt-2">
                <Flex gap="1">
                  <Box 
                    className={`px-3 py-1 rounded-md text-sm border cursor-pointer flex-1 text-center ${
                      completionFilter === "all" 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-card text-card-foreground border-border hover:bg-accent'
                    }`}
                    onClick={() => setCompletionFilter("all")}
                  >
                    All ({wods.length})
                  </Box>
                  <Box 
                    className={`px-3 py-1 rounded-md text-sm border cursor-pointer flex-1 text-center ${
                      completionFilter === "done" 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-card text-card-foreground border-border hover:bg-accent'
                    }`}
                    onClick={() => setCompletionFilter("done")}
                  >
                    Done ({doneWods.length})
                  </Box>
                  <Box 
                    className={`px-3 py-1 rounded-md text-sm border cursor-pointer flex-1 text-center ${
                      completionFilter === "notDone" 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-card text-card-foreground border-border hover:bg-accent'
                    }`}
                    onClick={() => setCompletionFilter("notDone")}
                  >
                    Not Done ({notDoneWods.length})
                  </Box>
                </Flex>
              </Box>
            )}
            
            {view === "table" ? (
              <WodTable wods={sortedWods} sortBy={sortBy} sortDirection={sortDirection} handleSort={handleSort} />
            ) : (
              <WodTimeline wods={sortedWods} sortBy={sortBy} sortDirection={sortDirection} handleSort={handleSort} />
            )}
          </Box>
        </Tabs.Root>
  );
}
