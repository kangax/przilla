import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { scores } from "~/server/db/schema";
import { eq } from "drizzle-orm";

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

  // Placeholder for future procedures
  // create: protectedProcedure
  //   .input(z.object({ /* Define input schema based on separate columns */ }))
  //   .mutation(async ({ ctx, input }) => {
  //     // ... implementation to insert into scores table using separate columns
  //   }),
});
