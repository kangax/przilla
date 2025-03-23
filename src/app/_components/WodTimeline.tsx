"use client";

import Link from "next/link";
import { Box, Flex, Table, Text, Tooltip } from "@radix-ui/themes";

import { Wod, WodResult } from "./WodViewer";
import React from "react";

interface WodTimelineProps {
  wods: Wod[];
  sortBy: "wodName" | "date";
  sortDirection: "asc" | "desc";
  handleSort: (column: "wodName" | "date") => void;
}

const WodTimeline: React.FC<WodTimelineProps> = ({ wods, sortBy, sortDirection, handleSort }) => {
  // Helper function to safely handle potentially undefined values
  const safeString = (value: string | undefined): string => value || "";
  
  // Helper function to safely extract date part
  const getDatePart = (date: string | undefined): string => {
    if (!date) return "";
    // @ts-ignore - Ignore TypeScript error for now
    const parts = date.split(" ");
    return parts.length > 1 ? parts[1] : date;
  };

  const getSortIndicator = (columnName: "wodName" | "date") => {
    if (sortBy === columnName) {
      return sortDirection === "asc" ? "▲" : "▼";
    }
    return "";
  };

  const sortedWods = wods; // Sort is already handled in parent component

  return (
    <Table.Root variant="surface" className="table-fixed w-full">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell className="w-1/4" onClick={() => handleSort("wodName")} style={{ cursor: 'pointer' }}>
            Workout {getSortIndicator("wodName")}
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="w-3/4" onClick={() => handleSort("date")} style={{ cursor: 'pointer' }}>
            Progress Timeline {getSortIndicator("date")}
          </Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      
      <Table.Body>
        {sortedWods.map((wod: Wod) => { // Explicitly type wod
          // Only show workouts with at least one result
          if (wod.results.length === 0 || !wod.results[0].date) return null;
          
          // Sort results by date (oldest first for the timeline)
          const sortedResults = [...wod.results]
            .filter(r => r.date && r.score)
            .sort((a, b) => {
              if (!a.date) return 1;
              if (!b.date) return -1;
              return new Date(a.date).getTime() - new Date(b.date).getTime();
            });
            
          return (
            <Table.Row key={wod.wodName}>
              <Table.Cell className="font-medium">
                <Tooltip content={wod.wodName}>
                  <Link href={wod.wodUrl} target="_blank" className="text-[#a855f7] hover:underline flex items-center whitespace-nowrap max-w-[200px] truncate">
                    {wod.wodName}
                    <span className="ml-1 text-xs opacity-70 flex-shrink-0">↗</span>
                  </Link>
                </Tooltip>
              </Table.Cell>
              <Table.Cell>
                <Flex align="center" gap="2" className="flex-wrap">
                  {sortedResults.map((result, index) => (
                    <Flex key={index} align="center" className="mb-1">
                      {/* @ts-ignore - Ignore TypeScript errors for now */}
                      <Tooltip content={`${safeString(result.date)}${safeString(result.notes) ? ` - ${safeString(result.notes)}` : ''}`}>
                        <Text className="cursor-help whitespace-nowrap">
                          <span className="font-mono">{safeString(result.score)}</span> 
                          <span className="text-sm opacity-80">{safeString(result.rxStatus)}</span>
                        </Text>
                      </Tooltip>
                      
                      {index < sortedResults.length - 1 && (
                        <Text className="mx-2">→</Text>
                      )}
                    </Flex>
                  ))}
                </Flex>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
};

export default WodTimeline;
