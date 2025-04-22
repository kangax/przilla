"use client";

import { useState } from "react";
import type { ProcessedRow } from "../components/types";

export type ImportStep =
  | "upload"
  | "processing"
  | "review"
  | "confirm"
  | "complete";

export interface UseImportFlowProps {
  importType: "przilla" | "sugarwod";
}

export interface UseImportFlowReturn {
  step: ImportStep;
  setStep: (step: ImportStep) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  processedRows: ProcessedRow[];
  setProcessedRows: (rows: ProcessedRow[]) => void;
  selectedRows: Set<string>;
  setSelectedRows: (rows: Set<string>) => void;
  processingError: string | null;
  setProcessingError: (error: string | null) => void;
  importSuccessCount: number;
  setImportSuccessCount: (count: number) => void;
  handleReset: () => void;
}

export function useImportFlow({
  importType: _importType, // Renamed to satisfy lint rule for unused vars
}: UseImportFlowProps): UseImportFlowReturn {
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [processedRows, setProcessedRows] = useState<ProcessedRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [importSuccessCount, setImportSuccessCount] = useState<number>(0);

  const handleReset = () => {
    setFile(null);
    setProcessedRows([]);
    setSelectedRows(new Set());
    setProcessingError(null);
    setImportSuccessCount(0);
    setStep("upload");
  };

  return {
    step,
    setStep,
    file,
    setFile,
    processedRows,
    setProcessedRows,
    selectedRows,
    setSelectedRows,
    processingError,
    setProcessingError,
    importSuccessCount,
    setImportSuccessCount,
    handleReset,
  };
}
