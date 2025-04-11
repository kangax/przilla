import React from "react";

interface ImportProgressProps {
  message: string;
  progress?: number; // Optional progress value (0-100)
}

export function ImportProgress({ message, progress }: ImportProgressProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border bg-gray-50 p-8 shadow-md">
      {/* Basic Spinner */}
      <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      <p className="mb-2 text-gray-700">{message}</p>
      {progress !== undefined && (
        <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="transition-width h-2.5 rounded-full bg-blue-600 duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}
