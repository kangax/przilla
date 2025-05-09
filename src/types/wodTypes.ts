// Type definitions for WOD data

import { z } from "zod";
import type { FuseResultMatch } from "fuse.js"; // Import FuseResultMatch

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

/**
 * Allowed WOD categories (single source of truth).
 * Update this array to change allowed categories everywhere.
 */
export const WOD_CATEGORIES = [
  "Girl",
  "Hero",
  "Games",
  "Open",
  "Quarterfinals",
  "AGOQ",
  "Benchmark",
  "Other",
] as const;

// Define allowed tags and categories as types for better safety
export const WodCategorySchema = z.enum(WOD_CATEGORIES);

/**
 * DRY base shape for all WOD schemas.
 * Extend or override in each consumer schema as needed.
 */
export const WodBaseShape = {
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
};

export const WodSchema = z.object({
  id: z.string(),
  ...WodBaseShape,
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
  isFavorited: z.boolean().optional(),
});

// Zod schema to parse/transform raw DB row into Wod
/**
 * CANONICAL: This is the single source of truth for parsing and transforming
 * raw WOD DB rows into normalized Wod objects. All code (API routers, utilities, etc.)
 * should import and use this schema. Do not duplicate this schema elsewhere.
 */
export const WodFromDbRowSchema = z.object({
  id: z.string().min(1).catch("unknown_id"),
  ...{
    ...WodBaseShape,
    wodUrl: z.string().default(""),
    wodName: z.string().min(1).catch("Unknown WOD"),
    description: z.string().default(""),
    benchmarks: z
      .union([z.string(), BenchmarksSchema, z.null()])
      .transform((val): Benchmarks | null => {
        if (typeof val === "string") {
          try {
            const parsed: unknown = JSON.parse(val);
            if (
              typeof parsed === "object" &&
              parsed !== null &&
              "type" in parsed &&
              "levels" in parsed
            ) {
              const result = BenchmarksSchema.safeParse(parsed);
              return result.success ? (result.data as Benchmarks) : null;
            }
            return null;
          } catch {
            return null;
          }
        }
        if (
          val &&
          typeof val === "object" &&
          "type" in val &&
          "levels" in val
        ) {
          const result = BenchmarksSchema.safeParse(val);
          return result.success ? (result.data as Benchmarks) : null;
        }
        return null;
      })
      .nullable()
      .default(null),
    category: z
      .string()
      .refine(
        (val): val is (typeof WOD_CATEGORIES)[number] =>
          WOD_CATEGORIES.includes(val as (typeof WOD_CATEGORIES)[number]),
        { message: "Invalid category" },
      )
      .default("Other"),
    tags: z
      .union([z.string(), z.array(z.string()), z.null()])
      .transform((val): string[] => {
        if (typeof val === "string") {
          try {
            const parsed: unknown = JSON.parse(val);
            if (Array.isArray(parsed)) {
              return parsed.filter((t): t is string => typeof t === "string");
            }
            return [];
          } catch {
            return [];
          }
        }
        if (Array.isArray(val)) {
          return val.filter((t): t is string => typeof t === "string");
        }
        return [];
      })
      .default([]),
    // difficulty, difficultyExplanation, countLikes, timecap, movements are inherited from WodBaseShape
  },
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

export type WodTag =
  | "Chipper"
  | "Couplet"
  | "Triplet"
  | "EMOM"
  | "AMRAP"
  | "For Time"
  | "Ladder";

export type WodCategory = (typeof WOD_CATEGORIES)[number];

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
  isFavorited?: boolean; // Added for favorites feature
};

// Intermediate type representing Wod data as potentially received from tRPC query (before client parsing)
export type WodFromQuery = Omit<
  Wod,
  "createdAt" | "updatedAt" | "tags" | "benchmarks" | "isFavorited" // Exclude isFavorited here if it's added to Wod
> & {
  createdAt: string | Date; // Could be string or Date depending on serialization
  updatedAt?: string | Date | null; // Could be string or Date depending on serialization
  tags?: string | string[] | null; // Could be stringified JSON or array
  benchmarks?: string | Benchmarks | null; // Could be stringified JSON or object
  movements?: string[]; // Always array from DB, can be empty
  isFavorited?: boolean; // Added for favorites feature, will be dynamically added by API
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
  benchType: Benchmarks["type"];
};

export type WodChartDataResponse = {
  tagCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  monthlyData: Record<
    string,
    {
      count: number;
      totalAdjustedLevelScore: number;
      scores: MonthlyScoreDetail[];
    }
  >;
  yourMovementCounts: Record<string, { count: number; wodNames: string[] }>;
  allMovementCounts: Record<string, { count: number; wodNames: string[] }>;
  movementCountsByCategory: Record<
    string,
    Record<string, { count: number; wodNames: string[] }>
  >;
};
