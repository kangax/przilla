"use client";

import React from "react";

interface CompleteStepProps {
  importSuccessCount: number;
  handleReset: () => void;
}

export function CompleteStep({
  importSuccessCount,
  handleReset,
}: CompleteStepProps) {
  return (
    <div className="rounded-lg border border-green-300 bg-green-50 p-6 text-center shadow-md dark:border-green-700 dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-medium text-green-700 dark:text-green-400">
        Import Complete!
      </h3>
      <p className="mb-6 text-gray-700 dark:text-gray-300">
        Successfully imported{" "}
        <span className="font-semibold">{importSuccessCount}</span> score(s).
      </p>
      <button
        onClick={handleReset}
        className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        Import Another File
      </button>
    </div>
  );
}
