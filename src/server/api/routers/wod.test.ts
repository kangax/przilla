import { describe, it, expect, beforeEach, vi } from "vitest";

// Import mock utilities first
import {
  mockWodsTable,
  mockScoresTable,
  mockMovementsTable,
  mockWodMovementsTable,
  type MockWod,
  type MockScore,
  type MockMovement,
  type MockWodMovement,
} from "../__tests__/utils/mockTypes";

// Mock the actual schema objects using the defined symbols
// IMPORTANT: Mocks must be defined before imports that use them
vi.mock("~/server/db/schema", () => ({
  wods: mockWodsTable,
  scores: mockScoresTable,
  movements: mockMovementsTable,
  wodMovements: mockWodMovementsTable,
}));
vi.mock("~/server/db/index", () => ({ db: {} }));
vi.mock("~/server/auth", () => ({ auth: {} }));

// Now import the router and other dependencies
import { wodRouter } from "./wod";
import type { createTRPCContext } from "../trpc";
import { makeCtx, assertMockContext } from "../__tests__/utils/makeCtx";
import {
  createTestWodsData,
  createTestScoresData,
  createTestMovementsData,
  createTestWodMovementsData,
} from "../__tests__/utils/testData";

describe("wodRouter.getChartData - yourMovementCounts", () => {
  let wodsData: MockWod[];
  let scoresData: MockScore[];
  let movementsData: MockMovement[];
  let wodMovementsData: MockWodMovement[];
  const userId = "user-1";

  beforeEach(() => {
    vi.clearAllMocks();

    // Initialize test data using utility functions
    wodsData = createTestWodsData();
    scoresData = createTestScoresData(userId);
    movementsData = createTestMovementsData();
    wodMovementsData = createTestWodMovementsData();
  });

  it("returns correct yourMovementCounts for user with logged WODs", async () => {
    // Filter movements to only include those for WODs that the user has scores for
    const userWodIds = scoresData.map((s) => s.wodId);
    const filteredWodMovements = wodMovementsData.filter((wm) =>
      userWodIds.includes(wm.wodId),
    );

    const ctx = makeCtx({
      wodsData,
      scoresData,
      movementsData,
      wodMovementsData: filteredWodMovements, // Only include movements for user's WODs
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
    // Only include wod-4 which has no movements
    const userScores = scoresData.filter((s) => s.id === "score-4"); // Score for wod-4
    const filteredWodMovements = wodMovementsData.filter(
      (wm) => wm.wodId === "wod-4",
    );

    const ctx = makeCtx({
      wodsData,
      scoresData: userScores,
      movementsData,
      wodMovementsData: filteredWodMovements, // Only include movements for wod-4 (which should be none)
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
    const filteredWodMovements = wodMovementsData.filter(
      (wm) => wm.wodId === "wod-5",
    );

    const ctx = makeCtx({
      wodsData,
      scoresData: userScores,
      movementsData,
      wodMovementsData: filteredWodMovements, // Only include movements for wod-5
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
    const filteredWodMovements = wodMovementsData.filter(
      (wm) => wm.wodId === "wod-6",
    );

    const ctx = makeCtx({
      wodsData,
      scoresData: userScores,
      movementsData,
      wodMovementsData: filteredWodMovements, // Only include movements for wod-6
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
