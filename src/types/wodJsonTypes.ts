import { z } from "zod";

/**
 * Canonical schema and type for WOD objects in public/data/wods.json.
 * All scripts and code that read or manipulate WOD JSON data must use this.
 */

export const WodJsonSchema = z.object({
  wodUrl: z.string().nullable().optional(),
  wodName: z.string(),
  description: z.string(),
  benchmarks: z.array(z.string()).optional().nullable(),
  category: z.string(),
  tags: z.array(z.string()).optional().nullable(),
  difficulty: z.string(),
  difficultyExplanation: z.string().optional().nullable(),
  timecap: z.number().optional().nullable(),
  countLikes: z.number().optional(), // default to 0 if missing
  movements: z.array(z.string()).optional(),
});

export type WodJson = z.infer<typeof WodJsonSchema>;
