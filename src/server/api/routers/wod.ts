import { asc, eq, inArray } from "drizzle-orm"; // Removed unused sql import

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
  WodSchema, // Import WodSchema for validation
  type WodFromQuery, // Import intermediate type
} from "~/types/wodTypes";
// import { normalizeMovementName } from "~/utils/movementMapping";
import { isWodDone } from "~/utils/wodUtils";

// Define difficulty multipliers
const difficultyMultipliers: Record<string, number> = {
  Easy: 0.8,
  Medium: 1.0,
  Hard: 1.2,
  "Very Hard": 1.5,
  "Extremely Hard": 2.0,
};
const DEFAULT_MULTIPLIER = 1.0; // Fallback multiplier

// Define the structure for individual scores in the chart data
// Updated to include raw score fields
type MonthlyScoreDetail = {
  wodName: string;
  level: number; // The original calculated level (0-4) for this score
  difficulty: string | null; // WOD difficulty string
  difficultyMultiplier: number; // Corresponding multiplier
  adjustedLevel: number; // level * difficultyMultiplier
  // Raw score fields for formatting in tooltip
  time_seconds: number | null;
  reps: number | null;
  load: number | null;
  rounds_completed: number | null;
  partial_reps: number | null;
  is_rx: boolean | null;
};

export const wodRouter = createTRPCRouter({
  /**
   * Fetches all WODs from the database, ordered alphabetically by name,
   * and maps database fields (snake_case) to frontend type fields (camelCase).
   */
  getAll: publicProcedure.query(async ({ ctx }) => {
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
    return allWodsData.reduce<Wod[]>((acc, wod) => {
      let parsedBenchmarks: Benchmarks | null = null;
      if (typeof wod.benchmarks === "string") {
        try {
          // Use safe parsing with fallback
          parsedBenchmarks = JSON.parse(wod.benchmarks || "null") as Benchmarks;
        } catch (error) {
          console.error(
            `Failed to parse benchmarks JSON for WOD ${wod.id} (${wod.wodName}):`,
            error,
          );
          // Keep parsedBenchmarks as null if parsing fails
        }
      } else if (wod.benchmarks && typeof wod.benchmarks === "object") {
        // If it's already a non-null object (e.g., if DB driver parsed it), use it
        parsedBenchmarks = wod.benchmarks;
      }

      // Similar parsing for tags (assuming they might also be stored as JSON string)
      let parsedTags: string[] | null = null;
      if (typeof wod.tags === "string") {
        try {
          parsedTags = JSON.parse(wod.tags) as string[];
        } catch (error) {
          console.error(
            `Failed to parse tags JSON for WOD ${wod.id} (${wod.wodName}):`,
            error,
          );
        }
      } else if (Array.isArray(wod.tags)) {
        parsedTags = wod.tags;
      }

      // Construct the potential Wod object for validation, typed as WodFromQuery
      const potentialWod: WodFromQuery = {
        id: wod.id, // id is required in WodFromQuery (implicitly via Omit<Wod>)
        wodUrl: wod.wodUrl,
        wodName: wod.wodName,
        description: wod.description,
        benchmarks: parsedBenchmarks, // Use parsed object or null
        category: wod.category,
        tags: parsedTags ?? [], // Use parsed array or default to empty array
        difficulty: wod.difficulty,
        difficultyExplanation: wod.difficultyExplanation,
        countLikes: wod.countLikes,
        timecap: wod.timecap,
        createdAt: wod.createdAt, // Will be validated by Zod preprocessor
        updatedAt: wod.updatedAt, // Will be validated by Zod preprocessor
        movements: movementsByWod[wod.id] ?? [],
      };

      // Validate the constructed object against the WodSchema
      // No need for 'as any' now that potentialWod is typed correctly
      const validationResult = WodSchema.safeParse(potentialWod);

      if (validationResult.success) {
        // If valid, add the validated data to the accumulator
        acc.push(validationResult.data);
      } else {
        // If invalid, log the error and skip this WOD
        console.error(
          `Zod validation failed for WOD ${wod.wodName} (ID: ${wod.id}). Skipping. Issues:`,
          JSON.stringify(validationResult.error.issues, null, 2), // Log detailed issues
        );
      }

      return acc; // Return accumulator for the next iteration
    }, []); // Initial value for reduce is an empty array
  }),

  /**
   * Fetches aggregated chart data for WOD distribution by tags and categories,
   * and monthly performance data including individual score breakdowns with adjusted levels.
   */
  getChartData: protectedProcedure.query(async ({ ctx }) => {
    // Get all WODs (still needed for tag/category counts of *all* WODs)
    const allWods = await ctx.db.select().from(wods).orderBy(asc(wods.wodName));

    // Get user's scores JOINED with WOD data (name, difficulty, benchmarks)
    // Updated to select raw score fields
    const userScoresWithWodData = await ctx.db
      .select({
        // Select all score fields needed
        scoreId: scores.id,
        userId: scores.userId,
        wodId: scores.wodId,
        time_seconds: scores.time_seconds,
        reps: scores.reps,
        load: scores.load,
        rounds_completed: scores.rounds_completed,
        partial_reps: scores.partial_reps,
        is_rx: scores.is_rx,
        scoreDate: scores.scoreDate,
        notes: scores.notes,
        createdAt: scores.createdAt,
        updatedAt: scores.updatedAt,
        // Select joined WOD fields
        wodName: wods.wodName,
        difficulty: wods.difficulty,
        benchmarks: wods.benchmarks,
      })
      .from(scores)
      .leftJoin(wods, eq(scores.wodId, wods.id)) // Join scores with wods
      .where(eq(scores.userId, ctx.session.user.id)); // Filter by user ID

    // Organize scores by WOD ID for isWodDone check
    const scoresByWodId = userScoresWithWodData.reduce<Record<string, Score[]>>(
      (acc, data) => {
        // Construct the Score object from selected fields
        const score: Score = {
          id: data.scoreId,
          userId: data.userId,
          wodId: data.wodId,
          time_seconds: data.time_seconds,
          reps: data.reps,
          load: data.load,
          rounds_completed: data.rounds_completed,
          partial_reps: data.partial_reps,
          isRx: data.is_rx, // Map is_rx to isRx
          scoreDate: data.scoreDate,
          notes: data.notes,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
        const wodId = data.wodId; // Use wodId from the joined data
        if (!wodId) return acc; // Skip if wodId is null

        if (!acc[wodId]) {
          acc[wodId] = [];
        }
        acc[wodId].push(score);
        return acc;
      },
      {},
    );

    // Process WODs to count tags and categories for completed WODs
    const tagCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    allWods.forEach((wod) => {
      const tagsInput = wod.tags || "[]";
      const parsedTags: string[] = Array.isArray(tagsInput)
        ? tagsInput
        : (JSON.parse(tagsInput) as string[]);
      // Use the pre-organized scoresByWodId for the isWodDone check
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

    // Calculate monthly score data for timeline chart, including adjusted score details
    const monthlyData: Record<
      string,
      {
        count: number;
        totalAdjustedLevelScore: number;
        scores: MonthlyScoreDetail[];
      } // Updated structure
    > = {};

    userScoresWithWodData.forEach((data) => {
      // Extract score fields directly from data
      const wodName = data.wodName;
      const difficulty = data.difficulty;
      const benchmarksInput = data.benchmarks; // Use benchmarks from joined data

      // Skip if essential data is missing
      if (!wodName || !benchmarksInput) {
        console.warn(
          `Skipping score ID ${data.scoreId} due to missing WOD name or benchmarks.`,
        );
        return;
      }

      const monthKey = data.scoreDate.toISOString().slice(0, 7); // YYYY-MM format
      if (!monthlyData[monthKey]) {
        // Initialize with the new structure including the scores array
        monthlyData[monthKey] = {
          count: 0,
          totalAdjustedLevelScore: 0,
          scores: [],
        };
      }
      monthlyData[monthKey].count++;

      // Calculate performance level score based on benchmarks
      let benchmarks: Benchmarks | null = null;
      if (typeof benchmarksInput === "string") {
        try {
          benchmarks = JSON.parse(benchmarksInput || "{}") as Benchmarks; // Use fallback for empty/null string
        } catch (error) {
          console.error(
            `Failed to parse benchmarks JSON in getChartData for score ${data.scoreId}:`,
            error,
          );
          // Keep benchmarks null if parsing fails
        }
      } else if (benchmarksInput && typeof benchmarksInput === "object") {
        benchmarks = benchmarksInput;
      }

      // If benchmarks are null after parsing/checking, log a warning and skip level calculation for this score
      if (!benchmarks) {
        console.warn(
          `Skipping level calculation for score ${data.scoreId} due to missing or invalid benchmarks data.`,
        );
        // Potentially continue to next iteration or handle differently if needed
        // For now, we'll proceed, but levelScore will remain 0
      }

      // Get numeric score value (time in seconds, reps, etc.)
      const scoreValue = data.time_seconds ?? data.reps ?? 0; // Use nullish coalescing

      // Calculate original performance level (0-4 scale)
      let levelScore = 0;
      // Only calculate level if benchmarks and benchmarks.levels exist
      if (benchmarks?.levels) {
        // Handle time-based benchmarks (lower is better)
        if (benchmarks.type === "time") {
          if (scoreValue <= (benchmarks.levels.elite?.max ?? Infinity))
            levelScore = 4;
          else if (scoreValue <= (benchmarks.levels.advanced?.max ?? Infinity))
            levelScore = 3;
          else if (
            scoreValue <= (benchmarks.levels.intermediate?.max ?? Infinity)
          )
            levelScore = 2;
          // Check beginner min last, ensuring it's not null before comparing
          else if (
            benchmarks.levels.beginner?.min !== null &&
            scoreValue >= (benchmarks.levels.beginner?.min ?? 0)
          )
            levelScore = 1;
          // Handle cases where score might be below beginner min (if defined) - treat as beginner
          else if (
            benchmarks.levels.beginner?.min !== null &&
            scoreValue < benchmarks.levels.beginner.min
          )
            levelScore = 1;
        }
        // Handle rep/load-based benchmarks (higher is better)
        else {
          if (scoreValue >= (benchmarks.levels.elite?.min ?? 0)) levelScore = 4;
          else if (scoreValue >= (benchmarks.levels.advanced?.min ?? 0))
            levelScore = 3;
          else if (scoreValue >= (benchmarks.levels.intermediate?.min ?? 0))
            levelScore = 2;
          // Check beginner max last, ensuring it's not null before comparing
          else if (
            benchmarks.levels.beginner?.max !== null &&
            scoreValue <= (benchmarks.levels.beginner?.max ?? Infinity)
          )
            levelScore = 1;
          // Handle cases where score might be above beginner max (if defined) - treat as beginner
          else if (
            benchmarks.levels.beginner?.max !== null &&
            scoreValue > benchmarks.levels.beginner.max
          )
            levelScore = 1;
        }
      }

      // Bonus for Rx - apply only if not already Elite
      if (data.is_rx && levelScore < 4) {
        levelScore = Math.min(levelScore + 0.5, 4);
      }

      // Calculate difficulty multiplier and adjusted level
      const difficultyMultiplier = difficulty
        ? (difficultyMultipliers[difficulty] ?? DEFAULT_MULTIPLIER)
        : DEFAULT_MULTIPLIER;
      const adjustedLevel = levelScore * difficultyMultiplier;

      monthlyData[monthKey].totalAdjustedLevelScore += adjustedLevel;

      // Add the detailed score info to the scores array for this month
      // Include raw score fields
      monthlyData[monthKey].scores.push({
        wodName: wodName,
        level: levelScore, // Original level
        difficulty: difficulty, // Difficulty string
        difficultyMultiplier: difficultyMultiplier, // Multiplier used
        adjustedLevel: adjustedLevel, // Calculated adjusted level
        // Add raw score fields
        time_seconds: data.time_seconds,
        reps: data.reps,
        load: data.load,
        rounds_completed: data.rounds_completed,
        partial_reps: data.partial_reps,
        is_rx: data.is_rx,
      });
    });

    // --- BEGIN: Movement Frequency Aggregation Using Normalized Tables ---

    // Import the required tables
    const { wodMovements, movements } = await import("~/server/db/schema");

    // Helper: Get all movements for a set of WOD IDs
    async function getMovementsForWods(
      wodIds: string[],
    ): Promise<Record<string, { count: number; wodNames: string[] }>> {
      if (wodIds.length === 0) return {};
      // Get all (wodId, movementName) pairs for these WODs
      const rows = await ctx.db
        .select({
          wodId: wodMovements.wodId,
          movementName: movements.name,
          wodName: wods.wodName,
        })
        .from(wodMovements)
        .leftJoin(movements, eq(wodMovements.movementId, movements.id))
        .leftJoin(wods, eq(wodMovements.wodId, wods.id))
        .where(inArray(wodMovements.wodId, wodIds));

      // Aggregate
      const movementCounts: Record<
        string,
        { count: number; wodNames: string[] }
      > = {};
      for (const row of rows) {
        if (!row.movementName || !row.wodName) continue;
        if (!movementCounts[row.movementName]) {
          movementCounts[row.movementName] = { count: 0, wodNames: [] };
        }
        movementCounts[row.movementName].count += 1;
        movementCounts[row.movementName].wodNames.push(row.wodName);
      }
      return movementCounts;
    }

    // 1. Your Movement Frequency (WODs the user has logged)
    const userWodIds = Array.from(
      new Set(userScoresWithWodData.map((data) => data.wodId).filter(Boolean)),
    );
    const yourMovementCounts = await getMovementsForWods(userWodIds);

    // 2. All Movement Frequency (all WODs)
    const allWodIds = allWods.map((wod) => wod.id);
    const allMovementCounts = await getMovementsForWods(allWodIds);

    // 3. Movement Frequency By Category
    //    Structure: { [category]: { [movementName]: { count, wodNames } } }
    const movementCountsByCategory: Record<
      string,
      Record<string, { count: number; wodNames: string[] }>
    > = {};
    // Group WOD IDs by category
    const wodsByCategory: Record<string, string[]> = {};
    allWods.forEach((wod) => {
      if (!wod.category) return;
      if (!wodsByCategory[wod.category]) wodsByCategory[wod.category] = [];
      wodsByCategory[wod.category].push(wod.id);
    });
    for (const [category, wodIds] of Object.entries(wodsByCategory)) {
      movementCountsByCategory[category] = await getMovementsForWods(wodIds);
    }

    // --- END: Movement Frequency Aggregation Using Normalized Tables ---

    return {
      tagCounts,
      categoryCounts,
      monthlyData, // Return the updated structure with adjusted levels
      yourMovementCounts,
      allMovementCounts,
      movementCountsByCategory,
    };
  }),
});
