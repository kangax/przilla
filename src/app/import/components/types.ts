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

import { z } from "zod";

// Zod schema for SugarWOD CSV row
export const CsvRowSchema = z.object({
  date: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  best_result_raw: z.string(),
  best_result_display: z.string(),
  score_type: z.string(),
  barbell_lift: z.string().optional(),
  set_details: z.string().optional(),
  notes: z.string().optional(),
  rx_or_scaled: z.string().min(1),
  pr: z.string().optional(),
});

// Zod schema for PRzilla CSV row
export const PrzillaCsvRowSchema = z.object({
  "WOD Name": z.string().min(1),
  Date: z.string().min(1),
  "Score (time)": z.string().optional(),
  "Score (reps)": z.string().optional(),
  "Score (rounds)": z.string().optional(),
  "Score (partial reps)": z.string().optional(),
  "Score (load)": z.string().optional(),
  Rx: z.string().optional(),
  Notes: z.string().optional(),
});
