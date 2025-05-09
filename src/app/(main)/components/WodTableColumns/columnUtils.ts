import type { SortByType } from "~/types/wodTypes";

// Numeric mapping for performance levels for sorting
export const performanceLevelValues: Record<string, number> = {
  elite: 4,
  advanced: 3,
  intermediate: 2,
  beginner: 1,
  rx: 0, // Rx but no specific level (e.g., no benchmarks)
  scaled: -1,
  noScore: -2, // WOD has no score logged
};

export const getSortIndicator = (
  columnName: SortByType,
  sortBy: SortByType,
  sortDirection: "asc" | "desc",
): string => {
  if (sortBy === columnName) {
    return sortDirection === "asc" ? " ▲" : " ▼";
  }
  return "";
};
