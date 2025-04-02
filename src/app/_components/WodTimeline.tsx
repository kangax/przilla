"use client";

import Link from "next/link";
import { Flex, Table, Text, Tooltip, Badge } from "@radix-ui/themes";
import type { Wod, SortByType } from "~/types/wodTypes"; // Import Wod and SortByType from shared types
import {
  getPerformanceLevelColor,
  getPerformanceLevel,
  formatScore,
  hasScore,
} from "~/utils/wodUtils"; // Import utils from shared utils file
import React from "react";

// type SortByType = "wodName" | "date" | "level" | "attempts" | "latestLevel"; // Removed local definition

interface WodTimelineProps {
  wods: Wod[];
  sortBy: SortByType; // Use new type
  sortDirection: "asc" | "desc";
  handleSort: (column: SortByType) => void; // Use new type
}

const WodTimeline: React.FC<WodTimelineProps> = ({
  wods,
  sortBy,
  sortDirection,
  handleSort,
}) => {
  const safeString = (value: string | undefined | null): string => value ?? "";

  const getSortIndicator = (columnName: SortByType) => {
    if (sortBy === columnName) {
      return sortDirection === "asc" ? "▲" : "▼";
    }
    return "";
  };

  return (
    <Table.Root
      variant="surface"
      className="w-full overflow-hidden rounded-md border border-table-border bg-table-row"
    >
      <Table.Header className="bg-table-header">
        <Table.Row>
          <Table.ColumnHeaderCell
            onClick={() => handleSort("wodName")}
            style={{ cursor: "pointer" }}
            className="text-foreground"
          >
            Workout {getSortIndicator("wodName")}
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell
            onClick={() => handleSort("latestLevel")}
            style={{ cursor: "pointer" }}
            className="text-foreground"
          >
            Progress Timeline{" "}
            <span className="text-xs opacity-70">(latest level)</span>{" "}
            {getSortIndicator("latestLevel")}
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-foreground">
            Description
          </Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body className="bg-table-row">
        {wods.map((wod) => {
          // Calculate sorted valid results first
          const sortedResults = [...wod.results]
            .filter((r) => r.date && hasScore(r)) // Filter for valid results (date and score)
            .sort((a, b) => {
              const dateA = safeString(a.date);
              const dateB = safeString(b.date);
              if (!dateA) return 1;
              if (!dateB) return -1;
              return new Date(dateA).getTime() - new Date(dateB).getTime();
            });

          // Determine if the WOD has been attempted (has valid results)
          const isAttempted = sortedResults.length > 0;

          return (
            <Table.Row
              key={wod.wodName}
              className="border-t border-table-border hover:bg-table-rowAlt"
            >
              <Table.Cell className="font-medium">
                {wod.wodUrl ? (
                  <Link
                    href={wod.wodUrl}
                    target="_blank"
                    className="flex max-w-[200px] items-center truncate whitespace-nowrap text-primary hover:underline"
                  >
                    {wod.wodName}
                    <span className="ml-1 flex-shrink-0 text-xs opacity-70">
                      ↗
                    </span>
                  </Link>
                ) : (
                  <span className="max-w-[200px] truncate whitespace-nowrap">
                    {wod.wodName}
                  </span>
                )}
              </Table.Cell>
              <Table.Cell>
                {isAttempted ? (
                  <Flex align="center">
                    {sortedResults.map((result, index) => (
                      <Flex key={index} align="center" className="mb-1">
                        <Tooltip
                          content={
                            <>
                              <Text size="1" weight="bold">
                                {safeString(result?.date)}
                              </Text>
                              {result.notes && (
                                <>
                                  <br />
                                  <Text
                                    size="1"
                                    style={{
                                      whiteSpace: "pre-wrap",
                                      maxWidth: "300px",
                                    }}
                                  >
                                    {safeString(result.notes)}
                                  </Text>
                                </>
                              )}
                            </>
                          }
                        >
                          <Text className="cursor-help whitespace-nowrap">
                            <span
                              className={`font-mono ${result.rxStatus && result.rxStatus !== "Rx" ? getPerformanceLevelColor(null) : getPerformanceLevelColor(getPerformanceLevel(wod, result))}`}
                            >
                              {formatScore(result)}
                            </span>
                            {result.rxStatus && (
                              <Badge
                                className="ml-1 rounded-full"
                                size="1"
                                color="gray"
                              >
                                {safeString(result.rxStatus)}
                              </Badge>
                            )}
                          </Text>
                        </Tooltip>
                        {index < sortedResults.length - 1 && (
                          <Text className="mx-2">→</Text>
                        )}
                      </Flex>
                    ))}
                  </Flex>
                ) : (
                  <Text size="1" className="italic text-foreground/60">
                    Not Attempted
                  </Text>
                )}
              </Table.Cell>
              <Table.Cell className="min-w-[400px]">
                <Text className="font-small whitespace-pre-line text-sm">
                  {wod.description}
                </Text>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
};

export default WodTimeline;
