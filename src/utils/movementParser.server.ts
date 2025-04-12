import { type Wod } from "../types/wodTypes";
import { normalizeMovementName } from "./movementMapping";

export const commonWords = new Set([
  "for",
  "time",
  "reps",
  "rounds",
  "of",
  "min",
  "rest",
  "between",
  "then",
  "amrap",
  "emom",
  "in",
  "minutes",
  "seconds",
  "with",
  "meter",
  "meters",
  "lb",
  "kg",
  "pood",
  "bodyweight",
  "alternating",
  "legs",
  "unbroken",
  "max",
  "needed",
  "set",
  "score",
  "is",
  "load",
  "the",
  "a",
  "and",
  "or",
  "each",
  "total",
  "cap",
  "as",
  "many",
  "possible",
  "on",
  "every",
  "minute",
  "from",
  "if",
  "completed",
  "before",
  "rounds for time",
  "reps for time",
  "rep for time",
  "for time",
  "amrap in",
  "emom in",
  "time cap",
  "with a",
  "minute rest",
  "rest between rounds",
  "alternating legs",
  "over the bar",
  "bar facing",
  "dumbbell",
  "kettlebell",
  "barbell",
  "assault bike",
  "echo bike",
  "cals",
  "calories",
  "men",
  "women",
  "men use",
  "women use",
  "amanda",
  "doubles and oly",
  "ringer",
  "if you complete",
  "complete",
  "perform",
  "then rest",
  "rest",
  "each round",
  "round",
  "part",
]);

export const introductoryWords = new Set([
  "if",
  "for",
  "then",
  "rest",
  "each",
  "complete",
  "perform",
  "round",
  "rounds",
]);

export function parseMovementsFromWod(wod: Wod): Set<string> {
  const movements = new Set<string>();

  if (!wod.category || !wod.description || !wod.wodName) {
    return movements;
  }

  const lines = wod.description.split("\n");
  for (const line of lines) {
    const movementRegex = /([A-Z][a-zA-Z\s-]+)/g;
    let match: RegExpExecArray | null;
    const rawPhrases: string[] = [];

    while ((match = movementRegex.exec(line)) !== null) {
      if (match && typeof match[1] === "string") {
        const phrase = match[1]
          .replace(/\s+\(.*?\)/g, "")
          .replace(
            /(\d+(\.\d+)?\/?\d*(\.\d+)?)\s*(lb|kg|pood|in|meter|meters)/gi,
            "",
          )
          .replace(/[:\-.,]$/, "")
          .trim();

        const phraseLower = phrase.toLowerCase();
        const wordsInPhrase = phraseLower.split(/\s+/);
        const allCommon = wordsInPhrase.every(
          (word) => commonWords.has(word) || word.length <= 1,
        );
        const startsWithIntroductory =
          wordsInPhrase.length > 0 && introductoryWords.has(wordsInPhrase[0]);

        if (
          phrase.length > 2 &&
          !commonWords.has(phraseLower) &&
          !allCommon &&
          !startsWithIntroductory
        ) {
          if (!wordsInPhrase.every((word) => commonWords.has(word))) {
            rawPhrases.push(phrase);
          }
        }
      }
    }

    for (const rawPhrase of rawPhrases) {
      const normalized = normalizeMovementName(rawPhrase);
      if (normalized) {
        movements.add(normalized);
      }
    }
  }

  return movements;
}

export function analyzeMovementFrequency(
  wods: Wod[],
): Record<string, Record<string, { count: number; wodNames: string[] }>> {
  const movementDataByCategory: Record<
    string,
    Record<string, { count: number; wodNames: string[] }>
  > = {};

  for (const wod of wods) {
    const movements = parseMovementsFromWod(wod);

    if (!movementDataByCategory[wod.category]) {
      movementDataByCategory[wod.category] = {};
    }

    for (const movement of movements) {
      if (!movementDataByCategory[wod.category][movement]) {
        movementDataByCategory[wod.category][movement] = {
          count: 0,
          wodNames: [],
        };
      }
      movementDataByCategory[wod.category][movement].count++;
      movementDataByCategory[wod.category][movement].wodNames.push(wod.wodName);
    }
  }

  return movementDataByCategory;
}
