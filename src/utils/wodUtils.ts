import type { Wod, WodResult, SortByType } from "~/types/wodTypes"; // Added SortByType
import {
  PERFORMANCE_LEVEL_COLORS,
  PERFORMANCE_LEVEL_VALUES, // Added PERFORMANCE_LEVEL_VALUES
} from "~/config/constants";

/**
 * Checks if a WodResult has any score value recorded.
 */
export const hasScore = (result: WodResult): boolean => {
  return (
    result.score_time_seconds !== null ||
    result.score_reps !== null ||
    result.score_load !== null ||
    result.score_rounds_completed !== null
  );
};

/**
 * Calculates a single numeric value representing the score for comparison,
 * based on the WOD's benchmark type. Returns null if no benchmark or score.
 */
export const getNumericScore = (wod: Wod, result: WodResult): number | null => {
  if (!wod.benchmarks || !hasScore(result)) return null;

  if (wod.benchmarks.type === "time" && result.score_time_seconds !== null) {
    return result.score_time_seconds;
  } else if (wod.benchmarks.type === "reps" && result.score_reps !== null) {
    return result.score_reps;
  } else if (wod.benchmarks.type === "load" && result.score_load !== null) {
    return result.score_load;
  } else if (
    wod.benchmarks.type === "rounds" &&
    result.score_rounds_completed !== null
  ) {
    // Convert rounds+reps to a decimal number (e.g., 5+10 becomes 5.10)
    const partialReps = result.score_partial_reps || 0;
    // Ensure partial reps don't overflow (e.g., treat 100 reps as 0.99 for comparison)
    // This assumes no WOD has 100+ reps in a partial round for scoring benchmarks.
    const partialDecimal = Math.min(partialReps, 99) / 100;
    return result.score_rounds_completed + partialDecimal;
  }

  return null;
};

/**
 * Determines the performance level (elite, advanced, etc.) based on the numeric score
 * and the WOD's benchmark levels. Returns null if no benchmark or score.
 */
export const getPerformanceLevel = (
  wod: Wod,
  result: WodResult,
): string | null => {
  if (!wod.benchmarks) return null;

  const numericScore = getNumericScore(wod, result);
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
 * Checks if a WOD is considered "done" (has at least one result with a date and score).
 */
export const isWodDone = (wod: Wod): boolean => {
  return wod.results.some((r) => r.date && hasScore(r));
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
 * Formats a WodResult into a displayable score string based on available fields.
 */
export const formatScore = (result: WodResult): string => {
  if (result.score_time_seconds !== null) {
    return formatSecondsToMMSS(result.score_time_seconds);
  } else if (result.score_reps !== null) {
    return `${result.score_reps} reps`;
  } else if (result.score_load !== null) {
    return `${result.score_load} lbs`;
  } else if (result.score_rounds_completed !== null) {
    if (result.score_partial_reps !== null && result.score_partial_reps > 0) {
      return `${result.score_rounds_completed}+${result.score_partial_reps}`;
    } else {
      return `${result.score_rounds_completed} rounds`; // Be explicit for full rounds
    }
  }
  return "-"; // Return a dash if no score is found
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
 * Generates a multi-line string tooltip describing the benchmark levels for a WOD.
 */
export const getPerformanceLevelTooltip = (wod: Wod): string => {
  if (!wod.benchmarks) return "No benchmark data available.";

  // Add check for levels existence and non-emptiness
  const { levels, type } = wod.benchmarks;
  if (
    !levels ||
    typeof levels !== "object" ||
    Object.keys(levels).length === 0
  ) {
    return "Benchmark levels not defined.";
  }

  // Ensure levelOrder only contains keys actually present in levels, though standard keys are expected
  const levelOrder: Array<keyof typeof levels> = [
    "elite",
    "advanced",
    "intermediate",
    "beginner",
  ];
  const tooltipLines: string[] = [];

  levelOrder.forEach((levelName) => {
    const levelData = levels[levelName];
    // Check if levelData actually exists for the key
    if (!levelData) {
      tooltipLines.push(
        `${levelName.charAt(0).toUpperCase() + levelName.slice(1)}: N/A`,
      );
      return; // Skip to next iteration
    }

    let formattedRange = "";

    if (type === "time") {
      // Lower is better for time
      // Use optional chaining just in case, though levelData check helps
      const min =
        levelData?.min !== null ? formatSecondsToMMSS(levelData.min) : "0:00";
      const max =
        levelData?.max !== null ? formatSecondsToMMSS(levelData.max) : "∞";
      // Handle edge case where min is 0 for elite (means less than max)
      if (levelName === "elite" && levelData?.min === 0) {
        formattedRange = `< ${max}`;
      } else if (levelName === "beginner" && levelData?.max === null) {
        formattedRange = `> ${min}`;
      } else {
        formattedRange = `${min} - ${max}`;
      }
    } else {
      // Higher is better for reps, load, rounds
      const min = levelData?.min !== null ? levelData.min.toString() : "0";
      const max = levelData?.max !== null ? levelData.max.toString() : "∞";
      const unit =
        type === "load"
          ? " lbs"
          : type === "reps" || type === "rounds"
            ? ""
            : ` ${String(type)}`; // Explicitly cast type to string for template literal

      // Handle edge case where max is null for elite (means greater than min)
      if (levelName === "elite" && levelData?.max === null) {
        formattedRange = `> ${min}${unit}`;
      } else if (levelName === "beginner" && levelData?.min === 0) {
        formattedRange = `< ${max}${unit}`;
      } else {
        formattedRange = `${min} - ${max}${unit}`;
      }
    }

    const capitalizedLevelName =
      levelName.charAt(0).toUpperCase() + levelName.slice(1);
    tooltipLines.push(`${capitalizedLevelName}: ${formattedRange}`);
  });

  return tooltipLines.join("\n");
};

/**
 * Sorts an array of WODs based on the specified column and direction.
 */
export const sortWods = (
  wodsToSort: Wod[],
  sortBy: SortByType,
  sortDirection: "asc" | "desc",
): Wod[] => {
  return [...wodsToSort].sort((a, b) => {
    const directionMultiplier = sortDirection === "asc" ? 1 : -1;

    if (sortBy === "wodName") {
      const nameA = a.wodName.toUpperCase();
      const nameB = b.wodName.toUpperCase();
      if (nameA < nameB) return -1 * directionMultiplier;
      if (nameA > nameB) return 1 * directionMultiplier;
      return 0;
    } else if (sortBy === "date") {
      // Find the earliest valid date for comparison
      const earliestDateA =
        [...a.results]
          .filter((r) => r.date && hasScore(r))
          .map((r) => new Date(r.date).getTime()) // Removed unnecessary non-null assertion
          .sort((d1, d2) => d1 - d2)[0] ?? Infinity;
      const earliestDateB =
        [...b.results]
          .filter((r) => r.date && hasScore(r))
          .map((r) => new Date(r.date).getTime()) // Removed unnecessary non-null assertion
          .sort((d1, d2) => d1 - d2)[0] ?? Infinity;

      if (earliestDateA === Infinity && earliestDateB === Infinity) {
        return a.wodName.localeCompare(b.wodName);
      } else if (earliestDateA === Infinity) {
        return 1 * directionMultiplier;
      } else if (earliestDateB === Infinity) {
        return -1 * directionMultiplier;
      }

      if (earliestDateA !== earliestDateB) {
        return (earliestDateA - earliestDateB) * directionMultiplier;
      } else {
        return a.wodName.localeCompare(b.wodName);
      }
    } else if (sortBy === "attempts") {
      const attemptsA = a.results.filter((r) => r.date && hasScore(r)).length;
      const attemptsB = b.results.filter((r) => r.date && hasScore(r)).length;
      return (attemptsA - attemptsB) * directionMultiplier;
    } else if (sortBy === "level" || sortBy === "latestLevel") {
      let resultA: WodResult | null = null;
      let resultB: WodResult | null = null;

      const findResult = (wod: Wod): WodResult | null => {
        const validResults = wod.results.filter((r) => r.date && hasScore(r));
        if (validResults.length === 0) return null;

        if (sortBy === "level") {
          return validResults.sort(
            (r1, r2) =>
              new Date(r1.date).getTime() - new Date(r2.date).getTime(), // Removed unnecessary non-null assertion
          )[0];
        } else {
          return validResults.sort(
            (r1, r2) =>
              new Date(r2.date).getTime() - new Date(r1.date).getTime(), // Removed unnecessary non-null assertion
          )[0];
        }
      };

      resultA = findResult(a);
      resultB = findResult(b);

      const levelA = resultA ? getPerformanceLevel(a, resultA) : null;
      const levelB = resultB ? getPerformanceLevel(b, resultB) : null;

      const levelValueA = levelA ? (PERFORMANCE_LEVEL_VALUES[levelA] ?? 0) : 0;
      const levelValueB = levelB ? (PERFORMANCE_LEVEL_VALUES[levelB] ?? 0) : 0;

      const isScaledA =
        resultA && resultA.rxStatus && resultA.rxStatus !== "Rx";
      const isScaledB =
        resultB && resultB.rxStatus && resultB.rxStatus !== "Rx";
      const baseScoreA = resultA ? (isScaledA ? 0 : 10) : 0;
      const baseScoreB = resultB ? (isScaledB ? 0 : 10) : 0;

      const finalScoreA = baseScoreA + levelValueA;
      const finalScoreB = baseScoreB + levelValueB;

      if (finalScoreA !== finalScoreB) {
        return (finalScoreA - finalScoreB) * directionMultiplier;
      }

      const nameCompare = a.wodName.localeCompare(b.wodName);
      if (nameCompare !== 0) {
        return nameCompare * directionMultiplier;
      }
      return 0;
    } else if (sortBy === "difficulty") {
      // Define a mapping for difficulty levels to numeric values
      const difficultyValues: Record<string, number> = {
        easy: 1,
        medium: 2,
        hard: 3,
        "very hard": 4,
      };

      // Get the numeric value for each WOD's difficulty, defaulting to 0 if undefined/null or not in map
      const difficultyA =
        difficultyValues[a.difficulty?.toLowerCase() ?? ""] ?? 0;
      const difficultyB =
        difficultyValues[b.difficulty?.toLowerCase() ?? ""] ?? 0;

      if (difficultyA !== difficultyB) {
        return (difficultyA - difficultyB) * directionMultiplier;
      }
      // Secondary sort by name if difficulties are the same
      return a.wodName.localeCompare(b.wodName) * directionMultiplier;
    } else if (sortBy === "count_likes") {
      // Treat null/undefined likes as 0 for comparison
      const likesA = a.count_likes ?? 0;
      const likesB = b.count_likes ?? 0;

      if (likesA !== likesB) {
        return (likesA - likesB) * directionMultiplier;
      }
      // Secondary sort by name if likes are the same
      return a.wodName.localeCompare(b.wodName) * directionMultiplier;
    }
    return 0;
  });
};
