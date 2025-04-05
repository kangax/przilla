"use client";

import React from "react"; // Import React
import Link from "next/link";
import { Tooltip, Table, Text, Flex, Badge } from "@radix-ui/themes";
import type { Wod, SortByType } from "~/types/wodTypes"; // Import Wod and SortByType from shared types
import {
  getPerformanceLevel,
  getPerformanceLevelColor,
  getPerformanceLevelTooltip,
  formatScore,
} from "~/utils/wodUtils"; // Import utils from shared utils file

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

// --- Memoized Row Component ---
interface WodRowSetProps {
  wod: Wod;
}

const WodRowSet: React.FC<WodRowSetProps> = React.memo(({ wod }) => {
  // console.log(`Rendering WodRowSet for: ${wod.wodName}`); // For debugging memoization

  // For workouts with no results, display a single row
  if (wod.results.length === 0) {
    return (
      <Table.Row
        key={`${wod.wodName}-no-results`} // Key moved here
        className="border-t border-table-border hover:bg-table-rowAlt"
      >
        <Table.Cell className="font-medium">
          <Tooltip
            content={
              <span style={{ whiteSpace: "pre-wrap" }}>{wod.description}</span>
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
        <Table.Cell>
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
        <Table.Cell className="whitespace-nowrap">-</Table.Cell>
        <Table.Cell className="whitespace-nowrap font-mono">-</Table.Cell>
        <Table.Cell>-</Table.Cell>
        <Table.Cell className="whitespace-nowrap">
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
        <Table.Cell className="whitespace-nowrap">
          {wod.count_likes ?? "-"}
        </Table.Cell>
        <Table.Cell>-</Table.Cell>
      </Table.Row>
    );
  }

  // For workouts with results, display a row for each result
  return wod.results.map((result, resultIndex) => (
    <Table.Row
      key={`${wod.wodName}-${resultIndex}`} // Key moved here
      className="border-t border-table-border hover:bg-table-rowAlt"
    >
      {resultIndex === 0 ? (
        <Table.Cell className="font-medium">
          <Tooltip
            content={
              <span style={{ whiteSpace: "pre-wrap" }}>{wod.description}</span>
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
        <Table.Cell></Table.Cell>
      )}

      {resultIndex === 0 ? (
        <Table.Cell>
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
        <Table.Cell></Table.Cell>
      )}
      <Table.Cell className="whitespace-nowrap">
        {safeString(result.date)}
      </Table.Cell>
      <Table.Cell className="whitespace-nowrap font-mono">
        {formatScore(result)}{" "}
        {result.rxStatus && (
          <span className="text-sm opacity-80">
            {safeString(result.rxStatus)}
          </span>
        )}
      </Table.Cell>
      <Table.Cell>
        {wod.benchmarks ? (
          <Tooltip
            content={
              <span style={{ whiteSpace: "pre-wrap" }}>
                {getPerformanceLevelTooltip(wod)}
              </span>
            }
          >
            {result.rxStatus && result.rxStatus !== "Rx" ? (
              <Text className={`font-medium ${getPerformanceLevelColor(null)}`}>
                Scaled
              </Text>
            ) : (
              <Text
                className={`font-medium ${getPerformanceLevelColor(getPerformanceLevel(wod, result))}`}
              >
                {getPerformanceLevel(wod, result)?.charAt(0).toUpperCase() +
                  getPerformanceLevel(wod, result)?.slice(1) || "N/A"}
              </Text>
            )}
          </Tooltip>
        ) : (
          <Text>-</Text>
        )}
      </Table.Cell>
      {resultIndex === 0 ? (
        <Table.Cell className="whitespace-nowrap">
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
        <Table.Cell></Table.Cell>
      )}
      {resultIndex === 0 ? (
        <Table.Cell className="whitespace-nowrap">
          {wod.count_likes ?? "-"}
        </Table.Cell>
      ) : (
        <Table.Cell></Table.Cell>
      )}
      <Table.Cell className="max-w-[250px] truncate">
        <Tooltip content={safeString(result.notes)}>
          <span>{safeString(result.notes)}</span>
        </Tooltip>
      </Table.Cell>
    </Table.Row>
  ));
});
WodRowSet.displayName = "WodRowSet"; // Add display name for better debugging

// --- Main Table Component ---
const WodTable: React.FC<WodTableProps> = ({
  wods,
  sortBy,
  sortDirection,
  handleSort,
}) => {
  const getSortIndicator = (columnName: SortByType) => {
    if (sortBy === columnName) {
      return sortDirection === "asc" ? "▲" : "▼";
    }
    return "";
  };

  // getDifficultyColor moved outside

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
          <Table.ColumnHeaderCell className="text-foreground">
            Type
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell
            onClick={() => handleSort("date")}
            style={{ cursor: "pointer" }}
            className="text-foreground"
          >
            Date {getSortIndicator("date")}
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-foreground">
            Score
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell
            onClick={() => handleSort("level")}
            style={{ cursor: "pointer" }}
            className="text-foreground"
          >
            Level {getSortIndicator("level")}
          </Table.ColumnHeaderCell>
          {/* Added Difficulty Header - Made clickable */}
          <Table.ColumnHeaderCell
            onClick={() => handleSort("difficulty")}
            style={{ cursor: "pointer" }}
            className="whitespace-nowrap text-foreground"
          >
            Difficulty {getSortIndicator("difficulty")}
          </Table.ColumnHeaderCell>
          {/* Added Likes Header */}
          <Table.ColumnHeaderCell
            onClick={() => handleSort("count_likes")}
            style={{ cursor: "pointer" }}
            className="whitespace-nowrap text-foreground" // Added whitespace-nowrap
          >
            Likes {getSortIndicator("count_likes")}
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="text-foreground">
            Notes
          </Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body className="bg-table-row">
        {/* Map over wods and render the memoized WodRowSet */}
        {wods.map((wod) => (
          <WodRowSet key={wod.wodName} wod={wod} /> // Use wodName as key (assuming unique for this list)
        ))}
      </Table.Body>
    </Table.Root>
  );
};

export default WodTable;
