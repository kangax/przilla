import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { scores } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Define the schema for a single score object in the import array
const scoreImportSchema = z.object({
  wodId: z.string().uuid(), // Expecting UUID from the frontend matching process
  scoreDate: z.date(), // Expecting Date object from frontend
  isRx: z.boolean().default(false),
  notes: z.string().nullable().optional(),
  // Score components - allow null as not all scores have all components
  time_seconds: z.number().int().nullable().optional(),
  reps: z.number().int().nullable().optional(),
  load: z.number().int().nullable().optional(),
  rounds_completed: z.number().int().nullable().optional(),
  partial_reps: z.number().int().nullable().optional(),
});

// Define the input schema for the importScores mutation
const importScoresInputSchema = z.array(scoreImportSchema);

export const scoreRouter = createTRPCRouter({
  /**
   * Fetches all scores logged by the current user.
   */
  getAllByUser: protectedProcedure.query(async ({ ctx }) => {
    // Fetch scores for the currently logged-in user
    const userScores = await ctx.db.query.scores.findMany({
      where: eq(scores.userId, ctx.session.user.id),
      orderBy: (scores, { desc }) => [desc(scores.scoreDate)], // Order by date descending
      // We fetch all score component columns by default
      // Optionally join with WODs if needed later, but fetching WODs separately might be cleaner
      // with: {
      //   wod: {
      //     columns: {
      //       wodName: true, // Example: only fetch wodName
      //     },
      //   },
      // Explicitly select columns to ensure is_rx is included and map to camelCase
      columns: {
        id: true,
        userId: true,
        wodId: true,
        time_seconds: true,
        reps: true,
        load: true,
        rounds_completed: true,
        partial_reps: true,
        scoreDate: true,
        notes: true,
        is_rx: true, // Select the snake_case column
        createdAt: true,
        updatedAt: true,
      },
    });

    // Map snake_case is_rx to camelCase isRx
    const mappedScores = userScores.map((score) => ({
      ...score,
      isRx: score.is_rx, // Map to camelCase
    }));

    return mappedScores;
  }),

  /**
   * Imports an array of scores for the current user.
   */
  importScores: protectedProcedure
    .input(importScoresInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      if (!input || input.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No scores provided for import.",
        });
      }

      // Prepare data for insertion, mapping frontend fields to DB schema
      const scoresToInsert = input.map((score) => ({
        userId: userId,
        wodId: score.wodId,
        scoreDate: score.scoreDate, // Drizzle expects Date object for timestamp mode
        is_rx: score.isRx, // Map boolean to integer/boolean for DB
        notes: score.notes,
        // Include score components, defaulting to null if not provided
        time_seconds: score.time_seconds ?? null,
        reps: score.reps ?? null,
        load: score.load ?? null,
        rounds_completed: score.rounds_completed ?? null,
        partial_reps: score.partial_reps ?? null,
        // id, createdAt, updatedAt will be handled by the DB/Drizzle
      }));

      try {
        // Perform bulk insert
        const result = await ctx.db.insert(scores).values(scoresToInsert);

        // Drizzle's SQLite driver might return limited info on bulk insert success.
        // We'll assume success if no error is thrown.
        // Check result properties if available and needed for more specific feedback.
        console.log(
          `Successfully inserted ${input.length} scores for user ${userId}`,
        );

        return { success: true, count: input.length };
      } catch (error) {
        console.error("Failed to import scores:", error);
        // Log the specific error for debugging
        if (error instanceof Error) {
          console.error("Error details:", error.message);
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to import scores due to a database error.",
          cause: error,
        });
      }
    }),

  // Placeholder for future procedures
  // create: protectedProcedure
  //   .input(z.object({ /* Define input schema based on separate columns */ }))
  //   .mutation(async ({ ctx, input }) => {
  //     // ... implementation to insert into scores table using separate columns
  //   }),
});
