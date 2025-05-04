import { z } from "zod";

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
  wodUrl: z.union([z.string().url(), z.literal("")]), // Must be valid URL or empty string
  wodName: z.string(),
  description: z.string().default(""),
  benchmarks: BenchmarksSchema.nullable().default(null),
  category: z.string().default("Other"),
  tags: z.array(z.string()).default([]),
  difficulty: z.string().default(""),
  difficultyExplanation: z.string().default(""),
  timecap: z.number().default(0),
  countLikes: z.number().default(0),
  movements: z.array(z.string()).default([]),
});

export type WodJson = z.infer<typeof WodJsonSchema>;
