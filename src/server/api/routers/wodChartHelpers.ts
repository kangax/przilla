import { asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { wods, wodMovements, movements, scores } from "~/server/db/schema";
import type {
  Benchmarks,
  Score,
  Wod,
  MonthlyScoreDetail,
  Score as ScoreType, // Rename imported Score to avoid conflict
} from "~/types/wodTypes";
import { difficultyMultipliers, DEFAULT_MULTIPLIER } from "~/config/constants";
import { isWodDone, getPerformanceLevel } from "~/utils/wodUtils"; // Import getPerformanceLevel
import {
  type WodWithMatches,
  WOD_CATEGORIES,
  WodCategorySchema,
} from "~/types/wodTypes";
import { protectedProcedure } from "~/server/api/trpc";
import { validateWodsFromDb } from "~/utils/wodValidation";

/**
 * Helper to aggregate movement frequencies for a set of WOD IDs.
 */
import { type db as drizzleDb } from "~/server/db/index";
type DBContext = { db: typeof drizzleDb };

export async function getMovementsForWods(
  ctx: DBContext,
  wodIds: string[],
): Promise<Record<string, { count: number; wodNames: string[] }>> {
  if (wodIds.length === 0) return {};
  const rows = await ctx.db
    .select({
      wodId: wodMovements.wodId,
      movementName: movements.name,
      wodName: wods.wodName,
    })
    .from(wodMovements)
    .leftJoin(movements, eq(wodMovements.movementId, movements.id))
    .leftJoin(wods, eq(wodMovements.wodId, wods.id))
    .where(inArray(wodMovements.wodId, wodIds));

  const movementCounts: Record<string, { count: number; wodNames: string[] }> =
    {};
  for (const row of rows) {
    if (!row.movementName || !row.wodName) continue;
    if (!movementCounts[row.movementName]) {
      movementCounts[row.movementName] = { count: 0, wodNames: [] };
    }
    movementCounts[row.movementName].count += 1;
    movementCounts[row.movementName].wodNames.push(row.wodName);
  }
  return movementCounts;
}

/**
 * Helper to aggregate movement frequencies by category.
 */
export async function getMovementCountsByCategory(
  ctx: DBContext,
  allWods: Wod[],
): Promise<
  Record<string, Record<string, { count: number; wodNames: string[] }>>
> {
  const movementCountsByCategory: Record<
    string,
    Record<string, { count: number; wodNames: string[] }>
  > = {};
  const wodsByCategory: Record<string, string[]> = {};
  allWods.forEach((wod) => {
    if (!wod.category) return;
    const categoryCheck = WodCategorySchema.safeParse(wod.category);
    if (categoryCheck.success) {
      const validCategory = categoryCheck.data;
      if (!wodsByCategory[validCategory]) wodsByCategory[validCategory] = [];
      wodsByCategory[validCategory].push(wod.id);
    }
  });
  for (const [category, wodIds] of Object.entries(wodsByCategory)) {
    movementCountsByCategory[category] = await getMovementsForWods(ctx, wodIds);
  }
  return movementCountsByCategory;
}

/**
 * Helper to process tag and category counts for completed WODs.
 */
export function processTagAndCategoryCounts(
  allWods: Wod[],
  scoresByWodId: Record<string, Score[]>,
): {
  tagCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
} {
  const tagCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};

  allWods.forEach((wod) => {
    const tagsInput = wod.tags || "[]";
    let parsedTags: string[] = [];
    if (typeof tagsInput === "string") {
      try {
        parsedTags = JSON.parse(tagsInput) as string[];
      } catch (error) {
        console.error(
          `Failed to parse tags JSON for WOD ${wod.id} (${wod.wodName}):`,
          error,
        );
      }
    } else if (Array.isArray(tagsInput)) {
      parsedTags = tagsInput;
    }

    // Use the full Wod object directly for isWodDone
    const isDone = isWodDone(wod, scoresByWodId[wod.id]);

    if (isDone) {
      if (wod.category) {
        const categoryCheck = WodCategorySchema.safeParse(wod.category);
        if (categoryCheck.success) {
          categoryCounts[categoryCheck.data] =
            (categoryCounts[categoryCheck.data] || 0) + 1;
        }
      }
      parsedTags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  return { tagCounts, categoryCounts };
}

/**
 * Helper to calculate monthly score data for timeline chart.
 */
type UserScoreWithWodData = {
  scoreId: string;
  userId: string;
  wodId: string;
  time_seconds: number | null;
  reps: number | null;
  load: number | null;
  rounds_completed: number | null;
  partial_reps: number | null;
  is_rx: boolean | null;
  scoreDate: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  wodName: string;
  difficulty: string | null;
  benchmarks: string | Benchmarks | null;
};

export function calculateMonthlyData(
  userScoresWithWodData: UserScoreWithWodData[],
): Record<
  string,
  {
    count: number;
    totalAdjustedLevelScore: number;
    scores: MonthlyScoreDetail[];
  }
> {
  const monthlyData: Record<
    string,
    {
      count: number;
      totalAdjustedLevelScore: number;
      scores: MonthlyScoreDetail[];
    }
  > = {};

  userScoresWithWodData.forEach((data) => {
    const wodName = data.wodName;
    const difficulty = data.difficulty;
    const benchmarksInput = data.benchmarks;

    if (!wodName || !benchmarksInput) {
      console.warn(
        `Skipping score ID ${data.scoreId} due to missing WOD name or benchmarks.`,
      );
      return;
    }

    const monthKey = data.scoreDate.toISOString().slice(0, 7);
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        count: 0,
        totalAdjustedLevelScore: 0,
        scores: [],
      };
    }
    monthlyData[monthKey].count++;

    let benchmarks: Benchmarks | null = null;
    if (typeof benchmarksInput === "string") {
      try {
        benchmarks = JSON.parse(benchmarksInput || "{}") as Benchmarks;
      } catch (error) {
        console.error(
          `Failed to parse benchmarks JSON in getChartData for score ${data.scoreId}:`,
          error,
        );
      }
    } else if (benchmarksInput && typeof benchmarksInput === "object") {
      benchmarks = benchmarksInput;
    }

    if (!benchmarks) {
      console.warn(
        `Skipping level calculation for score ${data.scoreId} due to missing or invalid benchmarks data.`,
      );
    }

    // --- Start: Replace levelScore calculation with getPerformanceLevel ---
    // Create temporary Wod and Score objects compatible with getPerformanceLevel
    const tempWod: Wod = {
      id: data.wodId,
      wodName: data.wodName,
      description: "", // Not needed for level calculation
      benchmarks: benchmarks, // Use the parsed benchmarks
      category: null, // Not needed
      tags: null, // Not needed
      difficulty: data.difficulty,
      difficultyExplanation: null, // Not needed
      countLikes: null, // Not needed
      wodUrl: null, // Not needed
      timecap: null, // Not needed
      movements: [], // Not needed
      // Add dummy values to satisfy the Wod type
      createdAt: new Date(),
      updatedAt: null,
    };
    const tempScore: ScoreType = {
      id: data.scoreId,
      userId: data.userId,
      wodId: data.wodId,
      time_seconds: data.time_seconds,
      reps: data.reps,
      load: data.load,
      rounds_completed: data.rounds_completed,
      partial_reps: data.partial_reps,
      isRx: data.is_rx ?? false,
      scoreDate: data.scoreDate,
      notes: data.notes,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    const performanceLevelString = getPerformanceLevel(tempWod, tempScore);

    // Map string level to numeric score (1-4)
    const performanceLevelMap: Record<string, number> = {
      elite: 4,
      advanced: 3,
      intermediate: 2,
      beginner: 1,
    };
    // Default to 1 (Beginner) if level is null or unrecognized
    const levelScore = performanceLevelString
      ? (performanceLevelMap[performanceLevelString] ?? 1)
      : 1;
    // --- End: Replace levelScore calculation ---

    const difficultyMultiplier = difficulty
      ? (difficultyMultipliers[difficulty] ?? DEFAULT_MULTIPLIER)
      : DEFAULT_MULTIPLIER;
    const adjustedLevel = levelScore * difficultyMultiplier;

    monthlyData[monthKey].totalAdjustedLevelScore += adjustedLevel;
    monthlyData[monthKey].scores.push({
      wodName: wodName,
      level: levelScore,
      difficulty: difficulty,
      difficultyMultiplier: difficultyMultiplier,
      adjustedLevel: adjustedLevel,
      time_seconds: data.time_seconds,
      reps: data.reps,
      load: data.load,
      rounds_completed: data.rounds_completed,
      partial_reps: data.partial_reps,
      is_rx: data.is_rx,
    });
  });

  return monthlyData;
}

type ChartDataContext = {
  db: typeof drizzleDb;
  session: { user: { id: string } };
};

export const getChartData = async ({ ctx }: { ctx: ChartDataContext }) => {
  // Get all WODs (still needed for tag/category counts of *all* WODs)
  const allWods = await ctx.db.select().from(wods).orderBy(asc(wods.wodName));

  // Get user's scores JOINED with WOD data (name, difficulty, benchmarks)
  const userScoresWithWodData: UserScoreWithWodData[] = await ctx.db
    .select({
      scoreId: scores.id,
      userId: scores.userId,
      wodId: scores.wodId,
      time_seconds: scores.time_seconds,
      reps: scores.reps,
      load: scores.load,
      rounds_completed: scores.rounds_completed,
      partial_reps: scores.partial_reps,
      is_rx: scores.is_rx,
      scoreDate: scores.scoreDate,
      notes: scores.notes,
      createdAt: scores.createdAt,
      updatedAt: scores.updatedAt,
      wodName: wods.wodName,
      difficulty: wods.difficulty,
      benchmarks: wods.benchmarks,
    })
    .from(scores)
    .leftJoin(wods, eq(scores.wodId, wods.id))
    .where(eq(scores.userId, ctx.session.user.id));

  // Organize scores by WOD ID for isWodDone check
  const scoresByWodId = userScoresWithWodData.reduce<Record<string, Score[]>>(
    (acc, data) => {
      const score: Score = {
        id: data.scoreId,
        userId: data.userId,
        wodId: data.wodId,
        time_seconds: data.time_seconds,
        reps: data.reps,
        load: data.load,
        rounds_completed: data.rounds_completed,
        partial_reps: data.partial_reps,
        isRx: data.is_rx ?? false, // Ensure boolean
        scoreDate: data.scoreDate,
        notes: data.notes,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
      const wodId = data.wodId;
      if (!wodId) return acc;

      if (!acc[wodId]) {
        acc[wodId] = [];
      }
      acc[wodId].push(score);
      return acc;
    },
    {},
  );

  // Use validated Wods for all analytics/aggregation helpers
  // (validatedWods is guaranteed to be Wod[] by Zod schema)
  // Reuse the same validation logic as in getAll
  const movementsByWod: Record<string, string[]> = {};
  // (rebuild movementsByWod as in getAll if needed)
  const validatedWods = validateWodsFromDb(allWods, movementsByWod);

  const { tagCounts, categoryCounts } = processTagAndCategoryCounts(
    validatedWods,
    scoresByWodId,
  );

  const monthlyData = calculateMonthlyData(userScoresWithWodData);

  const userWodIds = Array.from(
    new Set(userScoresWithWodData.map((data) => data.wodId).filter(Boolean)),
  );
  const yourMovementCounts = await getMovementsForWods(ctx, userWodIds);

  const allWodIds = validatedWods.map((wod) => wod.id);
  const allMovementCounts = await getMovementsForWods(ctx, allWodIds);

  const movementCountsByCategory = await getMovementCountsByCategory(
    ctx,
    validatedWods,
  );

  return {
    tagCounts,
    categoryCounts,
    monthlyData,
    yourMovementCounts,
    allMovementCounts,
    movementCountsByCategory,
  };
};
