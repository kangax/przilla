import type { WodTag, WodCategory } from "~/types/wodTypes";

// Define allowed tags and their desired display order
export const DESIRED_TAG_ORDER: WodTag[] = [
  "For Time",
  "AMRAP",
  "Couplet",
  "Triplet",
  "Chipper",
  "Ladder",
  "EMOM",
];
// Ensure ALLOWED_TAGS uses the WodTag type if needed elsewhere,
// or remove if only DESIRED_TAG_ORDER is used for filtering/display logic.
export const ALLOWED_TAGS: WodTag[] = DESIRED_TAG_ORDER;

// Define desired category order
export const DESIRED_CATEGORY_ORDER: WodCategory[] = [
  "Girl",
  "Benchmark",
  "Hero",
  "Open",
  "Quarterfinals",
  "Games",
  "Other",
];

// Mapping for performance level numerical values (used in page.tsx and WodViewer sort)
export const PERFORMANCE_LEVEL_VALUES: Record<string, number> = {
  elite: 4,
  advanced: 3,
  intermediate: 2,
  beginner: 1,
};

// Mapping for performance level colors (used in WodViewer and potentially WodTable/Timeline)
// Using darker shades for better contrast in light mode
export const PERFORMANCE_LEVEL_COLORS: Record<string, string> = {
  elite: "text-purple-600 dark:text-purple-400",
  advanced: "text-green-600 dark:text-green-400",
  intermediate: "text-yellow-600 dark:text-yellow-400",
  beginner: "text-red-600 dark:text-red-400",
  default: "text-foreground/70 dark:text-foreground/60", // For scaled or N/A
};
