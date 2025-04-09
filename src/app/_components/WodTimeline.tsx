"use client";

import React, { useRef, useMemo } from "react";
import Link from "next/link";
// Removed unused Flex, Tooltip, Badge
import { Text } from "@radix-ui/themes";
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
// Removed unused WodResult
import type { Wod, SortByType } from "~/types/wodTypes";
// Removed unused utils
// import {
//   getPerformanceLevelColor,
//   getPerformanceLevel,
//   formatScore,
//   hasScore,
// } from "~/utils/wodUtils";

// --- Interfaces & Types ---

interface WodTimelineProps {
  wods: Wod[];
  tableHeight: number; // Added prop for dynamic height
  sortBy: SortByType;
  sortDirection: "asc" | "desc";
  handleSort: (column: SortByType) => void;
  searchTerm: string; // Added searchTerm prop
}
// Removed unused safeString function
// const safeString = (value: string | undefined | null): string => value ?? "";

// --- Highlight Component (Copied from WodTable.tsx) ---
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

const columnHelper = createColumnHelper<Wod>();

const createColumns = (
  handleSort: (column: SortByType) => void,
  sortBy: SortByType,
  sortDirection: "asc" | "desc",
  searchTerm: string, // Added searchTerm parameter
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
        const wod = info.row.original;
        return wod.wodUrl ? (
          <Link
            href={wod.wodUrl}
            target="_blank"
            className="flex max-w-[200px] items-center truncate whitespace-nowrap font-medium text-primary hover:underline"
          >
            <HighlightMatch text={wod.wodName} highlight={searchTerm} />
            <span className="ml-1 flex-shrink-0 text-xs opacity-70">↗</span>
          </Link>
        ) : (
          <span className="max-w-[200px] truncate whitespace-nowrap font-medium">
            <HighlightMatch text={wod.wodName} highlight={searchTerm} />
          </span>
        );
      },
      size: 220, // Estimate size
    }),
    // REMOVED Progress Timeline column as wod.results is not available
    // columnHelper.accessor("results", { ... }),
    columnHelper.accessor("description", {
      header: "Description",
      cell: (info) => {
        const description = info.getValue<string>(); // Explicitly type the value
        if (!description) return null;
        return (
          <Text className="font-small whitespace-pre-line text-sm">
            <HighlightMatch text={description} highlight={searchTerm} />
          </Text>
        );
      },
      size: 400, // Estimate size
    }),
  ];
};

// --- Main Timeline Component ---
const WodTimeline: React.FC<WodTimelineProps> = ({
  wods,
  tableHeight,
  sortBy,
  sortDirection,
  handleSort,
  searchTerm, // Destructure searchTerm
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const columns = useMemo(
    () => createColumns(handleSort, sortBy, sortDirection, searchTerm), // Pass searchTerm
    [handleSort, sortBy, sortDirection, searchTerm], // Add searchTerm dependency
  );

  const table = useReactTable({
    data: wods, // Use wods directly, no flattening
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true, // Sorting is handled externally
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 70, // Estimate: Adjust based on typical content + padding
    overscan: 5,
    // Add measureElement for dynamic height - remove userAgent check
    measureElement: (element) => element.getBoundingClientRect().height,
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
        <div
          className="sticky top-0 z-10 bg-table-header"
          style={{ width: "100%" }} // Header width should match container
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
                    header.column.id === sortBy // Use column ID for comparison
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

        {/* Virtualized Rows */}
        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index];
          return (
            <div
              key={row.id}
              ref={rowVirtualizer.measureElement} // Add ref for measurement
              data-index={virtualRow.index} // Required by measureElement
              className="absolute left-0 flex w-full border-b border-table-border bg-table-row hover:bg-table-rowAlt"
              style={{
                // Height is now dynamic based on content, remove fixed height style
                transform: `translateY(${virtualRow.start}px)`,
                width: "100%", // Row width should match container
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

// Memoize the component
const MemoizedWodTimeline = React.memo(WodTimeline);
MemoizedWodTimeline.displayName = "WodTimeline"; // Add display name

export default MemoizedWodTimeline;
