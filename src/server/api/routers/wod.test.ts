import { describe, it, expect, beforeEach, vi } from "vitest";
vi.mock("~/server/db/index", () => ({ db: {} }));
vi.mock("~/server/auth", () => ({ auth: {} }));
import { wodRouter } from "./wod";
import { type Benchmarks } from "~/types/wodTypes";

// Mock DB and context utilities
type MockWod = {
  id: string;
  wodName: string;
  description: string;
  category?: string;
  tags?: string | string[];
  benchmarks?: Benchmarks;
  difficulty?: string;
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

function makeCtx({
  wods,
  scores,
  userId,
}: {
  wods: MockWod[];
  scores: MockScore[];
  userId: string;
}) {
  return {
    headers: new Headers(),
    db: {
      select: () => ({
        from: (table: unknown) => ({
          orderBy: () => {
            if (table === "wods" || table === undefined) {
              // Return all WODs
              return Promise.resolve(wods);
            }
            return Promise.resolve([]);
          },
        }),
      }),
    },
    session: {
      session: {
        id: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        expires: new Date(),
        userId,
        userAgent: "test",
      },
      user: { id: userId },
    },
  };
}

describe("wodRouter.getChartData - yourMovementCounts", () => {
  let wods: MockWod[];
  let scores: MockScore[];
  const userId = "user-1";

  beforeEach(() => {
    wods = [
      {
        id: "wod-1",
        wodName: "Fran",
        description: "Thrusters, Pull-Ups",
      },
      {
        id: "wod-2",
        wodName: "Open 20.1",
        description: "Ground to Overhead, Bar Facing Burpees",
      },
      {
        id: "wod-3",
        wodName: "DT",
        description: "Deadlifts, Hang Power Cleans, Push Jerks",
      },
      {
        id: "wod-4",
        wodName: "No Movements",
        description: "",
      },
    ];
    scores = [
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
        reps: 200,
        scoreDate: new Date("2024-03-01"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  });

  it("returns correct yourMovementCounts for user with logged WODs", async () => {
    const ctx = makeCtx({ wods, scores, userId });
    // Patch the router to use our mock context
    // @ts-expect-error: test context does not match real router context type
    const result = await wodRouter.createCaller(ctx as unknown).getChartData();

    expect(result.yourMovementCounts).toBeDefined();
    // Should include normalized movements from all logged WODs
    expect(result.yourMovementCounts.Thruster).toBeDefined();
    expect(result.yourMovementCounts["Pull-Up"]).toBeDefined();
    expect(result.yourMovementCounts["Ground To Overhead"]).toBeDefined();
    expect(result.yourMovementCounts["Bar Facing Burpee"]).toBeDefined();
    expect(result.yourMovementCounts.Deadlift).toBeDefined();
    expect(result.yourMovementCounts["Hang Power Clean"]).toBeDefined();
    expect(result.yourMovementCounts["Push Jerk"]).toBeDefined();

    // Check counts and WOD names
    expect(result.yourMovementCounts.Thruster.count).toBe(1);
    expect(result.yourMovementCounts.Thruster.wodNames).toContain("Fran");
    expect(result.yourMovementCounts["Pull-Up"].count).toBe(1);
    expect(result.yourMovementCounts["Pull-Up"].wodNames).toContain("Fran");
    expect(result.yourMovementCounts["Ground To Overhead"].count).toBe(1);
    expect(result.yourMovementCounts["Ground To Overhead"].wodNames).toContain(
      "Open 20.1",
    );
    expect(result.yourMovementCounts["Bar Facing Burpee"].count).toBe(1);
    expect(result.yourMovementCounts["Bar Facing Burpee"].wodNames).toContain(
      "Open 20.1",
    );
    expect(result.yourMovementCounts.Deadlift.count).toBe(1);
    expect(result.yourMovementCounts.Deadlift.wodNames).toContain("DT");
    expect(result.yourMovementCounts["Hang Power Clean"].count).toBe(1);
    expect(result.yourMovementCounts["Hang Power Clean"].wodNames).toContain(
      "DT",
    );
    expect(result.yourMovementCounts["Push Jerk"].count).toBe(1);
    expect(result.yourMovementCounts["Push Jerk"].wodNames).toContain("DT");
  });

  it("returns empty yourMovementCounts for user with no logged WODs", async () => {
    const ctx = makeCtx({ wods, scores: [], userId });
    // @ts-expect-error: test context does not match real router context type
    const result = await wodRouter.createCaller(ctx as unknown).getChartData();
    expect(result.yourMovementCounts).toEqual({});
  });

  it("handles WODs with empty or missing descriptions", async () => {
    const ctx = makeCtx({
      wods: [{ id: "wod-4", wodName: "No Movements", description: "" }],
      scores: [
        {
          id: "score-4",
          userId,
          wodId: "wod-4",
          time_seconds: 100,
          scoreDate: new Date("2024-04-01"),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      userId,
    });
    // @ts-expect-error: test context does not match real router context type
    const result = await wodRouter.createCaller(ctx as unknown).getChartData();
    expect(result.yourMovementCounts).toEqual({});
  });

  it("does not double-count movements within a single WOD", async () => {
    const ctx = makeCtx({
      wods: [
        {
          id: "wod-5",
          wodName: "Repeats",
          description: "Thrusters, Thrusters, Pull-Ups, Pull-Ups",
        },
      ],
      scores: [
        {
          id: "score-5",
          userId,
          wodId: "wod-5",
          time_seconds: 123,
          scoreDate: new Date("2024-05-01"),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      userId,
    });
    // @ts-expect-error: test context does not match real router context type
    const result = await wodRouter.createCaller(ctx as unknown).getChartData();
    // eslint-disable-next-line @typescript-eslint/dot-notation
    expect(result.yourMovementCounts.Thruster.count).toBe(1);
    expect(result.yourMovementCounts["Pull-Up"].count).toBe(1);
  });

  it("normalizes movement names using normalizeMovementName", async () => {
    const ctx = makeCtx({
      wods: [
        {
          id: "wod-6",
          wodName: "Mixed Case",
          description: "thrusters, PULL-UPS, dumbbell snatches",
        },
      ],
      scores: [
        {
          id: "score-6",
          userId,
          wodId: "wod-6",
          time_seconds: 111,
          scoreDate: new Date("2024-06-01"),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      userId,
    });
    // @ts-expect-error: test context does not match real router context type
    const result = await wodRouter.createCaller(ctx as unknown).getChartData();
    // eslint-disable-next-line @typescript-eslint/dot-notation
    expect(result.yourMovementCounts.Thruster).toBeDefined();
    expect(result.yourMovementCounts["Pull-Up"]).toBeDefined();
    expect(result.yourMovementCounts["Dumbbell Snatch"]).toBeDefined();
  });
});
