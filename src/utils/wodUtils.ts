import type { Wod, Score, SortByType } from "~/types/wodTypes"; // Added Score, SortByType, removed WodResult
import { PERFORMANCE_LEVEL_COLORS } from "~/config/constants";

/**
 * Checks if a Score has any score value recorded.
 */
export const hasScore = (score: Score): boolean => {
  return (
    score.time_seconds !== null ||
    score.reps !== null ||
    score.load !== null ||
    score.rounds_completed !== null
    // partial_reps doesn't count as a primary score value on its own
  );
};

/**
 * Calculates a single numeric value representing the score for comparison,
 * based on the WOD's benchmark type. Returns null if no benchmark or score.
 */
export const getNumericScore = (
  wod: Wod | null,
  score: Score,
): number | null => {
  if (!wod || !wod.benchmarks) return null; // No benchmarks to compare against

  // Check if score object has any relevant value
  const hasAnyScoreValue =
    score.time_seconds !== null ||
    score.reps !== null ||
    score.load !== null ||
    score.rounds_completed !== null;

  if (!hasAnyScoreValue) return null; // No score value recorded

  if (wod.benchmarks.type === "time" && score.time_seconds !== null) {
    return score.time_seconds;
  } else if (wod.benchmarks.type === "reps" && score.reps !== null) {
    return score.reps;
  } else if (wod.benchmarks.type === "load" && score.load !== null) {
    return score.load;
  } else if (
    wod.benchmarks.type === "rounds" &&
    score.rounds_completed !== null
  ) {
    // Convert rounds+reps to a decimal number (e.g., 5+10 becomes 5.10)
    const partialReps = score.partial_reps || 0;
    // Ensure partial reps don't overflow (e.g., treat 100 reps as 0.99 for comparison)
    // This assumes no WOD has 100+ reps in a partial round for scoring benchmarks.
    const partialDecimal = Math.min(partialReps, 99) / 100;
    return score.rounds_completed + partialDecimal;
  }

  return null;
};

/**
 * Determines the performance level (elite, advanced, etc.) based on the numeric score
 * and the WOD's benchmark levels. Returns null if no benchmark or score.
 */
export const getPerformanceLevel = (
  wod: Wod | null,
  score: Score,
): string | null => {
  if (!wod || !wod.benchmarks) return null;

  const numericScore = getNumericScore(wod, score);
  if (numericScore === null) return null;

  // Add check for levels existence and non-emptiness
  const { levels } = wod.benchmarks;
  if (
    !levels ||
    typeof levels !== "object" ||
    Object.keys(levels).length === 0
  ) {
    return null; // Cannot determine level without defined levels
  }

  if (wod.benchmarks.type === "time") {
    // Lower is better for time
    // Add optional chaining for safety, though the check above should cover it
    if (levels.elite?.max !== null && numericScore <= levels.elite.max)
      return "elite";
    if (levels.advanced?.max !== null && numericScore <= levels.advanced.max)
      return "advanced";
    if (
      levels.intermediate?.max !== null &&
      numericScore <= levels.intermediate.max
    )
      return "intermediate";
    // If score is higher than intermediate max (or intermediate max is null), it's beginner
    return "beginner";
  } else {
    // Higher is better for rounds/reps/load
    // Add optional chaining for safety
    if (levels.elite?.min !== null && numericScore >= levels.elite.min)
      return "elite";
    if (levels.advanced?.min !== null && numericScore >= levels.advanced.min)
      return "advanced";
    if (
      levels.intermediate?.min !== null &&
      numericScore >= levels.intermediate.min
    )
      return "intermediate";
    // If score is lower than intermediate min (or intermediate min is null), it's beginner
    return "beginner";
  }
};

/**
 * Checks if a WOD is considered "done".
 * NOTE: This currently always returns false as WOD definitions fetched via
 * `api.wod.getAll` do not include user-specific results. Determining "doneness"
 * requires fetching associated scores separately.
 * @param wod The WOD definition.
 * @param scores An array of Score objects associated with this WOD for the current user.
 */
export const isWodDone = (_wod: Wod, scores?: Score[] | null): boolean => {
  // Prefix unused 'wod'
  // Check if there's at least one score associated with this WOD
  return !!scores && scores.length > 0;
};

/**
 * Formats a duration in seconds into MM:SS format.
 */
export const formatSecondsToMMSS = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60); // Ensure whole seconds
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

/**
 * Formats a duration in seconds into "Xmin Ysec" format.
 * Examples:
 *   2124 -> "35min 24sec"
 *   24   -> "24sec"
 *   60   -> "1min 0sec"
 *   0    -> "0sec"
 */
export const formatSecondsToMinSec = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return "0sec";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  if (minutes > 0) {
    return `${minutes}min ${remainingSeconds}sec`;
  }
  return `${remainingSeconds}sec`;
};

/**
 * Formats a Date object into a short "Mon DD, 'YY" format.
 */
export const formatShortDate = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "Invalid Date"; // Handle invalid date input
  }
  const month = date.toLocaleString("default", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear().toString().slice(-2);
  return `${month} ${day}, '${year}`;
};

/**
 * Determines the display text and Radix color for a performance badge based on level and Rx status.
 */
export const getPerformanceBadgeDetails = (
  wod: Wod,
  score: Score,
): { displayLevel: string; color: string } => {
  // If the score is not Rx, always show "Scaled" and gray
  if (!score.isRx) {
    return { displayLevel: "Scaled", color: "gray" };
  }

  const level = getPerformanceLevel(wod, score);
  let displayLevel = "Score"; // Default if no level
  let color = "gray"; // Default Radix color

  if (level) {
    const capitalizedLevel = level.charAt(0).toUpperCase() + level.slice(1);
    displayLevel = capitalizedLevel;

    switch (level) {
      case "elite":
        color = "purple";
        break;
      case "advanced":
        color = "green";
        break;
      case "intermediate":
        color = "yellow";
        break;
      case "beginner":
        color = "gray"; // Keep gray for beginner
        break;
    }
  } else if (score.isRx) {
    // Handle case where there's no benchmark level but it was Rx
    displayLevel = "Rx";
    color = "green"; // Use green for Rx when no level is available
  }

  return { displayLevel, color };
};

/**
 * Formats a Score object into a displayable score string based on available fields.
 * Optionally appends a suffix (e.g., "Rx" or "Scaled").
 */
export const formatScore = (score: Score, suffix?: string): string => {
  let value = "-";
  if (score.time_seconds !== null) {
    value = formatSecondsToMMSS(score.time_seconds);
  } else if (score.reps !== null) {
    value = `${score.reps} reps`;
  } else if (score.load !== null) {
    // TODO: Add unit (lbs/kg) based on user preference or WOD context if available
    value = `${score.load} lbs`;
  } else if (score.rounds_completed !== null) {
    if (score.partial_reps !== null && score.partial_reps > 0) {
      value = `${score.rounds_completed}+${score.partial_reps}`;
    } else {
      value = `${score.rounds_completed} rounds`; // Be explicit for full rounds
    }
  }
  if (suffix) {
    return `${value} ${suffix}`;
  }
  return value;
};

/**
 * Gets the Tailwind CSS class string for coloring text based on performance level.
 */
export const getPerformanceLevelColor = (level: string | null): string => {
  // Use dot notation for default access
  return (
    PERFORMANCE_LEVEL_COLORS[level ?? "default"] ??
    PERFORMANCE_LEVEL_COLORS.default
  );
};

/**
 * Generates a structured array of benchmark level details for a WOD.
 * Returns an empty array if no benchmark data is available or levels are not defined.
 */
export const getPerformanceLevelTooltip = (
  wod: Wod | null,
): Array<{ levelName: string; colorClass: string; formattedRange: string }> => {
  if (!wod || !wod.benchmarks) return [];

  const { levels, type } = wod.benchmarks;
  if (
    !levels ||
    typeof levels !== "object" ||
    Object.keys(levels).length === 0
  ) {
    return [];
  }

  const levelOrder: Array<keyof NonNullable<Wod["benchmarks"]["levels"]>> = [
    "elite",
    "advanced",
    "intermediate",
    "beginner",
  ];
  const levelDetails: Array<{
    levelName: string;
    colorClass: string;
    formattedRange: string;
  }> = [];

  levelOrder.forEach((levelName) => {
    const levelData = levels[levelName];
    if (!levelData) {
      // Include levels even if data is missing, but mark as N/A
      levelDetails.push({
        levelName: levelName.charAt(0).toUpperCase() + levelName.slice(1),
        colorClass: getPerformanceLevelColor(levelName), // Still get color for consistency
        formattedRange: "N/A",
      });
      return;
    }

    let formattedRange = "";

    if (type === "time") {
      // Lower is better for time
      const min =
        levelData.min !== null ? formatSecondsToMMSS(levelData.min) : "0:00";
      const max =
        levelData.max !== null ? formatSecondsToMMSS(levelData.max) : "∞";
      // For time benchmarks, format ranges based on level
      if (levelName === "elite") {
        formattedRange = `0:00 - ${max}`;
      } else if (levelName === "beginner" && levelData.max === null) {
        formattedRange = `${min} - ∞`;
      } else if (levelName === "beginner" && levelData.min === null) {
        formattedRange = `0:00 - ${max}`;
      } else {
        formattedRange = `${min} - ${max}`;
      }
    } else {
      // Higher is better for reps, load, rounds
      const min = levelData.min !== null ? levelData.min.toString() : "0";
      const max = levelData.max !== null ? levelData.max.toString() : "∞";
      const unit =
        type === "load"
          ? " lbs"
          : type === "reps" || type === "rounds"
            ? ""
            : ` ${String(type)}`;

      // Handle edge case where max is null for elite (means greater than min)
      if (levelName === "elite" && levelData.max === null) {
        formattedRange = `> ${min}${unit}`;
      } else if (levelName === "beginner" && levelData.min === null) {
        formattedRange = `0 - ${max}${unit}`;
      } else {
        formattedRange = `${min} - ${max}${unit}`;
      }
    }

    const capitalizedLevelName =
      levelName.charAt(0).toUpperCase() + levelName.slice(1);
    levelDetails.push({
      levelName: capitalizedLevelName,
      colorClass: getPerformanceLevelColor(levelName),
      formattedRange: formattedRange,
    });
  });

  return levelDetails;
};

// Define difficulty map outside the sort function for efficiency
const difficultyValues: Record<string, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
  "very hard": 4,
  "extremely hard": 5, // Added extremely hard based on getDifficultyColor
};

/**
 * Sorts an array of WODs based on the specified column and direction.
 * Requires scoresByWodId map for sorting by date, level, etc.
 */
export const sortWods = (
  wodsToSort: Wod[],
  sortBy: SortByType,
  sortDirection: "asc" | "desc",
  scoresByWodId?: Record<string, Score[]>, // Optional map for score-based sorting
): Wod[] => {
  // Helper to get the latest score date for a WOD
  const getLatestScoreDate = (wodId: string): Date | null => {
    // Changed number to string
    const scores = scoresByWodId?.[wodId];
    // Scores are pre-sorted descending in WodViewer, so the first one is the latest
    return scores && scores.length > 0 ? scores[0].scoreDate : null;
  };

  // Numeric mapping for performance levels for sorting
  const performanceLevelValues: Record<string, number> = {
    elite: 4,
    advanced: 3,
    intermediate: 2,
    beginner: 1,
    rx: 0, // Rx but no specific level (e.g., no benchmarks)
    scaled: -1,
    noScore: -2, // WOD has no score logged
  };

  return [...wodsToSort].sort((a, b) => {
    const directionMultiplier = sortDirection === "asc" ? 1 : -1;

    if (sortBy === "wodName") {
      // Use localeCompare for proper string comparison
      const compareResult = a.wodName.localeCompare(b.wodName);
      // No secondary sort needed if primary is name
      return compareResult * directionMultiplier;
    } else if (sortBy === "results") {
      // --- Sorting by latest score level ---
      const getLevelValue = (wod: Wod): number => {
        const scores = scoresByWodId?.[wod.id] ?? [];
        if (scores.length === 0) {
          return performanceLevelValues.noScore;
        }
        // Assuming scores are sorted descending by date, latest is scores[0]
        const latestScore = scores[0];
        if (!latestScore.isRx) {
          return performanceLevelValues.scaled;
        }
        // Use getPerformanceLevel from this module
        const level = getPerformanceLevel(wod, latestScore);
        return level
          ? (performanceLevelValues[level] ?? performanceLevelValues.rx)
          : performanceLevelValues.rx;
      };

      const levelA = getLevelValue(a);
      const levelB = getLevelValue(b);

      if (levelA !== levelB) {
        return (levelA - levelB) * directionMultiplier;
      }
      // Secondary sort by name
      return a.wodName.localeCompare(b.wodName);
    } else if (sortBy === "date") {
      // --- NEW Date Sorting Logic ---
      if (sortBy === "date") {
        const dateA = getLatestScoreDate(a.id);
        const dateB = getLatestScoreDate(b.id);

        // Handle cases where one or both WODs have no scores
        if (dateA === null && dateB === null)
          return a.wodName.localeCompare(b.wodName); // Secondary sort by name
        if (dateA === null) return 1 * directionMultiplier; // Sort WODs without scores after those with scores (asc) or before (desc)
        if (dateB === null) return -1 * directionMultiplier; // Sort WODs without scores after those with scores (asc) or before (desc)

        // Both have dates, compare them
        const timeDiff = dateA.getTime() - dateB.getTime();
        if (timeDiff !== 0) {
          return timeDiff * directionMultiplier;
        }
        // Secondary sort by name if dates are the same
        return a.wodName.localeCompare(b.wodName);
      }
      // --- END Date Sorting Logic ---
      return a.wodName.localeCompare(b.wodName) * directionMultiplier; // Fallback for other score-based sorts
    } else if (sortBy === "difficulty") {
      // Use pre-defined map
      const difficultyA =
        difficultyValues[a.difficulty?.toLowerCase() ?? ""] ?? 0;
      const difficultyB =
        difficultyValues[b.difficulty?.toLowerCase() ?? ""] ?? 0;

      if (difficultyA !== difficultyB) {
        return (difficultyA - difficultyB) * directionMultiplier;
      }
      // Secondary sort by name (using localeCompare is fine here)
      return a.wodName.localeCompare(b.wodName); // directionMultiplier already applied if primary sort differed
    } else if (sortBy === "countLikes") {
      // Treat null/undefined likes as 0
      const likesA = a.countLikes ?? 0;
      const likesB = b.countLikes ?? 0;

      if (likesA !== likesB) {
        return (likesA - likesB) * directionMultiplier;
      }
      // Secondary sort by name (using localeCompare is fine here)
      return a.wodName.localeCompare(b.wodName); // directionMultiplier already applied if primary sort differed
    }

    // Default case if sortBy is unrecognized (shouldn't happen with TS)
    return 0;
  });
};

/**
 * Calculates the count of WODs per category.
 * NOTE: This currently counts all WODs per category, as `isWodDone` always returns false.
 * It might need adjustment later if filtering by "done" status based on fetched scores is required.
 */
export const calculateCategoryCounts = (
  wods: Wod[],
): Record<string, number> => {
  const counts: Record<string, number> = {};
  wods.forEach((wod) => {
    // if (isWodDone(wod) && wod.category) { // Old logic checking isWodDone
    if (wod.category) {
      // Count all WODs in the category
      counts[wod.category] = (counts[wod.category] || 0) + 1;
    }
  });
  return counts;
};

/**
 * Parses the tags property of a WOD, which might be a stringified JSON array,
 * into an actual array of strings. Returns an empty array if parsing fails or input is invalid.
 */
export const parseTags = (
  tags: string | string[] | null | undefined,
): string[] => {
  if (Array.isArray(tags)) {
    // Already an array, ensure elements are strings
    return tags.map(String);
  }
  if (typeof tags === "string") {
    try {
      // Cast to unknown first, then check if it's an array
      const parsed = JSON.parse(tags) as unknown;
      // Ensure the parsed result is an array and its elements are strings
      if (Array.isArray(parsed)) {
        // Cast to unknown[] before mapping to satisfy linter
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        return (parsed as unknown[]).map((item: unknown) => String(item));
      }
      console.warn("Parsed tags JSON was not an array:", tags);
      return []; // Return empty array if parsed JSON is not an array
    } catch (e) {
      console.error("Failed to parse tags JSON string:", tags, e);
      return []; // Return empty array on parsing error
    }
  }
  // Return empty array for null, undefined, or other types
  return [];
};
