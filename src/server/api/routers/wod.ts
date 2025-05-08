import { asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { wods, scores, userFavoriteWods } from "~/server/db/schema";
import { getFavoriteWodIdsByUser } from "./favoriteUtils";
import {
  type Wod,
  type Score,
  type Benchmarks,
  WodSchema,
  type WodFromQuery,
  type WodWithMatches,
} from "~/types/wodTypes";
import { isWodDone } from "~/utils/wodUtils";
import { fuzzySearchWods } from "~/utils/wodFuzzySearch";
import {
  getMovementsForWods,
  getMovementCountsByCategory,
  processTagAndCategoryCounts,
  calculateMonthlyData,
} from "./wodChartHelpers";
import { getChartData } from "./wodChartHelpers";
import type { WodChartDataResponse } from "~/types/wodTypes";
import { difficultyMultipliers, DEFAULT_MULTIPLIER } from "~/config/constants";
import { validateWodsFromDb } from "~/utils/wodValidation";

export const wodRouter = createTRPCRouter({
  /**
   * Fetches all WODs from the database, optionally filters them based on a search query,
   * orders them alphabetically by name, and maps database fields (snake_case)
   * to frontend type fields (camelCase). Returns WodWithMatches[] to include search match info.
   */
  getAll: publicProcedure
    .input(
      z.object({
        searchQuery: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }): Promise<WodWithMatches[]> => {
      const { wodMovements, movements } = await import("~/server/db/schema");

      let favoriteWodIds: string[] = [];
      if (ctx.session?.user) {
        try {
          favoriteWodIds = await getFavoriteWodIdsByUser(ctx);
        } catch (error) {
          console.error(
            "Failed to fetch favorite WOD IDs in wod.getAll:",
            error,
          );
          // Proceed without favorite info if this fails
        }
      }

      const allWodsData = await ctx.db
        .select()
        .from(wods)
        .orderBy(asc(wods.wodName));

      const allWodIds = allWodsData.map((wod) => wod.id);
      let movementsByWod: Record<string, string[]> = {};
      if (allWodIds.length > 0) {
        const movementRows = await ctx.db
          .select({
            wodId: wodMovements.wodId,
            movementName: movements.name,
          })
          .from(wodMovements)
          .leftJoin(movements, eq(wodMovements.movementId, movements.id))
          .where(inArray(wodMovements.wodId, allWodIds));
        movementsByWod = movementRows.reduce<Record<string, string[]>>(
          (acc, row) => {
            if (!row.wodId || !row.movementName) return acc;
            if (!acc[row.wodId]) acc[row.wodId] = [];
            acc[row.wodId].push(row.movementName);
            return acc;
          },
          {},
        );
      }

      const validatedWods = validateWodsFromDb(allWodsData, movementsByWod);

      const wodsWithFavoriteStatus = validatedWods.map(
        (wod): Wod => ({
          // Ensure Wod type, isFavorited is part of it
          ...wod,
          isFavorited: favoriteWodIds.includes(wod.id),
        }),
      );

      if (input.searchQuery) {
        console.log("[SERVER DEBUG] Search query:", {
          searchQuery: input.searchQuery,
          wodsCount: wodsWithFavoriteStatus.length,
        });
        const decodedQuery = decodeURIComponent(input.searchQuery);
        console.log("[SERVER DEBUG] Decoded search query:", {
          originalQuery: input.searchQuery,
          decodedQuery,
          areEqual: input.searchQuery === decodedQuery,
        });
        // fuzzySearchWods expects Wod[], our wodsWithFavoriteStatus is Wod[]
        const results = fuzzySearchWods(wodsWithFavoriteStatus, decodedQuery);
        console.log("[SERVER DEBUG] Search results:", {
          resultsCount: results.length,
          firstFewResults: results.slice(0, 3).map((r) => r.wodName),
        });
        return results; // fuzzySearchWods already returns WodWithMatches[]
      }

      return wodsWithFavoriteStatus.map(
        (wod): WodWithMatches => ({ ...wod, matches: undefined }),
      );
    }),

  /**
   * Fetches WODs favorited by the current user, with optional filtering.
   */
  getFavoritesByUser: protectedProcedure
    .input(
      z.object({
        searchQuery: z.string().optional(),
        category: z.string().optional(), // Assuming WodCategory type
        tags: z.array(z.string()).optional(), // Assuming WodTag array
      }),
    )
    .query(async ({ ctx, input }): Promise<WodWithMatches[]> => {
      const userId = ctx.session.user.id;
      const { wodMovements, movements } = await import("~/server/db/schema");

      // 1. Fetch IDs of WODs favorited by the user
      const favoriteEntries = await ctx.db
        .select({ wodId: userFavoriteWods.wodId })
        .from(userFavoriteWods)
        .where(eq(userFavoriteWods.userId, userId));

      const favoritedWodIds = favoriteEntries.map((fav) => fav.wodId);

      if (favoritedWodIds.length === 0) {
        return [];
      }

      // 2. Fetch full WOD details for these IDs, applying category/tag filters at DB level
      // Base query
      let query = ctx.db
        .select()
        .from(wods)
        .where(inArray(wods.id, favoritedWodIds))
        .orderBy(asc(wods.wodName))
        .$dynamic(); // Use $dynamic for easier conditional where clauses

      // Apply category filter
      if (input.category) {
        query = query.where(eq(wods.category, input.category));
      }

      // Apply tags filter (Note: tags are stored as JSON string array, e.g., "[\"AMRAP\",\"For Time\"]")
      // This requires a more complex query for JSON containment, or post-fetch filtering.
      // For simplicity with SQLite JSON, we'll filter tags post-fetch for now.
      // If using PostgreSQL, JSONB operators would be more efficient here.

      const favoritedWodsData = await query;

      // 3. Fetch movements for these WODs
      let movementsByWod: Record<string, string[]> = {};
      if (favoritedWodIds.length > 0) {
        // Use favoritedWodIds which are confirmed to be > 0
        const movementRows = await ctx.db
          .select({
            wodId: wodMovements.wodId,
            movementName: movements.name,
          })
          .from(wodMovements)
          .leftJoin(movements, eq(wodMovements.movementId, movements.id))
          .where(inArray(wodMovements.wodId, favoritedWodIds));
        movementsByWod = movementRows.reduce<Record<string, string[]>>(
          (acc, row) => {
            if (!row.wodId || !row.movementName) return acc;
            if (!acc[row.wodId]) acc[row.wodId] = [];
            acc[row.wodId].push(row.movementName);
            return acc;
          },
          {},
        );
      }

      // 4. Validate, attach movements, and set isFavorited = true
      let validatedFavoritedWods = validateWodsFromDb(
        favoritedWodsData,
        movementsByWod,
      );

      // Apply tags filter (post-fetch)
      if (input.tags && input.tags.length > 0) {
        const filterTags = new Set(input.tags);
        validatedFavoritedWods = validatedFavoritedWods.filter((wod) =>
          wod.tags.some((tag) => filterTags.has(tag)),
        );
      }

      // All WODs from this endpoint are favorites
      const wodsWithFavoriteStatus = validatedFavoritedWods.map(
        (wod): Wod => ({
          ...wod,
          isFavorited: true,
        }),
      );

      // 5. Apply search query if provided
      if (input.searchQuery) {
        const decodedQuery = decodeURIComponent(input.searchQuery);
        // fuzzySearchWods expects Wod[], our wodsWithFavoriteStatus is Wod[]
        const results = fuzzySearchWods(wodsWithFavoriteStatus, decodedQuery);
        return results; // fuzzySearchWods returns WodWithMatches[]
      }

      // 6. Return all favorited WODs (cast to WodWithMatches[] with undefined matches)
      return wodsWithFavoriteStatus.map(
        (wod): WodWithMatches => ({ ...wod, matches: undefined }),
      );
    }),

  /**
   * Fetches aggregated chart data for WOD distribution by tags and categories,
   * and monthly performance data including individual score breakdowns with adjusted levels.
   */
  getChartData: protectedProcedure.query(
    async ({ ctx }): Promise<WodChartDataResponse> => getChartData({ ctx }),
  ), // Moved to wodChartHelpers.ts
}); // End of wodRouter
