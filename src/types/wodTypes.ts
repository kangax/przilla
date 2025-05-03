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
import type { FuseResultMatch } from "fuse.js"; // Import FuseResultMatch

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
export const WodCategorySchema = z.enum([
  "Girl",
  "Hero",
  "Games",
  "Open",
  "Quarterfinals",
  "AGOQ",
  "Benchmark",
  "Other",
]);

// Zod schema for the final client-side Wod type
export const WodSchema = z.object({
  id: z.string(),
  wodUrl: z.union([z.string().url(), z.literal("")]), // Allow valid URL or empty string
  wodName: z.string(),
  description: z.string().nullable().optional(), // Optional because it might be missing entirely
  benchmarks: BenchmarksSchema.nullable().optional(), // Optional because it might be missing entirely
  category: WodCategorySchema.nullable().optional(), // Optional because it might be missing entirely
  tags: z.array(z.string()).nullable().default([]), // Default to empty array if null/undefined
  difficulty: z.string().nullable().optional(), // Optional because it might be missing entirely
  difficultyExplanation: z.string().nullable().optional(), // Optional because it might be missing entirely
  countLikes: z.number().nullable().optional(), // Optional because it might be missing entirely
  movements: z.array(z.string()).default([]), // Default to empty array if undefined
  timecap: z.number().nullable().optional(), // Optional because it might be missing entirely
  createdAt: z.preprocess((arg: unknown) => {
    if (typeof arg === "string") return new Date(arg);
    if (arg instanceof Date) return new Date(arg);
    // For any other type, return current date as default
    return new Date();
  }, z.date()),
  updatedAt: z
    .preprocess((arg: unknown) => {
      if (typeof arg === "string") return new Date(arg);
      if (arg instanceof Date) return new Date(arg);
      // If null or undefined, return null
      if (arg === null || typeof arg === "undefined") return null;

      // Handle objects specifically to avoid "[object Object]" string conversion
      if (typeof arg === "object") {
        // If it has a toISOString method, it might be Date-like
        if (
          arg &&
          "toISOString" in arg &&
          typeof arg.toISOString === "function"
        ) {
          try {
            // Use type assertion to tell TypeScript this is safe
            const dateObj = arg as { toISOString(): string };
            const isoString = dateObj.toISOString();
            return new Date(isoString);
          } catch {
            return null;
          }
        }
        // If it has numeric timestamp properties, try to use those
        if (arg && "valueOf" in arg && typeof arg.valueOf === "function") {
          try {
            // Use type assertion to tell TypeScript this is safe
            const valueObj = arg as { valueOf(): number };
            const value = valueObj.valueOf();
            const date = new Date(value);
            return isNaN(date.getTime()) ? null : date;
          } catch {
            return null;
          }
        }
        // For other objects, we can't safely convert to a date
        return null;
      }

      // For numbers, use direct conversion
      if (typeof arg === "number") {
        const date = new Date(arg);
        return isNaN(date.getTime()) ? null : date;
      }

      // For any other type, we can't safely convert to a date
      return null;
    }, z.date())
    .nullable(),
});

// Zod schema to parse/transform raw DB row into Wod
export const WodFromDbRowSchema = z.object({
  id: z.string().min(1).catch("unknown_id"),
  wodUrl: z.string().default(""),
  wodName: z.string().min(1).catch("Unknown WOD"),
  description: z.string().nullable().optional(),
  benchmarks: z
    .any()
    .transform(val => {
      if (typeof val === "string") {
        try { return JSON.parse(val); } catch { return null; }
      }
      return val ?? null;
    })
    .nullable()
    .optional(),
  category: z
    .string()
    .refine(
      val =>
        [
          "Girl",
          "Hero",
          "Games",
          "Open",
          "Quarterfinals",
          "AGOQ",
          "Benchmark",
          "Other",
        ].includes(val),
      { message: "Invalid category" }
    )
    .nullable()
    .optional(),
  tags: z
    .any()
    .transform(val => {
      if (typeof val === "string") {
        try { return JSON.parse(val); } catch { return []; }
      }
      return Array.isArray(val) ? val : [];
    })
    .default([]),
  difficulty: z.string().nullable().optional(),
  difficultyExplanation: z.string().nullable().optional(),
  countLikes: z.number().nullable().optional(),
  timecap: z.number().nullable().optional(),
  createdAt: z.preprocess((arg: unknown) => {
    if (typeof arg === "string") return new Date(arg);
    if (arg instanceof Date) return new Date(arg);
    return new Date();
  }, z.date()),
  updatedAt: z
    .preprocess((arg: unknown) => {
      if (typeof arg === "string") return new Date(arg);
      if (arg instanceof Date) return new Date(arg);
      if (arg === null || typeof arg === "undefined") return null;
      if (typeof arg === "object") {
        if (
          arg &&
          "toISOString" in arg &&
          typeof arg.toISOString === "function"
        ) {
          try {
            const dateObj = arg as { toISOString(): string };
            const isoString = dateObj.toISOString();
            return new Date(isoString);
          } catch {
            return null;
          }
        }
        if (arg && "valueOf" in arg && typeof arg.valueOf === "function") {
          try {
            const valueObj = arg as { valueOf(): number };
            const value = valueObj.valueOf();
            const date = new Date(value);
            return isNaN(date.getTime()) ? null : date;
          } catch {
            return null;
          }
        }
        return null;
      }
      if (typeof arg === "number") {
        const date = new Date(arg);
        return isNaN(date.getTime()) ? null : date;
      }
      return null;
    }, z.date())
    .nullable(),
  movements: z.array(z.string()).default([]),
});

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
  | "Quarterfinals"
  | "AGOQ"
  | "Benchmark"
  | "Other";

// Final client-side Wod type (after parsing/transformation)
export type Wod = {
  id: string; // Added from DB schema
  wodUrl: string; // Must be a string (valid URL or empty)
  wodName: string;
  description?: string | null; // Updated to match DB schema (can be null)
  benchmarks?: Benchmarks | null; // Updated to match DB schema (can be null)
  // results: WodResult[]; // Removed - results are fetched separately
  category?: WodCategory | null; // Use specific category type
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
  scores: MonthlyScoreDetail[];
};

// Type for sorting columns in WodTable/WodViewer
export type SortByType =
  | "wodName"
  | "date"
  | "difficulty"
  | "countLikes"
  | "results"; // Added 'results' for sorting by latest score level

// Type for WOD data returned by search, including match indices
export type WodWithMatches = Wod & {
  matches?: readonly FuseResultMatch[] | undefined;
};

// Structure for individual scores in the chart data (used in getChartData)
export type MonthlyScoreDetail = {
  wodName: string;
  level: number; // The original calculated level (0-4) for this score
  difficulty: string | null; // WOD difficulty string
  difficultyMultiplier: number; // Corresponding multiplier
  adjustedLevel: number; // level * difficultyMultiplier
  // Raw score fields for formatting in tooltip
  time_seconds: number | null;
  reps: number | null;
  load: number | null;
  rounds_completed: number | null;
  partial_reps: number | null;
  is_rx: boolean | null;
};

export type WodChartDataResponse = {
  tagCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  monthlyData: Record<string, { count: number; totalAdjustedLevelScore: number; scores: MonthlyScoreDetail[] }>;
  yourMovementCounts: Record<string, { count: number; wodNames: string[] }>;
  allMovementCounts: Record<string, { count: number; wodNames: string[] }>;
  movementCountsByCategory: Record<string, Record<string, { count: number; wodNames: string[] }>>;
};
