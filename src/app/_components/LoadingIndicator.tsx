import React from "react";

interface LoadingIndicatorProps {
  message: string;
  progress?: number; // Optional progress value (0-100)
}

export function LoadingIndicator({ message, progress }: LoadingIndicatorProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-8 shadow-md">
      {/* Basic Spinner */}
      <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      <p className="mb-2 text-card-foreground">{message}</p>
      {progress !== undefined && (
        <div className="bg-muted h-2.5 w-full rounded-full">
          <div
            className="transition-width h-2.5 rounded-full bg-primary duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}
