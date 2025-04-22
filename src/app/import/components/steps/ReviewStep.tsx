"use client";

import React from "react";
import { ScoreReviewTable } from "../ScoreReviewTable";
import type { ProcessedRow } from "../types";

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
  return (
    <div>
      {/* Display processing error prominently */}
      {processingError && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
          Error: {processingError}
        </div>
      )}

      <ScoreReviewTable
        rows={processedRows.filter((row) => row.matchedWod)} // Filter for matched WODs only
        onComplete={handleReviewComplete} // Pass the handler to proceed
      />
    </div>
  );
}
