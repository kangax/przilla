"use client";

import React, { useRef, useMemo } from "react";
import Link from "next/link";
import { Tooltip, Text, Flex, Badge } from "@radix-ui/themes";
import { Info } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Wod, Score, SortByType } from "~/types/wodTypes"; // Import Score
import {
  getPerformanceLevelTooltip, // Keep for benchmark info tooltip
  formatScore,
  formatShortDate,
  getPerformanceBadgeDetails, // Added
} from "~/utils/wodUtils";

// --- Interfaces & Types ---

interface WodTableProps {
  wods: Wod[];
  tableHeight: number;
  sortBy: SortByType;
  sortDirection: "asc" | "desc";
  handleSort: (column: SortByType) => void;
  searchTerm: string;
  scoresByWodId: Record<string, Score[]>; // Add scores map prop
}

// --- Helper Functions ---

const safeString = (value: string | undefined | null): string => value || "";

const getDifficultyColor = (difficulty: string | undefined | null): string => {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return "text-green-500";
    case "medium":
      return "text-yellow-500";
    case "hard":
      return "text-orange-500";
    case "very hard":
      return "text-red-500";
    case "extremely hard":
      return "text-purple-500";
    default:
      return "text-foreground";
  }
};

// --- Highlight Component (Memoized) ---
const HighlightMatch: React.FC<{ text: string; highlight: string }> =
  React.memo(({ text, highlight }) => {
    if (!highlight.trim() || !text) {
      return <>{text}</>;
    }
    const regex = new RegExp(
      `(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i}>{part}</mark>
          ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
          ),
        )}
      </>
    );
  });
HighlightMatch.displayName = "HighlightMatch";

// --- Column Definitions ---

const columnHelper = createColumnHelper<Wod>();

const createColumns = (
  handleSort: (column: SortByType) => void,
  sortBy: SortByType,
  sortDirection: "asc" | "desc",
  searchTerm: string,
  scoresByWodId: Record<string, Score[]>,
): ColumnDef<Wod, unknown>[] => {
  const getSortIndicator = (columnName: SortByType) => {
    if (sortBy === columnName) {
      return sortDirection === "asc" ? " ▲" : " ▼";
    }
    return "";
  };

  return [
    columnHelper.accessor("wodName", {
      header: () => (
        <span onClick={() => handleSort("wodName")} className="cursor-pointer">
          Workout{getSortIndicator("wodName")}
        </span>
      ),
      cell: (info) => {
        const row = info.row.original;
        return row.wodUrl ? (
          <Link
            href={row.wodUrl}
            target="_blank"
            className="flex max-w-[200px] items-center truncate whitespace-nowrap font-medium text-primary hover:underline"
          >
            <HighlightMatch text={row.wodName} highlight={searchTerm} />
            <span className="ml-1 flex-shrink-0 text-xs opacity-70">↗</span>
          </Link>
        ) : (
          <span className="max-w-[200px] truncate whitespace-nowrap font-medium">
            <HighlightMatch text={row.wodName} highlight={searchTerm} />
          </span>
        );
      },
      size: 200,
    }),
    // Combined Category and Tags Column
    columnHelper.accessor(
      (row) => ({ category: row.category, tags: row.tags }),
      {
        id: "categoryAndTags",
        header: "Category / Tags",
        cell: (info) => {
          const { category, tags } = info.getValue();
          const safeTags = tags ?? [];
          if (!category && safeTags.length === 0) return null;

          return (
            <Flex direction="column" gap="1" align="start">
              {category && (
                <Badge
                  color="indigo"
                  variant="soft"
                  radius="full"
                  className="w-fit"
                >
                  <HighlightMatch text={category} highlight={searchTerm} />
                </Badge>
              )}
              {safeTags.length > 0 && (
                <Flex gap="1" wrap="wrap" className="mt-1">
                  {safeTags.map((tag) => (
                    <Badge
                      key={tag}
                      color="gray"
                      variant="soft"
                      radius="full"
                      className="flex-shrink-0 text-xs"
                    >
                      <HighlightMatch text={tag} highlight={searchTerm} />
                    </Badge>
                  ))}
                </Flex>
              )}
            </Flex>
          );
        },
        size: 200,
      },
    ),
    columnHelper.accessor("difficulty", {
      header: () => (
        <span
          onClick={() => handleSort("difficulty")}
          className="cursor-pointer whitespace-nowrap"
        >
          Difficulty{getSortIndicator("difficulty")}
        </span>
      ),
      cell: (info) => {
        const row = info.row.original;
        if (!row.difficulty) return <Text>-</Text>;
        return (
          <Tooltip
            content={
              <span style={{ whiteSpace: "pre-wrap" }}>
                {safeString(row.difficultyExplanation)}
              </span>
            }
          >
            <Text
              className={`whitespace-nowrap font-medium ${getDifficultyColor(row.difficulty)}`}
            >
              {row.difficulty}
            </Text>
          </Tooltip>
        );
      },
      size: 100,
    }),
    columnHelper.accessor("countLikes", {
      header: () => (
        <span
          onClick={() => handleSort("countLikes")}
          className="cursor-pointer whitespace-nowrap"
        >
          Likes{getSortIndicator("countLikes")}
        </span>
      ),
      cell: (info) => {
        const row = info.row.original;
        return (
          <span className="whitespace-nowrap">{row.countLikes ?? "-"} </span>
        );
      },
      size: 70,
    }),
    // --- Description Column ---
    columnHelper.accessor("description", {
      header: "Description",
      cell: (info) => {
        const row = info.row.original;
        if (!row.description) return null;
        return (
          <span className="whitespace-pre-wrap break-words">
            <HighlightMatch text={row.description} highlight={searchTerm} />
          </span>
        );
      },
      size: 364,
    }),
    // --- NEW Results Column ---
    columnHelper.accessor(
      (row) => ({ wod: row, scores: scoresByWodId[row.id] }),
      {
        id: "results",
        header: "Your scores", // No sorting for now
        cell: (info) => {
          const { wod, scores } = info.getValue();

          // --- Case 1: No Scores ---
          if (!scores || scores.length === 0) {
            // Show benchmark tooltip if benchmarks exist
            if (wod.benchmarks) {
              return (
                <Tooltip
                  content={
                    <span style={{ whiteSpace: "pre-wrap" }}>
                      {getPerformanceLevelTooltip(wod)}
                    </span>
                  }
                >
                  <Info
                    size={14}
                    className="text-muted-foreground cursor-help"
                  />
                </Tooltip>
              );
            }
            // Otherwise, show placeholder
            return (
              <span className="text-muted-foreground whitespace-nowrap">-</span>
            );
          }

          // --- Case 2: Scores Exist ---
          // Assuming scores are sorted descending by date (newest first)
          return (
            <Flex direction="column" gap="1" align="start">
              {scores.map((score) => {
                const formattedScore = formatScore(score);
                const formattedDate = formatShortDate(score.scoreDate);
                const { displayLevel, color } = getPerformanceBadgeDetails(
                  wod,
                  score,
                );

                const scoreBadge = (
                  <Tooltip content={displayLevel}>
                    <Badge
                      color={
                        color as
                          | "red"
                          | "blue"
                          | "green"
                          | "yellow"
                          | "purple"
                          | "gray"
                          | "indigo"
                      } // All possible Radix Badge colors
                      variant="soft" // Use soft variant for less visual weight
                      radius="full"
                      size="2"
                      className="cursor-help" // Indicate tooltip
                    >
                      {formattedScore}
                    </Badge>
                  </Tooltip>
                );

                return (
                  <Flex key={score.id} align="center" gap="1" wrap="nowrap">
                    <Tooltip
                      content={
                        <span style={{ whiteSpace: "pre-wrap" }}>
                          {safeString(score.notes)}
                        </span>
                      }
                    >
                      <div>
                        {scoreBadge}
                        <span className="text-muted-foreground ml-1 whitespace-nowrap text-xs">
                          {" "}
                          on {formattedDate}
                        </span>
                      </div>
                    </Tooltip>
                  </Flex>
                );
              })}
            </Flex>
          );
        },
        size: 200, // Reduced size slightly as level text is now in tooltip
      },
    ),
  ];
};

// --- Main Table Component ---

const WodTable: React.FC<WodTableProps> = ({
  wods,
  tableHeight,
  sortBy,
  sortDirection,
  handleSort,
  searchTerm,
  scoresByWodId,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const columns = useMemo(
    () =>
      createColumns(
        handleSort,
        sortBy,
        sortDirection,
        searchTerm,
        scoresByWodId,
      ),
    [handleSort, sortBy, sortDirection, searchTerm, scoresByWodId],
  );

  const table = useReactTable({
    data: wods,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 49,
    overscan: 5,
    measureElement: (element) => (element as HTMLElement).offsetHeight,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const headerGroups = table.getHeaderGroups();

  return (
    <div
      ref={parentRef}
      className="w-full overflow-auto rounded-md border border-table-border"
      style={{ height: `${tableHeight}px` }}
    >
      {/* Sticky Header */}
      <div
        className="sticky top-0 z-10 bg-table-header"
        style={{ width: table.getTotalSize() }}
      >
        {headerGroups.map((headerGroup) => (
          <div key={headerGroup.id} className="flex" role="row">
            {headerGroup.headers.map((header) => (
              <div
                key={header.id}
                className="flex-shrink-0 flex-grow-0 border-b border-r border-table-border px-3 py-2 text-sm font-medium text-foreground last:border-r-0"
                style={{ width: `${header.getSize()}px` }}
                role="columnheader"
                aria-sort={
                  isValidSortBy(header.column.id) && header.column.id === sortBy
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Virtual Row Container */}
      <div
        style={{
          height: `${totalSize}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index];
          return (
            <div
              key={row.id}
              className="absolute left-0 top-0 flex w-full border-b border-table-border bg-table-row hover:bg-table-rowAlt"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
                width: table.getTotalSize(),
              }}
              ref={rowVirtualizer.measureElement}
              data-index={virtualRow.index}
              role="row"
            >
              {row.getVisibleCells().map((cell) => (
                <div
                  key={cell.id}
                  className="flex flex-shrink-0 flex-grow-0 items-center border-r border-table-border px-3 py-2 text-sm last:border-r-0"
                  style={{ width: `${cell.column.getSize()}px` }}
                  role="cell"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Helper function to validate sort by type (updated)
const isValidSortBy = (sortBy: string | null): sortBy is SortByType => {
  const validSortKeys: SortByType[] = [
    "wodName",
    // "date", // Removed
    // "level", // Removed
    "attempts", // Keep for potential future sorting
    "latestLevel", // Keep for potential future sorting
    "difficulty",
    "countLikes",
  ];
  // Note: Sorting by the new 'results' column isn't implemented yet.
  return validSortKeys.includes(sortBy as SortByType);
};

// Memoize the component
const MemoizedWodTable = React.memo(WodTable);
MemoizedWodTable.displayName = "WodTable";

export default MemoizedWodTable;
