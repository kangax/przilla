import { type Wod } from "~/types/wodTypes";
import { WodFromDbRowSchema } from "~/server/api/routers/wod";

/**
 * Validates and transforms raw WOD data from the DB into fully-typed Wod objects.
 * Attaches movements from the provided map.
 */
export function validateWodsFromDb(
  wodsData: any[],
  movementsByWod: Record<string, string[]>
): Wod[] {
  return wodsData.reduce<Wod[]>((acc, wod) => {
    // Attach movements from external context
    const input = { ...wod, movements: Array.isArray(movementsByWod[wod.id]) ? movementsByWod[wod.id] : [] };
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
