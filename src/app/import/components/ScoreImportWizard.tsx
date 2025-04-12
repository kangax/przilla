"use client"; // Add this directive

import React, { useState, useEffect, useCallback } from "react"; // Added useCallback
import Papa from "papaparse";
import { api } from "~/trpc/react";
import { CsvUploadZone } from "./CsvUploadZone";
import { LoadingIndicator } from "../../_components/LoadingIndicator"; // Updated path and name
import { ScoreReviewTable } from "./ScoreReviewTable";
import { ImportConfirmation } from "./ImportConfirmation";
// Import types
import type { CsvRow, ProcessedRow } from "./types";
import { isCsvRow } from "./types";
import type { Wod } from "~/types/wodTypes"; // Import base types (Removed unused Score)

type ImportStep = "upload" | "processing" | "review" | "confirm" | "complete";

export function ScoreImportWizard() {
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [processedRows, setProcessedRows] = useState<ProcessedRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set()); // Keep track of user selections
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Fetch all WODs for client-side matching
  const {
    data: allWods,
    isLoading: isLoadingWods,
    error: wodsError,
  } = api.wod.getAll.useQuery();
  const [wodsMap, setWodsMap] = useState<Map<string, Wod>>(new Map());

  // Create a map for faster WOD lookup once data is loaded
  useEffect(() => {
    if (allWods) {
      const map = new Map<string, Wod>();
      // Filter out any potential entries without an ID (shouldn't happen based on schema/query)
      // and assert the type to satisfy TS if needed, though filtering is safer.
      allWods
        .filter((wod) => !!wod?.id) // Filter for existence of wod and wod.id, remove type predicate
        .forEach((wod) => {
          // Assume wod structure matches Wod after filtering, cast explicitly via unknown
          map.set(wod.wodName, wod as unknown as Wod); // Cast via unknown to bypass strict overlap check
        });
      setWodsMap(map);
    }
  }, [allWods]);

  // Wrap parseAndProcessFile in useCallback
  const parseAndProcessFile = useCallback(
    (fileToProcess: File) => {
      setProcessingError(null);
      Papa.parse<CsvRow>(fileToProcess, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.error("CSV Parsing errors:", results.errors);
            setProcessingError(
              `Error parsing CSV: ${results.errors[0]?.message || "Unknown error"}`,
            );
            setStep("upload"); // Go back to upload on error
            return;
          }

          // Check wodsMap directly as it's derived from allWods
          if (wodsMap.size === 0) {
            console.error("WOD data not loaded yet for matching.");
            setProcessingError(
              "WOD data not available for matching. Please try again.",
            );
            setStep("upload");
            return;
          }

          const processedData: ProcessedRow[] = results.data
            .map((rawRow, index) => {
              // Basic validation using type guard
              if (!isCsvRow(rawRow)) {
                console.warn(`Skipping invalid row ${index + 1}:`, rawRow);
                return null; // Skip rows that don't match the expected structure
              }

              const csvRow: CsvRow = rawRow; // Now we know it's a CsvRow

              // Case-insensitive matching
              const normalizedTitle = csvRow.title.toLowerCase().trim();
              const matchedWod =
                Array.from(wodsMap.entries()).find(
                  ([wodName]) =>
                    wodName.toLowerCase().trim() === normalizedTitle,
                )?.[1] || null;

              console.log("Match result:", matchedWod);
              if (!matchedWod) {
                console.log(
                  "Similar WODs:",
                  Array.from(wodsMap.keys()).filter((name) =>
                    name.toLowerCase().includes(normalizedTitle),
                  ),
                );
              }

              // Basic validation example (add more as needed)
              const validationErrors: string[] = [];
              let scoreDate: Date | null = null;
              try {
                // Attempt to parse date (assuming MM/DD/YYYY)
                const parts = csvRow.date.split("/");
                if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
                  // Note: Month is 0-indexed in JS Date constructor
                  scoreDate = new Date(
                    parseInt(parts[2]),
                    parseInt(parts[0]) - 1,
                    parseInt(parts[1]),
                  );
                  if (isNaN(scoreDate.getTime())) {
                    validationErrors.push("Invalid date format");
                    scoreDate = null; // Reset if invalid
                  }
                } else {
                  validationErrors.push("Invalid date format");
                }
              } catch {
                // Removed unused variable binding '_e'
                // Prefix unused variable
                validationErrors.push("Error parsing date");
              }

              // Create proposed score object
              let proposedScore: ProcessedRow["proposedScore"] = null;
              if (matchedWod && scoreDate) {
                // Only create score if WOD matched and date is valid
                // Helper to safely parse float/int, returning null on failure
                const safeParseFloat = (val: string) => {
                  const num = parseFloat(val);
                  return isNaN(num) ? null : num;
                };
                const safeParseInt = (val: string) => {
                  const num = parseInt(val, 10);
                  return isNaN(num) ? null : num;
                };

                const scoreTypeLower =
                  csvRow.score_type?.toLowerCase() || "time"; // "" means it's time based
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
                  scoreDate: scoreDate, // Keep as Date object internally
                  notes: csvRow.notes || null,
                };
                // Further score validation could happen here
                if (
                  proposedScore.time_seconds === null &&
                  proposedScore.reps === null &&
                  proposedScore.load === null &&
                  proposedScore.rounds_completed === null
                ) {
                  validationErrors.push(
                    "No valid score value found based on score_type",
                  );
                  proposedScore = null; // Invalidate score if no value parsed
                }
              } else if (!matchedWod) {
                // Don't add error if we decided to skip unmatched WODs silently
                // validationErrors.push("WOD not found");
              } else if (!scoreDate) {
                // Date error already added
              }

              return {
                id: `row-${index}`, // Simple unique ID for the session
                csvRow,
                matchedWod,
                validation: {
                  // Valid if no errors AND it's either matched or we don't care about matching (depends on final logic)
                  isValid: validationErrors.length === 0 && !!matchedWod, // Only valid if matched for now
                  errors: validationErrors,
                },
                proposedScore: matchedWod ? proposedScore : null, // Only propose score if WOD matched
                // Pre-select valid, matched rows
                selected:
                  !!matchedWod &&
                  validationErrors.length === 0 &&
                  !!proposedScore,
              };
            })
            .filter((row): row is ProcessedRow => row !== null); // Filter out skipped rows

          setProcessedRows(processedData);
          // Update initial selection state based on pre-selected rows
          setSelectedRows(
            new Set(processedData.filter((r) => r.selected).map((r) => r.id)),
          );
          setStep("review");
        },
        error: (error: Error) => {
          console.error("CSV Parsing failed:", error);
          setProcessingError(`Failed to parse CSV: ${error.message}`);
          setStep("upload");
        },
      });
    },
    [wodsMap],
  ); // Add dependencies for useCallback

  const handleFileAccepted = (acceptedFile: File) => {
    setFile(acceptedFile);
    setStep("processing");
    // Reset previous errors/data
    setProcessingError(null);
    setProcessedRows([]);
    setSelectedRows(new Set());

    if (isLoadingWods) {
      // Wait for WODs to load if they aren't already
      console.log("Waiting for WOD data to load...");
      // The useEffect hook will trigger processing once WODs are loaded
    } else if (wodsError) {
      setProcessingError(`Error fetching WODs: ${wodsError.message}`);
      setStep("upload");
    } else {
      parseAndProcessFile(acceptedFile);
    }
  };

  // Effect to process file once WODs are loaded if file was selected while loading
  useEffect(() => {
    // Only process if we are in the processing step, have a file, WODs are loaded, and haven't processed yet
    if (
      step === "processing" &&
      file &&
      !isLoadingWods &&
      wodsMap.size > 0 &&
      processedRows.length === 0 &&
      !processingError
    ) {
      console.log("WODs loaded, processing file now...");
      parseAndProcessFile(file); // Call memoized function
    }
    // If WOD loading finished with an error while we were waiting
    if (step === "processing" && file && wodsError && !processingError) {
      setProcessingError(`Error fetching WODs: ${wodsError.message}`);
      setStep("upload");
    }
  }, [
    step,
    file,
    isLoadingWods,
    wodsMap, // Include wodsMap size check dependency
    processedRows.length, // Depend on length to avoid re-processing if rows exist
    wodsError,
    processingError,
    parseAndProcessFile, // Add memoized function to dependency array
  ]);

  const handleReviewComplete = (selectedIds: Set<string>) => {
    setSelectedRows(selectedIds); // Update selection state from table
    setStep("confirm");
  };

  const handleConfirm = () => {
    setStep("processing"); // Show processing state during submission
    // TODO: Add submission logic using tRPC mutation `score.bulkCreate`
    // Filter processedRows based on selectedRows
    const scoresToSubmit = processedRows
      .filter((row) => selectedRows.has(row.id) && row.proposedScore)
      .map((row) => {
        // Ensure scoreDate is formatted as needed by the backend (e.g., ISO string)
        const score = row.proposedScore;
        return {
          ...score,
          scoreDate:
            score.scoreDate instanceof Date
              ? score.scoreDate.toISOString()
              : score.scoreDate, // Convert Date to ISO string if needed
        };
      });

    console.log("Submitting scores:", scoresToSubmit);
    // Replace with actual tRPC call
    setTimeout(() => {
      console.log("Simulated submission complete.");
      setStep("complete");
    }, 2000);
  };

  const handleReset = () => {
    setFile(null);
    setProcessedRows([]);
    setSelectedRows(new Set());
    setProcessingError(null);
    setStep("upload");
  };

  // Render Loading state while WODs are fetching initially
  if (isLoadingWods && step === "upload" && !file) {
    return <LoadingIndicator message="Loading..." />;
  }

  // Render Error state if WOD fetching failed
  if (wodsError && step === "upload" && !file) {
    return (
      <div className="rounded border border-red-300 p-4 text-red-600">
        Error loading WOD data: {wodsError.message}
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4 shadow-md">
      <h2 className="mb-4 text-xl font-semibold">
        Import Scores from SugarWOD
      </h2>
      {processingError && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
          Error: {processingError}
        </div>
      )}

      {step === "upload" && (
        <CsvUploadZone onFileAccepted={handleFileAccepted} />
      )}

      {/* Show processing for both file parsing and submission */}
      {step === "processing" && (
        <LoadingIndicator // Updated component name
          message={
            file
              ? "Processing CSV and matching WODs..."
              : "Submitting scores..."
          }
        />
      )}

      {step === "review" && (
        <ScoreReviewTable
          rows={processedRows.filter((row) => row.matchedWod)} // Filter for matched WODs only
          onComplete={handleReviewComplete} // Pass the handler to proceed
        />
      )}

      {step === "confirm" && (
        <ImportConfirmation
          rows={processedRows}
          selectedIds={selectedRows}
          onConfirm={handleConfirm}
          onBack={() => setStep("review")} // Allow going back
        />
      )}

      {step === "complete" && (
        <div>
          <p className="text-green-600">Import Complete!</p>
          {/* TODO: Show summary of imported/skipped */}
          <p>Successfully processed {selectedRows.size} scores.</p>
          <button
            onClick={handleReset}
            className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Import Another File
          </button>
        </div>
      )}
    </div>
  );
}
