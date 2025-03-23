"use client";

import { useState } from "react";
import { Box, Tabs, Flex, Table, Text, Tooltip } from "@radix-ui/themes";
import Link from "next/link";
import WodTable from "./WodTable";
import WodTimeline from "./WodTimeline";

// Type definitions for our data
export type WodResult = {
  date?: string;
  score?: string;
  rxStatus?: string | null;
  notes?: string;
};

export type BenchmarkLevel = {
  min: number | null;
  max: number | null;
};

export type Benchmarks = {
  type: "time" | "rounds" | "reps";
  certainty: number;
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
};

// Helper function to calculate performance level
// Helper function to get the color for a performance level
export const getPerformanceLevelColor = (level: string | null): string => {
  switch (level) {
    case "elite":
      return "text-purple-400"; // Gold
    case "advanced":
      return "text-green-400"; // Blue
    case "intermediate":
      return "text-yellow-400"; // Green
    case "beginner":
      return "text-red-400"; // Gray
    default:
      return "text-gray-500"; // Default
  }
};

// Helper function to get the tooltip content for a performance level
export const getPerformanceLevelTooltip = (wod: Wod, level: string | null): string => {
  if (!wod.benchmarks || !level) return "No benchmark data available";
  
  const { levels, type } = wod.benchmarks;
  const levelData = levels[level as keyof typeof levels];
  
  if (type === "time") {
    const min = levelData.min !== null ? `${Math.floor(levelData.min)}:${(levelData.min % 1 * 60).toFixed(0).padStart(2, '0')}` : "0:00";
    const max = levelData.max !== null ? `${Math.floor(levelData.max)}:${(levelData.max % 1 * 60).toFixed(0).padStart(2, '0')}` : "∞";
    return `${level.charAt(0).toUpperCase() + level.slice(1)}: ${min} - ${max}`;
  } else {
    const min = levelData.min !== null ? levelData.min.toString() : "0";
    const max = levelData.max !== null ? levelData.max.toString() : "∞";
    return `${level.charAt(0).toUpperCase() + level.slice(1)}: ${min} - ${max} ${type}`;
  }
};

export const getPerformanceLevel = (wod: Wod, score?: string): string | null => {
  if (!wod.benchmarks || !score) return null;
  
  // Parse the score
  let numericScore: number | null = null;
  
  if (wod.benchmarks.type === "time") {
    // Parse time format (e.g., "5:57" to 5.95 minutes)
    const timeParts = score.split(":");
    if (timeParts.length === 2) {
      const minutes = parseInt(timeParts[0], 10);
      const seconds = parseInt(timeParts[1], 10);
      numericScore = minutes + seconds / 60;
    } else {
      numericScore = parseFloat(score);
    }
  } else if (wod.benchmarks.type === "rounds" || wod.benchmarks.type === "reps") {
    // Parse rounds+reps format (e.g., "20+5" to 20.5 rounds)
    const roundsParts = score.split("+");
    if (roundsParts.length === 2) {
      const rounds = parseInt(roundsParts[0], 10);
      const reps = parseInt(roundsParts[1], 10);
      numericScore = rounds + reps / 100; // Using a fraction for reps
    } else {
      numericScore = parseFloat(score);
    }
  }
  
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
    // For rounds/reps-based workouts, higher is better
    if (levels.elite.min !== null && numericScore >= levels.elite.min) return "elite";
    if (levels.advanced.min !== null && numericScore >= levels.advanced.min) return "advanced";
    if (levels.intermediate.min !== null && numericScore >= levels.intermediate.min) return "intermediate";
    return "beginner";
  }
};

const sortWods = (wodsToSort: Wod[], sortBy: "wodName" | "date" | "level", sortDirection: "asc" | "desc"): Wod[] => {
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
    } else if (sortBy === "level") {
      // For level sorting, we need to get the performance level of the first result
      const levelA = getPerformanceLevel(a, a.results[0]?.score);
      const levelB = getPerformanceLevel(b, b.results[0]?.score);
      
      // Define the order of levels for sorting (elite is highest)
      const levelOrder = ["elite", "advanced", "intermediate", "beginner", null];
      
      // Get the index of each level in the order array
      const indexA = levelOrder.indexOf(levelA);
      const indexB = levelOrder.indexOf(levelB);
      
      // Compare the indices (lower index = higher level)
      return (indexA - indexB) * directionMultiplier;
    }
    return 0;
  });
};

export default function WodViewer({ wods }: { wods: Wod[] }) {
  const [view, setView] = useState<"table" | "timeline">("timeline");
  const [sortBy, setSortBy] = useState<"wodName" | "date" | "level">("wodName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const completedWods = wods.filter(wod => 
    wod.results[0]?.date && wod.results[0].date !== ""
  );

  const handleSort = (column: "wodName" | "date" | "level") => {
    if (column === sortBy) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  const sortedWods = sortWods(completedWods, sortBy, sortDirection);

  return (
    <Box>
      <Tabs.Root defaultValue={view}>
        <Tabs.List>
          <Tabs.Trigger value="timeline" onClick={() => setView("timeline")}>Timeline View</Tabs.Trigger>
          <Tabs.Trigger value="table" onClick={() => setView("table")}>Table View</Tabs.Trigger>
        </Tabs.List>
        
        <Box className="mt-4">
          {view === "table" ? (
            <WodTable wods={sortedWods} sortBy={sortBy} sortDirection={sortDirection} handleSort={handleSort} />
          ) : (
            <WodTimeline wods={sortedWods} sortBy={sortBy} sortDirection={sortDirection} handleSort={handleSort} />
          )}
        </Box>
      </Tabs.Root>
    </Box>
  );
}
