import type { Score, Wod } from "~/types/wodTypes";

// Structure matching the input CSV columns
export interface CsvRow {
  date: string; // mm/dd/yyyy
  title: string;
  description: string;
  best_result_raw: string;
  best_result_display: string;
  score_type: string; // Will be parsed more strictly later
  barbell_lift?: string; // Optional
  set_details?: string; // Optional
  notes?: string; // Optional
  rx_or_scaled: string; // 'RX' or 'SCALED'
  pr?: string; // Optional
  // Add any other columns present in the CSV if needed
}

// Structure for holding processed data after parsing and matching
export interface ProcessedRow {
  id: string; // Unique ID for the row (e.g., generated during processing)
  csvRow: CsvRow;
  matchedWod: Wod | null; // Matched WOD object or null if no match
  validation: {
    isValid: boolean;
    errors: string[]; // List of validation errors (e.g., invalid date, missing required field)
  };
  // The score object ready to be potentially inserted, derived from csvRow
  // Omitting id and userId as they are set during insertion
  proposedScore:
    | (Omit<
        Score,
        "id" | "userId" | "createdAt" | "updatedAt" | "scoreDate" // Omit original scoreDate (string)
      > & { scoreDate: Date })
    | null; // Add scoreDate back as Date
  selected: boolean; // Whether the user has selected this row for import
}

// Type guard to check if an object is a valid CsvRow
// Use unknown instead of any for better type safety
export function isCsvRow(obj: unknown): obj is CsvRow {
  // Check if obj is a non-null object first
  if (typeof obj !== "object" || obj === null) {
    return false;
  }
  // Cast to Record<string, unknown> for safe property access
  const record = obj as Record<string, unknown>;
  // Check for presence and type of required fields
  return (
    typeof record.date === "string" &&
    !!record.date &&
    typeof record.title === "string" &&
    !!record.title &&
    typeof record.description === "string" && // Allow empty description
    typeof record.best_result_raw === "string" && // Allow empty raw result
    typeof record.best_result_display === "string" && // Allow empty display result
    typeof record.rx_or_scaled === "string" &&
    !!record.rx_or_scaled
    // Add checks for other required fields if any
  );
}
