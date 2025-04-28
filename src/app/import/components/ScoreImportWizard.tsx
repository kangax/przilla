"use client";

import React, { useEffect, useState } from "react";
import { Heading } from "@radix-ui/themes";
import { api } from "~/trpc/react";
import type { Wod } from "~/types/wodTypes";
import {
  useImportFlow,
  useFileUpload,
  useScoreProcessing,
  useScoreSubmission,
} from "../hooks";
import {
  UploadStep,
  ReviewStep,
  ConfirmStep,
  CompleteStep,
  ProcessingStep,
} from "./steps";

type ScoreImportWizardProps = {
  importType: "przilla" | "sugarwod";
};

export function ScoreImportWizard({ importType }: ScoreImportWizardProps) {
  // Fetch all WODs for client-side matching
  const {
    data: allWods,
    isLoading: isLoadingWods,
    error: wodsError,
  } = api.wod.getAll.useQuery();

  // Create a map for faster WOD lookup
  const [wodsMap, setWodsMap] = useState<Map<string, Wod>>(new Map());

  // Set up the import flow state
  const importFlow = useImportFlow({ importType });
  const {
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
  } = importFlow;

  // Set up file upload handling
  const fileUpload = useFileUpload({
    setFile,
    setStep,
    setProcessingError,
    isLoadingWods,
    wodsError,
  });

  // Set up score processing
  useScoreProcessing({
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
  });

  // Define the handler for completing the review step
  const handleReviewComplete = (selectedIds: Set<string>) => {
    // 1. Update the selectedRows set state
    setSelectedRows(selectedIds);

    // 2. Create a new processedRows array with updated 'selected' status
    const updatedProcessedRows = processedRows.map((row) => ({
      ...row,
      selected: selectedIds.has(row.id),
    }));

    // 3. Update the processedRows state
    setProcessedRows(updatedProcessedRows);

    // 4. Move to the confirm step
    setStep("confirm");
  };

  // Set up score submission (handleConfirm logic remains here)
  const scoreSubmission = useScoreSubmission({
    processedRows, // Pass potentially updated rows
    selectedRows: selectedRows, // Pass updated selection set
    setStep,
    setProcessingError,
    setImportSuccessCount,
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

  return (
    <div className="space-y-6 rounded-lg border p-4 shadow-md">
      <Heading as="h2" size="6" mb="4" className="text-center">
        {importType === "przilla"
          ? "Import Scores from PRzilla"
          : "Import Scores from SugarWOD"}
      </Heading>

      {/* Render the appropriate step based on the current state */}
      {step === "upload" && (
        <UploadStep
          importType={importType}
          isLoadingWods={isLoadingWods}
          wodsError={wodsError}
          handleFileAccepted={fileUpload.handleFileAccepted}
        />
      )}

      {step === "processing" && (
        <ProcessingStep isSubmitting={scoreSubmission.isSubmitting} />
      )}

      {step === "review" && (
        <ReviewStep
          processedRows={processedRows}
          handleReviewComplete={handleReviewComplete} // Use the new handler
          processingError={processingError}
        />
      )}

      {step === "confirm" && (
        <ConfirmStep
          processedRows={processedRows}
          selectedRows={selectedRows}
          handleConfirm={scoreSubmission.handleConfirm}
          handleBack={() => setStep("review")}
          isSubmitting={scoreSubmission.isSubmitting}
          processingError={processingError}
        />
      )}

      {step === "complete" && (
        <CompleteStep
          importSuccessCount={importSuccessCount}
          handleReset={handleReset}
        />
      )}
    </div>
  );
}
