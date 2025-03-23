"use client";

import Link from "next/link";
import { Flex, Table, Text, Tooltip } from "@radix-ui/themes";
import { Wod } from "./WodViewer";
import { getPerformanceLevelColor, getPerformanceLevel } from "./WodViewer";
import React from "react";

interface WodTimelineProps {
  wods: Wod[];
  sortBy: "wodName" | "date" | "level";
  sortDirection: "asc" | "desc";
  handleSort: (column: "wodName" | "date" | "level") => void;
}

const WodTimeline: React.FC<WodTimelineProps> = ({ wods, sortBy, sortDirection, handleSort }) => {
  const safeString = (value: string | undefined | null): string => value ?? "";
  
  const getSortIndicator = (columnName: "wodName" | "date" | "level") => {
    if (sortBy === columnName) {
      return sortDirection === "asc" ? "▲" : "▼";
    }
    return "";
  };

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
        {wods.map((wod) => {
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
              <Table.Cell>
                <pre className="max-w-[400px] text-sm font-small">{wod.description?.replace('\n', "\n")}</pre>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
};

export default WodTimeline;
