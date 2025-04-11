"use client"; // Needs to be a client component for react-dropzone hooks

import React, { useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone"; // Import specific type

interface CsvUploadZoneProps {
  onFileAccepted: (file: File) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in bytes
}

export function CsvUploadZone({
  onFileAccepted,
  acceptedTypes = ["text/csv"],
  maxSize = 10 * 1024 * 1024, // 10MB default
}: CsvUploadZoneProps) {
  const onDrop = useCallback(
    // Use FileRejection[] type
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        // Handle rejected files (e.g., show error message)
        const firstError = fileRejections[0]?.errors[0];
        // TODO: Show user-friendly error (e.g., using a toast notification or state update)
        console.error("File rejected:", firstError?.code, firstError?.message);
        return;
      }
      if (acceptedFiles.length > 0 && acceptedFiles[0]) {
        onFileAccepted(acceptedFiles[0]);
      }
    },
    [onFileAccepted],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce(
      (acc, type) => ({ ...acc, [type]: [] }),
      {} as Record<string, string[]>, // Add type assertion for accept object
    ),
    maxSize: maxSize,
    multiple: false, // Only accept one file
  });

  return (
    <div
      {...getRootProps()}
      className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors duration-200 ease-in-out ${
        isDragActive
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" // Add dark mode background
          : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500" // Add dark mode borders
      }`}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className="text-blue-600 dark:text-blue-400">
          Drop the CSV file here ...
        </p>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">
          Drag &apos;n&apos; drop a CSV file here, or click to select file
        </p>
      )}
      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
        (Max file size: {maxSize / 1024 / 1024}MB)
      </p>
    </div>
  );
}
