"use client";

import React from "react";
import { ImportConfirmation } from "../ImportConfirmation";
import { LoadingIndicator } from "../../../_components/LoadingIndicator";
import type { ProcessedRow } from "../types";

interface ConfirmStepProps {
  processedRows: ProcessedRow[];
  selectedRows: Set<string>;
  handleConfirm: () => void;
  handleBack: () => void;
  isSubmitting: boolean;
  processingError: string | null;
}

export function ConfirmStep({
  processedRows,
  selectedRows,
  handleConfirm,
  handleBack,
  isSubmitting,
  processingError,
}: ConfirmStepProps) {
  if (isSubmitting) {
    return <LoadingIndicator message="Submitting scores..." />;
  }

  return (
    <div>
      {/* Display processing error prominently */}
      {processingError && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
          Error: {processingError}
        </div>
      )}

      <ImportConfirmation
        rows={processedRows}
        selectedIds={selectedRows}
        onConfirm={handleConfirm}
        onBack={handleBack}
      />
    </div>
  );
}
