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
  wodUrl: z.string().nullable().optional(),
  wodName: z.string(),
  description: z.string(),
  benchmarks: BenchmarksSchema.optional().nullable(),
  category: z.string(),
  tags: z.array(z.string()).optional().nullable(),
  difficulty: z.string(),
  difficultyExplanation: z.string().optional().nullable(),
  timecap: z.number().optional().nullable(),
  countLikes: z.number().optional(), // default to 0 if missing
  movements: z.array(z.string()).optional(),
});

export type WodJson = z.infer<typeof WodJsonSchema>;
