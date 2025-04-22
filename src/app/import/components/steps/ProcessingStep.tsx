"use client";

import React from "react";
import { LoadingIndicator } from "../../../_components/LoadingIndicator";

interface ProcessingStepProps {
  isSubmitting: boolean;
}

export function ProcessingStep({ isSubmitting }: ProcessingStepProps) {
  return (
    <LoadingIndicator
      message={
        isSubmitting
          ? "Submitting scores..."
          : "Processing CSV and matching WODs..."
      }
    />
  );
}
