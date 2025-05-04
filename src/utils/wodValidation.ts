import { type Wod } from "~/types/wodTypes";
import { z } from "zod";
import { WodFromDbRowSchema } from "~/types/wodTypes";

/**
 * Zod schema representing raw WOD data from the database (non-nullable, with defaults)
 */
export const WodFromDbSchema = z.object({
  id: z.string(),
  wodUrl: z.string().default(""),
  wodName: z.string().default(""),
  description: z.string().default(""),
  benchmarks: z.string().default(""),
  category: z.string().default("Other"),
  tags: z.string().default("[]"),
  difficulty: z.string().default(""),
  difficultyExplanation: z.string().default(""),
  timecap: z.number().default(0),
  countLikes: z.number().default(0),
  createdAt: z.union([z.number(), z.date()]),
  updatedAt: z.union([z.number(), z.date()]),
});
export type WodFromDb = z.infer<typeof WodFromDbSchema>;

/**
 * Validates and transforms raw WOD data from the DB into fully-typed Wod objects.
 * Attaches movements from the provided map.
 */
export function validateWodsFromDb(
  wodsData: WodFromDb[],
  movementsByWod: Record<string, string[]>
): Wod[] {
  return wodsData.reduce<Wod[]>((acc, wod) => {
    // Parse JSON fields before validation
    let parsedBenchmarks: unknown = "";
    try {
      parsedBenchmarks = wod.benchmarks ? JSON.parse(wod.benchmarks) : null;
    } catch {
      parsedBenchmarks = null;
    }
    let parsedTags: unknown = [];
    try {
      parsedTags = wod.tags ? JSON.parse(wod.tags) : [];
    } catch {
      parsedTags = [];
    }

    // Attach movements from external context
    const input = {
      ...wod,
      benchmarks: parsedBenchmarks,
      tags: parsedTags,
      movements: Array.isArray(movementsByWod[wod.id]) ? movementsByWod[wod.id] : [],
    };
    const validationResult = WodFromDbRowSchema.safeParse(input);

    if (validationResult.success) {
      acc.push(validationResult.data as Wod);
    } else {
      console.error(
        `Zod validation failed for WOD ${wod.wodName} (ID: ${wod.id}). Skipping. Issues:`,
        JSON.stringify(validationResult.error.issues, null, 2)
      );
    }

    return acc;
  }, []);
}
