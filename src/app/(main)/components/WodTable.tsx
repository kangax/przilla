"use client";

import React, { useRef, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Wod, Score, SortByType } from "~/types/wodTypes";
import { LogScoreDialog } from "./LogScoreDialog";
import { DeleteScoreDialog } from "./DeleteScoreDialog";
import { useSession } from "~/lib/auth-client";
import { isValidSortBy } from "./wodTableUtils";
// api, useToast are now used within useWodTableDialogs or useFavoriteWod
import { useFavoriteWod } from "./hooks/useFavoriteWod"; 
import { useWodTableDialogs } from "./hooks/useWodTableDialogs"; // Import the new dialogs hook
import { Flex } from "@radix-ui/themes"; 

// Import new column definitions
import { createWodNameColumn } from "./WodTableColumns/wodNameColumn";
import { createCategoryAndTagsColumn } from "./WodTableColumns/categoryAndTagsColumn";
import { createDifficultyColumn } from "./WodTableColumns/difficultyColumn";
import { createCountLikesColumn } from "./WodTableColumns/countLikesColumn";
import { createDescriptionColumn } from "./WodTableColumns/descriptionColumn";
import { createResultsColumn } from "./WodTableColumns/resultsColumn";


interface WodTableProps {
  wods: Wod[];
  tableHeight: number;
  sortBy: SortByType;
  sortDirection: "asc" | "desc";
  handleSort: (column: SortByType) => void;
  searchTerm: string;
  scoresByWodId: Record<string, Score[]>;
  _isLoadingScores: boolean; // Prefixed as unused for now
  onScoreLogged?: () => void;
}

// Simplified createColumns - now an assembler
const createColumns = (
  handleSort: (column: SortByType) => void,
  sortBy: SortByType,
  sortDirection: "asc" | "desc",
  searchTerm: string,
  scoresByWodId: Record<string, Score[]>,
  isUserLoggedIn: boolean,
  handleToggleFavorite: (wodId: string, currentIsFavorited: boolean) => void,
  // onScoreLogged is passed to createResultsColumn
  openLogDialog?: (wod: Wod) => void,
  openEditDialog?: (score: Score, wod: Wod) => void,
  handleDeleteScore?: (score: Score, wod: Wod) => void,
): ColumnDef<Wod, any>[] => { // Return type changed to any for simplicity during assembly
  return [
    createWodNameColumn({
      handleSort,
      sortBy,
      sortDirection,
      searchTerm,
      isUserLoggedIn,
      handleToggleFavorite,
    }),
    createCategoryAndTagsColumn({ searchTerm }),
    createDifficultyColumn({ handleSort, sortBy, sortDirection }),
    createCountLikesColumn({ handleSort, sortBy, sortDirection }),
    createDescriptionColumn({ searchTerm }),
    createResultsColumn({
      scoresByWodId,
      handleSort,
      sortBy,
      sortDirection,
      openLogDialog,
      openEditDialog,
      handleDeleteScore,
    }),
  ];
};

const WodTable: React.FC<WodTableProps> = ({
  wods,
  tableHeight,
  sortBy,
  sortDirection,
  handleSort,
  searchTerm,
  scoresByWodId,
  _isLoadingScores, // Prefixed as unused for now
  onScoreLogged, // This will be passed to useWodTableDialogs
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const isUserLoggedIn = !!session?.user;

  // Use the new hook for favorite logic
  const {
    handleToggleFavorite,
  } = useFavoriteWod({ searchTerm });
  
  // Use the new hook for dialog management
  const {
    logScoreDialogState,
    openLogNewScoreDialog,
    openEditScoreDialog,
    handleLogScoreDialogChange,
    handleLogScoreDialogSubmit,
    deleteScoreDialogState,
    requestDeleteScore,
    confirmDeleteScore,
    cancelDeleteScore,
    isDeletingScore,
  } = useWodTableDialogs({ onDialogActionCompletion: onScoreLogged });


  const columns = useMemo(
    () =>
      createColumns(
        handleSort,
        sortBy,
        sortDirection,
        searchTerm,
        scoresByWodId,
        isUserLoggedIn,
        handleToggleFavorite,
        openLogNewScoreDialog, // Pass new handler from hook
        openEditScoreDialog,   // Pass new handler from hook
        requestDeleteScore,  // Pass new handler from hook
      ),
    [
      handleSort,
      sortBy,
      sortDirection,
      searchTerm,
      scoresByWodId,
      isUserLoggedIn,
      handleToggleFavorite,
      // Dependencies from useWodTableDialogs hook if their functions are not stable (e.g., not wrapped in useCallback within the hook)
      // For now, assuming they are stable or their change implies a re-render anyway.
      // Add openLogNewScoreDialog, openEditScoreDialog, requestDeleteScore if they are not stable.
      // onScoreLogged is part of the hook's setup, so it's implicitly a dependency if it changes.
    ],
  );

  const table = useReactTable({
    data: wods,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true, // Keep manual sorting as the main sort logic is outside TanStack Table
    // No need for meta here, scoresByWodId is accessed via closure in sortingFn
  });

  const { rows } = table.getRowModel();

  // Disable virtualization in test environment for reliable test rendering
  const isTestEnv =
    typeof process !== "undefined" && process.env.NODE_ENV === "test";

  // Always call useVirtualizer, but set count to 0 in test env
  const rowVirtualizer = useVirtualizer({
    count: isTestEnv ? 0 : rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 49,
    overscan: 5,
    measureElement: (element) => (element as HTMLElement).offsetHeight,
  });

  let renderedRows: React.ReactNode;
  if (isTestEnv) {
    renderedRows = rows.map((row) => (
      <div
        key={row.id}
        className="group flex w-full border-b border-table-border bg-table-row hover:bg-table-rowAlt"
        style={{
          width: table.getTotalSize(),
        }}
        data-index={row.index}
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
    ));
  } else {
    const virtualRows = rowVirtualizer.getVirtualItems();
    renderedRows = virtualRows.map((virtualRow) => {
      const row = rows[virtualRow.index];
      return (
        <div
          key={row.id}
          className="group absolute left-0 top-0 flex w-full border-b border-table-border bg-table-row hover:bg-table-rowAlt"
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
    });
  }

  const headerGroups = table.getHeaderGroups();

  const headerHeightEstimate = 40;
  const bodyHeight = tableHeight - headerHeightEstimate;

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

      {/* Body Container - Handles No Results/Rows */}
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`, // Use virtualizer total size
          width: "100%",
          position: "relative",
        }}
      >
        {rows.length === 0 ? (
          <Flex
            align="center"
            justify="center"
            className="text-muted-foreground absolute inset-0"
            style={{ height: `${bodyHeight}px` }}
          >
            {/* No results found. */}
          </Flex>
        ) : (
          renderedRows
        )}
      </div>

      {/* Log/Edit Score Dialog */}
      {logScoreDialogState.isOpen && logScoreDialogState.wod && (
        <LogScoreDialog
          isOpen={logScoreDialogState.isOpen}
          onOpenChange={handleLogScoreDialogChange}
          wod={logScoreDialogState.wod}
          initialScore={logScoreDialogState.scoreToEdit}
          onScoreLogged={handleLogScoreDialogSubmit} // Use submit handler from hook
        />
      )}

      {/* Delete confirmation dialog */}
      {deleteScoreDialogState.isOpen && deleteScoreDialogState.scoreToDelete && deleteScoreDialogState.wodAssociated && (
        <DeleteScoreDialog
          open={deleteScoreDialogState.isOpen}
          onOpenChange={(open) => { if (!open) cancelDeleteScore(); }} // Close via cancel if dismissed
          onConfirm={confirmDeleteScore}
          onCancel={cancelDeleteScore}
          isDeleting={isDeletingScore}
          score={deleteScoreDialogState.scoreToDelete}
          wod={deleteScoreDialogState.wodAssociated}
        />
      )}
    </div>
  );
};

const MemoizedWodTable = React.memo(WodTable);
MemoizedWodTable.displayName = "WodTable";

export default MemoizedWodTable;
