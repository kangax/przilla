"use client";

import React from "react";
import { ScoreReviewTable } from "../ScoreReviewTable";
import type { ProcessedRow } from "../types";
import { CsvRowSchema, PrzillaCsvRowSchema } from "../types";

interface ReviewStepProps {
  processedRows: ProcessedRow[];
  handleReviewComplete: (selectedIds: Set<string>) => void;
  processingError: string | null;
}

export function ReviewStep({
  processedRows,
  handleReviewComplete,
  processingError,
}: ReviewStepProps) {
  // Separate matched and unmatched rows
  // Reverse matched rows chronologically (descending by date)
  const matchedRows = processedRows
    .filter((row) => row.matchedWod)
    .slice()
    .sort((a, b) => {
      const dateA = new Date(
        CsvRowSchema.safeParse(a.csvRow).success
          ? (a.csvRow as import("../../components/types").CsvRow).date
          : (a.csvRow as import("../../components/types").PrzillaCsvRow).Date,
      ).getTime();
      const dateB = new Date(
        CsvRowSchema.safeParse(b.csvRow).success
          ? (b.csvRow as import("../../components/types").CsvRow).date
          : (b.csvRow as import("../../components/types").PrzillaCsvRow).Date,
      ).getTime();
      return dateB - dateA;
    });
  // Reverse unmatched rows chronologically (descending by date)
  const unmatchedRows = processedRows
    .filter((row) => !row.matchedWod)
    .slice()
    .sort((a, b) => {
      const dateA = new Date(
        CsvRowSchema.safeParse(a.csvRow).success
          ? (a.csvRow as import("../../components/types").CsvRow).date
          : (a.csvRow as import("../../components/types").PrzillaCsvRow).Date,
      ).getTime();
      const dateB = new Date(
        CsvRowSchema.safeParse(b.csvRow).success
          ? (b.csvRow as import("../../components/types").CsvRow).date
          : (b.csvRow as import("../../components/types").PrzillaCsvRow).Date,
      ).getTime();
      return dateB - dateA;
    });

  // Log unmatched entries for review
  if (unmatchedRows.length > 0) {
    console.warn("Unmatched SugarWOD import entries:", unmatchedRows);
  }

  return (
    <div>
      {/* Display processing error prominently */}
      {processingError && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
          Error: {processingError}
        </div>
      )}

      <ScoreReviewTable rows={matchedRows} onComplete={handleReviewComplete} />

      {unmatchedRows.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-lg font-medium text-gray-700 dark:text-gray-300">
            Unmatched entries
          </h3>
          <ScoreReviewTable rows={unmatchedRows} onComplete={() => undefined} />
        </div>
      )}
    </div>
  );
}
