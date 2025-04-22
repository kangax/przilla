import type { Score, Wod } from "~/types/wodTypes";

// Structure matching the SugarWOD CSV columns
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

// Structure matching the PRzilla CSV columns
export interface PrzillaCsvRow {
  "WOD Name": string;
  Date: string; // YYYY-MM-DD or ISO format
  "Score (time)"?: string;
  "Score (reps)"?: string;
  "Score (rounds)"?: string;
  "Score (partial reps)"?: string;
  "Score (load)"?: string;
  Rx?: string; // "yes" or "no"
  Notes?: string;
}

// Define separate interfaces for SugarWOD and PRzilla processed rows
export interface SugarWodProcessedRow {
  id: string;
  csvRow: CsvRow;
  matchedWod: Wod | null;
  validation: {
    isValid: boolean;
    errors: string[];
  };
  proposedScore:
    | (Omit<
        Score,
        "id" | "userId" | "createdAt" | "updatedAt" | "scoreDate"
      > & { scoreDate: Date })
    | null;
  selected: boolean;
}

export interface PrzillaProcessedRow {
  id: string;
  csvRow: PrzillaCsvRow;
  matchedWod: Wod | null;
  validation: {
    isValid: boolean;
    errors: string[];
  };
  proposedScore:
    | (Omit<
        Score,
        "id" | "userId" | "createdAt" | "updatedAt" | "scoreDate"
      > & { scoreDate: Date })
    | null;
  selected: boolean;
}

// Union type for both formats
export type ProcessedRow = SugarWodProcessedRow | PrzillaProcessedRow;

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

// Type guard to check if an object is a valid PrzillaCsvRow
export function isPrzillaCsvRow(obj: unknown): obj is PrzillaCsvRow {
  // Check if obj is a non-null object first
  if (typeof obj !== "object" || obj === null) {
    return false;
  }
  // Cast to Record<string, unknown> for safe property access
  const record = obj as Record<string, unknown>;
  // Check for presence and type of required fields
  return (
    typeof record["WOD Name"] === "string" &&
    !!record["WOD Name"] &&
    typeof record.Date === "string" &&
    !!record.Date
    // Other fields are optional
  );
}
