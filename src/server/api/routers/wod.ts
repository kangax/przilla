import { asc } from "drizzle-orm";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { wods } from "~/server/db/schema";

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

    // Map snake_case fields from DB to camelCase fields for the frontend Wod type
    // Remove explicit return type :Wod - rely on inference + SuperJSON
    return allWodsData.map((wod) => ({
      id: wod.id,
      wodUrl: wod.wodUrl, // Already camelCase in schema definition, but good to be explicit
      wodName: wod.wodName, // Already camelCase in schema definition
      description: wod.description,
      benchmarks: wod.benchmarks, // Drizzle handles JSON parsing via $type
      category: wod.category,
      tags: wod.tags, // Drizzle handles JSON parsing via $type
      difficulty: wod.difficulty,
      difficultyExplanation: wod.difficultyExplanation, // Map snake_case
      countLikes: wod.countLikes, // Map snake_case
      createdAt: wod.createdAt, // Map snake_case (Drizzle returns Date object)
      updatedAt: wod.updatedAt, // Map snake_case (Drizzle returns Date object or null)
      // Explicitly DO NOT include 'results' here
    }));
  }),

  // Future procedures can be added here, e.g., getById, create, update, delete
});
