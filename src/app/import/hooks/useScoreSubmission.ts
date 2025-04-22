"use client";

import { useCallback } from "react";
import { api } from "~/trpc/react";
import type { ProcessedRow } from "../components/types";
import type { ImportStep } from "./useImportFlow";

export interface UseScoreSubmissionProps {
  processedRows: ProcessedRow[];
  selectedRows: Set<string>;
  setStep: (step: ImportStep) => void;
  setProcessingError: (error: string | null) => void;
  setImportSuccessCount: (count: number) => void;
}

export interface UseScoreSubmissionReturn {
  handleConfirm: () => void;
  handleReviewComplete: (selectedIds: Set<string>) => void;
  isSubmitting: boolean;
}

export function useScoreSubmission({
  processedRows,
  selectedRows,
  setStep,
  setProcessingError,
  setImportSuccessCount,
}: UseScoreSubmissionProps): UseScoreSubmissionReturn {
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

  const handleReviewComplete = useCallback(
    (_selectedIds: Set<string>) => {
      setStep("confirm");
    },
    [setStep],
  );

  const handleConfirm = useCallback(() => {
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
  }, [
    processedRows,
    selectedRows,
    setStep,
    setProcessingError,
    importScoresMutation,
  ]);

  return {
    handleConfirm,
    handleReviewComplete,
    isSubmitting: importScoresMutation.isPending,
  };
}
