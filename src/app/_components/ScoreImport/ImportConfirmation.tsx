"use client"; // Add directive if it uses client hooks indirectly or for consistency

import React from "react";
import type { ProcessedRow } from "./types"; // Import ProcessedRow type

interface ImportConfirmationProps {
  rows: ProcessedRow[]; // Use ProcessedRow[]
  selectedIds: Set<string>;
  onConfirm: () => void;
  onBack: () => void;
}

export function ImportConfirmation({
  rows,
  selectedIds,
  onConfirm,
  onBack,
}: ImportConfirmationProps) {
  const totalRows = rows.length;
  const selectedCount = selectedIds.size;
  // Filter only matched rows first before counting selected ones
  const matchedRows = rows.filter((r: ProcessedRow) => r.matchedWod);
  const matchedCount = matchedRows.length;
  // const selectedMatchedCount = matchedRows.filter((r: ProcessedRow) => // Commented out as unused
  //   selectedIds.has(r.id),
  // ).length;
  // Calculate skipped based on total rows vs matched rows
  const skippedCount = totalRows - matchedCount;
  // Calculate unselected based on total selected vs total rows
  const unselectedCount = totalRows - selectedCount;

  return (
    <div className="rounded-lg border bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-medium dark:text-white">
        Confirm Import
      </h3>
      <div className="mb-6 space-y-2 text-sm text-gray-700 dark:text-gray-300">
        <p>
          Total rows processed:{" "}
          <span className="font-semibold">{totalRows}</span>
        </p>
        <p>
          Rows matched to existing WODs:{" "}
          <span className="font-semibold">{matchedCount}</span>
        </p>
        <p>
          Rows skipped (no WOD match):{" "}
          <span className="font-semibold">{skippedCount}</span>
        </p>
        <hr className="my-2 dark:border-gray-600" />
        <p>
          Rows selected for import:{" "}
          <span className="font-semibold text-green-600 dark:text-green-400">
            {selectedCount}
          </span>
        </p>
        {/* Show breakdown only if relevant */}
        {/* <p>
          {" "}
          - Of which are matched WODs:{" "}
          <span className="font-semibold">{selectedMatchedCount}</span>
         </p> */}
        <p>
          Rows deselected/skipped by user:{" "}
          <span className="font-semibold text-orange-600 dark:text-orange-400">
            {unselectedCount}
          </span>
        </p>
      </div>

      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        Clicking 'Confirm Import' will add {/* Use ' */}
        <span className="font-semibold">{selectedCount}</span> score(s) to your
        history. This action cannot be undone easily.
      </p>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Back to Review
        </button>
        <button
          onClick={onConfirm}
          className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          disabled={selectedCount === 0}
        >
          Confirm Import
        </button>
      </div>
    </div>
  );
}
