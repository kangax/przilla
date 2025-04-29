// Type definitions for WOD data

export type WodResult = {
  date?: string;
  rxStatus?: string | null;
  notes?: string;
  // New score fields replacing the old 'score' field
  score_time_seconds: number | null;
  score_reps: number | null;
  score_load: number | null;
  score_rounds_completed: number | null;
  score_partial_reps: number | null;
};

export type BenchmarkLevel = {
  min: number | null;
  max: number | null;
};

export type Benchmarks = {
  type: "time" | "rounds" | "reps" | "load";
  levels: {
    elite: BenchmarkLevel;
    advanced: BenchmarkLevel;
    intermediate: BenchmarkLevel;
    beginner: BenchmarkLevel;
  };
};

// Zod schema for Benchmarks
import { z } from "zod";

export const BenchmarkLevelSchema = z.object({
  min: z.number().nullable(),
  max: z.number().nullable(),
});

export const BenchmarksSchema = z.object({
  type: z.enum(["time", "rounds", "reps", "load"]),
  levels: z.object({
    elite: BenchmarkLevelSchema,
    advanced: BenchmarkLevelSchema,
    intermediate: BenchmarkLevelSchema,
    beginner: BenchmarkLevelSchema,
  }),
});

// Define allowed tags and categories as types for better safety
export type WodTag =
  | "Chipper"
  | "Couplet"
  | "Triplet"
  | "EMOM"
  | "AMRAP"
  | "For Time"
  | "Ladder";

export type WodCategory =
  | "Girl"
  | "Hero"
  | "Games"
  | "Open"
  | "Quarterfinals" // Added Quarterfinals based on page.tsx
  | "Benchmark"
  | "Skill" // Added Skill based on page.tsx
  | "Other";

// Final client-side Wod type (after parsing/transformation)
export type Wod = {
  id: string; // Added from DB schema
  wodUrl: string | null; // Updated to match DB schema (can be null)
  wodName: string;
  description?: string | null; // Updated to match DB schema (can be null)
  benchmarks?: Benchmarks | null; // Updated to match DB schema (can be null)
  // results: WodResult[]; // Removed - results are fetched separately
  category?: string | null; // Simplified type to match DB 'text' column, resolving lint error
  tags?: string[] | null; // Simplified type to match DB 'text' column (JSON array), resolving lint error
  difficulty?: string | null; // Updated to match DB schema (can be null)
  difficultyExplanation?: string | null; // Renamed from difficulty_explanation, match DB (can be null)
  countLikes?: number | null; // Renamed from count_likes, match DB (can be null)
  /**
   * List of normalized movement names for this WOD (from DB, can be empty)
   */
  movements?: string[];
  /**
   * Time cap for the workout, in seconds (nullable, from DB)
   */
  timecap?: number | null;
  createdAt: Date; // Added from DB schema (Drizzle returns Date)
  updatedAt?: Date | null; // Added from DB schema (Drizzle returns Date or null)
};

// Intermediate type representing Wod data as potentially received from tRPC query (before client parsing)
export type WodFromQuery = Omit<
  Wod,
  "createdAt" | "updatedAt" | "tags" | "benchmarks"
> & {
  createdAt: string | Date; // Could be string or Date depending on serialization
  updatedAt?: string | Date | null; // Could be string or Date depending on serialization
  tags?: string | string[] | null; // Could be stringified JSON or array
  benchmarks?: string | Benchmarks | null; // Could be stringified JSON or object
  movements?: string[]; // Always array from DB, can be empty
};

// Final client-side Score type (after parsing/transformation)
export type Score = {
  id: string;
  userId: string;
  wodId: string;
  time_seconds: number | null;
  reps: number | null;
  load: number | null;
  rounds_completed: number | null;
  partial_reps: number | null;
  isRx: boolean; // Added Rx status
  scoreDate: Date; // Drizzle returns Date for timestamp mode
  notes: string | null;
  createdAt: Date; // Drizzle returns Date for timestamp mode
  updatedAt: Date | null; // Drizzle returns Date or null for timestamp mode
};

// Intermediate type representing Score data as potentially received from tRPC query (before client parsing)
export type ScoreFromQuery = Omit<
  Score,
  "scoreDate" | "createdAt" | "updatedAt"
> & {
  scoreDate: string | Date; // Could be string or Date depending on serialization
  createdAt: string | Date; // Could be string or Date depending on serialization
  updatedAt?: string | Date | null; // Could be string or Date depending on serialization
};

// Type for chart data points (used in WodViewer and passed from page.tsx)
export type ChartDataPoint = {
  name: string;
  value: number;
};

// Types for timeline chart data points (passed from page.tsx to WodViewer)
export type FrequencyDataPoint = {
  month: string;
  count: number;
};
export type PerformanceDataPoint = {
  month: string;
  averageLevel: number;
};

// Type for sorting columns in WodTable/WodViewer
export type SortByType =
  | "wodName"
  | "date"
  | "difficulty"
  | "countLikes"
  | "results"; // Added 'results' for sorting by latest score level
