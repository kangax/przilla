import { z } from "zod";
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
      // },
    });
    // The result will include time_seconds, reps, load, rounds_completed, partial_reps, etc.
    return userScores;
  }),

  // Placeholder for future procedures
  // create: protectedProcedure
  //   .input(z.object({ /* Define input schema based on separate columns */ }))
  //   .mutation(async ({ ctx, input }) => {
  //     // ... implementation to insert into scores table using separate columns
  //   }),
});
