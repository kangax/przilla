"use client";

import React, { useMemo, forwardRef } from "react"; // Import React and hooks
import Link from "next/link";
import { Tooltip, Table, Text, Flex, Badge } from "@radix-ui/themes";
import { TableVirtuoso } from "react-virtuoso";
import type { Wod, SortByType, WodResult } from "~/types/wodTypes"; // Import Wod, SortByType, WodResult
import {
  getPerformanceLevel,
  getPerformanceLevelColor,
  getPerformanceLevelTooltip,
  formatScore,
} from "~/utils/wodUtils"; // Import utils from shared utils file

// Define the structure for flattened data
type FlatWodRow = {
  type: "wod" | "result" | "no_result";
  wod: Wod;
  result?: WodResult;
  isFirstResult: boolean; // To render WOD name/details only once
};

// type SortByType = "wodName" | "date" | "level" | "attempts" | "latestLevel"; // Removed local definition

interface WodTableProps {
  wods: Wod[];
  sortBy: SortByType;
  sortDirection: "asc" | "desc";
  handleSort: (column: SortByType) => void;
}

// Helper function to safely handle potentially undefined values
const safeString = (value: string | undefined): string => value || "";

// Helper function to get color based on difficulty (moved outside WodTable for use in WodRowSet)
const getDifficultyColor = (difficulty: string | undefined): string => {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return "text-green-500";
    case "medium":
      return "text-yellow-500";
    case "hard":
      return "text-orange-500";
    case "very hard":
      return "text-red-500";
    default:
      return "text-foreground"; // Default color
  }
};

// --- Radix UI Table Components for react-virtuoso ---
// Need to use forwardRef for react-virtuoso to correctly interact with Radix components
const TableRoot = forwardRef<HTMLTableElement>((props, ref) => (
  <Table.Root
    {...props}
    ref={ref}
    variant="surface"
    // Base classes moved here from the wrapper div
    className="w-full"
    style={{ tableLayout: "fixed" }} // Add fixed table layout
  />
));
TableRoot.displayName = "TableRoot";

const TableHeader = forwardRef<HTMLTableSectionElement>((props, ref) => (
  <Table.Header
    {...props}
    ref={ref}
    // Sticky header styling - REMOVED sticky, top-0, z-10
    className="bg-table-header" // Keep background or other necessary styles
  />
));
TableHeader.displayName = "TableHeader";

const TableBody = forwardRef<HTMLTableSectionElement>((props, ref) => (
  // Background applied here for the scrollable body
  <Table.Body {...props} ref={ref} className="bg-table-row" />
));
TableBody.displayName = "TableBody";

const TableRow = forwardRef<HTMLTableRowElement>((props, ref) => (
  // Apply row-specific classes here
  <Table.Row
    {...props}
    ref={ref}
    className="rt-TableRow border-t border-table-border hover:bg-table-rowAlt"
  />
));
TableRow.displayName = "TableRow";

// --- Main Table Component ---
const WodTable: React.FC<WodTableProps> = ({
  wods,
  sortBy,
  sortDirection,
  handleSort,
}) => {
  const getSortIndicator = (columnName: SortByType) => {
    if (sortBy === columnName) {
      return sortDirection === "asc" ? " ▲" : " ▼"; // Added space for visual separation
    }
    return "";
  };

  // Flatten the WOD data for virtualization
  const flatWods = useMemo(() => {
    const flattened: FlatWodRow[] = [];
    wods.forEach((wod) => {
      if (wod.results.length === 0) {
        flattened.push({ type: "no_result", wod, isFirstResult: true });
      } else {
        wod.results.forEach((result, index) => {
          flattened.push({
            type: "result",
            wod,
            result,
            isFirstResult: index === 0,
          });
        });
      }
    });
    return flattened;
  }, [wods]);

  return (
    // Remove outer scroll div. Apply height, overflow, border directly to TableVirtuoso style/components
    <TableVirtuoso
      style={{ height: "70vh", overscrollBehavior: "contain" }} // Apply height and overscroll behavior
      data={flatWods}
      className="rounded-md border border-table-border" // Apply border/rounding here
      components={{
        // Re-add components prop
        // @ts-expect-error TODO: Investigate type mismatch between Radix forwardRef and react-virtuoso
        Table: TableRoot,
        TableHead: TableHeader,
        TableBody: TableBody,
        // @ts-expect-error TODO: Investigate type mismatch between Radix forwardRef and react-virtuoso
        TableRow: TableRow, // Pass the styled TableRow
      }}
      fixedHeaderContent={() => (
        // Return fragment, sticky positioning is handled by the TableHeader component via components.TableHead
        <Table.Row>
          <Table.ColumnHeaderCell
            onClick={() => handleSort("wodName")}
            style={{ cursor: "pointer", width: "20%" }} // Keep width
            className="w-1 text-foreground"
          >
            Workout {getSortIndicator("wodName")}
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell
            style={{ width: "15%" }}
            className="text-foreground"
          >
            Type
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell
            onClick={() => handleSort("date")}
            style={{ cursor: "pointer", width: "10%" }} // Add width
            className="text-foreground"
          >
            Date {getSortIndicator("date")}
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell
            style={{ width: "10%" }}
            className="text-foreground"
          >
            Score
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell
            onClick={() => handleSort("level")}
            style={{ cursor: "pointer", width: "10%" }} // Add width
            className="text-foreground"
          >
            Level {getSortIndicator("level")}
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell
            onClick={() => handleSort("difficulty")}
            style={{ cursor: "pointer", width: "10%" }} // Add width
            className="whitespace-nowrap text-foreground" // Keep whitespace-nowrap if needed
          >
            Difficulty {getSortIndicator("difficulty")}
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell
            onClick={() => handleSort("count_likes")}
            style={{ cursor: "pointer", width: "8%" }} // Add width
            className="whitespace-nowrap text-foreground" // Keep whitespace-nowrap
          >
            Likes {getSortIndicator("count_likes")}
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell
            style={{ width: "17%" }}
            className="text-foreground"
          >
            Notes
          </Table.ColumnHeaderCell>
        </Table.Row>
      )}
      itemContent={(_index, item) => {
        const { wod, result, isFirstResult, type } = item;

        // Return cells directly (wrapped in fragment), TableVirtuoso uses components.TableRow
        return (
          <>
            {type === "no_result" ? (
              <>
                <Table.Cell className="font-medium" style={{ width: "20%" }}>
                  <Tooltip
                    content={
                      <span style={{ whiteSpace: "pre-wrap" }}>
                        {wod.description}
                      </span>
                    }
                  >
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
                  </Tooltip>
                </Table.Cell>
                <Table.Cell style={{ width: "15%" }}>
                  {wod.category && (
                    <Badge
                      color="indigo"
                      variant="soft"
                      radius="full"
                      className="w-fit"
                    >
                      {wod.category}
                    </Badge>
                  )}
                  {wod.tags?.map((tag) => (
                    <Badge
                      key={tag}
                      color="gray"
                      variant="soft"
                      radius="full"
                      className="text-xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                </Table.Cell>
                <Table.Cell
                  className="whitespace-nowrap"
                  style={{ width: "10%" }}
                >
                  -
                </Table.Cell>
                <Table.Cell
                  className="whitespace-nowrap font-mono"
                  style={{ width: "10%" }}
                >
                  -
                </Table.Cell>
                <Table.Cell style={{ width: "10%" }}>-</Table.Cell>
                <Table.Cell
                  className="whitespace-nowrap"
                  style={{ width: "10%" }}
                >
                  {wod.difficulty ? (
                    <Tooltip
                      content={
                        <span style={{ whiteSpace: "pre-wrap" }}>
                          {safeString(wod.difficulty_explanation)}
                        </span>
                      }
                    >
                      <Text
                        className={`font-medium ${getDifficultyColor(wod.difficulty)}`}
                      >
                        {wod.difficulty}
                      </Text>
                    </Tooltip>
                  ) : (
                    <Text>-</Text>
                  )}
                </Table.Cell>
                <Table.Cell
                  className="whitespace-nowrap"
                  style={{ width: "8%" }}
                >
                  {wod.count_likes ?? "-"}
                </Table.Cell>
                <Table.Cell style={{ width: "17%" }}>-</Table.Cell>
              </>
            ) : (
              // Type === 'result'
              <>
                {isFirstResult ? (
                  <Table.Cell className="font-medium" style={{ width: "20%" }}>
                    <Tooltip
                      content={
                        <span style={{ whiteSpace: "pre-wrap" }}>
                          {wod.description}
                        </span>
                      }
                    >
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
                    </Tooltip>
                  </Table.Cell>
                ) : (
                  <Table.Cell style={{ width: "20%" }}></Table.Cell>
                )}
                {isFirstResult ? (
                  <Table.Cell style={{ width: "15%" }}>
                    <Flex gap="1">
                      {wod.category && (
                        <Badge
                          color="indigo"
                          variant="soft"
                          radius="full"
                          className="w-fit"
                        >
                          {wod.category}
                        </Badge>
                      )}
                      {wod.tags?.map((tag) => (
                        <Badge
                          key={tag}
                          color="gray"
                          variant="soft"
                          radius="full"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </Flex>
                  </Table.Cell>
                ) : (
                  <Table.Cell style={{ width: "15%" }}></Table.Cell>
                )}
                <Table.Cell
                  className="whitespace-nowrap"
                  style={{ width: "10%" }}
                >
                  {safeString(result?.date)}
                </Table.Cell>
                <Table.Cell
                  className="whitespace-nowrap font-mono"
                  style={{ width: "10%" }}
                >
                  {result ? formatScore(result) : "-"}{" "}
                  {result?.rxStatus && (
                    <span className="text-sm opacity-80">
                      {safeString(result.rxStatus)}
                    </span>
                  )}
                </Table.Cell>
                <Table.Cell style={{ width: "10%" }}>
                  {wod.benchmarks && result ? (
                    <Tooltip
                      content={
                        <span style={{ whiteSpace: "pre-wrap" }}>
                          {getPerformanceLevelTooltip(wod)}
                        </span>
                      }
                    >
                      {result.rxStatus && result.rxStatus !== "Rx" ? (
                        <Text
                          className={`font-medium ${getPerformanceLevelColor(null)}`}
                        >
                          Scaled
                        </Text>
                      ) : (
                        <Text
                          className={`font-medium ${getPerformanceLevelColor(getPerformanceLevel(wod, result))}`}
                        >
                          {getPerformanceLevel(wod, result)
                            ?.charAt(0)
                            .toUpperCase() +
                            getPerformanceLevel(wod, result)?.slice(1) || "N/A"}
                        </Text>
                      )}
                    </Tooltip>
                  ) : (
                    <Text>-</Text>
                  )}
                </Table.Cell>
                {isFirstResult ? (
                  <Table.Cell
                    className="whitespace-nowrap"
                    style={{ width: "10%" }}
                  >
                    {wod.difficulty ? (
                      <Tooltip
                        content={
                          <span style={{ whiteSpace: "pre-wrap" }}>
                            {safeString(wod.difficulty_explanation)}
                          </span>
                        }
                      >
                        <Text
                          className={`font-medium ${getDifficultyColor(wod.difficulty)}`}
                        >
                          {wod.difficulty}
                        </Text>
                      </Tooltip>
                    ) : (
                      <Text>-</Text>
                    )}
                  </Table.Cell>
                ) : (
                  <Table.Cell style={{ width: "10%" }}></Table.Cell>
                )}
                {isFirstResult ? (
                  <Table.Cell
                    className="whitespace-nowrap"
                    style={{ width: "8%" }}
                  >
                    {wod.count_likes ?? "-"}
                  </Table.Cell>
                ) : (
                  <Table.Cell style={{ width: "8%" }}></Table.Cell>
                )}
                <Table.Cell
                  className="max-w-[250px] truncate"
                  style={{ width: "17%" }}
                >
                  <Tooltip content={safeString(result?.notes)}>
                    <span>{safeString(result?.notes)}</span>
                  </Tooltip>
                </Table.Cell>
              </>
            )}
          </>
        );
      }}
    />
  );
};

export default WodTable;
