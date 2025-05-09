"use client";

import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnDef,
  type CellContext,
} from "@tanstack/react-table";
import { Table } from "@radix-ui/themes";
import type { ProcessedRow, CsvRow, PrzillaCsvRow } from "./types";
import { formatScore } from "~/utils/wodUtils";
import type { Score } from "~/types/wodTypes";

interface ScoreReviewTableProps {
  rows: ProcessedRow[];
  onComplete: (selectedIds: Set<string>) => void;
}

const columnHelper = createColumnHelper<ProcessedRow>();

// Helper type for proposedScore cell context
type ProposedScoreCellContext = CellContext<
  ProcessedRow,
  ProcessedRow["proposedScore"]
>;
// Helper type for isRx cell context
type IsRxCellContext = CellContext<ProcessedRow, boolean | null | undefined>;
// Helper type for notes cell context
type NotesCellContext = CellContext<ProcessedRow, string | null | undefined>;

import { CsvRowSchema, PrzillaCsvRowSchema } from "../components/types";

// Helper function to safely get date from either CsvRow or PrzillaCsvRow
const getDateFromCsvRow = (row: CsvRow | PrzillaCsvRow): string => {
  if (CsvRowSchema.safeParse(row).success) {
    return (row as CsvRow).date;
  } else if (PrzillaCsvRowSchema.safeParse(row).success) {
    return (row as PrzillaCsvRow).Date;
  }
  return "";
};

// Helper function to safely get notes from either CsvRow or PrzillaCsvRow
const getNotesFromCsvRow = (
  row: CsvRow | PrzillaCsvRow,
): string | null | undefined => {
  if ("notes" in row) {
    return row.notes;
  } else if ("Notes" in row) {
    return row.Notes;
  }
  return null;
};

export function ScoreReviewTable({ rows, onComplete }: ScoreReviewTableProps) {
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

  // Determine if rendering unmatched entries (no matchedWod)
  const isUnmatchedTable = rows.length > 0 && !rows[0].matchedWod;

  const columns = useMemo<ColumnDef<ProcessedRow>[]>(() => {
    if (isUnmatchedTable) {
      // Columns for unmatched entries table
      return [
        columnHelper.display({
          id: "select",
          header: () => <></>, // No selection header
          cell: () => <input type="checkbox" disabled />, // Disabled checkboxes
        }),
        columnHelper.accessor((row) => getDateFromCsvRow(row.csvRow), {
          id: "date",
          header: "Date",
          cell: (info) => info.getValue(),
          enableSorting: true,
        }),
        columnHelper.accessor(
          (row) => ("title" in row.csvRow ? row.csvRow.title : "No Title"),
          {
            id: "title",
            header: "Title",
            cell: (info) => (
              <span className="italic text-orange-500">{info.getValue()}</span>
            ),
            enableSorting: false,
          },
        ),
        columnHelper.accessor(
          (row) => ("description" in row.csvRow ? row.csvRow.description : "-"),
          {
            id: "description",
            header: "Description",
            cell: (info) => <span>{info.getValue()}</span>,
            enableSorting: false,
          },
        ),
        columnHelper.accessor(
          (row) =>
            "best_result_display" in row.csvRow
              ? row.csvRow.best_result_display
              : "-",
          {
            id: "bestResultDisplay",
            header: "Best Result",
            cell: (info) => <span>{info.getValue()}</span>,
            enableSorting: false,
          },
        ),
        columnHelper.accessor(
          (row) => {
            // Use rx_or_scaled field from csvRow if present, fallback to proposedScore.isRx
            if ("rx_or_scaled" in row.csvRow) {
              return row.csvRow.rx_or_scaled.toLowerCase() === "rx"
                ? "Rx"
                : "Scaled";
            }
            return row.proposedScore?.isRx ? "Rx" : "Scaled";
          },
          {
            id: "rx",
            header: "RX",
            cell: (info: IsRxCellContext): React.ReactNode => info.getValue(),
            enableSorting: true,
          },
        ),
        columnHelper.accessor((row) => getNotesFromCsvRow(row.csvRow), {
          id: "notes",
          header: "Notes",
          cell: (info: NotesCellContext): React.ReactNode => (
            <span>{info.getValue() || "-"}</span>
          ),
          enableSorting: false,
        }),
      ];
    } else {
      // Columns for matched entries table
      return [
        columnHelper.display({
          id: "select",
          size: 40,
          header: ({ table }) =>
            rows.some((row) => row.matchedWod) ? (
              <input
                type="checkbox"
                {...{
                  checked: table.getIsAllRowsSelected(),
                  indeterminate: table.getIsSomeRowsSelected()
                    ? true
                    : undefined,
                  onChange: table.getToggleAllRowsSelectedHandler(),
                }}
              />
            ) : (
              <></>
            ),
          cell: ({ row }) =>
            row.original.matchedWod ? (
              <input
                type="checkbox"
                {...{
                  checked: row.getIsSelected(),
                  disabled: !row.getCanSelect(),
                  indeterminate: row.getIsSomeSelected() ? true : undefined,
                  onChange: row.getToggleSelectedHandler(),
                }}
              />
            ) : (
              <input type="checkbox" disabled />
            ),
        }),
        columnHelper.accessor((row) => getDateFromCsvRow(row.csvRow), {
          id: "date",
          header: "Date",
          cell: (info) => info.getValue(),
          enableSorting: true,
        }),
        columnHelper.accessor((row) => row.matchedWod?.wodName, {
          id: "wodName",
          header: "WOD Name",
          cell: (info): React.ReactNode => {
            if (info.row.original.matchedWod) {
              return info.getValue();
            } else {
              // Show title from CSV for unmatched entries
              return (
                <span className="italic text-orange-500">
                  {"title" in info.row.original.csvRow
                    ? info.row.original.csvRow.title
                    : "No Title"}
                </span>
              );
            }
          },
          enableSorting: true,
        }),
        columnHelper.accessor((row) => row.proposedScore, {
          id: "score",
          header: "Score",
          cell: (info: ProposedScoreCellContext): React.ReactNode => {
            const scoreData = info.getValue();
            const matchedWod = info.row.original.matchedWod;
            return scoreData && matchedWod
              ? formatScore(scoreData as Score, matchedWod)
              : "-";
          },
          enableSorting: false,
        }),
        columnHelper.accessor((row) => row.proposedScore?.isRx, {
          id: "rx",
          header: "RX",
          cell: (info: IsRxCellContext): React.ReactNode =>
            info.getValue() ? "Rx" : "Scaled",
          enableSorting: true,
        }),
        columnHelper.accessor((row) => getNotesFromCsvRow(row.csvRow), {
          id: "notes",
          header: "Notes",
          cell: (info: NotesCellContext): React.ReactNode => (
            <span>{info.getValue() || "-"}</span>
          ),
          enableSorting: false,
        }),
      ];
    }
  }, [rows, isUnmatchedTable]);

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: (row) =>
      !!row.original.matchedWod && row.original.validation.isValid,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    debugTable: false,
  });

  // Calculate selected count for the button
  const selectedCount = Object.values(rowSelection).filter(Boolean).length;

  return (
    <div>
      <h3 className="mb-3 text-lg font-medium">
        Scores matching those available in PRZilla. Select the ones you wish to
        import.
      </h3>

      <Table.Root variant="surface" size="1">
        <Table.Header>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Table.ColumnHeaderCell
                  key={header.id}
                  colSpan={header.colSpan}
                  style={{
                    cursor: header.column.getCanSort() ? "pointer" : "default",
                    width: header.getSize(),
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
            </Table.Row>
          ))}
        </Table.Header>
        <Table.Body>
          {table.getRowModel().rows.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={columns.length} align="center">
                No data parsed or all rows are invalid/unmatched.
              </Table.Cell>
            </Table.Row>
          ) : (
            table.getRowModel().rows.map((row) => (
              <Table.Row
                key={row.id}
                className={`${!row.getCanSelect() ? "opacity-50" : ""}`}
              >
                {row.getVisibleCells().map((cell) => (
                  <Table.Cell
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table.Root>

      {rows.some((row) => row.matchedWod) && (
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
      )}
    </div>
  );
}
