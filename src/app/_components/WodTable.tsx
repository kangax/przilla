"use client";

import React, { useRef, useMemo } from "react"; // Removed useState, useLayoutEffect
import Link from "next/link";
import { Tooltip, Text, Flex, Badge } from "@radix-ui/themes";
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Wod, WodResult, SortByType } from "~/types/wodTypes";
import {
  getPerformanceLevel,
  getPerformanceLevelColor,
  getPerformanceLevelTooltip,
  formatScore,
} from "~/utils/wodUtils";

// --- Interfaces & Types ---

interface WodTableProps {
  wods: Wod[];
  sortBy: SortByType;
  sortDirection: "asc" | "desc";
  handleSort: (column: SortByType) => void;
}

// Represents a single row in the flattened data structure
interface FlatWodRow {
  wodName: string;
  wodUrl?: string;
  description?: string;
  category?: string;
  tags?: string[];
  difficulty?: string;
  difficulty_explanation?: string;
  count_likes?: number;
  benchmarks?: Wod["benchmarks"]; // Keep benchmarks for level calculation
  resultIndex: number; // Index of the result within the original Wod.results array
  result?: WodResult; // The specific result for this row (optional if no results)
  isFirstResult: boolean; // Flag if this is the first result row for a WOD
}

// --- Helper Functions ---

const safeString = (value: string | undefined): string => value || "";

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
      return "text-foreground";
  }
};

// --- Column Definitions ---

const columnHelper = createColumnHelper<FlatWodRow>();

const createColumns = (
  handleSort: (column: SortByType) => void,
  sortBy: SortByType,
  sortDirection: "asc" | "desc",
): ColumnDef<FlatWodRow, unknown>[] => {
  // Changed any to unknown
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
        // Only render WOD name/link on the first row for that WOD
        if (!row.isFirstResult) return null;
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
                {row.wodName}
                <span className="ml-1 flex-shrink-0 text-xs opacity-70">
                  ↗
                </span>
              </Link>
            ) : (
              <span className="max-w-[200px] truncate whitespace-nowrap font-medium">
                {row.wodName}
              </span>
            )}
          </Tooltip>
        );
      },
      size: 220, // Estimate size
    }),
    columnHelper.accessor("category", {
      header: "Category", // Changed header
      cell: (info) => {
        const row = info.row.original;
        // Only render category on the first row for that WOD
        if (!row.isFirstResult || !row.category) return null;
        return (
          <Badge color="indigo" variant="soft" radius="full" className="w-fit">
            {row.category}
          </Badge>
        );
      },
      size: 110, // Adjusted size
    }),
    // New column for Tags
    columnHelper.accessor("tags", {
      header: "Tags",
      cell: (info) => {
        const row = info.row.original;
        // Only render tags on the first row for that WOD
        if (!row.isFirstResult || !row.tags || row.tags.length === 0)
          return null;
        return (
          <Flex
            gap="1"
            className="flex-nowrap overflow-hidden" // Ensure single line
            title={row.tags.join(", ")} // Tooltip for overflow
          >
            {row.tags.map((tag) => (
              <Badge
                key={tag}
                color="gray"
                variant="soft"
                radius="full"
                className="flex-shrink-0 text-xs" // Prevent shrinking
              >
                {tag}
              </Badge>
            ))}
          </Flex>
        );
      },
      size: 200, // Set size for tags column
    }),
    // --- Moved Level column after Score ---
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
        // Only render difficulty on the first row for that WOD
        if (!row.isFirstResult) return null;
        if (!row.difficulty) return <Text>-</Text>;
        return (
          <Tooltip
            content={
              <span style={{ whiteSpace: "pre-wrap" }}>
                {safeString(row.difficulty_explanation)}
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
    columnHelper.accessor("count_likes", {
      header: () => (
        <span
          onClick={() => handleSort("count_likes")}
          className="cursor-pointer whitespace-nowrap"
        >
          Likes{getSortIndicator("count_likes")}
        </span>
      ),
      cell: (info) => {
        const row = info.row.original;
        // Only render likes on the first row for that WOD
        if (!row.isFirstResult) return null;
        return (
          <span className="whitespace-nowrap">{row.count_likes ?? "-"} </span>
        );
      },
      size: 60,
    }),
    // --- Date Column (Moved) ---
    columnHelper.accessor((row) => row.result?.date, {
      id: "date",
      header: () => (
        <span onClick={() => handleSort("date")} className="cursor-pointer">
          Date{getSortIndicator("date")}
        </span>
      ),
      cell: (info) => {
        const dateValue = safeString(info.getValue());
        return (
          <span className="whitespace-nowrap">{dateValue || "-"}</span> // Render dash if date is empty
        );
      },
      size: 90,
    }),
    // --- Score Column (Moved) ---
    columnHelper.accessor((row) => row.result, {
      id: "score",
      header: "Score",
      cell: (info) => {
        const result = info.getValue(); // Type assertion
        if (!result)
          return <span className="whitespace-nowrap font-mono">-</span>;
        return (
          <span className="whitespace-nowrap font-mono">
            {formatScore(result)}{" "}
            {result.rxStatus && (
              <span className="text-sm opacity-80">
                {safeString(result.rxStatus)}
              </span>
            )}
          </span>
        );
      },
      size: 150,
    }),
    // --- Level Column (Moved) ---
    columnHelper.accessor(
      (row) => ({ result: row.result, benchmarks: row.benchmarks }),
      {
        id: "level",
        header: () => (
          <span onClick={() => handleSort("level")} className="cursor-pointer">
            Level{getSortIndicator("level")}
          </span>
        ),
        cell: (info) => {
          // Type assertion for the destructured value
          const value = info.getValue() as {
            result?: WodResult;
            benchmarks?: Wod["benchmarks"];
          };
          const { result, benchmarks } = value;
          if (!result || !benchmarks) return <Text>-</Text>;

          const level = getPerformanceLevel(
            { benchmarks } as Wod, // Cast needed for util function
            result,
          );
          const levelText =
            level?.charAt(0).toUpperCase() + level?.slice(1) || "N/A";

          return (
            <Tooltip
              content={
                <span style={{ whiteSpace: "pre-wrap" }}>
                  {getPerformanceLevelTooltip({ benchmarks } as Wod)}
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
                  className={`font-medium ${getPerformanceLevelColor(level)}`}
                >
                  {levelText}
                </Text>
              )}
            </Tooltip>
          );
        },
        size: 110,
      },
    ),
    // --- Notes Column ---
    columnHelper.accessor((row) => row.result?.notes, {
      id: "notes",
      header: "Notes",
      cell: (info) => {
        const notes = safeString(info.getValue());
        if (!notes) return <span>-</span>;
        return (
          <Tooltip content={notes}>
            <span className="block max-w-[250px] truncate">{notes}</span>
          </Tooltip>
        );
      },
      size: 250,
    }),
  ];
};

// --- Main Table Component ---

const WodTable: React.FC<WodTableProps> = ({
  wods,
  sortBy,
  sortDirection,
  handleSort,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null); // Ref for header
  // Removed unused headerHeight state and useLayoutEffect

  // Flatten the data for virtualization
  const flatData = useMemo(() => {
    const rows: FlatWodRow[] = [];
    wods.forEach((wod) => {
      if (wod.results.length === 0) {
        rows.push({
          wodName: wod.wodName,
          wodUrl: wod.wodUrl,
          description: wod.description,
          category: wod.category,
          tags: wod.tags,
          difficulty: wod.difficulty,
          difficulty_explanation: wod.difficulty_explanation,
          count_likes: wod.count_likes,
          benchmarks: wod.benchmarks,
          resultIndex: 0,
          result: undefined,
          isFirstResult: true,
        });
      } else {
        wod.results.forEach((result, index) => {
          rows.push({
            wodName: wod.wodName,
            wodUrl: wod.wodUrl,
            description: wod.description,
            category: wod.category,
            tags: wod.tags,
            difficulty: wod.difficulty,
            difficulty_explanation: wod.difficulty_explanation,
            count_likes: wod.count_likes,
            benchmarks: wod.benchmarks,
            resultIndex: index,
            result: result,
            isFirstResult: index === 0,
          });
        });
      }
    });
    return rows;
  }, [wods]);

  const columns = useMemo(
    () => createColumns(handleSort, sortBy, sortDirection),
    [handleSort, sortBy, sortDirection],
  );

  const table = useReactTable({
    data: flatData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true, // We handle sorting externally
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 49, // Estimate row height in px (adjust as needed)
    overscan: 5, // Render a few extra rows above/below viewport
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const headerGroups = table.getHeaderGroups();

  return (
    <div
      ref={parentRef}
      className="h-[600px] w-full overflow-auto rounded-md border border-table-border" // Container with fixed height and scroll
    >
      <div
        style={{
          height: `${totalSize}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {/* Sticky Header */}
        {/* Ensure header stays sticky, remove incorrect absolute positioning */}
        <div
          ref={headerRef} // Attach ref here
          className="sticky top-0 z-10 bg-table-header"
          style={{ width: table.getTotalSize() }} // Rely on sticky class for positioning
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
                    header.column.id === sortBy
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

        {/* Virtualized Rows - These are positioned absolutely relative to the padded container */}
        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index];
          return (
            <div
              key={row.id}
              className="absolute left-0 flex w-full border-b border-table-border bg-table-row hover:bg-table-rowAlt"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`, // Positions row within the padded container
                width: table.getTotalSize(),
              }}
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

export default WodTable;
