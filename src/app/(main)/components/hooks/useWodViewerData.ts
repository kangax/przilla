import { useMemo } from "react";
import {
  type ScoreFromQuery,
  type Wod,
  type Score,
  type SortByType,
  type WodCategory,
} from "~/types/wodTypes";
import { sortWods, isWodDone } from "~/utils/wodUtils";

/**
 * Custom hook to handle all WOD data transformation, filtering, searching, sorting, and count calculations.
 */
export function useWodViewerData(
  wodsData: Wod[] | undefined,
  initialWods: Wod[] | undefined,
  scoresData: ScoreFromQuery[] | undefined,
  selectedCategories: string[],
  selectedTags: string[],
  completionFilter: "all" | "done" | "notDone",
  sortBy: SortByType,
  sortDirection: "asc" | "desc",
  searchTerm: string,
): {
  wods: Wod[];
  scoresByWodId: Record<string, Score[]>;
  categoryOrder: string[];
  tagOrder: string[];
  categoryCounts: Record<string, number>;
  originalTotalWodCount: number;
  validSelectedCategories: string[];
  validSelectedTags: string[];
  dynamicTotalWodCount: number;
  dynamicDoneWodsCount: number;
  dynamicNotDoneWodsCount: number;
  sortedWods: Wod[];
  finalFilteredWods: Wod[];
} {
  // Map and memoize WODs
  const wods = useMemo<Wod[]>(() => {
    // Data is already parsed as Wod[]
    const result = wodsData ?? initialWods ?? [];
    console.log("[DEBUG] Initial wods data:", {
      wodsData: wodsData?.length,
      initialWods: initialWods?.length,
      result: result.length,
      searchTerm,
    });
    return result;
  }, [wodsData, initialWods, searchTerm]);

  // Map and memoize scores
  const scoresByWodId = useMemo(() => {
    if (!scoresData) return {} as Record<string, Score[]>;
    const processedScores: Score[] = scoresData.map(
      (score): Score => ({
        id: score.id ?? "",
        userId: score.userId ?? "",
        wodId: score.wodId ?? "",
        time_seconds:
          typeof score.time_seconds === "number" ? score.time_seconds : null,
        reps: typeof score.reps === "number" ? score.reps : null,
        load: typeof score.load === "number" ? score.load : null,
        rounds_completed:
          typeof score.rounds_completed === "number"
            ? score.rounds_completed
            : null,
        partial_reps:
          typeof score.partial_reps === "number" ? score.partial_reps : null,
        isRx: typeof score.isRx === "boolean" ? score.isRx : false,
        notes:
          typeof score.notes === "string"
            ? score.notes
            : score.notes === null
              ? null
              : "",
        scoreDate:
          typeof score.scoreDate === "string"
            ? new Date(score.scoreDate)
            : score.scoreDate instanceof Date
              ? score.scoreDate
              : new Date(),
        createdAt:
          typeof score.createdAt === "string"
            ? new Date(score.createdAt)
            : score.createdAt instanceof Date
              ? score.createdAt
              : new Date(),
        updatedAt:
          typeof score.updatedAt === "string"
            ? new Date(score.updatedAt)
            : score.updatedAt instanceof Date
              ? score.updatedAt
              : null,
      }),
    );

    const reduced: Record<string, Score[]> = (processedScores ?? []).reduce<
      Record<string, Score[]>
    >((acc: Record<string, Score[]>, score: Score) => {
      if (!acc[score.wodId]) {
        acc[score.wodId] = [];
      }
      acc[score.wodId].push(score);
      acc[score.wodId].sort(
        (a, b) => b.scoreDate.getTime() - a.scoreDate.getTime(),
      );
      return acc;
    }, {});
    return reduced;
  }, [scoresData]);

  // Category and tag order
  const categoryOrder = useMemo<string[]>(() => {
    if (!wods) return [];
    const categories = new Set<WodCategory>(
      wods
        .map((wod) => wod.category)
        .filter(
          (cat): cat is WodCategory =>
            typeof cat === "string" && cat.length > 0,
        ),
    );
    return Array.from(categories).sort();
  }, [wods]);

  const tagOrder = useMemo<string[]>(() => {
    if (!wods) return [];
    const tags = new Set<string>(
      wods.flatMap((wod) =>
        Array.isArray(wod.tags)
          ? wod.tags.filter(
              (t): t is string => typeof t === "string" && t.length > 0,
            )
          : [],
      ),
    );
    return Array.from(tags).sort();
  }, [wods]);

  // Original total count (before any filtering)
  const originalTotalWodCount = useMemo(() => wods.length, [wods]);

  // Client-side search logic removed - handled by backend now.

  const validSelectedCategories = useMemo(() => {
    return selectedCategories.length > 0 &&
      categoryOrder.includes(selectedCategories[0])
      ? selectedCategories
      : [];
  }, [selectedCategories, categoryOrder]);

  const validSelectedTags = useMemo(() => {
    return selectedTags.filter((tag) => tagOrder.includes(tag));
  }, [selectedTags, tagOrder]);

  // Update this filter to use 'wods' directly instead of 'searchedWods'
  const categoryTagFilteredWods = useMemo(() => {
    const filtered = wods.filter((wod) => {
      const categoryMatch =
        validSelectedCategories.length === 0 ||
        (wod.category && validSelectedCategories.includes(wod.category));
      // Ensure tags is always a string array
      const tags: string[] = Array.isArray(wod.tags)
        ? wod.tags.filter((t): t is string => typeof t === "string")
        : [];
      const tagMatch =
        validSelectedTags.length === 0 ||
        tags.some((tag) => validSelectedTags.includes(tag));
      return categoryMatch && tagMatch;
    });

    console.log("[DEBUG] Category/Tag filtering:", {
      inputLength: wods.length,
      outputLength: filtered.length,
      validSelectedCategories,
      validSelectedTags,
      searchTerm,
    });

    return filtered;
  }, [wods, validSelectedCategories, validSelectedTags, searchTerm]);

  // Completion filter
  const finalFilteredWods = useMemo<Wod[]>(() => {
    let result: Wod[];
    if (completionFilter === "done") {
      result = categoryTagFilteredWods.filter((wod) =>
        isWodDone(wod, scoresByWodId[wod.id]),
      );
    } else if (completionFilter === "notDone") {
      result = categoryTagFilteredWods.filter(
        (wod) => !isWodDone(wod, scoresByWodId[wod.id]),
      );
    } else {
      result = categoryTagFilteredWods;
    }

    console.log("[DEBUG] Completion filtering:", {
      inputLength: categoryTagFilteredWods.length,
      outputLength: result.length,
      completionFilter,
      searchTerm,
    });

    return result;
  }, [categoryTagFilteredWods, completionFilter, scoresByWodId, searchTerm]);

  // Category counts based on filtered wods
  const categoryCounts = useMemo<Record<string, number>>(() => {
    return categoryTagFilteredWods.reduce<Record<string, number>>(
      (acc: Record<string, number>, wod: Wod) => {
        if (wod.category) {
          acc[wod.category] = (acc[wod.category] || 0) + 1;
        }
        return acc;
      },
      {},
    );
  }, [categoryTagFilteredWods]);

  // Counts
  const {
    dynamicTotalWodCount,
    dynamicDoneWodsCount,
    dynamicNotDoneWodsCount,
  } = useMemo(() => {
    const total = categoryTagFilteredWods.length;
    const done = categoryTagFilteredWods.filter((wod) =>
      isWodDone(wod, scoresByWodId[wod.id]),
    ).length;
    return {
      dynamicTotalWodCount: total,
      dynamicDoneWodsCount: done,
      dynamicNotDoneWodsCount: total - done,
    };
  }, [categoryTagFilteredWods, scoresByWodId]);

  // Sorting
  const sortedWods = useMemo<Wod[]>(() => {
    const sorted = sortWods(
      finalFilteredWods,
      sortBy,
      sortDirection,
      scoresByWodId,
    );

    console.log("[DEBUG] Final sorting:", {
      inputLength: finalFilteredWods.length,
      outputLength: sorted.length,
      sortBy,
      sortDirection,
      searchTerm,
    });

    // Log the first few WODs to see what's in the final result
    if (sorted.length > 0) {
      console.log(
        "[DEBUG] First few sorted WODs:",
        sorted.slice(0, Math.min(3, sorted.length)).map((wod) => ({
          id: wod.id,
          name: wod.wodName,
          category: wod.category,
          tags: wod.tags,
        })),
      );
    } else {
      console.log("[DEBUG] No WODs in final sorted result");
    }

    return sorted;
  }, [finalFilteredWods, sortBy, sortDirection, scoresByWodId, searchTerm]);

  // Final debug log before returning
  console.log("[DEBUG] useWodViewerData final state:", {
    wodsLength: wods.length,
    categoryTagFilteredWodsLength: categoryTagFilteredWods.length,
    finalFilteredWodsLength: finalFilteredWods.length,
    sortedWodsLength: sortedWods.length,
    searchTerm,
    timestamp: new Date().toISOString(),
  });

  return {
    wods,
    scoresByWodId,
    categoryOrder,
    tagOrder,
    categoryCounts,
    originalTotalWodCount,
    validSelectedCategories,
    validSelectedTags,
    dynamicTotalWodCount,
    dynamicDoneWodsCount,
    dynamicNotDoneWodsCount,
    sortedWods,
    // searchedWods, // Removed
    finalFilteredWods,
  };
}
