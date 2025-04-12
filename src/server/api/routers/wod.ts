import { asc, eq, and } from "drizzle-orm";
import { type SQL } from "drizzle-orm";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { wods, scores } from "~/server/db/schema";
import { type Wod, type Score } from "~/types/wodTypes";
import { isWodDone } from "~/utils/wodUtils";

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
   * Fetches aggregated chart data for WOD distribution by tags and categories
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

    // Process WODs to count tags and categories
    const tagCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    allWods.forEach((wod) => {
      const parsedTags = Array.isArray(wod.tags)
        ? wod.tags
        : JSON.parse(wod.tags || "[]");
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

    // Calculate monthly score data for timeline chart
    const monthlyData: Record<
      string,
      { count: number; totalLevelScore: number }
    > = {};

    userScores.forEach((score) => {
      const monthKey = score.scoreDate.toISOString().slice(0, 7); // YYYY-MM format
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, totalLevelScore: 0 };
      }
      monthlyData[monthKey].count++;

      // Calculate performance level score based on benchmarks
      const wod = allWods.find((w) => w.id === score.wodId);
      if (wod?.benchmarks) {
        const benchmarks =
          typeof wod.benchmarks === "string"
            ? JSON.parse(wod.benchmarks)
            : wod.benchmarks;

        // Get numeric score value (time in seconds, reps, etc.)
        const scoreValue = score.time_seconds || score.reps || 0;

        // Calculate performance level (0-4 scale)
        let levelScore = 0;
        if (benchmarks.levels) {
          if (scoreValue <= (benchmarks.levels.elite?.max || Infinity)) {
            levelScore = 4; // Elite
          } else if (
            scoreValue <= (benchmarks.levels.advanced?.max || Infinity)
          ) {
            levelScore = 3; // Advanced
          } else if (
            scoreValue <= (benchmarks.levels.intermediate?.max || Infinity)
          ) {
            levelScore = 2; // Intermediate
          } else {
            levelScore = 1; // Beginner
          }
        }

        // Bonus for Rx
        if (score.is_rx) {
          levelScore = Math.min(levelScore + 0.5, 4);
        }
        monthlyData[monthKey].totalLevelScore += levelScore;
      }
    });

    return {
      tagCounts,
      categoryCounts,
      monthlyData,
    };
  }),
});
