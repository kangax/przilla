"use client";

import Link from "next/link";
import { Flex, Table, Text, Tooltip, Badge } from "@radix-ui/themes";
import { TableVirtuoso } from "react-virtuoso"; // Import TableVirtuoso
import type { Wod, SortByType } from "~/types/wodTypes"; // Import Wod and SortByType from shared types
import {
  getPerformanceLevelColor,
  getPerformanceLevel,
  formatScore,
  hasScore,
} from "~/utils/wodUtils"; // Import utils from shared utils file

// type SortByType = "wodName" | "date" | "level" | "attempts" | "latestLevel"; // Removed local definition

interface WodTimelineProps {
  wods: Wod[];
  sortBy: SortByType; // Use new type
  sortDirection: "asc" | "desc";
  handleSort: (column: SortByType) => void;
}

import React, { forwardRef } from "react"; // Add forwardRef

// Helper function (can be kept if needed elsewhere, or moved into component)
const safeString = (value: string | undefined | null): string => value ?? "";

// --- Radix UI Table Components for react-virtuoso ---
const TableRoot = forwardRef<HTMLTableElement>((props, ref) => (
  <Table.Root
    {...props}
    ref={ref}
    variant="surface"
    className="w-full" // Base class
  />
));
TableRoot.displayName = "TableRoot";

const TableHeader = forwardRef<HTMLTableSectionElement>((props, ref) => (
  <Table.Header
    {...props}
    ref={ref}
    className="sticky top-0 z-10 bg-table-header" // Sticky header
  />
));
TableHeader.displayName = "TableHeader";

const TableBody = forwardRef<HTMLTableSectionElement>((props, ref) => (
  <Table.Body {...props} ref={ref} className="bg-table-row" />
));
TableBody.displayName = "TableBody";

const TableRow = forwardRef<HTMLTableRowElement>((props, ref) => (
  <Table.Row
    {...props}
    ref={ref}
    className="rt-TableRow border-t border-table-border hover:bg-table-rowAlt" // Row styling
  />
));
TableRow.displayName = "TableRow";

// --- Main Timeline Component ---
const WodTimeline: React.FC<WodTimelineProps> = ({
  wods,
  sortBy,
  sortDirection,
  handleSort,
}) => {
  const getSortIndicator = (columnName: SortByType) => {
    if (sortBy === columnName) {
      return sortDirection === "asc" ? " ▲" : " ▼"; // Added space
    }
    return "";
  };

  return (
    // Remove outer scroll div. Apply height, overflow, border directly to TableVirtuoso style/components
    <TableVirtuoso<Wod>
      style={{ height: "70vh", overscrollBehavior: "contain" }} // Apply height and overscroll behavior
      data={wods} // Use the wods prop directly
      className="rounded-md border border-table-border" // Apply border/rounding here
      components={{
        // Re-add components prop
        // @ts-ignore TODO: Investigate type mismatch between Radix forwardRef and react-virtuoso
        Table: TableRoot,
        TableHead: TableHeader,
        TableBody: TableBody,
        // @ts-ignore TODO: Investigate type mismatch between Radix forwardRef and react-virtuoso
        TableRow: TableRow,
      }}
      fixedHeaderContent={() => (
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
      )}
      itemContent={(_index, wod) => {
        // Logic from WodTimelineRow moved here
        const sortedResults = [...wod.results]
          .filter((r) => r.date && hasScore(r))
          .sort((a, b) => {
            const dateA = safeString(a.date);
            const dateB = safeString(b.date);
            if (!dateA) return 1;
            if (!dateB) return -1;
            return new Date(dateA).getTime() - new Date(dateB).getTime();
          });
        const isAttempted = sortedResults.length > 0;

        // Return cells directly (wrapped in fragment), TableVirtuoso uses components.TableRow
        return (
          <>
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
                  n/a
                </Text>
              )}
            </Table.Cell>
            <Table.Cell className="min-w-[400px]">
              <Text className="font-small whitespace-pre-line text-sm">
                {wod.description}
              </Text>
            </Table.Cell>
          </>
        );
      }}
    />
    // Removed closing </div> tag
  );
};

export default WodTimeline;
