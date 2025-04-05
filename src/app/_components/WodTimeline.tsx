"use client";

import React, { useRef, useMemo } from "react";
import Link from "next/link";
import { Flex, Text, Tooltip, Badge } from "@radix-ui/themes";
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Wod, SortByType } from "~/types/wodTypes";
import {
  getPerformanceLevelColor,
  getPerformanceLevel,
  formatScore,
  hasScore,
} from "~/utils/wodUtils";

// --- Interfaces & Types ---

interface WodTimelineProps {
  wods: Wod[];
  tableHeight: number; // Added prop for dynamic height
  sortBy: SortByType;
  sortDirection: "asc" | "desc";
  handleSort: (column: SortByType) => void;
}

// --- Helper Functions ---

const safeString = (value: string | undefined | null): string => value ?? "";

// --- Column Definitions ---

const columnHelper = createColumnHelper<Wod>();

const createColumns = (
  handleSort: (column: SortByType) => void,
  sortBy: SortByType,
  sortDirection: "asc" | "desc",
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
            {wod.wodName}
            <span className="ml-1 flex-shrink-0 text-xs opacity-70">↗</span>
          </Link>
        ) : (
          <span className="max-w-[200px] truncate whitespace-nowrap font-medium">
            {wod.wodName}
          </span>
        );
      },
      size: 220, // Estimate size
    }),
    columnHelper.accessor("results", {
      // Access results array for rendering the timeline
      id: "progressTimeline", // Custom ID needed as accessor is not a simple string
      header: () => (
        <span
          onClick={() => handleSort("latestLevel")}
          className="cursor-pointer"
        >
          Progress Timeline{" "}
          <span className="text-xs opacity-70">(latest level)</span>
          {getSortIndicator("latestLevel")}
        </span>
      ),
      cell: (info) => {
        const wod = info.row.original; // Get the full Wod object
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

        if (!isAttempted) {
          return (
            <Text size="1" className="italic text-foreground/60">
              n/a
            </Text>
          );
        }

        return (
          <Flex align="center" className="flex-nowrap">
            {sortedResults.map((result, index) => (
              <Flex key={index} align="center" className="mb-1 flex-shrink-0">
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
                  <Text className="mx-2 flex-shrink-0">→</Text>
                )}
              </Flex>
            ))}
          </Flex>
        );
      },
      size: 500, // Estimate size for timeline
    }),
    columnHelper.accessor("description", {
      header: "Description",
      cell: (info) => (
        <Text className="font-small whitespace-pre-line text-sm">
          {info.getValue()}
        </Text>
      ),
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
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const columns = useMemo(
    () => createColumns(handleSort, sortBy, sortDirection),
    [handleSort, sortBy, sortDirection],
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
    estimateSize: () => 49, // Estimate row height (adjust as needed)
    overscan: 5,
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
          width: table.getTotalSize(), // Use table total size for inner div width
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
              className="absolute left-0 flex w-full border-b border-table-border bg-table-row hover:bg-table-rowAlt"
              style={{
                height: `${virtualRow.size}px`,
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

export default WodTimeline;
