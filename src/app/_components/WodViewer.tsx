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

export type Wod = {
  wodUrl: string;
  wodName: string;
  results: WodResult[];
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
          <Table.ColumnHeaderCell className="w-1/4" onClick={() => handleSort("wodName")} style={{ cursor: 'pointer' }}>
            Workout {getSortIndicator("wodName")}
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="w-[15%]" onClick={() => handleSort("date")} style={{ cursor: 'pointer' }}>
            Date {getSortIndicator("date")}
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="w-[15%]">Score</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="w-[45%]">Notes</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      
      <Table.Body>
        {wods.map((wod) => (
          wod.results.map((result, resultIndex) => (
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
              <Table.Cell className="max-w-[400px]">
                <Text as="p" className="text-sm leading-relaxed text-gray-300">
                  {safeString(result.notes)}
                </Text>
              </Table.Cell>
            </Table.Row>
          ))
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
                          <span className="font-mono">{safeString(result?.score)}</span>{result?.rxStatus ? <span className="text-sm opacity-80"> {safeString(result?.rxStatus)}</span> : null}
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
