import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { userFavoriteWods } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { getFavoriteWodIdsByUser } from "./favoriteUtils";

export const favoriteRouter = createTRPCRouter({
  add: protectedProcedure
    .input(z.object({ wodId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { wodId } = input;

      try {
        // Check if already favorited to prevent duplicates (optional, db constraint handles it)
        const existingFavorite = await db
          .select()
          .from(userFavoriteWods)
          .where(
            and(
              eq(userFavoriteWods.userId, userId),
              eq(userFavoriteWods.wodId, wodId),
            ),
          )
          .limit(1);

        if (existingFavorite.length > 0) {
          // Already favorited, could return success or a specific message
          return { success: true, message: "WOD already favorited." };
        }

        await db.insert(userFavoriteWods).values({
          userId,
          wodId,
          // createdAt will be handled by the database default (unixepoch())
        });
        return { success: true };
      } catch (error) {
        console.error("Failed to add favorite:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add WOD to favorites.",
        });
      }
    }),

  remove: protectedProcedure
    .input(z.object({ wodId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { wodId } = input;

      try {
        const result = await db
          .delete(userFavoriteWods)
          .where(
            and(
              eq(userFavoriteWods.userId, userId),
              eq(userFavoriteWods.wodId, wodId),
            ),
          );

        if (result.rowsAffected === 0) {
          // Optional: throw an error or return a specific status if the favorite didn't exist
          // For now, just return success as the state is achieved (not favorited)
        }
        return { success: true };
      } catch (error) {
        console.error("Failed to remove favorite:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove WOD from favorites.",
        });
      }
    }),

  getWodIdsByUser: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await getFavoriteWodIdsByUser(ctx);
    } catch (error) {
      console.error("Failed to get favorite WOD IDs:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve favorite WOD IDs.",
      });
    }
  }),
});
