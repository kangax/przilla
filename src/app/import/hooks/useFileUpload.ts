"use client";

import { useCallback } from "react";
import type { ImportStep } from "./useImportFlow";

export interface UseFileUploadProps {
  setFile: (file: File | null) => void;
  setStep: (step: ImportStep) => void;
  setProcessingError: (error: string | null) => void;
  isLoadingWods: boolean;
  wodsError: unknown; // Simplified type to satisfy linter
}

export interface UseFileUploadReturn {
  handleFileAccepted: (acceptedFile: File) => void;
}

export function useFileUpload({
  setFile,
  setStep,
  setProcessingError,
  isLoadingWods,
  wodsError,
}: UseFileUploadProps): UseFileUploadReturn {
  const handleFileAccepted = useCallback(
    (acceptedFile: File) => {
      setFile(acceptedFile);
      setStep("processing");
      // Reset previous errors
      setProcessingError(null);

      if (isLoadingWods) {
        // Wait for WODs to load if they aren't already
        console.log("Waiting for WOD data to load...");
        // The useEffect hook in the parent will trigger processing once WODs are loaded
      } else if (wodsError) {
        // Handle error safely by checking for message property
        const errorMessage =
          wodsError instanceof Error
            ? wodsError.message
            : "Unknown error fetching WODs";
        setProcessingError(`Error fetching WODs: ${errorMessage}`);
        setStep("upload");
      }
      // If WODs are loaded, the parent component will handle processing
    },
    [setFile, setStep, setProcessingError, isLoadingWods, wodsError],
  );

  return {
    handleFileAccepted,
  };
}
