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
  description: z.string().default(""),
  benchmarks: BenchmarksSchema.nullable().default(null),
  category: WodCategorySchema.default("Other"),
  tags: z.array(z.string()).default([]),
  difficulty: z.string().default(""),
  difficultyExplanation: z.string().default(""),
  countLikes: z.number().default(0),
  movements: z.array(z.string()).default([]), // Default to empty array if undefined
  timecap: z.number().default(0),
  createdAt: z.preprocess((arg: unknown) => {
    if (typeof arg === "string") return new Date(arg);
    if (arg instanceof Date) return new Date(arg);
    // For any other type, return current date as default
    return new Date();
  }, z.date()),
  updatedAt: z.preprocess((arg: unknown) => {
    if (typeof arg === "string") return new Date(arg);
    if (arg instanceof Date) return new Date(arg);
    if (typeof arg === "number") {
      const date = new Date(arg);
      return isNaN(date.getTime()) ? new Date() : date;
    }
    return new Date();
  }, z.date()),
});

// Zod schema to parse/transform raw DB row into Wod
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */
/**
 * CANONICAL: This is the single source of truth for parsing and transforming
 * raw WOD DB rows into normalized Wod objects. All code (API routers, utilities, etc.)
 * should import and use this schema. Do not duplicate this schema elsewhere.
 */
export const WodFromDbRowSchema = z.object({
  id: z.string().min(1).catch("unknown_id"),
  wodUrl: z.string().default(""),
  wodName: z.string().min(1).catch("Unknown WOD"),
  description: z.string().default(""),
  benchmarks: z
    .any()
    .transform(val => {
      if (typeof val === "string") {
        try { return JSON.parse(val); } catch { return null; }
      }
      return val ?? null;
    })
    .nullable()
    .default(null),
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
    .default("Other"),
  tags: z
    .any()
    .transform(val => {
      if (typeof val === "string") {
        try { return JSON.parse(val); } catch { return []; }
      }
      return Array.isArray(val) ? val : [];
    })
    .default([]),
  difficulty: z.string().default(""),
  difficultyExplanation: z.string().default(""),
  countLikes: z.number().default(0),
  timecap: z.number().default(0),
  createdAt: z.preprocess((arg: unknown) => {
    if (typeof arg === "string") return new Date(arg);
    if (arg instanceof Date) return new Date(arg);
    return new Date();
  }, z.date()),
  updatedAt: z.preprocess((arg: unknown) => {
    if (typeof arg === "string") return new Date(arg);
    if (arg instanceof Date) return new Date(arg);
    if (typeof arg === "number") {
      const date = new Date(arg);
      return isNaN(date.getTime()) ? new Date() : date;
    }
    return new Date();
  }, z.date()),
  movements: z.array(z.string()).default([]),
});
/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */

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
  id: string;
  wodUrl: string;
  wodName: string;
  description: string;
  benchmarks: Benchmarks | null;
  category: WodCategory;
  tags: string[];
  difficulty: string;
  difficultyExplanation: string;
  countLikes: number;
  movements: string[];
  timecap: number;
  createdAt: Date;
  updatedAt: Date;
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
