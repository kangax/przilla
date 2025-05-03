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

 
// Zod schema to parse/transform raw DB row into Wod
const WodFromDbRowSchema = z.object({
  id: z.string().min(1).catch("unknown_id"),
  wodUrl: z.string().default(""),
  wodName: z.string().min(1).catch("Unknown WOD"),
  description: z.string().nullable().optional(),
  benchmarks: z
    .any()
    .transform(val => {
      if (typeof val === "string") {
        try { return JSON.parse(val); } catch { return null; }
      }
      return val ?? null;
    })
    .nullable()
    .optional(),
  category: z
    .string()
    .refine(
      val =>
        [
          "Girl",
          "Hero",
          "Games",
          "Open",
          "Quarterfinals",
          "AGOQ",
          "Benchmark",
          "Other",
        ].includes(val),
      { message: "Invalid category" }
    )
    .nullable()
    .optional(),
  tags: z
    .any()
    .transform(val => {
      if (typeof val === "string") {
        try { return JSON.parse(val); } catch { return []; }
      }
      return Array.isArray(val) ? val : [];
    })
    .default([]),
  difficulty: z.string().nullable().optional(),
  difficultyExplanation: z.string().nullable().optional(),
  countLikes: z.number().nullable().optional(),
  timecap: z.number().nullable().optional(),
  createdAt: z.preprocess((arg: unknown) => {
    if (typeof arg === "string") return new Date(arg);
    if (arg instanceof Date) return new Date(arg);
    return new Date();
  }, z.date()),
  updatedAt: z
    .preprocess((arg: unknown) => {
      if (typeof arg === "string") return new Date(arg);
      if (arg instanceof Date) return new Date(arg);
      if (arg === null || typeof arg === "undefined") return null;
      if (typeof arg === "object") {
        if (
          arg &&
          "toISOString" in arg &&
          typeof arg.toISOString === "function"
        ) {
          try {
            const dateObj = arg as { toISOString(): string };
            const isoString = dateObj.toISOString();
            return new Date(isoString);
          } catch {
            return null;
          }
        }
        if (arg && "valueOf" in arg && typeof arg.valueOf === "function") {
          try {
            const valueObj = arg as { valueOf(): number };
            const value = valueObj.valueOf();
            const date = new Date(value);
            return isNaN(date.getTime()) ? null : date;
          } catch {
            return null;
          }
        }
        return null;
      }
      if (typeof arg === "number") {
        const date = new Date(arg);
        return isNaN(date.getTime()) ? null : date;
      }
      return null;
    }, z.date())
    .nullable(),
  movements: z.array(z.string()).default([]),
});

function validateWodsFromDb(
  wodsData: any[],
  movementsByWod: Record<string, string[]>
): Wod[] {
  return wodsData.reduce<Wod[]>((acc, wod) => {
    // Attach movements from external context
    const input = { ...wod, movements: Array.isArray(movementsByWod[wod.id]) ? movementsByWod[wod.id] : [] };
    const validationResult = WodFromDbRowSchema.safeParse(input);

    if (validationResult.success) {
      acc.push(validationResult.data as Wod);
    } else {
      console.error(
        `Zod validation failed for WOD ${wod.wodName} (ID: ${wod.id}). Skipping. Issues:`,
        JSON.stringify(validationResult.error.issues, null, 2)
      );
    }

    return acc;
  }, []);
}

export { WodFromDbRowSchema };
