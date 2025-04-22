"use client";

import { useCallback, useEffect, useState } from "react";
import Papa from "papaparse";
import type { Wod } from "~/types/wodTypes";
import type {
  CsvRow,
  ProcessedRow,
  SugarWodProcessedRow,
  PrzillaProcessedRow,
  PrzillaCsvRow,
} from "../components/types";
import { isCsvRow } from "../components/types";
import type { ImportStep } from "./useImportFlow";

export interface UseScoreProcessingProps {
  importType: "przilla" | "sugarwod";
  file: File | null;
  step: ImportStep;
  setStep: (step: ImportStep) => void;
  setProcessedRows: (rows: ProcessedRow[]) => void;
  setSelectedRows: (rows: Set<string>) => void;
  setProcessingError: (error: string | null) => void;
  wodsMap: Map<string, Wod>;
  isLoadingWods: boolean;
  wodsError: Error | null | unknown;
  processedRows: ProcessedRow[];
}

export interface UseScoreProcessingReturn {
  parseAndProcessFile: (fileToProcess: File) => void;
}

export function useScoreProcessing({
  importType,
  file,
  step,
  setStep,
  setProcessedRows,
  setSelectedRows,
  setProcessingError,
  wodsMap,
  isLoadingWods,
  wodsError,
  processedRows,
}: UseScoreProcessingProps): UseScoreProcessingReturn {
  // Parse and process the file based on import type
  const parseAndProcessFile = useCallback(
    (fileToProcess: File) => {
      setProcessingError(null);

      if (importType === "przilla") {
        // PRzilla CSV format: expects headers as exported from PRzilla
        Papa.parse(fileToProcess, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              setProcessingError(
                `Error parsing CSV: ${results.errors[0]?.message || "Unknown error"}`,
              );
              setStep("upload");
              return;
            }
            if (wodsMap.size === 0) {
              setProcessingError(
                "WOD data not available for matching. Please try again.",
              );
              setStep("upload");
              return;
            }

            // PRzilla export headers: "WOD Name", "Date", "Score (time)", "Score (reps)", "Score (rounds)", "Score (partial reps)", "Score (load)", "Rx", "Notes"
            const processedData: ProcessedRow[] = (results.data as any[])
              .map((row, index) => {
                const wodName = row["WOD Name"]?.trim?.() || "";
                const matchedWod = wodsMap.get(wodName) || null;
                const validationErrors: string[] = [];
                let scoreDate: Date | null = null;
                if (row["Date"]) {
                  // Accept YYYY-MM-DD or ISO
                  const d = new Date(row["Date"]);
                  if (!isNaN(d.getTime())) {
                    scoreDate = d;
                  } else {
                    validationErrors.push("Invalid date format");
                  }
                } else {
                  validationErrors.push("Missing date");
                }
                // Parse numeric fields
                const safeParseFloat = (val: string) => {
                  const num = parseFloat(val);
                  return isNaN(num) ? null : num;
                };
                const safeParseInt = (val: string) => {
                  const num = parseInt(val, 10);
                  return isNaN(num) ? null : num;
                };
                const time_seconds = row["Score (time)"]
                  ? safeParseFloat(row["Score (time)"])
                  : null;
                const reps = row["Score (reps)"]
                  ? safeParseInt(row["Score (reps)"])
                  : null;
                const rounds_completed = row["Score (rounds)"]
                  ? safeParseInt(row["Score (rounds)"])
                  : null;
                const partial_reps = row["Score (partial reps)"]
                  ? safeParseInt(row["Score (partial reps)"])
                  : null;
                const load = row["Score (load)"]
                  ? safeParseInt(row["Score (load)"])
                  : null;
                const isRx = row["Rx"]?.toLowerCase?.() === "yes";
                const notes = row["Notes"] || null;

                let proposedScore: ProcessedRow["proposedScore"] = null;
                if (matchedWod && scoreDate) {
                  if (
                    time_seconds === null &&
                    reps === null &&
                    load === null &&
                    rounds_completed === null
                  ) {
                    validationErrors.push("No valid score value found");
                  } else {
                    proposedScore = {
                      wodId: matchedWod.id,
                      scoreDate,
                      isRx,
                      notes,
                      time_seconds,
                      reps,
                      load,
                      rounds_completed,
                      partial_reps,
                    };
                  }
                }
                // Cast row to PrzillaCsvRow type
                return {
                  id: `row-${index}`,
                  csvRow: row as unknown as PrzillaCsvRow,
                  matchedWod,
                  validation: {
                    isValid: validationErrors.length === 0 && !!matchedWod,
                    errors: validationErrors,
                  },
                  proposedScore:
                    matchedWod && proposedScore ? proposedScore : null,
                  selected:
                    !!matchedWod &&
                    validationErrors.length === 0 &&
                    !!proposedScore,
                };
              })
              .filter((row): row is PrzillaProcessedRow => row !== null);

            setProcessedRows(processedData);
            setSelectedRows(
              new Set(processedData.filter((r) => r.selected).map((r) => r.id)),
            );
            setStep("review");
          },
          error: (error: Error) => {
            setProcessingError(`Failed to parse CSV: ${error.message}`);
            setStep("upload");
          },
        });
      } else {
        // SugarWOD import
        Papa.parse<CsvRow>(fileToProcess, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              setProcessingError(
                `Error parsing CSV: ${results.errors[0]?.message || "Unknown error"}`,
              );
              setStep("upload");
              return;
            }
            if (wodsMap.size === 0) {
              setProcessingError(
                "WOD data not available for matching. Please try again.",
              );
              setStep("upload");
              return;
            }

            const processedData: ProcessedRow[] = results.data
              .map((rawRow, index) => {
                if (!isCsvRow(rawRow)) {
                  return null;
                }
                const csvRow: CsvRow = rawRow;
                const sugarwodAliases: Record<string, string> = {
                  "1 mile Run": "Run 1600m",
                  "2 mile Run": "Run 3200m",
                  "5k Run": "Run 5000m",
                  "10k Run": "Run 10000m",
                };
                const importedTitle = csvRow.title;
                const canonicalName = sugarwodAliases[importedTitle];
                let matchedWod: Wod | null = null;
                if (canonicalName) {
                  matchedWod = wodsMap.get(canonicalName) || null;
                } else {
                  matchedWod = wodsMap.get(importedTitle) || null;
                }
                const validationErrors: string[] = [];
                let scoreDate: Date | null = null;
                try {
                  const parts = csvRow.date.split("/");
                  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
                    scoreDate = new Date(
                      parseInt(parts[2]),
                      parseInt(parts[0]) - 1,
                      parseInt(parts[1]),
                    );
                    if (isNaN(scoreDate.getTime())) {
                      validationErrors.push("Invalid date format");
                      scoreDate = null;
                    }
                  } else {
                    validationErrors.push("Invalid date format");
                  }
                } catch {
                  validationErrors.push("Error parsing date");
                }
                let proposedScore: ProcessedRow["proposedScore"] = null;
                if (matchedWod && scoreDate) {
                  const safeParseFloat = (val: string) => {
                    const num = parseFloat(val);
                    return isNaN(num) ? null : num;
                  };
                  const safeParseInt = (val: string) => {
                    const num = parseInt(val, 10);
                    return isNaN(num) ? null : num;
                  };
                  const scoreTypeLower =
                    csvRow.score_type?.toLowerCase() || "time";
                  const rawScore = csvRow.best_result_raw || "";
                  const isRounds = scoreTypeLower.includes("rounds");
                  const roundsParts = isRounds ? rawScore.split("+") : [];
                  proposedScore = {
                    wodId: matchedWod.id,
                    time_seconds: scoreTypeLower.includes("time")
                      ? safeParseFloat(rawScore)
                      : null,
                    reps: scoreTypeLower.includes("reps")
                      ? safeParseInt(rawScore)
                      : null,
                    load: scoreTypeLower.includes("load")
                      ? safeParseInt(rawScore)
                      : null,
                    rounds_completed: isRounds
                      ? safeParseInt(roundsParts[0] ?? "")
                      : null,
                    partial_reps:
                      isRounds && roundsParts.length > 1
                        ? safeParseInt(roundsParts[1] ?? "")
                        : null,
                    isRx: csvRow.rx_or_scaled?.toUpperCase() === "RX",
                    scoreDate: scoreDate,
                    notes: csvRow.notes || null,
                  };
                  if (
                    proposedScore.time_seconds === null &&
                    proposedScore.reps === null &&
                    proposedScore.load === null &&
                    proposedScore.rounds_completed === null
                  ) {
                    validationErrors.push(
                      "No valid score value found based on score_type",
                    );
                    proposedScore = null;
                  }
                }
                return {
                  id: `row-${index}`,
                  csvRow,
                  matchedWod,
                  validation: {
                    isValid: validationErrors.length === 0 && !!matchedWod,
                    errors: validationErrors,
                  },
                  proposedScore: matchedWod ? proposedScore : null,
                  selected:
                    !!matchedWod &&
                    validationErrors.length === 0 &&
                    !!proposedScore,
                };
              })
              .filter((row): row is SugarWodProcessedRow => row !== null);

            setProcessedRows(processedData);
            setSelectedRows(
              new Set(processedData.filter((r) => r.selected).map((r) => r.id)),
            );
            setStep("review");
          },
          error: (error: Error) => {
            setProcessingError(`Failed to parse CSV: ${error.message}`);
            setStep("upload");
          },
        });
      }
    },
    [
      importType,
      wodsMap,
      setProcessedRows,
      setSelectedRows,
      setStep,
      setProcessingError,
    ],
  );

  // Effect to process file once WODs are loaded if file was selected while loading
  useEffect(() => {
    // Only process if we are in the processing step, have a file, WODs are loaded, and haven't processed yet
    if (
      step === "processing" &&
      file &&
      !isLoadingWods &&
      wodsMap.size > 0 &&
      processedRows.length === 0 &&
      !wodsError
    ) {
      console.log("WODs loaded, processing file now...");
      parseAndProcessFile(file);
    }
    // If WOD loading finished with an error while we were waiting
    if (step === "processing" && file && wodsError) {
      const errorMessage =
        wodsError instanceof Error
          ? wodsError.message
          : "Unknown error fetching WODs";
      setProcessingError(`Error fetching WODs: ${errorMessage}`);
      setStep("upload");
    }
  }, [
    step,
    file,
    isLoadingWods,
    wodsMap,
    processedRows.length,
    wodsError,
    parseAndProcessFile,
    setProcessingError,
    setStep,
  ]);

  return {
    parseAndProcessFile,
  };
}
