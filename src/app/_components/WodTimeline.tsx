"use client";

import Link from "next/link";
import { Flex, Table, Text, Tooltip, Badge } from "@radix-ui/themes";
import { Wod } from "./WodViewer";
import { 
  getPerformanceLevelColor, 
  getPerformanceLevel, 
  formatScore,
  hasScore
} from "./WodViewer";
import React from "react";

interface WodTimelineProps {
  wods: Wod[];
  sortBy: "wodName" | "date" | "level" | "attempts";
  sortDirection: "asc" | "desc";
  handleSort: (column: "wodName" | "date" | "level" | "attempts") => void;
}

const WodTimeline: React.FC<WodTimelineProps> = ({ wods, sortBy, sortDirection, handleSort }) => {
  const safeString = (value: string | undefined | null): string => value ?? "";
  
  const getSortIndicator = (columnName: "wodName" | "date" | "level" | "attempts") => {
    if (sortBy === columnName) {
      return sortDirection === "asc" ? "▲" : "▼";
    }
    return "";
  };

  return (
    <Table.Root variant="surface" className="w-full">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell onClick={() => handleSort("wodName")} style={{ cursor: 'pointer' }}>
            Workout {getSortIndicator("wodName")}
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell onClick={() => handleSort("attempts")} style={{ cursor: 'pointer' }}>
            Progress Timeline <span className="text-xs opacity-70">(attempts)</span> {getSortIndicator("attempts")}
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      
      <Table.Body>
        {wods.map((wod) => {
          if (wod.results.length === 0 || !wod.results[0].date) return null;
          
          const sortedResults = [...wod.results]
            .filter(r => r.date && hasScore(r))
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
                <Flex align="center" className="flex-wrap min-w-[300px]">
                  <Tooltip content={`${sortedResults.length} attempt${sortedResults.length !== 1 ? 's' : ''}`}>
                    <Text className="mr-2 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      {sortedResults.length}
                    </Text>
                  </Tooltip>
                  {sortedResults.map((result, index) => (
                    <Flex key={index} align="center" className="mb-1">
                      {/* Update Tooltip content to include notes */}
                      <Tooltip content={`${safeString(result?.date)}${result.notes ? `\nNotes: ${safeString(result.notes)}` : ''}`}>
                        <Text className="cursor-help whitespace-nowrap">
                          <span className={`font-mono ${result.rxStatus && result.rxStatus !== "Rx" ? "text-gray-500" : getPerformanceLevelColor(getPerformanceLevel(wod, result))}`}>
                            {formatScore(result)}
                          </span> {result.rxStatus && <span className="text-sm opacity-80">{safeString(result.rxStatus)}</span>}
                        </Text>
                      </Tooltip>
                      
                      {index < sortedResults.length - 1 && (
                        <Text className="mx-2">→</Text>
                      )}
                    </Flex>
                  ))}
                </Flex>
              </Table.Cell>
              <Table.Cell className="min-w-[400px]">
                <Text className="text-sm font-small whitespace-pre-line">{wod.description}</Text>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
};

export default WodTimeline;
