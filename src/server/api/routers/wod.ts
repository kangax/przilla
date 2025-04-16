import { asc, eq } from "drizzle-orm";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { wods, scores } from "~/server/db/schema";
import { type Wod, type Score, type Benchmarks } from "~/types/wodTypes";
import { isWodDone } from "~/utils/wodUtils";

// Define the structure for individual scores in the chart data
type MonthlyScoreDetail = {
  wodName: string;
  level: number; // The calculated level (0-4) for this score
};

export const wodRouter = createTRPCRouter({
  /**
   * Fetches all WODs from the database, ordered alphabetically by name,
   * and maps database fields (snake_case) to frontend type fields (camelCase).
   */
  getAll: publicProcedure.query(async ({ ctx }) => {
    const allWodsData = await ctx.db
      .select()
      .from(wods)
      .orderBy(asc(wods.wodName));

    return allWodsData.map((wod) => ({
      id: wod.id,
      wodUrl: wod.wodUrl,
      wodName: wod.wodName,
      description: wod.description,
      benchmarks: wod.benchmarks,
      category: wod.category,
      tags: wod.tags,
      difficulty: wod.difficulty,
      difficultyExplanation: wod.difficultyExplanation,
      countLikes: wod.countLikes,
      createdAt: wod.createdAt,
      updatedAt: wod.updatedAt,
    }));
  }),

  /**
   * Fetches aggregated chart data for WOD distribution by tags and categories,
   * and monthly performance data including individual score breakdowns.
   */
  getChartData: protectedProcedure.query(async ({ ctx }) => {
    // Get all WODs
    const allWods = await ctx.db.select().from(wods).orderBy(asc(wods.wodName));

    // Get user's scores
    const userScores = await ctx.db
      .select()
      .from(scores)
      .where(eq(scores.userId, ctx.session.user.id));

    // Organize scores by WOD ID and map to Score type
    const scoresByWodId = userScores.reduce<Record<string, Score[]>>(
      (acc, score) => {
        if (!acc[score.wodId]) {
          acc[score.wodId] = [];
        }
        acc[score.wodId].push({
          ...score,
          isRx: score.is_rx,
          scoreDate: score.scoreDate,
          createdAt: score.createdAt,
          updatedAt: score.updatedAt,
        });
        return acc;
      },
      {},
    );

    // Process WODs to count tags and categories for completed WODs
    const tagCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    allWods.forEach((wod) => {
      const tagsInput = wod.tags || "[]";
      const parsedTags: string[] = Array.isArray(tagsInput)
        ? tagsInput
        : (JSON.parse(tagsInput) as string[]);
      const isDone = isWodDone(wod as Wod, scoresByWodId[wod.id]);

      if (isDone) {
        // Count categories
        if (wod.category) {
          categoryCounts[wod.category] =
            (categoryCounts[wod.category] || 0) + 1;
        }

        // Count tags
        parsedTags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    // Calculate monthly score data for timeline chart, including score details
    const monthlyData: Record<
      string,
      { count: number; totalLevelScore: number; scores: MonthlyScoreDetail[] } // Updated structure
    > = {};

    userScores.forEach((score) => {
      const monthKey = score.scoreDate.toISOString().slice(0, 7); // YYYY-MM format
      if (!monthlyData[monthKey]) {
        // Initialize with the new structure including the scores array
        monthlyData[monthKey] = { count: 0, totalLevelScore: 0, scores: [] };
      }
      monthlyData[monthKey].count++;

      // Calculate performance level score based on benchmarks
      const wod = allWods.find((w) => w.id === score.wodId);
      if (wod?.benchmarks && wod.wodName) {
        // Ensure wod and wodName exist
        const benchmarksInput = wod.benchmarks || "{}";
        const benchmarks: Benchmarks =
          typeof benchmarksInput === "string"
            ? (JSON.parse(benchmarksInput) as Benchmarks)
            : benchmarksInput;

        // Get numeric score value (time in seconds, reps, etc.)
        const scoreValue = score.time_seconds ?? score.reps ?? 0; // Use nullish coalescing

        // Calculate performance level (0-4 scale)
        let levelScore = 0;
        if (benchmarks.levels) {
          // Handle time-based benchmarks (lower is better)
          if (benchmarks.type === "time") {
            if (scoreValue <= (benchmarks.levels.elite?.max ?? Infinity))
              levelScore = 4;
            else if (
              scoreValue <= (benchmarks.levels.advanced?.max ?? Infinity)
            )
              levelScore = 3;
            else if (
              scoreValue <= (benchmarks.levels.intermediate?.max ?? Infinity)
            )
              levelScore = 2;
            else if (scoreValue >= (benchmarks.levels.beginner?.min ?? 0))
              levelScore = 1;
            // Handle cases where score might be below beginner min (if defined) - treat as beginner
            else if (
              benchmarks.levels.beginner?.min &&
              scoreValue < benchmarks.levels.beginner.min
            )
              levelScore = 1;
          }
          // Handle rep/load-based benchmarks (higher is better)
          else {
            if (scoreValue >= (benchmarks.levels.elite?.min ?? 0))
              levelScore = 4;
            else if (scoreValue >= (benchmarks.levels.advanced?.min ?? 0))
              levelScore = 3;
            else if (scoreValue >= (benchmarks.levels.intermediate?.min ?? 0))
              levelScore = 2;
            else if (
              scoreValue <= (benchmarks.levels.beginner?.max ?? Infinity)
            )
              levelScore = 1;
            // Handle cases where score might be above beginner max (if defined) - treat as beginner
            else if (
              benchmarks.levels.beginner?.max &&
              scoreValue > benchmarks.levels.beginner.max
            )
              levelScore = 1;
          }
        }

        // Bonus for Rx - apply only if not already Elite
        if (score.is_rx && levelScore < 4) {
          levelScore = Math.min(levelScore + 0.5, 4);
        }

        monthlyData[monthKey].totalLevelScore += levelScore;

        // Add the score detail to the scores array for this month
        monthlyData[monthKey].scores.push({
          wodName: wod.wodName,
          level: levelScore,
        });
      }
    });

    return {
      tagCounts,
      categoryCounts,
      monthlyData, // Return the updated structure
    };
  }),
});
