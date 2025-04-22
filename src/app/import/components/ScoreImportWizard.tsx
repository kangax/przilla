"use client"; // Add this directive

import React, { useState, useEffect, useCallback } from "react"; // Added useCallback
import Papa from "papaparse";
import { api } from "~/trpc/react";
import { CsvUploadZone } from "./CsvUploadZone";
import { LoadingIndicator } from "../../_components/LoadingIndicator"; // Updated path and name
import { ScoreReviewTable } from "./ScoreReviewTable";
import { Box, Card, Text, Link, Heading, Flex } from "@radix-ui/themes"; // Import Radix components + Heading + Flex
import Image from "next/image"; // Import Next Image
import { ImportConfirmation } from "./ImportConfirmation";
// Import types
import type { CsvRow, ProcessedRow } from "./types";
import { isCsvRow } from "./types";
import type { Wod } from "~/types/wodTypes"; // Import base types (Removed unused Score)

type ImportStep = "upload" | "processing" | "review" | "confirm" | "complete";

type ScoreImportWizardProps = {
  importType: "przilla" | "sugarwod";
};

export function ScoreImportWizard({ importType }: ScoreImportWizardProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [processedRows, setProcessedRows] = useState<ProcessedRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set()); // Keep track of user selections
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [importSuccessCount, setImportSuccessCount] = useState<number>(0); // Track success count

  // Fetch all WODs for client-side matching
  const {
    data: allWods,
    isLoading: isLoadingWods,
    error: wodsError,
  } = api.wod.getAll.useQuery();
  const [wodsMap, setWodsMap] = useState<Map<string, Wod>>(new Map());

  // tRPC mutation for importing scores
  const importScoresMutation = api.score.importScores.useMutation({
    onSuccess: (data) => {
      console.log("Import successful:", data);
      setImportSuccessCount(data.count); // Store the count of imported scores
      setStep("complete");
      setProcessingError(null); // Clear any previous errors
    },
    onError: (error) => {
      console.error("Import failed:", error);
      setProcessingError(`Import failed: ${error.message}`);
      setStep("confirm"); // Go back to confirm step on error
    },
  });

  // Create a map for faster WOD lookup once data is loaded
  useEffect(() => {
    if (allWods) {
      const map = new Map<string, Wod>();
      // Store keys as-is for strict, case-sensitive matching
      allWods
        .filter((wod) => !!wod?.id)
        .forEach((wod) => {
          map.set(wod.wodName, wod as unknown as Wod);
        });
      setWodsMap(map);
    }
  }, [allWods]);

  // Wrap parseAndProcessFile in useCallback
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
                return {
                  id: `row-${index}`,
                  csvRow: row,
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
              .filter((row: any) => row !== null);

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
        // SugarWOD import (existing logic)
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
              .filter((row): row is ProcessedRow => row !== null);
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
    [wodsMap, importType],
  );

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
    setProcessingError(null); // Clear previous errors before submitting

    // Filter processedRows based on selectedRows and ensure proposedScore exists
    const scoresToSubmit = processedRows
      .filter((row) => selectedRows.has(row.id) && row.proposedScore)
      .map((row) => {
        // We know proposedScore exists due to the filter
        const score = row.proposedScore;
        // Ensure scoreDate is a Date object as expected by the backend schema
        if (!(score.scoreDate instanceof Date)) {
          console.error("Invalid scoreDate type before submission:", score);
          // Handle error or attempt conversion if possible, otherwise skip/throw
          // For now, we'll rely on earlier validation ensuring it's a Date
        }
        return {
          wodId: score.wodId,
          scoreDate: score.scoreDate, // Pass Date object directly
          isRx: score.isRx,
          notes: score.notes,
          time_seconds: score.time_seconds,
          reps: score.reps,
          load: score.load,
          rounds_completed: score.rounds_completed,
          partial_reps: score.partial_reps,
        };
      });

    if (scoresToSubmit.length === 0) {
      console.warn("No valid scores selected for submission.");
      setProcessingError("No valid scores were selected for import.");
      setStep("confirm"); // Go back if nothing to submit
      return;
    }

    console.log("Submitting scores via tRPC:", scoresToSubmit);
    importScoresMutation.mutate(scoresToSubmit); // Call the tRPC mutation
  };

  const handleReset = () => {
    setFile(null);
    setProcessedRows([]);
    setSelectedRows(new Set());
    setProcessingError(null);
    setImportSuccessCount(0); // Reset success count
    setStep("upload");
  };

  // Render Loading state while WODs are fetching initially
  if (isLoadingWods && step === "upload" && !file) {
    return <LoadingIndicator message="Loading WOD data..." />; // Updated message
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
    <div className="space-y-6 rounded-lg border p-4 shadow-md">
      <Heading as="h2" size="6" mb="4" className="text-center">
        {importType === "przilla"
          ? "Import Scores from PRzilla"
          : "Import Scores from SugarWOD"}
      </Heading>

      <Flex direction={{ initial: "column", md: "row" }} gap="6">
        {/* Instructions Section (Left Column) */}
        {step === "upload" && (
          <Box className="w-full md:w-1/2 md:flex-shrink-0">
            <Card variant="surface">
              <Box p="3">
                {importType === "przilla" ? (
                  <>
                    <Text as="p" size="2" color="gray" mb="4">
                      To import your scores from PRzilla:
                    </Text>
                    <ol className="mb-4 ml-5 list-decimal space-y-2 text-sm">
                      <li>
                        <Text size="2">
                          Go to your profile dropdown and select{" "}
                          <strong>Export as CSV</strong>.
                        </Text>
                      </li>
                      <li>
                        <Text size="2">
                          Download the CSV file to your computer.
                        </Text>
                      </li>
                      <li>
                        <Text size="2">
                          Upload that CSV file here (on the right).
                        </Text>
                      </li>
                    </ol>
                  </>
                ) : (
                  <>
                    <Text as="p" size="2" color="gray" mb="4">
                      Follow these steps to get your workout data CSV file from
                      SugarWOD:
                    </Text>
                    <ol className="mb-4 ml-5 list-decimal space-y-2 text-sm">
                      <li>
                        <Text size="2">
                          Go to your{" "}
                          <Link
                            href="https://app.sugarwod.com/athletes/me#profile"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            SugarWOD profile page
                          </Link>
                        </Text>
                      </li>
                      <li>
                        <Text size="2">
                          Click on the <strong>Export Workouts</strong> button
                          (as shown below).
                        </Text>
                      </li>
                      <li>
                        <Text size="2">
                          Wait for SugarWOD to send CSV file with all your
                          workouts.
                        </Text>
                      </li>
                      <li>
                        <Text size="2">
                          Upload that CSV file here (on the right).
                        </Text>
                      </li>
                    </ol>
                    <Box className="relative mt-4 h-auto w-full max-w-xl overflow-hidden rounded border">
                      <Image
                        src="/images/sugarwod_export_3.png"
                        alt="Screenshot showing the 'Export Workouts' button in SugarWOD profile settings"
                        width={600}
                        height={300}
                        style={{ objectFit: "contain" }}
                        priority
                      />
                    </Box>
                  </>
                )}
              </Box>
            </Card>
          </Box>
        )}

        {/* Main Content Area (Right Column) */}
        <Box className="flex-grow">
          {/* Display processing error prominently */}
          {processingError &&
            step !== "processing" && ( // Don't show parsing error during submission loading
              <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
                Error: {processingError}
              </div>
            )}

          {/* Conditional Rendering based on step */}
          {step === "upload" && (
            <CsvUploadZone
              onFileAccepted={handleFileAccepted}
              acceptedTypes={["text/csv"]}
            />
          )}

          {/* Show processing for both file parsing and submission */}
          {step === "processing" && (
            <LoadingIndicator // Updated component name
              message={
                importScoresMutation.isPending // Use isPending instead of isLoading
                  ? "Submitting scores..."
                  : "Processing CSV and matching WODs..."
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
              // Disable confirm button while submitting
              // isSubmitting={importScoresMutation.isPending} // Pass loading state if needed by component
            />
          )}

          {step === "complete" && (
            <div className="rounded-lg border border-green-300 bg-green-50 p-6 text-center shadow-md dark:border-green-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-medium text-green-700 dark:text-green-400">
                Import Complete!
              </h3>
              <p className="mb-6 text-gray-700 dark:text-gray-300">
                Successfully imported{" "}
                <span className="font-semibold">{importSuccessCount}</span>{" "}
                score(s).
              </p>
              <button
                onClick={handleReset}
                className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Import Another File
              </button>
            </div>
          )}
        </Box>
      </Flex>
    </div>
  );
}
