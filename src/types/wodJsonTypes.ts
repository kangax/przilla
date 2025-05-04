import { z } from "zod";
import { WodBaseShape } from "./wodTypes";

/**
 * Benchmark level type and schema
 */
export type BenchmarkLevel = {
  min: number | null;
  max: number | null;
};

export const BenchmarkLevelSchema = z.object({
  min: z.number().nullable(),
  max: z.number().nullable(),
});

/**
 * Benchmarks type and schema
 */
export type Benchmarks = {
  type: "time" | "rounds" | "reps" | "load";
  levels: {
    elite: BenchmarkLevel;
    advanced: BenchmarkLevel;
    intermediate: BenchmarkLevel;
    beginner: BenchmarkLevel;
  };
};

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
 * Canonical schema and type for WOD objects in public/data/wods.json.
 * All scripts and code that read or manipulate WOD JSON data must use this.
 */

export const WodJsonSchema = z.object({
  ...WodBaseShape,
  // Override category to be a string (not enum) for JSON compatibility
  category: z.string().default("Other"),
});

export type WodJson = z.infer<typeof WodJsonSchema>;
