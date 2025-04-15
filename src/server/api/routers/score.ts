import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { scores } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
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

const updateScoreSchema = z.object({
  id: z.string().uuid(),
  wodId: z.string().uuid().optional(),
  scoreDate: z.date().optional(),
  isRx: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  time_seconds: z.number().int().nullable().optional(),
  reps: z.number().int().nullable().optional(),
  load: z.number().int().nullable().optional(),
  rounds_completed: z.number().int().nullable().optional(),
  partial_reps: z.number().int().nullable().optional(),
});

type UpdateScoreData = {
  wodId?: string;
  scoreDate?: Date;
  is_rx?: boolean;
  notes?: string | null;
  time_seconds?: number | null;
  reps?: number | null;
  load?: number | null;
  rounds_completed?: number | null;
  partial_reps?: number | null;
};

export const scoreRouter = createTRPCRouter({
  /**
   * Fetches all scores logged by the current user.
   */
  getAllByUser: protectedProcedure.query(async ({ ctx }) => {
    // Fetch scores for the currently logged-in user
    const userScores = await ctx.db.query.scores.findMany({
      where: eq(scores.userId, ctx.session.user.id),
      orderBy: (scores, { desc }) => [desc(scores.scoreDate)], // Order by date descending
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
        await ctx.db.insert(scores).values(scoresToInsert);

        console.log(
          `Successfully inserted ${input.length} scores for user ${userId}`,
        );

        return { success: true, count: input.length };
      } catch (error) {
        console.error("Failed to import scores:", error);
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

  /**
   * Logs a single score for the current user.
   */
  logScore: protectedProcedure
    .input(scoreImportSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Prepare data for insertion, mapping frontend fields to DB schema
      const scoreToInsert = {
        userId: userId,
        wodId: input.wodId,
        scoreDate: input.scoreDate,
        is_rx: input.isRx,
        notes: input.notes,
        time_seconds: input.time_seconds ?? null,
        reps: input.reps ?? null,
        load: input.load ?? null,
        rounds_completed: input.rounds_completed ?? null,
        partial_reps: input.partial_reps ?? null,
      };

      try {
        const [insertedScore] = await ctx.db
          .insert(scores)
          .values(scoreToInsert)
          .returning();

        if (!insertedScore) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to insert score.",
          });
        }

        // Map snake_case is_rx to camelCase isRx for return value
        return {
          ...insertedScore,
          isRx: insertedScore.is_rx,
        };
      } catch (error) {
        console.error("Failed to log score:", error);
        if (error instanceof Error) {
          console.error("Error details:", error.message);
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to log score due to a database error.",
          cause: error,
        });
      }
    }),

  /**
   * Deletes a score by id for the current user.
   */
  deleteScore: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      // Check that the score exists and belongs to the user
      const [scoreToDelete] = await ctx.db
        .select()
        .from(scores)
        .where(and(eq(scores.id, input.id), eq(scores.userId, userId)));

      if (!scoreToDelete) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Score not found or does not belong to user.",
        });
      }

      try {
        await ctx.db.delete(scores).where(eq(scores.id, input.id));
        return { success: true };
      } catch (error) {
        console.error("Failed to delete score:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete score due to a database error.",
          cause: error,
        });
      }
    }),

  /**
   * Updates a score by id for the current user.
   */
  updateScore: protectedProcedure
    .input(updateScoreSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      // Check that the score exists and belongs to the user
      const [scoreToUpdate] = await ctx.db
        .select()
        .from(scores)
        .where(and(eq(scores.id, input.id), eq(scores.userId, userId)));

      if (!scoreToUpdate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Score not found or does not belong to user.",
        });
      }

      // Prepare update object, only include fields that are defined
      const updateData: UpdateScoreData = {};
      if (input.wodId !== undefined) updateData.wodId = input.wodId;
      if (input.scoreDate !== undefined) updateData.scoreDate = input.scoreDate;
      if (input.isRx !== undefined) updateData.is_rx = input.isRx;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.time_seconds !== undefined)
        updateData.time_seconds = input.time_seconds;
      if (input.reps !== undefined) updateData.reps = input.reps;
      if (input.load !== undefined) updateData.load = input.load;
      if (input.rounds_completed !== undefined)
        updateData.rounds_completed = input.rounds_completed;
      if (input.partial_reps !== undefined)
        updateData.partial_reps = input.partial_reps;

      try {
        const [updatedScore] = await ctx.db
          .update(scores)
          .set(updateData)
          .where(eq(scores.id, input.id))
          .returning();

        if (!updatedScore) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update score.",
          });
        }

        return {
          ...updatedScore,
          isRx: updatedScore.is_rx,
        };
      } catch (error) {
        console.error("Failed to update score:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update score due to a database error.",
          cause: error,
        });
      }
    }),
});
