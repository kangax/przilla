import type { SortByType } from "~/types/wodTypes";

/**
 * Returns a safe string, defaulting to an empty string if the value is undefined or null.
 */
export const safeString = (value: string | undefined | null): string =>
  value || "";

/**
 * Returns a Tailwind color class for a given difficulty string.
 */
export const getDifficultyColor = (
  difficulty: string | undefined | null,
): string => {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return "text-green-500";
    case "medium":
      return "text-yellow-500";
    case "hard":
      return "text-orange-500";
    case "very hard":
      return "text-red-500";
    case "extremely hard":
      return "text-purple-500";
    default:
      return "text-foreground";
  }
};

/**
 * Checks if a given sort key is a valid SortByType.
 */
export const isValidSortBy = (sortBy: string | null): sortBy is SortByType => {
  const validSortKeys: SortByType[] = [
    "wodName",
    "date",
    "difficulty",
    "countLikes",
    "results",
  ];
  return validSortKeys.includes(sortBy as SortByType);
};
