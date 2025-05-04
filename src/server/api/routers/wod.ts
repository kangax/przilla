import { asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { wods, scores } from "~/server/db/schema";
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
    .query(async ({ ctx, input }): Promise<WodWithMatches[]> => { // Explicit return type
      // Import movement tables dynamically to avoid circular deps
      const { wodMovements, movements } = await import("~/server/db/schema");

      // 1. Fetch all WODs
      const allWodsData = await ctx.db
        .select()
        .from(wods)
        .orderBy(asc(wods.wodName));

      // 2. Fetch all movements for all WODs
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
        // Aggregate by WOD ID
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

      // 3. Reduce WODs: Parse JSON, Validate with Zod, Filter invalid, and Attach movements
      const validatedWods = validateWodsFromDb(allWodsData, movementsByWod);

      // 4. Apply search filtering if searchQuery is provided
      if (input.searchQuery) {
        // Add server-side debugging
        console.log("[SERVER DEBUG] Search query:", {
          searchQuery: input.searchQuery,
          wodsCount: validatedWods.length
        });
        
        // Ensure the search query is properly decoded
        const decodedQuery = decodeURIComponent(input.searchQuery);
        
        // Add more debugging
        console.log("[SERVER DEBUG] Decoded search query:", {
          originalQuery: input.searchQuery,
          decodedQuery,
          areEqual: input.searchQuery === decodedQuery
        });
        
        // Use the decoded query for search
        const results = fuzzySearchWods(validatedWods, decodedQuery);
        
        // Log the results
        console.log("[SERVER DEBUG] Search results:", {
          resultsCount: results.length,
          firstFewResults: results.slice(0, 3).map(r => r.wodName)
        });
        
        return results;
      }

      // 5. Return all validated WODs if no search query (cast to WodWithMatches[] with undefined matches)
      return validatedWods.map((wod): WodWithMatches => ({ ...wod, matches: undefined }));
    }), // End of getAll query

  /**
   * Fetches aggregated chart data for WOD distribution by tags and categories,
   * and monthly performance data including individual score breakdowns with adjusted levels.
   */
  getChartData: protectedProcedure.query(async ({ ctx }): Promise<WodChartDataResponse> => getChartData({ ctx })), // Moved to wodChartHelpers.ts
}); // End of wodRouter
