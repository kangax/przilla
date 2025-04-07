"use client";

import React, { useRef, useMemo } from "react"; // Removed useState, useLayoutEffect
import Link from "next/link";
import { Tooltip, Text, Flex, Badge } from "@radix-ui/themes";
import { Info } from "lucide-react"; // Added Info icon
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
  tableHeight: number; // Add prop for dynamic height
  sortBy: SortByType;
  sortDirection: "asc" | "desc";
  handleSort: (column: SortByType) => void;
  searchTerm: string; // Added for highlighting
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

// --- Highlight Component ---
// Simple component to highlight matches in text
const HighlightMatch: React.FC<{ text: string; highlight: string }> = ({
  text,
  highlight,
}) => {
  if (!highlight.trim()) {
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
};

// --- Column Definitions ---

const columnHelper = createColumnHelper<FlatWodRow>();

const createColumns = (
  handleSort: (column: SortByType) => void,
  sortBy: SortByType,
  sortDirection: "asc" | "desc",
  searchTerm: string, // Added searchTerm
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
      size: 200,
    }),
    // Combined Category and Tags Column
    columnHelper.accessor(
      (row) => ({ category: row.category, tags: row.tags }),
      {
        id: "categoryAndTags", // Unique ID for combined column
        header: "Category / Tags",
        cell: (info) => {
          const { category, tags } = info.getValue();
          const row = info.row.original;

          // Only render on the first row for that WOD
          if (!row.isFirstResult) return null;
          if (!category && (!tags || tags.length === 0)) return null; // Render nothing if both are empty

          return (
            <Flex direction="column" gap="1" align="start">
              {/* Category Badge */}
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
              {/* Tags Badges */}
              {tags && tags.length > 0 && (
                <Flex
                  gap="1"
                  wrap="wrap" // Allow tags to wrap
                  className="mt-1" // Add some margin top
                >
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      color="gray"
                      variant="soft"
                      radius="full"
                      className="flex-shrink-0 text-xs" // Prevent shrinking
                    >
                      <HighlightMatch text={tag} highlight={searchTerm} />
                    </Badge>
                  ))}
                </Flex>
              )}
            </Flex>
          );
        },
        size: 180, // Adjusted size for combined content
      },
    ),
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
      size: 70,
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
    // Accessor now includes benchmarks for the tooltip
    columnHelper.accessor(
      (row) => ({ result: row.result, benchmarks: row.benchmarks }),
      {
        id: "score",
        header: "Score",
        cell: (info) => {
          // Destructure result and benchmarks
          const value = info.getValue() as {
            result?: WodResult;
            benchmarks?: Wod["benchmarks"];
          };
          const { result, benchmarks } = value;

          // If no result, show Info icon with benchmark tooltip
          if (!result) {
            // Ensure benchmarks exist before showing tooltip
            if (!benchmarks)
              return <span className="whitespace-nowrap font-mono">-</span>;
            return (
              <Tooltip
                content={
                  <span style={{ whiteSpace: "pre-wrap" }}>
                    {getPerformanceLevelTooltip({ benchmarks } as Wod)}
                  </span>
                }
              >
                <Info size={14} className="text-muted-foreground" />
              </Tooltip>
            );
          }

          // Score display logic with optional notes tooltip
          const scoreDisplay = (
            <span className="whitespace-nowrap">
              {formatScore(result)}{" "}
              {result.rxStatus && (
                <Badge
                  color="gray"
                  variant="soft"
                  radius="full"
                  className="w-fit"
                >
                  {safeString(result.rxStatus)}
                </Badge>
              )}
            </span>
          );

          if (result.notes) {
            return (
              <Tooltip
                content={
                  <span style={{ whiteSpace: "pre-wrap" }}>{result.notes}</span>
                }
              >
                {scoreDisplay}
              </Tooltip>
            );
          } else {
            return scoreDisplay;
          }
        },
        size: 140,
      },
    ),
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
    // --- Description Column (New) ---
    columnHelper.accessor("description", {
      header: "Description",
      cell: (info) => {
        const row = info.row.original;
        // Only render description on the first row for that WOD
        if (!row.isFirstResult || !row.description) return null;
        return (
          <span className="whitespace-normal break-words">
            <HighlightMatch text={row.description} highlight={searchTerm} />
          </span>
        );
      },
      size: 300, // Adjust size as needed
    }),
  ];
};

// --- Main Table Component ---

const WodTable: React.FC<WodTableProps> = ({
  wods,
  tableHeight, // Destructure the new prop
  sortBy,
  sortDirection,
  handleSort,
  searchTerm, // Destructure searchTerm
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
    () => createColumns(handleSort, sortBy, sortDirection, searchTerm), // Pass searchTerm
    [handleSort, sortBy, sortDirection, searchTerm], // Add searchTerm dependency
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
    estimateSize: () => 49, // Still provide an estimate
    overscan: 5,
    // Add measurement function for dynamic height, casting element
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
              className="absolute left-0 top-0 flex w-full border-b border-table-border bg-table-row hover:bg-table-rowAlt" // Added top-0
              style={{
                // Remove fixed height, let content determine it
                transform: `translateY(${virtualRow.start}px)`, // Positions row within the padded container
                width: table.getTotalSize(),
              }}
              // Add ref for measurement
              ref={rowVirtualizer.measureElement}
              data-index={virtualRow.index} // Required by measureElement
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
