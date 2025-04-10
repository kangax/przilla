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
  getPerformanceLevel, // Re-enable
  getPerformanceLevelTooltip,
  formatScore, // Re-enable
  getPerformanceLevelColor, // Import color helper
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

// No longer need FlatWodRow interface

// --- Helper Functions ---

const safeString = (value: string | undefined | null): string => value || "";

// NOTE: getDifficultyColor is defined but reported as unused by ESLint in the commit error,
// however, it IS used within the 'difficulty' column cell renderer.
// Let's keep it for now and see if fixing other files resolves the lint error.
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
    case "extremely hard": // Added Extremely Hard
      return "text-purple-500"; // Example color
    default:
      return "text-foreground";
  }
};

// --- Highlight Component (Memoized) ---
const HighlightMatch: React.FC<{ text: string; highlight: string }> =
  React.memo(({ text, highlight }) => {
    if (!highlight.trim() || !text) {
      // Added check for text existence
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
// Add display name for better debugging
HighlightMatch.displayName = "HighlightMatch";

// --- Column Definitions ---

const columnHelper = createColumnHelper<Wod>(); // Use Wod type directly

const createColumns = (
  handleSort: (column: SortByType) => void,
  sortBy: SortByType,
  sortDirection: "asc" | "desc",
  searchTerm: string,
  scoresByWodId: Record<string, Score[]>, // Accept scores map
): ColumnDef<Wod, unknown>[] => {
  // Use Wod type
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
        const row = info.row.original; // row is now a Wod object
        return (
          <Tooltip
            content={
              <span style={{ whiteSpace: "pre-wrap" }}>
                {safeString(row.description)}
              </span>
            }
          >
            {row.wodUrl ? (
              <Link
                href={row.wodUrl}
                target="_blank"
                className="flex max-w-[200px] items-center truncate whitespace-nowrap font-medium text-primary hover:underline"
              >
                <HighlightMatch text={row.wodName} highlight={searchTerm} />
                <span className="ml-1 flex-shrink-0 text-xs opacity-70">
                  ↗
                </span>
              </Link>
            ) : (
              <span className="max-w-[200px] truncate whitespace-nowrap font-medium">
                <HighlightMatch text={row.wodName} highlight={searchTerm} />
              </span>
            )}
          </Tooltip>
        );
      },
      size: 180,
    }),
    // Combined Category and Tags Column
    columnHelper.accessor(
      (row) => ({ category: row.category, tags: row.tags }), // Access directly from Wod
      {
        id: "categoryAndTags",
        header: "Category / Tags",
        cell: (info) => {
          // Destructure directly as 'tags' since it's pre-parsed in WodViewer
          const { category, tags } = info.getValue();

          // 'tags' is now guaranteed to be string[] | null | undefined
          const safeTags = tags ?? []; // Use empty array for null/undefined

          // Return null if neither category nor safe tags exist
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
              {/* Use safeTags */}
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
        size: 154,
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
      size: 90,
    }),
    columnHelper.accessor("countLikes", {
      // Use camelCase from Wod type
      header: () => (
        <span
          onClick={() => handleSort("countLikes")} // Use camelCase
          className="cursor-pointer whitespace-nowrap"
        >
          Likes{getSortIndicator("countLikes")} {/* Use camelCase */}
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
    // --- Date Column ---
    columnHelper.accessor(
      (row) => scoresByWodId[row.id]?.[0]?.scoreDate, // Get latest score date
      {
        id: "date",
        header: () => (
          <span onClick={() => handleSort("date")} className="cursor-pointer">
            Date{getSortIndicator("date")}
          </span>
        ),
        cell: (info) => {
          const date = info.getValue();
          return (
            <span className="whitespace-nowrap">
              {date ? date.toLocaleDateString() : "-"}
            </span>
          );
        },
        size: 90,
      },
    ),
    // --- Score Column ---
    columnHelper.accessor(
      (row) => ({ wod: row, scores: scoresByWodId[row.id] }), // Pass WOD and scores
      {
        id: "score",
        header: "Score",
        cell: (info) => {
          const { wod, scores } = info.getValue();
          const latestScore = scores?.[0]; // Assuming scores are sorted descending by date

          if (!latestScore) {
            // If no score, show benchmark tooltip if benchmarks exist
            if (!wod.benchmarks)
              return <span className="whitespace-nowrap font-mono">-</span>;
            return (
              <Tooltip
                content={
                  <span style={{ whiteSpace: "pre-wrap" }}>
                    {getPerformanceLevelTooltip(wod)}
                  </span>
                }
              >
                <Info size={14} className="text-muted-foreground" />
              </Tooltip>
            );
          }

          // If score exists, display it with notes tooltip
          return (
            <Tooltip
              content={
                <span style={{ whiteSpace: "pre-wrap" }}>
                  {safeString(latestScore.notes)}
                </span>
              }
            >
              <span className="whitespace-nowrap font-mono">
                {formatScore(latestScore)}
              </span>
            </Tooltip>
          );
        },
        size: 140,
      },
    ),
    // --- Level Column ---
    columnHelper.accessor(
      (row) => ({ wod: row, scores: scoresByWodId[row.id] }), // Pass WOD and scores
      {
        id: "level",
        header: () => (
          <span onClick={() => handleSort("level")} className="cursor-pointer">
            Level{getSortIndicator("level")}
          </span>
        ),
        cell: (info) => {
          const { wod, scores } = info.getValue();
          const latestScore = scores?.[0];
          if (!latestScore) return <Text>-</Text>;

          // Use the updated getPerformanceLevel function
          const level = getPerformanceLevel(wod, latestScore);
          // const level = "N/A"; // Placeholder until getPerformanceLevel is updated

          return (
            <Text className={getPerformanceLevelColor(level)}>
              {level ?? "-"}
            </Text>
          );
        },
        size: 110,
      },
    ),
    // --- Description Column ---
    columnHelper.accessor("description", {
      header: "Description",
      cell: (info) => {
        const row = info.row.original;
        if (!row.description) return null;
        return (
          <span className="whitespace-normal break-words">
            <HighlightMatch text={row.description} highlight={searchTerm} />
          </span>
        );
      },
      size: 300,
    }),
  ];
};

// --- Main Table Component ---

const WodTable: React.FC<WodTableProps> = ({
  wods, // Now directly using the Wod[] prop
  tableHeight,
  sortBy,
  sortDirection,
  handleSort,
  searchTerm,
  scoresByWodId, // Destructure new prop
}) => {
  // console.log("WodTable - Received wods prop:", wods); // DEBUG: Check prop value on render
  const parentRef = useRef<HTMLDivElement>(null);

  // No longer need flatData calculation

  const columns = useMemo(
    () =>
      createColumns(
        handleSort,
        sortBy,
        sortDirection,
        searchTerm,
        scoresByWodId,
      ), // Pass scores map
    [handleSort, sortBy, sortDirection, searchTerm, scoresByWodId], // Add dependency
  );

  const table = useReactTable({
    data: wods, // Use the wods prop directly
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  const { rows } = table.getRowModel();
  // console.log("WodTable - Row Model Length:", rows.length); // DEBUG

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 49, // Estimate remains useful
    overscan: 5,
    measureElement: (element) => (element as HTMLElement).offsetHeight,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  // console.log( // DEBUG
  //   "WodTable - Virtualizer:",
  //   `Items: ${virtualRows.length}, TotalSize: ${totalSize}`,
  // );
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
                  // Check if header.column.id is a valid SortByType before accessing it
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
          // console.log("WodTable - Rendering virtual row index:", virtualRow.index); // DEBUG
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

// Helper function to validate sort by type (needed for aria-sort)
const isValidSortBy = (sortBy: string | null): sortBy is SortByType => {
  const validSortKeys: SortByType[] = [
    "wodName",
    "date",
    "level",
    "attempts",
    "latestLevel",
    "difficulty",
    "countLikes",
  ];
  return validSortKeys.includes(sortBy as SortByType);
};

// Memoize the component
const MemoizedWodTable = React.memo(WodTable);
MemoizedWodTable.displayName = "WodTable"; // Add display name

export default MemoizedWodTable;
