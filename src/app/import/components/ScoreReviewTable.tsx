"use client"; // Add this directive

import React, { useState, useMemo } from "react"; // Removed useEffect
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnDef,
  type CellContext, // Import CellContext for explicit typing
} from "@tanstack/react-table";
import { Table } from "@radix-ui/themes"; // Import Radix Table components
import type { ProcessedRow } from "./types";
import { formatScore } from "~/utils/wodUtils"; // Assuming formatScore handles Score object
import type { Score } from "~/types/wodTypes"; // Import Score type for casting

interface ScoreReviewTableProps {
  rows: ProcessedRow[];
  // onSelectionChange prop removed as it's no longer needed
  // onEdit?: (id: string, field: keyof Score, value: unknown) => void; // Add later if needed
  onComplete: (selectedIds: Set<string>) => void;
}

const columnHelper = createColumnHelper<ProcessedRow>();

// Helper type for validation cell context
type ValidationCellContext = CellContext<
  ProcessedRow,
  ProcessedRow["validation"]
>;
// Helper type for proposedScore cell context
type ProposedScoreCellContext = CellContext<
  ProcessedRow,
  ProcessedRow["proposedScore"]
>;
// Helper type for isRx cell context
type IsRxCellContext = CellContext<ProcessedRow, boolean | null | undefined>;
// Helper type for notes cell context
type NotesCellContext = CellContext<ProcessedRow, string | null | undefined>;

export function ScoreReviewTable({
  rows,
  // onSelectionChange removed from destructuring
  // onEdit,
  onComplete,
}: ScoreReviewTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>(
    () => {
      // Initialize selection based on the 'selected' prop of incoming rows
      const initialSelection: Record<string, boolean> = {};
      rows.forEach((row) => {
        initialSelection[row.id] = row.selected;
      });
      return initialSelection;
    },
  );

  // Removed the problematic useEffect hook

  const columns = useMemo<ColumnDef<ProcessedRow>[]>( // Removed 'any' from ColumnDef generic
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            {...{
              checked: table.getIsAllRowsSelected(),
              // Pass undefined instead of false for indeterminate
              indeterminate: table.getIsSomeRowsSelected() ? true : undefined,
              onChange: table.getToggleAllRowsSelectedHandler(),
            }}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            {...{
              checked: row.getIsSelected(),
              disabled: !row.getCanSelect(),
              // Pass undefined instead of false for indeterminate
              indeterminate: row.getIsSomeSelected() ? true : undefined,
              onChange: row.getToggleSelectedHandler(),
            }}
          />
        ),
      }),
      columnHelper.accessor((row) => row.csvRow.date, {
        id: "date",
        header: "Date",
        cell: (info) => info.getValue(), // String return is safe
        enableSorting: true,
      }),
      columnHelper.accessor((row) => row.matchedWod?.wodName, {
        id: "wodName",
        header: "WOD Name",
        cell: (
          info,
        ): React.ReactNode => // Ensure return type is valid JSX/primitive
          info.getValue() ?? (
            <span className="italic text-orange-500">No Match</span>
          ),
        enableSorting: true,
      }),
      columnHelper.accessor((row) => row.proposedScore, {
        id: "score",
        header: "Score",
        // Safely handle proposedScore type for formatScore
        cell: (info: ProposedScoreCellContext): React.ReactNode => {
          // Add explicit type and return type
          const scoreData = info.getValue();
          // formatScore expects Score, but proposedScore omits some fields.
          // Casting assuming formatScore only needs the core value fields.
          return scoreData ? formatScore(scoreData as Score) : "-";
        },
        enableSorting: false,
      }),
      columnHelper.accessor((row) => row.proposedScore?.isRx, {
        id: "rx",
        header: "RX",
        cell: (info: IsRxCellContext): React.ReactNode =>
          info.getValue() ? "Rx" : "Scaled", // Add explicit type and return type
        enableSorting: true,
      }),
      columnHelper.accessor((row) => row.csvRow.notes, {
        id: "notes",
        header: "Notes",
        cell: (
          info: NotesCellContext,
        ): React.ReactNode => ( // Add explicit type and return type
          <span>{info.getValue() || "-"}</span>
        ),
        enableSorting: false,
      }),
    ],
    [], // Empty dependency array is correct here
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: (row) =>
      !!row.original.matchedWod && row.original.validation.isValid, // Only allow selecting valid, matched rows
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    debugTable: false, // Disable debug logging for production/general use
  });

  // Calculate selected count for the button
  const selectedCount = Object.values(rowSelection).filter(Boolean).length;

  return (
    <div>
      <h3 className="mb-3 text-lg font-medium">
        Scores matching those available in PRZilla. Select the ones you wish to
        import.
      </h3>

      {/* Use Radix Table Components */}
      <Table.Root variant="surface" size="1">
        {/* Use Radix Table Root */}
        <Table.Header>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Table.ColumnHeaderCell // Use Radix Header Cell
                  key={header.id}
                  colSpan={header.colSpan}
                  style={{
                    cursor: header.column.getCanSort() ? "pointer" : "default",
                    width: header.getSize(), // Apply size if needed
                  }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                  {{
                    asc: " 🔼",
                    desc: " 🔽",
                  }[header.column.getIsSorted() as string] ?? null}
                </Table.ColumnHeaderCell>
              ))}
            </Table.Row> // Missing closing tag was here
          ))}
        </Table.Header>
        <Table.Body>
          {/* Dark background and divider */}
          {table.getRowModel().rows.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={columns.length} align="center">
                {/* Use Radix Cell */}
                No data parsed or all rows are invalid/unmatched.
              </Table.Cell>
            </Table.Row>
          ) : (
            table.getRowModel().rows.map((row) => (
              <Table.Row // Use Radix Row
                key={row.id}
                // Apply subtle background for invalid/skipped rows using Radix colors if needed
                // className={`${!row.original.validation.isValid || !row.original.matchedWod ? "opacity-70" : ""}`} // Removed opacity for invalid as they are filtered out
                className={`${!row.getCanSelect() ? "opacity-50" : ""}`} // Dim rows that cannot be selected (already handled by parent filter, but belt-and-suspenders)
              >
                {row.getVisibleCells().map((cell) => (
                  <Table.Cell
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                  >
                    {/* Use Radix Cell */}
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table.Root>

      <div className="mt-6 flex justify-end">
        <button
          onClick={() =>
            onComplete(
              new Set(
                Object.keys(rowSelection).filter((id) => rowSelection[id]),
              ),
            )
          }
          className="rounded bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          disabled={selectedCount === 0}
        >
          Proceed to Confirmation ({selectedCount} selected)
        </button>
      </div>
    </div>
  );
}
