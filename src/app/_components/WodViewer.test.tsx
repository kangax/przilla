import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "../../test-utils";
import "@testing-library/jest-dom";
import WodViewer from "./WodViewer"; // Import the component
import {
  getPerformanceLevelColor,
  formatSecondsToMMSS,
  getPerformanceLevelTooltip,
  formatScore,
  getNumericScore,
  getPerformanceLevel,
  hasScore,
  sortWods,
} from "~/utils/wodUtils"; // Import helpers from utils
import type { Wod, Score, SortByType } from "~/types/wodTypes"; // Import types
import { type ReadonlyURLSearchParams } from "next/navigation"; // Keep this import

// --- Mocks for next/navigation ---
let mockSearchParams = new URLSearchParams(); // Default empty params - MUTABLE

// Mock router.replace to ALSO update the mockSearchParams
// Correct signature to accept both arguments
const mockRouterReplace = vi.fn(
  (pathWithQuery: string, _options?: { scroll: boolean }) => {
    // Prefix unused 'options'
    try {
      // Use a dummy base URL as we only care about the search part
      const url = new URL(pathWithQuery, "http://localhost");
      mockSearchParams = new URLSearchParams(url.search);
    } catch {
      // Handle potential URL parsing errors if needed, though unlikely for test paths
      mockSearchParams = new URLSearchParams(); // Default to empty on error
    }
  },
);

// Correct signature to accept both arguments
const mockRouterPush = vi.fn(
  (pathWithQuery: string, _options?: { scroll: boolean }) => {
    // Prefix unused 'options'
    // Also update params on push if used
    try {
      // Use a dummy base URL as we only care about the search part
      const url = new URL(pathWithQuery, "http://localhost");
      mockSearchParams = new URLSearchParams(url.search);
    } catch {
      // Handle potential URL parsing errors if needed
      mockSearchParams = new URLSearchParams(); // Default to empty on error
    }
  },
);

const mockRouter = {
  replace: mockRouterReplace,
  push: mockRouterPush,
  // Add other router methods if necessary
};
const mockPathname = "/"; // Example pathname

// Corrected vi.mock structure
vi.mock("next/navigation", async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual =
    await vi.importActual<typeof import("next/navigation")>("next/navigation"); // Disable rule for this line
  return {
    ...actual, // Include original exports like ReadonlyURLSearchParams
    useRouter: () => mockRouter,
    usePathname: () => mockPathname,
    // Return the current mutable mockSearchParams, cast to the expected type
    useSearchParams: () => mockSearchParams as ReadonlyURLSearchParams,
  };
});
// --- End Mocks ---

// Define types locally for mocks as they are not exported from component
type SortDirection = "asc" | "desc";

// --- Mocks and Test Data ---

// Add id and createdAt, remove results
const mockWodTime: Wod = {
  id: "mock-time",
  createdAt: new Date(),
  wodUrl: "test.com/fran",
  wodName: "Fran",
  benchmarks: {
    type: "time",
    levels: {
      elite: { min: null, max: 120 }, // 2:00
      advanced: { min: null, max: 180 }, // 3:00
      intermediate: { min: null, max: 300 }, // 5:00
      beginner: { min: null, max: 480 }, // 8:00
    },
  },
  // results removed
};

// Add id and createdAt, remove results
const mockWodRounds: Wod = {
  id: "mock-rounds",
  createdAt: new Date(),
  wodUrl: "test.com/cindy",
  wodName: "Cindy",
  benchmarks: {
    type: "rounds",
    levels: {
      elite: { min: 25, max: null },
      advanced: { min: 20, max: null },
      intermediate: { min: 15, max: null },
      beginner: { min: 10, max: null },
    },
  },
  // results removed
};

// Add id and createdAt, remove results
const mockWodLoad: Wod = {
  id: "mock-load",
  createdAt: new Date(),
  wodUrl: "test.com/deadlift",
  wodName: "Deadlift 1RM",
  benchmarks: {
    type: "load",
    levels: {
      elite: { min: 405, max: null },
      advanced: { min: 315, max: null },
      intermediate: { min: 225, max: null },
      beginner: { min: 135, max: null },
    },
  },
  // results removed
};

// Add id and createdAt, remove results
const mockWodReps: Wod = {
  id: "mock-reps",
  createdAt: new Date(),
  wodUrl: "test.com/max-pullups",
  wodName: "Max Pull-ups",
  benchmarks: {
    type: "reps",
    levels: {
      elite: { min: 30, max: null },
      advanced: { min: 20, max: null },
      intermediate: { min: 10, max: null },
      beginner: { min: 5, max: null },
    },
  },
  // results removed
};

// Add id and createdAt, remove results
const mockWodNoBenchmark: Wod = {
  id: "mock-no-bench",
  createdAt: new Date(),
  wodUrl: "test.com/random",
  wodName: "Random WOD",
  // results removed
};

// --- New Mock Score Data ---
const createMockScore = (
  wodId: string,
  scoreData: Partial<Score>,
  idSuffix = "",
): Score => ({
  id: `score-${wodId}-${idSuffix || Date.now()}`,
  userId: "test-user",
  wodId: wodId,
  scoreDate: new Date("2024-01-15T12:00:00Z"), // Default date
  createdAt: new Date("2024-01-15T12:00:00Z"),
  updatedAt: new Date("2024-01-15T12:00:00Z"),
  time_seconds: null,
  reps: null,
  load: null,
  rounds_completed: null,
  partial_reps: null,
  notes: null,
  isRx: false, // Add default isRx
  ...scoreData, // Override defaults
});

const mockScoreTime = createMockScore(mockWodTime.id, { time_seconds: 155 });
const mockScoreReps = createMockScore(mockWodReps.id, { reps: 25 });
const mockScoreLoad = createMockScore(mockWodLoad.id, { load: 225 });
const mockScoreRounds = createMockScore(mockWodRounds.id, {
  rounds_completed: 15,
  partial_reps: 0,
});
const mockScoreRoundsPartial = createMockScore(mockWodRounds.id, {
  rounds_completed: 15,
  partial_reps: 10,
});
const mockScoreNoValue = createMockScore(mockWodTime.id, {}); // No score values

// --- Tests ---

describe("WodViewer Helper Functions", () => {
  // These tests use the mock Wod data defined above and the new mock Score data
  // but they test utility functions, not the component itself.
  // They don't need the `results` property on the Wod objects.
  describe("getPerformanceLevelColor", () => {
    it("should return correct color class for each level", () => {
      expect(getPerformanceLevelColor("elite")).toBe(
        "text-purple-600 dark:text-purple-400",
      );
      expect(getPerformanceLevelColor("advanced")).toBe(
        "text-green-600 dark:text-green-400",
      );
      expect(getPerformanceLevelColor("intermediate")).toBe(
        "text-yellow-600 dark:text-yellow-400",
      );
      expect(getPerformanceLevelColor("beginner")).toBe(
        "text-red-600 dark:text-red-400",
      );
    });

    it("should return default color class for null or unknown levels", () => {
      expect(getPerformanceLevelColor(null)).toBe(
        "text-foreground/70 dark:text-foreground/60",
      );
      expect(getPerformanceLevelColor("unknown")).toBe(
        "text-foreground/70 dark:text-foreground/60",
      ); // Based on switch default
    });
  });

  describe("formatSecondsToMMSS", () => {
    it("should format seconds correctly", () => {
      expect(formatSecondsToMMSS(0)).toBe("0:00");
      expect(formatSecondsToMMSS(59)).toBe("0:59");
      expect(formatSecondsToMMSS(60)).toBe("1:00");
      expect(formatSecondsToMMSS(95)).toBe("1:35");
      expect(formatSecondsToMMSS(120)).toBe("2:00");
      expect(formatSecondsToMMSS(3661)).toBe("61:01"); // Over an hour
    });
  });

  describe("getPerformanceLevelTooltip", () => {
    it("should return correct multi-line tooltip for time benchmarks", () => {
      const expectedTooltip = [
        "Elite: 0:00 - 2:00",
        "Advanced: 0:00 - 3:00",
        "Intermediate: 0:00 - 5:00",
        "Beginner: 0:00 - 8:00",
      ].join("\n");
      expect(getPerformanceLevelTooltip(mockWodTime)).toBe(expectedTooltip);
    });

    it("should return correct multi-line tooltip for rounds benchmarks", () => {
      const expectedTooltip = [
        "Elite: > 25",
        "Advanced: 20 - ∞",
        "Intermediate: 15 - ∞",
        "Beginner: 10 - ∞",
      ].join("\n");
      expect(getPerformanceLevelTooltip(mockWodRounds)).toBe(expectedTooltip);
    });

    it("should return correct multi-line tooltip for load benchmarks", () => {
      const expectedTooltip = [
        "Elite: > 405 lbs",
        "Advanced: 315 - ∞ lbs",
        "Intermediate: 225 - ∞ lbs",
        "Beginner: 135 - ∞ lbs",
      ].join("\n");
      expect(getPerformanceLevelTooltip(mockWodLoad)).toBe(expectedTooltip);
    });

    it("should return correct multi-line tooltip for reps benchmarks", () => {
      const expectedTooltip = [
        "Elite: > 30",
        "Advanced: 20 - ∞",
        "Intermediate: 10 - ∞",
        "Beginner: 5 - ∞",
      ].join("\n");
      expect(getPerformanceLevelTooltip(mockWodReps)).toBe(expectedTooltip);
    });

    it("should return default message if no benchmarks", () => {
      expect(getPerformanceLevelTooltip(mockWodNoBenchmark)).toBe(
        "No benchmark data available.",
      );
    });
  });

  describe("formatScore", () => {
    // Use new mock Score objects
    it("should format time scores", () => {
      expect(formatScore(mockScoreTime)).toBe("2:35");
    });

    it("should format reps scores", () => {
      expect(formatScore(mockScoreReps)).toBe("25 reps");
    });

    it("should format load scores", () => {
      expect(formatScore(mockScoreLoad)).toBe("225 lbs");
    });

    it("should format rounds scores", () => {
      expect(formatScore(mockScoreRounds)).toBe("15 rounds");
    });

    it("should format rounds + partial reps scores", () => {
      expect(formatScore(mockScoreRoundsPartial)).toBe("15+10");
    });

    it("should return dash if no score", () => {
      expect(formatScore(mockScoreNoValue)).toBe("-");
    });
  });

  describe("getNumericScore", () => {
    // Use new mock Score objects
    it("should return time in seconds for time benchmarks", () => {
      expect(
        getNumericScore(
          mockWodTime,
          createMockScore(mockWodTime.id, { time_seconds: 110 }),
        ),
      ).toBe(110);
    });

    it("should return reps for reps benchmarks", () => {
      expect(
        getNumericScore(
          mockWodReps,
          createMockScore(mockWodReps.id, { reps: 22 }),
        ),
      ).toBe(22);
    });

    it("should return load for load benchmarks", () => {
      expect(
        getNumericScore(
          mockWodLoad,
          createMockScore(mockWodLoad.id, { load: 350 }),
        ),
      ).toBe(350);
    });

    it("should return rounds as integer for rounds benchmarks", () => {
      expect(
        getNumericScore(
          mockWodRounds,
          createMockScore(mockWodRounds.id, {
            rounds_completed: 18,
            partial_reps: 0,
          }),
        ),
      ).toBe(18);
    });

    it("should return rounds + partial reps as decimal for rounds benchmarks", () => {
      expect(
        getNumericScore(
          mockWodRounds,
          createMockScore(mockWodRounds.id, {
            rounds_completed: 18,
            partial_reps: 5,
          }),
        ),
      ).toBe(18.05);
    });

    it("should return null if benchmark type mismatch", () => {
      expect(
        getNumericScore(
          mockWodTime,
          createMockScore(mockWodTime.id, { reps: 20 }),
        ),
      ).toBe(null);
      expect(
        getNumericScore(
          mockWodReps,
          createMockScore(mockWodReps.id, { time_seconds: 120 }),
        ),
      ).toBe(null);
    });

    it("should return null if no benchmarks", () => {
      expect(
        getNumericScore(
          mockWodNoBenchmark,
          createMockScore(mockWodNoBenchmark.id, { time_seconds: 120 }),
        ),
      ).toBe(null);
    });

    it("should return null if no score", () => {
      expect(getNumericScore(mockWodTime, mockScoreNoValue)).toBe(null);
    });
  });

  describe("getPerformanceLevel", () => {
    // Use new mock Score objects
    // Time (lower is better)
    it("should return correct level for time benchmarks", () => {
      expect(
        getPerformanceLevel(
          mockWodTime,
          createMockScore(mockWodTime.id, { time_seconds: 110 }),
        ),
      ).toBe("elite");
      expect(
        getPerformanceLevel(
          mockWodTime,
          createMockScore(mockWodTime.id, { time_seconds: 120 }),
        ),
      ).toBe("elite");
      expect(
        getPerformanceLevel(
          mockWodTime,
          createMockScore(mockWodTime.id, { time_seconds: 121 }),
        ),
      ).toBe("advanced");
      expect(
        getPerformanceLevel(
          mockWodTime,
          createMockScore(mockWodTime.id, { time_seconds: 180 }),
        ),
      ).toBe("advanced");
      expect(
        getPerformanceLevel(
          mockWodTime,
          createMockScore(mockWodTime.id, { time_seconds: 181 }),
        ),
      ).toBe("intermediate");
      expect(
        getPerformanceLevel(
          mockWodTime,
          createMockScore(mockWodTime.id, { time_seconds: 300 }),
        ),
      ).toBe("intermediate");
      expect(
        getPerformanceLevel(
          mockWodTime,
          createMockScore(mockWodTime.id, { time_seconds: 301 }),
        ),
      ).toBe("beginner");
      expect(
        getPerformanceLevel(
          mockWodTime,
          createMockScore(mockWodTime.id, { time_seconds: 500 }),
        ),
      ).toBe("beginner");
    });

    // Rounds (higher is better)
    it("should return correct level for rounds benchmarks", () => {
      expect(
        getPerformanceLevel(
          mockWodRounds,
          createMockScore(mockWodRounds.id, {
            rounds_completed: 26,
            partial_reps: 0,
          }),
        ),
      ).toBe("elite");
      expect(
        getPerformanceLevel(
          mockWodRounds,
          createMockScore(mockWodRounds.id, {
            rounds_completed: 25,
            partial_reps: 0,
          }),
        ),
      ).toBe("elite");
      expect(
        getPerformanceLevel(
          mockWodRounds,
          createMockScore(mockWodRounds.id, {
            rounds_completed: 24,
            partial_reps: 0,
          }),
        ),
      ).toBe("advanced");
      expect(
        getPerformanceLevel(
          mockWodRounds,
          createMockScore(mockWodRounds.id, {
            rounds_completed: 20,
            partial_reps: 0,
          }),
        ),
      ).toBe("advanced");
      expect(
        getPerformanceLevel(
          mockWodRounds,
          createMockScore(mockWodRounds.id, {
            rounds_completed: 19,
            partial_reps: 0,
          }),
        ),
      ).toBe("intermediate");
      expect(
        getPerformanceLevel(
          mockWodRounds,
          createMockScore(mockWodRounds.id, {
            rounds_completed: 15,
            partial_reps: 0,
          }),
        ),
      ).toBe("intermediate");
      expect(
        getPerformanceLevel(
          mockWodRounds,
          createMockScore(mockWodRounds.id, {
            rounds_completed: 14,
            partial_reps: 0,
          }),
        ),
      ).toBe("beginner");
      expect(
        getPerformanceLevel(
          mockWodRounds,
          createMockScore(mockWodRounds.id, {
            rounds_completed: 10,
            partial_reps: 0,
          }),
        ),
      ).toBe("beginner");
      expect(
        getPerformanceLevel(
          mockWodRounds,
          createMockScore(mockWodRounds.id, {
            rounds_completed: 9,
            partial_reps: 0,
          }),
        ),
      ).toBe("beginner");
      // Check with partial reps
      expect(
        getPerformanceLevel(
          mockWodRounds,
          createMockScore(mockWodRounds.id, {
            rounds_completed: 24,
            partial_reps: 5,
          }),
        ),
      ).toBe("advanced");
      expect(
        getPerformanceLevel(
          mockWodRounds,
          createMockScore(mockWodRounds.id, {
            rounds_completed: 19,
            partial_reps: 99,
          }),
        ),
      ).toBe("intermediate");
    });

    // Load (higher is better)
    it("should return correct level for load benchmarks", () => {
      expect(
        getPerformanceLevel(
          mockWodLoad,
          createMockScore(mockWodLoad.id, { load: 410 }),
        ),
      ).toBe("elite");
      expect(
        getPerformanceLevel(
          mockWodLoad,
          createMockScore(mockWodLoad.id, { load: 405 }),
        ),
      ).toBe("elite");
      expect(
        getPerformanceLevel(
          mockWodLoad,
          createMockScore(mockWodLoad.id, { load: 400 }),
        ),
      ).toBe("advanced");
      expect(
        getPerformanceLevel(
          mockWodLoad,
          createMockScore(mockWodLoad.id, { load: 315 }),
        ),
      ).toBe("advanced");
      expect(
        getPerformanceLevel(
          mockWodLoad,
          createMockScore(mockWodLoad.id, { load: 310 }),
        ),
      ).toBe("intermediate");
      expect(
        getPerformanceLevel(
          mockWodLoad,
          createMockScore(mockWodLoad.id, { load: 225 }),
        ),
      ).toBe("intermediate");
      expect(
        getPerformanceLevel(
          mockWodLoad,
          createMockScore(mockWodLoad.id, { load: 220 }),
        ),
      ).toBe("beginner");
      expect(
        getPerformanceLevel(
          mockWodLoad,
          createMockScore(mockWodLoad.id, { load: 135 }),
        ),
      ).toBe("beginner");
      expect(
        getPerformanceLevel(
          mockWodLoad,
          createMockScore(mockWodLoad.id, { load: 130 }),
        ),
      ).toBe("beginner");
    });

    // Reps (higher is better)
    it("should return correct level for reps benchmarks", () => {
      expect(
        getPerformanceLevel(
          mockWodReps,
          createMockScore(mockWodReps.id, { reps: 35 }),
        ),
      ).toBe("elite");
      expect(
        getPerformanceLevel(
          mockWodReps,
          createMockScore(mockWodReps.id, { reps: 30 }),
        ),
      ).toBe("elite");
      expect(
        getPerformanceLevel(
          mockWodReps,
          createMockScore(mockWodReps.id, { reps: 29 }),
        ),
      ).toBe("advanced");
      expect(
        getPerformanceLevel(
          mockWodReps,
          createMockScore(mockWodReps.id, { reps: 20 }),
        ),
      ).toBe("advanced");
      expect(
        getPerformanceLevel(
          mockWodReps,
          createMockScore(mockWodReps.id, { reps: 19 }),
        ),
      ).toBe("intermediate");
      expect(
        getPerformanceLevel(
          mockWodReps,
          createMockScore(mockWodReps.id, { reps: 10 }),
        ),
      ).toBe("intermediate");
      expect(
        getPerformanceLevel(
          mockWodReps,
          createMockScore(mockWodReps.id, { reps: 9 }),
        ),
      ).toBe("beginner");
      expect(
        getPerformanceLevel(
          mockWodReps,
          createMockScore(mockWodReps.id, { reps: 5 }),
        ),
      ).toBe("beginner");
      expect(
        getPerformanceLevel(
          mockWodReps,
          createMockScore(mockWodReps.id, { reps: 4 }),
        ),
      ).toBe("beginner");
    });

    it("should return null if no benchmarks", () => {
      expect(
        getPerformanceLevel(
          mockWodNoBenchmark,
          createMockScore(mockWodNoBenchmark.id, { time_seconds: 120 }),
        ),
      ).toBe(null);
    });

    it("should return null if no numeric score can be determined", () => {
      expect(getPerformanceLevel(mockWodTime, mockScoreNoValue)).toBe(null);
      // This case should now return null because getNumericScore returns null
      expect(
        getPerformanceLevel(
          mockWodTime,
          createMockScore(mockWodTime.id, { reps: 20 }),
        ),
      ).toBe(null);
    });
  });

  describe("hasScore", () => {
    // Use new mock Score objects
    it("should return true if any score field is present", () => {
      expect(hasScore(mockScoreTime)).toBe(true);
      expect(hasScore(mockScoreReps)).toBe(true);
      expect(hasScore(mockScoreLoad)).toBe(true);
      expect(hasScore(mockScoreRounds)).toBe(true);
      expect(hasScore(mockScoreRoundsPartial)).toBe(true);
    });

    it("should return false if no score fields are present", () => {
      expect(hasScore(mockScoreNoValue)).toBe(false);
      // Test with a score object having only null values for score fields
      const scoreWithNulls = createMockScore("null-test", {
        time_seconds: null,
        reps: null,
        load: null,
        rounds_completed: null,
        partial_reps: null,
      });
      expect(hasScore(scoreWithNulls)).toBe(false);
    });
  });

  describe("sortWods", () => {
    // Remove results from wodsToSort and add id/createdAt
    const wodsToSort: Wod[] = [
      {
        id: "sort-A",
        createdAt: new Date("2024-01-15"),
        ...mockWodTime,
        wodName: "Fran",
        category: "Girl",
        tags: ["For Time", "Couplet"],
        countLikes: 100, // Use camelCase
        // results removed
      },
      {
        id: "sort-B",
        createdAt: new Date("2024-02-10"),
        ...mockWodRounds,
        wodName: "Cindy",
        category: "Girl",
        tags: ["AMRAP"],
        countLikes: 50, // Use camelCase
        // results removed
      },
      {
        id: "sort-C",
        createdAt: new Date("2024-01-17"),
        ...mockWodLoad,
        wodName: "Deadlift",
        category: "Benchmark",
        tags: ["Ladder"],
        countLikes: 75, // Use camelCase
        // results removed
      },
      {
        id: "sort-D",
        createdAt: new Date("2024-03-01"),
        ...mockWodTime,
        wodName: "Fran", // Same name as A
        category: "Girl",
        tags: ["For Time", "Couplet"],
        countLikes: 100, // Use camelCase
        // results removed
      },
      {
        id: "sort-E",
        createdAt: new Date("2023-05-15"),
        ...mockWodRounds,
        wodName: "Cindy", // Same name as B
        category: "Girl",
        tags: ["AMRAP"],
        countLikes: 25, // Use camelCase
        // results removed
      },
      {
        id: "sort-F",
        createdAt: new Date("2023-01-01"), // Placeholder
        ...mockWodReps,
        wodName: "Pull-ups",
        category: "Benchmark",
        countLikes: 10, // Use camelCase
        // results removed
      },
      {
        id: "sort-G",
        createdAt: new Date("2023-01-02"), // Placeholder
        ...mockWodReps,
        wodName: "Push-ups",
        category: "Benchmark",
        countLikes: undefined, // Use camelCase (defaults to 0 in sort)
        // results removed
      },
      {
        id: "sort-H",
        createdAt: new Date("2024-04-01"),
        ...mockWodRounds,
        wodName: "Cindy", // Same name as B, E
        category: "Girl",
        tags: ["AMRAP"],
        countLikes: 50, // Use camelCase
        // results removed
      },
    ];

    it("should sort by wodName ascending", () => {
      const sorted = sortWods(wodsToSort, "wodName", "asc");
      expect(sorted.map((w) => w.wodName)).toEqual([
        "Cindy",
        "Cindy",
        "Cindy",
        "Deadlift",
        "Fran",
        "Fran",
        "Pull-ups",
        "Push-ups",
      ]);
    });

    it("should sort by wodName descending", () => {
      const sorted = sortWods(wodsToSort, "wodName", "desc");
      expect(sorted.map((w) => w.wodName)).toEqual([
        "Push-ups",
        "Pull-ups",
        "Fran",
        "Fran",
        "Deadlift",
        "Cindy",
        "Cindy",
        "Cindy",
      ]);
    });

    // Remove tests for date, attempts, level, latestLevel as they are disabled

    it("should sort by countLikes ascending", () => {
      const sorted = sortWods(wodsToSort, "countLikes", "asc");
      // Likes: G(0), F(10), E(25), B(50), H(50), C(75), A(100), D(100)
      // Secondary sort name asc: G, F, E, B, H, C, A, D
      expect(sorted.map((w) => w.wodName)).toEqual([
        "Push-ups", // 0
        "Pull-ups", // 10
        "Cindy", // 25
        "Cindy", // 50 (B)
        "Cindy", // 50 (H)
        "Deadlift", // 75
        "Fran", // 100 (A)
        "Fran", // 100 (D)
      ]);
    });

    it("should sort by countLikes descending", () => {
      const sorted = sortWods(wodsToSort, "countLikes", "desc");
      // Likes: A(100), D(100), C(75), B(50), H(50), E(25), F(10), G(0)
      // Secondary sort name desc: D, A, C, H, B, E, F, G
      expect(sorted.map((w) => w.wodName)).toEqual([
        "Fran", // 100 (D)
        "Fran", // 100 (A)
        "Deadlift", // 75
        "Cindy", // 50 (H)
        "Cindy", // 50 (B)
        "Cindy", // 25
        "Pull-ups", // 10
        "Push-ups", // 0
      ]);
    });
  });
});

// --- Mock Child Components ---
// Mock WodTable and WodTimeline to check props passed to them
vi.mock("./WodTable", () => ({
  default: vi.fn(
    ({
      wods,
      sortBy,
      sortDirection,
      handleSort,
      searchTerm, // Add searchTerm
      tableHeight, // Add tableHeight
    }: {
      wods: Wod[];
      sortBy: SortByType;
      sortDirection: SortDirection;
      handleSort: (column: SortByType) => void;
      searchTerm: string; // Add type
      tableHeight: number; // Add type
    }) => (
      <div data-testid="wod-table" style={{ height: `${tableHeight}px` }}>
        <span>WodTable Mock</span>
        <span data-testid="table-wod-count">{wods.length}</span>
        <span data-testid="table-sort-by">{sortBy}</span>
        <span data-testid="table-sort-direction">{sortDirection}</span>
        <span data-testid="table-search-term">{searchTerm}</span>
        <button onClick={() => handleSort("wodName")}>
          Sort Table By Name
        </button>
      </div>
    ),
  ),
}));

vi.mock("./WodTimeline", () => ({
  default: vi.fn(
    ({
      wods,
      sortBy,
      sortDirection,
      handleSort,
      searchTerm, // Add searchTerm
      tableHeight, // Add tableHeight
    }: {
      wods: Wod[];
      sortBy: SortByType;
      sortDirection: SortDirection;
      handleSort: (column: SortByType) => void;
      searchTerm: string; // Add type
      tableHeight: number; // Add type
    }) => (
      <div data-testid="wod-timeline" style={{ height: `${tableHeight}px` }}>
        <span>WodTimeline Mock</span>
        <span data-testid="timeline-wod-count">{wods.length}</span>
        <span data-testid="timeline-sort-by">{sortBy}</span>
        <span data-testid="timeline-sort-direction">{sortDirection}</span>
        <span data-testid="timeline-search-term">{searchTerm}</span>
        <button onClick={() => handleSort("wodName")}>
          {" "}
          {/* Changed to wodName as date sort is disabled */}
          Sort Timeline By Name
        </button>
      </div>
    ),
  ),
}));

// --- Mock tRPC hook ---
// Variable to hold the mock query result for WODs, defined OUTSIDE the describe block
let mockWodQueryResult: {
  data: Wod[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: { message: string } | null;
};

// Variable to hold the mock query result for Scores
let mockScoreQueryResult: {
  data: Score[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: { message: string } | null;
};

vi.mock("~/trpc/react", () => {
  return {
    api: {
      wod: {
        getAll: {
          // Return the mockWodQueryResult variable
          useQuery: vi.fn(() => mockWodQueryResult),
        },
      },
      score: {
        getAllByUser: {
          // Return the mockScoreQueryResult variable
          useQuery: vi.fn(() => mockScoreQueryResult),
        },
      },
    },
  };
});
// --- End Mock tRPC hook ---

// --- Component Tests ---
describe("WodViewer Component", () => {
  // WodViewer no longer takes categoryOrder/tagOrder as props, they are derived internally

  // Use the same mock data from helper tests where applicable, remove results, add id/createdAt
  const testWods: Wod[] = [
    {
      id: "test-A",
      createdAt: new Date(),
      wodUrl: "test.com/fran",
      wodName: "Fran",
      category: "Girl",
      tags: ["For Time", "Couplet"],
      countLikes: 100,
      benchmarks: mockWodTime.benchmarks, // Reuse benchmark structure
      // results removed
    },
    {
      id: "test-B",
      createdAt: new Date(),
      wodUrl: "test.com/cindy",
      wodName: "Cindy",
      category: "Girl",
      tags: ["AMRAP"],
      countLikes: 50,
      benchmarks: mockWodRounds.benchmarks,
      // results removed
    },
    {
      id: "test-C",
      createdAt: new Date(),
      wodUrl: "test.com/deadlift",
      wodName: "Deadlift",
      category: "Benchmark",
      tags: ["Ladder"],
      countLikes: 75,
      benchmarks: mockWodLoad.benchmarks,
      // results removed
    },
    {
      id: "test-D",
      createdAt: new Date(),
      wodUrl: "test.com/pullups",
      wodName: "Pull-ups",
      category: "Benchmark",
      tags: [], // Ensure tags is an array
      countLikes: 10,
      benchmarks: mockWodReps.benchmarks,
      // results removed
    },
    {
      id: "test-E",
      createdAt: new Date(),
      wodUrl: "test.com/pushups",
      wodName: "Push-ups",
      category: "Benchmark",
      tags: [],
      countLikes: 0, // Explicitly 0 if undefined
      benchmarks: mockWodReps.benchmarks,
      // results removed
    },
    {
      id: "test-F",
      createdAt: new Date(),
      wodUrl: "test.com/murph",
      wodName: "Murph",
      category: "Hero",
      tags: ["Chipper", "For Time"],
      countLikes: 500,
      benchmarks: mockWodTime.benchmarks, // Example benchmark
      // results removed
    },
  ];

  beforeEach(() => {
    // Reset mocks and search params before each test
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams(); // Reset to empty
    // Set the default successful query result for WODs
    mockWodQueryResult = {
      data: testWods,
      isLoading: false,
      isError: false,
      error: null,
    };
    // Set the default successful query result for Scores (empty array)
    mockScoreQueryResult = {
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Ensure mocks are fully restored
  });

  it("should show loading state", () => {
    // Directly set the mock result for WODs
    mockWodQueryResult = {
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    }; // End assignment
    render(<WodViewer />);
    expect(screen.getByText(/Loading data.../i)).toBeInTheDocument();
  });

  it("should show error state", () => {
    // Directly set the mock result for WODs
    mockWodQueryResult = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: { message: "Failed to fetch" },
    }; // End assignment
    render(<WodViewer />);
    expect(
      screen.getByText(/Error loading WODs: Failed to fetch/i),
    ).toBeInTheDocument();
  });

  it("should render table view by default (no URL params)", () => {
    render(<WodViewer />);

    // Check table is rendered by default
    expect(screen.getByTestId("wod-table")).toBeInTheDocument();
    expect(screen.queryByTestId("wod-timeline")).not.toBeInTheDocument();

    // Table view with default filters (no completion filter applied initially)
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("6"); // All WODs shown initially

    // Check default sort state passed to table (date/desc)
    expect(screen.getByTestId("table-sort-by")).toHaveTextContent("date");
    expect(screen.getByTestId("table-sort-direction")).toHaveTextContent(
      "desc",
    );

    // Completion filter should be visible
    expect(
      screen.getByRole("radio", { name: /All \(\d+\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Done \(\d+\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Todo \(\d+\)/i }),
    ).toBeInTheDocument();
  });

  it("should filter by category and update URL", async () => {
    render(<WodViewer />);
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("6"); // All WODs initially

    // Find the category select trigger
    const categorySelect = screen.getByRole("combobox");
    fireEvent.click(categorySelect);

    // Select Benchmark category (C, D, E)
    const benchmarkItem = await screen.findByText("Benchmark");
    fireEvent.click(benchmarkItem);

    await waitFor(() => {
      expect(screen.getByTestId("table-wod-count")).toHaveTextContent("3");
      expect(mockRouterReplace).toHaveBeenCalledWith("/?category=Benchmark", {
        scroll: false,
      });
    });
    mockRouterReplace.mockClear();

    // Select 'All' again
    fireEvent.click(categorySelect);
    const allItem = await screen.findByText("All");
    fireEvent.click(allItem);

    await waitFor(() => {
      expect(screen.getByTestId("table-wod-count")).toHaveTextContent("6");
      const lastCall = mockRouterReplace.mock.lastCall;
      expect(lastCall[0]).toMatch(/^\/\??$/);
      expect(lastCall[1]).toEqual({ scroll: false });
    });
  });

  it("should filter by tags and update URL (multiple)", async () => {
    render(<WodViewer />);
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("6");

    // Click 'For Time' tag (A, F)
    fireEvent.click(screen.getByText("For Time"));
    await waitFor(() => {
      expect(screen.getByTestId("table-wod-count")).toHaveTextContent("2");
      expect(mockRouterReplace).toHaveBeenCalledWith("/?tags=For+Time", {
        scroll: false,
      });
    });
    mockRouterReplace.mockClear();

    // Click 'AMRAP' tag - now filters for ('For Time' OR 'AMRAP') -> (A, B, F)
    fireEvent.click(screen.getByText("AMRAP"));
    await waitFor(() => {
      expect(screen.getByTestId("table-wod-count")).toHaveTextContent("3");
      expect(mockRouterReplace).toHaveBeenCalledWith(
        "/?tags=For+Time%2CAMRAP",
        { scroll: false },
      );
    });
    mockRouterReplace.mockClear();

    // Click 'For Time' again to deselect it - should show only 'AMRAP' (B)
    fireEvent.click(screen.getByText("For Time"));
    await waitFor(() => {
      expect(screen.getByTestId("table-wod-count")).toHaveTextContent("1");
      expect(mockRouterReplace).toHaveBeenCalledWith("/?tags=AMRAP", {
        scroll: false,
      });
    });
    mockRouterReplace.mockClear();

    // Click 'AMRAP' again to deselect - should show all WODs again
    fireEvent.click(screen.getByText("AMRAP"));
    await waitFor(() => {
      expect(screen.getByTestId("table-wod-count")).toHaveTextContent("6");
      const lastCall = mockRouterReplace.mock.lastCall;
      expect(lastCall[0]).toMatch(/^\/\??$/);
      expect(lastCall[1]).toEqual({ scroll: false });
    });
  });

  // Completion filter tests removed as the filter is no longer rendered

  it("should handle sorting correctly and update URL", async () => {
    render(<WodViewer />);
    await waitFor(() => {
      expect(screen.getByTestId("table-sort-by")).toHaveTextContent("wodName");
      expect(screen.getByTestId("table-sort-direction")).toHaveTextContent(
        "asc",
      );
    });
    mockRouterReplace.mockClear();

    // Simulate sort trigger from mocked child component (clicking name header)
    const sortButton = screen.getByRole("button", {
      name: /Sort Table By Name/i,
    });
    fireEvent.click(sortButton); // Click once (already wodName/asc, should toggle to desc)

    await waitFor(() => {
      expect(screen.getByTestId("table-sort-by")).toHaveTextContent("wodName");
      expect(screen.getByTestId("table-sort-direction")).toHaveTextContent(
        "desc",
      );
      expect(mockRouterReplace).toHaveBeenCalledWith(
        "/?sortBy=wodName&sortDir=desc",
        { scroll: false },
      );
    });

    // Click again to toggle back to asc
    fireEvent.click(sortButton);
    await waitFor(() => {
      expect(screen.getByTestId("table-sort-by")).toHaveTextContent("wodName");
      expect(screen.getByTestId("table-sort-direction")).toHaveTextContent(
        "asc",
      );
      // sortDir=asc is default for wodName, so it should be removed from URL
      expect(mockRouterReplace).toHaveBeenCalledWith("/?sortBy=wodName", {
        scroll: false,
      });
    });
  });

  it("should render correctly with empty wods array", () => {
    // Directly set the mock result for WODs
    mockWodQueryResult = {
      data: [] as Wod[], // Explicitly type empty array
      isLoading: false,
      isError: false,
      error: null,
    }; // End assignment
    render(<WodViewer />);

    expect(screen.getByTestId("wod-table")).toBeInTheDocument();
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("0");

    // Switch to timeline view
    fireEvent.click(screen.getByRole("radio", { name: /Timeline View/i }));
    expect(screen.getByTestId("wod-timeline")).toBeInTheDocument();
    expect(screen.getByTestId("timeline-wod-count")).toHaveTextContent("0");

    // Filters should still be present
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("For Time")).toBeInTheDocument();
    // Completion filter is gone
  });

  // --- Tests for Initialization from URL ---

  it("should initialize with category from URL", () => {
    mockSearchParams = new URLSearchParams("?category=Benchmark");
    render(<WodViewer />);

    expect(screen.getByRole("combobox")).toHaveTextContent(
      /Benchmark \(\d+\)/i,
    );
    // Check filtered WODs (Benchmark = C, D, E)
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("3");
  });

  it("should initialize with tags from URL", () => {
    mockSearchParams = new URLSearchParams("?tags=AMRAP%2CLadder"); // B, C
    render(<WodViewer />);

    expect(screen.getByText("AMRAP")).toHaveClass(
      "border-primary bg-primary text-primary-foreground",
    );
    expect(screen.getByText("Ladder")).toHaveClass(
      "border-primary bg-primary text-primary-foreground",
    );
    expect(screen.getByText("For Time")).not.toHaveClass(
      "border-primary bg-primary text-primary-foreground",
    );

    // Check filtered WODs (AMRAP or Ladder = B, C)
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("2");
  });

  // Completion filter tests removed

  it("should initialize with view=timeline from URL", () => {
    mockSearchParams = new URLSearchParams("?view=timeline");
    render(<WodViewer />);

    expect(screen.getByTestId("wod-timeline")).toBeInTheDocument();
    expect(screen.queryByTestId("wod-table")).not.toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Timeline View/i, checked: true }),
    ).toBeInTheDocument();

    // Check default sort
    expect(screen.getByTestId("timeline-wod-count")).toHaveTextContent("6"); // All WODs
    expect(screen.getByTestId("timeline-sort-by")).toHaveTextContent("wodName");
    expect(screen.getByTestId("timeline-sort-direction")).toHaveTextContent(
      "asc",
    );
  });

  it("should initialize with sortBy and sortDir from URL", () => {
    mockSearchParams = new URLSearchParams("?sortBy=countLikes&sortDir=asc");
    render(<WodViewer />);

    expect(screen.getByTestId("table-sort-by")).toHaveTextContent("countLikes");
    expect(screen.getByTestId("table-sort-direction")).toHaveTextContent("asc");

    // Check default view/filters
    expect(screen.getByTestId("wod-table")).toBeInTheDocument();
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("6");
  });

  it("should initialize with multiple parameters from URL including view/sort", () => {
    mockSearchParams = new URLSearchParams(
      "?category=Girl&tags=AMRAP&view=timeline&sortBy=countLikes&sortDir=desc",
    );
    render(<WodViewer />);

    // Check category
    expect(screen.getByRole("combobox")).toHaveTextContent(/Girl \(\d+\)/i);
    // Check tag
    expect(screen.getByText("AMRAP")).toHaveClass(
      "border-primary bg-primary text-primary-foreground",
    );

    // Check filtered WODs (Girl + AMRAP = Wod B) - Should be timeline view
    expect(screen.getByTestId("timeline-wod-count")).toHaveTextContent("1");
    // Check sort
    expect(screen.getByTestId("timeline-sort-by")).toHaveTextContent(
      "countLikes",
    );
    expect(screen.getByTestId("timeline-sort-direction")).toHaveTextContent(
      "desc",
    );
  });

  it("should ignore invalid URL parameters and use defaults", () => {
    mockSearchParams = new URLSearchParams(
      "?category=InvalidCat&tags=InvalidTag,AMRAP&view=invalidView&sortBy=invalidSort&sortDir=invalidDir",
    );
    render(<WodViewer />);

    // Check category defaults to 'All'
    expect(screen.getByRole("combobox")).toHaveTextContent(/All \(\d+\)/i);
    // Check only valid tag 'AMRAP' is selected
    expect(screen.getByText("AMRAP")).toHaveClass(
      "border-primary bg-primary text-primary-foreground",
    );
    expect(screen.queryByText("InvalidTag")).toBeNull();

    // Check filtered WODs (AMRAP = Wod B)
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("1");

    // Check view/sort defaults
    expect(screen.getByTestId("wod-table")).toBeInTheDocument(); // Default view
    expect(screen.getByTestId("table-sort-by")).toHaveTextContent("wodName"); // Default sort
    expect(screen.getByTestId("table-sort-direction")).toHaveTextContent("asc"); // Default direction
  });

  it("should update URL correctly when changing view", async () => {
    render(<WodViewer />);
    mockRouterReplace.mockClear();

    // Switch to timeline
    fireEvent.click(screen.getByRole("radio", { name: /Timeline View/i }));
    await waitFor(() => {
      expect(screen.getByTestId("wod-timeline")).toBeInTheDocument();
      expect(mockRouterReplace).toHaveBeenCalledWith("/?view=timeline", {
        scroll: false,
      });
    });

    // Switch back to table
    fireEvent.click(screen.getByRole("radio", { name: /Table View/i }));
    await waitFor(() => {
      expect(screen.getByTestId("wod-table")).toBeInTheDocument();
      const lastCall = mockRouterReplace.mock.lastCall;
      expect(lastCall[0]).toMatch(/^\/\??$/);
      expect(lastCall[1]).toEqual({ scroll: false });
    });
  });

  it("should update URL correctly when changing filters and view/sort are non-default", async () => {
    mockSearchParams = new URLSearchParams("?view=timeline&sortBy=countLikes"); // sortDir=desc is default
    render(<WodViewer />);

    await waitFor(() => {
      expect(screen.getByTestId("wod-timeline")).toBeInTheDocument();
      expect(screen.getByTestId("timeline-sort-by")).toHaveTextContent(
        "countLikes",
      );
      expect(screen.getByTestId("timeline-sort-direction")).toHaveTextContent(
        "desc",
      );
    });
    mockRouterReplace.mockClear();

    // Change category filter to 'Benchmark'
    const categorySelect = screen.getByRole("combobox");
    fireEvent.click(categorySelect);
    const benchmarkItem = await screen.findByText(/Benchmark \(\d+\)/i);
    fireEvent.click(benchmarkItem);

    await waitFor(() => {
      // Params sorted: category, sortBy, view (sortDir=desc is default for countLikes)
      expect(mockRouterReplace).toHaveBeenCalledWith(
        "/?category=Benchmark&sortBy=countLikes&view=timeline",
        { scroll: false },
      );
    });
  });

  it("should handle search term input and update URL", async () => {
    render(<WodViewer />);
    const searchInput = screen.getByPlaceholderText(/Search.../i);

    fireEvent.change(searchInput, { target: { value: "fran" } });

    await waitFor(() => {
      expect(searchInput).toHaveValue("fran");
      // Check URL update after debounce
      expect(mockRouterReplace).toHaveBeenCalledWith("/?search=fran", {
        scroll: false,
      });
      // Check search term passed to table mock
      expect(screen.getByTestId("table-search-term")).toHaveTextContent("fran");
    });

    // Clear search
    fireEvent.change(searchInput, { target: { value: "" } });
    await waitFor(() => {
      expect(searchInput).toHaveValue("");
      // Check URL update after debounce (back to root)
      const lastCall = mockRouterReplace.mock.lastCall;
      expect(lastCall[0]).toMatch(/^\/\??$/);
      expect(lastCall[1]).toEqual({ scroll: false });
      // Check search term passed to table mock
      expect(screen.getByTestId("table-search-term")).toHaveTextContent("");
    });
  });

  it("should initialize search term from URL", () => {
    mockSearchParams = new URLSearchParams("?search=cindy");
    render(<WodViewer />);

    const searchInput = screen.getByPlaceholderText(/Search.../i);
    expect(searchInput).toHaveValue("cindy");
    // Check search term passed to table mock
    expect(screen.getByTestId("table-search-term")).toHaveTextContent("cindy");
  });
});
