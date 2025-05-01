import { describe, it, expect, beforeEach, vi } from "vitest";

// Define mock symbols BEFORE mocking the schema
const mockWodsTable = Symbol("wods");
const mockScoresTable = Symbol("scores");
const mockMovementsTable = Symbol("movements");
const mockWodMovementsTable = Symbol("wodMovements");

// Mock the actual schema objects using the defined symbols
vi.mock("~/server/db/schema", () => ({
  wods: mockWodsTable,
  scores: mockScoresTable,
  movements: mockMovementsTable,
  wodMovements: mockWodMovementsTable,
}));
vi.mock("~/server/db/index", () => ({ db: {} })); // Keep this simple for now, will enhance in makeCtx
vi.mock("~/server/auth", () => ({ auth: {} }));
import { wodRouter } from "./wod";
import type { Benchmarks } from "~/types/wodTypes";
import { createTRPCContext } from "../trpc";

// Mock DB and context utilities
type MockWod = {
  id: string;
  wodName: string;
  description: string; // Keep for reference, but not used for movements
  category?: string;
  tags?: string | string[];
  benchmarks?: Benchmarks;
  difficulty?: string;
  // Add fields used in joins/selects if necessary
};

type MockScore = {
  id: string;
  userId: string;
  wodId: string;
  time_seconds?: number | null;
  reps?: number | null;
  load?: number | null;
  rounds_completed?: number | null;
  partial_reps?: number | null;
  is_rx?: boolean | null;
  scoreDate: Date;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Add mock types for movements
type MockMovement = {
  id: string;
  name: string;
};

type MockWodMovement = {
  wodId: string;
  movementId: string;
};

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
function makeCtx({
  wodsData,
  scoresData,
  movementsData,
  wodMovementsData,
  userId,
}: {
  wodsData: MockWod[];
  scoresData: MockScore[];
  movementsData: MockMovement[];
  wodMovementsData: MockWodMovement[];
  userId: string;
}) {
  // Helper to simulate leftJoin based on mock data
  const simulateJoin = (
    leftTableData: any[],
    rightTableData: any[],
    leftKey: string,
    rightKey: string,
    table: any,
    joinTable: any,
  ) => {
    const rightDataMap = new Map(
      rightTableData.map((item) => [item[rightKey], item]),
    );
    return leftTableData.map((leftItem) => {
      const rightItem = rightDataMap.get(leftItem[leftKey]);
      // Simulate Drizzle's join behavior: merge right into left
      const joined = { ...leftItem };
      if (rightItem) {
        for (const key in rightItem) {
          // Avoid overwriting existing keys from left table unless necessary
          if (!(key in joined)) {
            joined[key] = rightItem[key];
          } else if (key === rightKey) {
            // Keep left table's key
          } else {
            joined[key] = rightItem[key];
          }
        }
        if (leftKey !== rightKey && rightKey in rightItem) {
          // Preserve original left key value if keys differ
        }
      }
      // Add specific fields needed by the router's select clause after join
      if (
        table === mockScoresTable &&
        joinTable === mockWodsTable &&
        rightItem
      ) {
        joined.wodName = rightItem.wodName;
        joined.difficulty = rightItem.difficulty;
        joined.benchmarks = rightItem.benchmarks;
      }
      if (
        table === mockWodMovementsTable &&
        joinTable === mockMovementsTable &&
        rightItem
      ) {
        joined.movementName = rightItem.name; // Add movement name
      }
      if (
        table === mockWodMovementsTable &&
        joinTable === mockWodsTable &&
        rightItem
      ) {
        joined.wodName = rightItem.wodName; // Add wod name
      }
      return joined;
    });
  };

  const mockDb = {
    select: (selection?: any) => ({
      from: (table: any) => {
        let currentData: any[] = [];
        // Use symbols for comparison
        if (table === mockWodsTable)
          currentData = JSON.parse(JSON.stringify(wodsData));
        else if (table === mockScoresTable)
          currentData = JSON.parse(JSON.stringify(scoresData));
        else if (table === mockMovementsTable)
          currentData = JSON.parse(JSON.stringify(movementsData));
        else if (table === mockWodMovementsTable)
          currentData = JSON.parse(JSON.stringify(wodMovementsData));
        else currentData = [];

        let joinedData = [...currentData];

        const queryBuilder = {
          leftJoin: (joinTable: any, condition: any) => {
            let rightTableData: any[] = [];
            if (joinTable === mockWodsTable)
              rightTableData = JSON.parse(JSON.stringify(wodsData));
            else if (joinTable === mockScoresTable)
              rightTableData = JSON.parse(JSON.stringify(scoresData));
            else if (joinTable === mockMovementsTable)
              rightTableData = JSON.parse(JSON.stringify(movementsData));
            else if (joinTable === mockWodMovementsTable)
              rightTableData = JSON.parse(JSON.stringify(wodMovementsData));
            else rightTableData = [];

            let leftKey = "";
            let rightKey = "";
            if (table === mockScoresTable && joinTable === mockWodsTable) {
              leftKey = "wodId";
              rightKey = "id";
            } else if (
              table === mockWodMovementsTable &&
              joinTable === mockMovementsTable
            ) {
              leftKey = "movementId";
              rightKey = "id";
            } else if (
              table === mockWodMovementsTable &&
              joinTable === mockWodsTable
            ) {
              leftKey = "wodId";
              rightKey = "id";
            }

            if (leftKey && rightKey && rightTableData.length > 0) {
              // Pass table symbols to simulateJoin if needed for context
              joinedData = simulateJoin(
                joinedData,
                rightTableData,
                leftKey,
                rightKey,
                table,
                joinTable,
              );
            } else if (rightTableData.length === 0) {
              // No changes if right table is empty
            } else {
              console.warn(
                "Mock leftJoin: Could not infer keys or find right table data for join:",
                table,
                joinTable,
              );
            }
            return queryBuilder;
          },
          where: (condition: any) => {
            // Refined 'where' simulation based on logged structure
            // Example: eq(scores.userId, userId) -> condition might look like { operator: 'eq', left: { table: mockScoresTable, name: 'userId' }, right: userIdValue }
            // Example: inArray(wodMovements.wodId, wodIds) -> { operator: 'inArray', left: { table: mockWodMovementsTable, name: 'wodId' }, right: [id1, id2] }

            // Check for eq(scores.userId, value)
            if (
              condition?.operator === "eq" &&
              condition?.left?.table === mockScoresTable &&
              condition?.left?.name === "userId" &&
              condition?.right
            ) {
              joinedData = joinedData.filter(
                (row) => row.userId === condition.right,
              );
            }
            // Check for inArray(wodMovements.wodId, value)
            else if (
              condition?.operator === "inArray" &&
              condition?.left?.table === mockWodMovementsTable &&
              condition?.left?.name === "wodId" &&
              Array.isArray(condition?.right)
            ) {
              const filterWodIds = new Set(condition.right);
              joinedData = joinedData.filter((row) =>
                filterWodIds.has(row.wodId),
              );
            }
            // Ignore join conditions passed to where (handled in leftJoin mock)
            else if (
              condition?.operator === "eq" &&
              condition?.left?.table &&
              condition?.right?.table
            ) {
              // Likely a join condition, ignore in 'where' simulation
            } else {
              console.warn(
                "Mock where: Unhandled condition structure:",
                JSON.stringify(condition, null, 2),
              );
            }
            return queryBuilder;
          },
          orderBy: (/*orderCondition: any*/) => {
            if (table === mockWodsTable) {
              joinedData.sort((a, b) => a.wodName.localeCompare(b.wodName));
            }
            return Promise.resolve(joinedData);
          },
          execute: () => Promise.resolve(joinedData),
          then: (resolve: any) => resolve(joinedData),
        };

        if (table === mockWodsTable && !selection) {
          return {
            orderBy: queryBuilder.orderBy,
            then: (resolve: any) => resolve(queryBuilder.orderBy()),
          };
        }
        if (
          (table === mockScoresTable || table === mockWodMovementsTable) &&
          selection
        ) {
          return queryBuilder;
        }
        return queryBuilder;
      },
    }),
  };

  return {
    headers: new Headers(),
    db: mockDb,
    session: {
      session: {
        id: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        expires: new Date(),
        userId: userId,
        userAgent: "test",
      },
      user: { id: userId },
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */

describe("wodRouter.getChartData - yourMovementCounts", () => {
  let wodsData: MockWod[];
  let scoresData: MockScore[];
  let movementsData: MockMovement[];
  let wodMovementsData: MockWodMovement[];
  const userId = "user-1";

  beforeEach(() => {
    vi.clearAllMocks();

    const dummyLevels = {
      elite: { value: 1, description: "Elite", min: 0, max: 1 },
      advanced: { value: 2, description: "Advanced", min: 1, max: 2 },
      intermediate: { value: 3, description: "Intermediate", min: 2, max: 3 },
      beginner: { value: 4, description: "Beginner", min: 3, max: 4 },
    };

    wodsData = [
      {
        id: "wod-1",
        wodName: "Fran",
        description: "...",
        difficulty: "Hard",
        benchmarks: { type: "time", levels: dummyLevels },
      },
      {
        id: "wod-2",
        wodName: "Open 20.1",
        description: "...",
        difficulty: "Hard",
        benchmarks: { type: "reps", levels: dummyLevels },
      },
      {
        id: "wod-3",
        wodName: "DT",
        description: "...",
        difficulty: "Hard",
        benchmarks: { type: "time", levels: dummyLevels },
      },
      {
        id: "wod-4",
        wodName: "No Movements",
        description: "",
        difficulty: "Easy",
        benchmarks: { type: "time", levels: dummyLevels },
      },
      {
        id: "wod-5",
        wodName: "Repeats",
        description: "...",
        difficulty: "Medium",
        benchmarks: { type: "time", levels: dummyLevels },
      },
      {
        id: "wod-6",
        wodName: "Mixed Case",
        description: "...",
        difficulty: "Medium",
        benchmarks: { type: "time", levels: dummyLevels },
      },
    ];
    scoresData = [
      {
        id: "score-1",
        userId,
        wodId: "wod-1",
        time_seconds: 300,
        scoreDate: new Date("2024-01-01"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "score-2",
        userId,
        wodId: "wod-2",
        reps: 100,
        scoreDate: new Date("2024-02-01"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "score-3",
        userId,
        wodId: "wod-3",
        time_seconds: 400,
        scoreDate: new Date("2024-03-01"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "score-4",
        userId,
        wodId: "wod-4",
        time_seconds: 100,
        scoreDate: new Date("2024-04-01"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "score-5",
        userId,
        wodId: "wod-5",
        time_seconds: 123,
        scoreDate: new Date("2024-05-01"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "score-6",
        userId,
        wodId: "wod-6",
        time_seconds: 111,
        scoreDate: new Date("2024-06-01"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    movementsData = [
      { id: "mov-1", name: "Thruster" },
      { id: "mov-2", name: "Pull-Up" },
      { id: "mov-3", name: "Ground To Overhead" },
      { id: "mov-4", name: "Bar Facing Burpee" },
      { id: "mov-5", name: "Deadlift" },
      { id: "mov-6", name: "Hang Power Clean" },
      { id: "mov-7", name: "Push Jerk" },
      { id: "mov-8", name: "Dumbbell Snatch" },
    ];
    wodMovementsData = [
      { wodId: "wod-1", movementId: "mov-1" },
      { wodId: "wod-1", movementId: "mov-2" },
      { wodId: "wod-2", movementId: "mov-3" },
      { wodId: "wod-2", movementId: "mov-4" },
      { wodId: "wod-3", movementId: "mov-5" },
      { wodId: "wod-3", movementId: "mov-6" },
      { wodId: "wod-3", movementId: "mov-7" },
      { wodId: "wod-5", movementId: "mov-1" },
      { wodId: "wod-5", movementId: "mov-2" },
      { wodId: "wod-6", movementId: "mov-1" },
      { wodId: "wod-6", movementId: "mov-2" },
      { wodId: "wod-6", movementId: "mov-8" },
    ];
  });

  it("returns correct yourMovementCounts for user with logged WODs", async () => {
    const ctx = makeCtx({
      wodsData,
      scoresData,
      movementsData,
      wodMovementsData,
      userId,
    });
    const result = await wodRouter
      .createCaller(
        ctx as unknown as Awaited<ReturnType<typeof createTRPCContext>>,
      )
      .getChartData();

    expect(result.yourMovementCounts).toBeDefined();
    // User logged scores for wod-1, wod-2, wod-3, wod-4, wod-5, wod-6
    // Movements should come from wod-1, wod-2, wod-3, wod-5, wod-6 (wod-4 has none)
    expect(result.yourMovementCounts.Thruster).toBeDefined(); // wod-1, wod-5, wod-6
    expect(result.yourMovementCounts["Pull-Up"]).toBeDefined(); // wod-1, wod-5, wod-6
    expect(result.yourMovementCounts["Ground To Overhead"]).toBeDefined(); // wod-2
    expect(result.yourMovementCounts["Bar Facing Burpee"]).toBeDefined(); // wod-2
    expect(result.yourMovementCounts.Deadlift).toBeDefined(); // wod-3
    expect(result.yourMovementCounts["Hang Power Clean"]).toBeDefined(); // wod-3
    expect(result.yourMovementCounts["Push Jerk"]).toBeDefined(); // wod-3
    expect(result.yourMovementCounts["Dumbbell Snatch"]).toBeDefined(); // wod-6

    // Check counts and WOD names
    expect(result.yourMovementCounts.Thruster.count).toBe(3);
    expect(result.yourMovementCounts.Thruster.wodNames).toEqual(
      expect.arrayContaining(["Fran", "Repeats", "Mixed Case"]),
    );
    expect(result.yourMovementCounts["Pull-Up"].count).toBe(3);
    expect(result.yourMovementCounts["Pull-Up"].wodNames).toEqual(
      expect.arrayContaining(["Fran", "Repeats", "Mixed Case"]),
    );
    expect(result.yourMovementCounts["Ground To Overhead"].count).toBe(1);
    expect(result.yourMovementCounts["Ground To Overhead"].wodNames).toEqual([
      "Open 20.1",
    ]);
    // ... (add checks for other movements)
    expect(result.yourMovementCounts["Bar Facing Burpee"].count).toBe(1);
    expect(result.yourMovementCounts["Bar Facing Burpee"].wodNames).toEqual([
      "Open 20.1",
    ]);
    expect(result.yourMovementCounts.Deadlift.count).toBe(1);
    expect(result.yourMovementCounts.Deadlift.wodNames).toEqual(["DT"]);
    expect(result.yourMovementCounts["Hang Power Clean"].count).toBe(1);
    expect(result.yourMovementCounts["Hang Power Clean"].wodNames).toEqual([
      "DT",
    ]);
    expect(result.yourMovementCounts["Push Jerk"].count).toBe(1);
    expect(result.yourMovementCounts["Push Jerk"].wodNames).toEqual(["DT"]);
    expect(result.yourMovementCounts["Dumbbell Snatch"].count).toBe(1);
    expect(result.yourMovementCounts["Dumbbell Snatch"].wodNames).toEqual([
      "Mixed Case",
    ]);
  });

  it("returns empty yourMovementCounts for user with no logged WODs", async () => {
    const ctx = makeCtx({
      wodsData,
      scoresData: [],
      movementsData,
      wodMovementsData,
      userId,
    });
    const result = await wodRouter
      .createCaller(
        ctx as unknown as Awaited<ReturnType<typeof createTRPCContext>>,
      )
      .getChartData();
    expect(result.yourMovementCounts).toEqual({});
  });

  it("handles WODs with no linked movements", async () => {
    const userScores = scoresData.filter((s) => s.id === "score-4"); // Score for wod-4
    const ctx = makeCtx({
      wodsData,
      scoresData: userScores,
      movementsData,
      wodMovementsData,
      userId,
    });
    const result = await wodRouter
      .createCaller(
        ctx as unknown as Awaited<ReturnType<typeof createTRPCContext>>,
      )
      .getChartData();
    // wod-4 has no movements in wodMovementsData, so count should be empty
    expect(result.yourMovementCounts).toEqual({});
  });

  it("does not double-count movements within a single WOD", async () => {
    const userScores = scoresData.filter((s) => s.id === "score-5"); // Score for wod-5
    const ctx = makeCtx({
      wodsData,
      scoresData: userScores,
      movementsData,
      wodMovementsData,
      userId,
    });
    const result = await wodRouter
      .createCaller(
        ctx as unknown as Awaited<ReturnType<typeof createTRPCContext>>,
      )
      .getChartData();
    // wod-5 has Thruster and Pull-Up linked once each in wodMovementsData
    expect(result.yourMovementCounts.Thruster.count).toBe(1);
    expect(result.yourMovementCounts.Thruster.wodNames).toEqual(["Repeats"]);
    expect(result.yourMovementCounts["Pull-Up"].count).toBe(1);
    expect(result.yourMovementCounts["Pull-Up"].wodNames).toEqual(["Repeats"]);
  });

  it("uses normalized movement names from the database", async () => {
    const userScores = scoresData.filter((s) => s.id === "score-6"); // Score for wod-6
    const ctx = makeCtx({
      wodsData,
      scoresData: userScores,
      movementsData,
      wodMovementsData,
      userId,
    });
    const result = await wodRouter
      .createCaller(
        ctx as unknown as Awaited<ReturnType<typeof createTRPCContext>>,
      )
      .getChartData();
    // wod-6 links mov-1, mov-2, mov-8
    expect(result.yourMovementCounts.Thruster).toBeDefined(); // From mov-1
    expect(result.yourMovementCounts["Pull-Up"]).toBeDefined(); // From mov-2
    expect(result.yourMovementCounts["Dumbbell Snatch"]).toBeDefined(); // From mov-8
    expect(result.yourMovementCounts.Thruster.wodNames).toEqual(["Mixed Case"]);
    expect(result.yourMovementCounts["Pull-Up"].wodNames).toEqual([
      "Mixed Case",
    ]);
    expect(result.yourMovementCounts["Dumbbell Snatch"].wodNames).toEqual([
      "Mixed Case",
    ]);
  });
});
