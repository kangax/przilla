"use client";

import Link from "next/link";
import { useState } from "react";
import { Box, Flex, Table, Text, Tabs, Tooltip } from "@radix-ui/themes";

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

const sortWods = (wodsToSort: Wod[], sortBy: "wodName" | "date", sortDirection: "asc" | "desc"): Wod[] => {
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
    }
    return 0;
  });
};

export default function WodViewer({ wods }: { wods: Wod[] }) {
  const [view, setView] = useState<"table" | "timeline">("timeline");
  const [sortBy, setSortBy] = useState<"wodName" | "date">("wodName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const completedWods = wods.filter(wod => 
    wod.results[0]?.date && wod.results[0].date !== ""
  );

  const handleSort = (column: "wodName" | "date") => {
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

function WodTable({ wods, sortBy, sortDirection, handleSort }: { 
  wods: Wod[];
  sortBy: "wodName" | "date";
  sortDirection: "asc" | "desc";
  handleSort: (column: "wodName" | "date") => void;
}) {
  const safeString = (value: string | undefined | null): string => value ?? "";
  
  const getSortIndicator = (columnName: "wodName" | "date") => {
    if (sortBy === columnName) {
      return sortDirection === "asc" ? "▲" : "▼";
    }
    return "";
  };

  return (
    <Table.Root variant="surface" className="table-fixed w-full [&_tr]:hover:bg-[#ffffff08]">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell className="w-1/5" onClick={() => handleSort("wodName")} style={{ cursor: 'pointer' }}>
            Workout {getSortIndicator("wodName")}
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="w-[12%]" onClick={() => handleSort("date")} style={{ cursor: 'pointer' }}>
            Date {getSortIndicator("date")}
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="w-[12%]">Score</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="w-[12%]">Level</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="w-[40%]">Notes</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      
      <Table.Body>
        {wods.map((wod) => (
          wod.results.map((result, resultIndex) => {
            const performanceLevel = getPerformanceLevel(wod, result.score);
            const levelColor = getPerformanceLevelColor(performanceLevel);
            const levelTooltip = getPerformanceLevelTooltip(wod, performanceLevel);
            
            return (
              <Table.Row key={`${wod.wodName}-${resultIndex}`} className="transition-colors">
                {resultIndex === 0 ? (
                  <Table.Cell className="font-medium">
                    <Tooltip content={wod.wodName}>
                      <Link href={wod.wodUrl} target="_blank" className="text-[#a855f7] hover:underline flex items-center whitespace-nowrap max-w-[200px] truncate">
                        {wod.wodName}
                        <span className="ml-1 text-xs opacity-70 flex-shrink-0">↗</span>
                      </Link>
                    </Tooltip>
                  </Table.Cell>
                ) : (
                  <Table.Cell></Table.Cell>
                )}
                <Table.Cell className="whitespace-nowrap">{safeString(result.date)}</Table.Cell>
                <Table.Cell className="whitespace-nowrap font-mono">
                  {safeString(result.score)}{result.rxStatus ? <span className="text-sm opacity-50"> {safeString(result.rxStatus)}</span> : null}
                </Table.Cell>
                <Table.Cell>
                  {performanceLevel ? (
                    <Tooltip content={levelTooltip}>
                      <Text className={`font-medium ${levelColor} capitalize`}>
                        {performanceLevel}
                      </Text>
                    </Tooltip>
                  ) : (
                    <Text className="text-gray-500 text-sm">-</Text>
                  )}
                </Table.Cell>
                <Table.Cell className="max-w-[400px]">
                  <Text as="p" className="text-sm leading-relaxed text-gray-300">
                    {safeString(result.notes)}
                  </Text>
                </Table.Cell>
              </Table.Row>
            );
          })
        ))}
      </Table.Body>
    </Table.Root>
  );
}

function WodTimeline({ wods, sortBy, sortDirection, handleSort }: { 
  wods: Wod[];
  sortBy: "wodName" | "date";
  sortDirection: "asc" | "desc";
  handleSort: (column: "wodName" | "date") => void;
}) {
  const safeString = (value: string | undefined | null): string => value ?? "";
  
  const getSortIndicator = (columnName: "wodName" | "date") => {
    if (sortBy === columnName) {
      return sortDirection === "asc" ? "▲" : "▼";
    }
    return "";
  };

  const sortedWods = sortWods(wods, sortBy, sortDirection);

  return (
    <Table.Root variant="surface" className="table-fixed w-full">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell className="w-1/4" onClick={() => handleSort("wodName")} style={{ cursor: 'pointer' }}>
            Workout {getSortIndicator("wodName")}
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="w-1/2" onClick={() => handleSort("date")} style={{ cursor: 'pointer' }}>
            Progress Timeline {getSortIndicator("date")}
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="w-1/4">Description</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      
      <Table.Body>
        {sortedWods.map((wod) => {
          if (wod.results.length === 0 || !wod.results[0].date) return null;
          
          const sortedResults = [...wod.results]
            .filter(r => r.date && r.score)
            .sort((a, b) => {
              const dateA = safeString(a.date);
              const dateB = safeString(b.date);
              if (!dateA) return 1;
              if (!dateB) return -1;
              return new Date(dateA).getTime() - new Date(dateB).getTime();
            });
          
          return (
            <Table.Row key={wod.wodName}>
              <Table.Cell className="font-medium">
                <Link href={wod.wodUrl} target="_blank" className="text-[#a855f7] hover:underline flex items-center whitespace-nowrap max-w-[200px] truncate">
                  {wod.wodName}
                  <span className="ml-1 text-xs opacity-70 flex-shrink-0">↗</span>
                </Link>
              </Table.Cell>
              <Table.Cell>
                <Flex align="center" className="flex-wrap min-w-[350px]">
                  {sortedResults.map((result, index) => (
                    <Flex key={index} align="center" className="mb-1">
                      <Tooltip content={safeString(result?.date)}>
                        <Text className="cursor-help whitespace-nowrap">
                          <span className={`font-mono ${getPerformanceLevelColor(getPerformanceLevel(wod, result.score))}`}>
                            {safeString(result?.score)}
                          </span>
                        </Text>
                      </Tooltip>
                      
                      {index < sortedResults.length - 1 && (
                        <Text className="mx-2">→</Text>
                      )}
                    </Flex>
                  ))}
                </Flex>
              </Table.Cell>
              <Table.Cell>
                <pre className="max-w-[400px] text-sm font-small">{wod.description?.replace('\n', "\n")}</pre>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
