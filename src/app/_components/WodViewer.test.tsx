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
import type { Wod, WodResult, SortByType } from "~/types/wodTypes"; // Import types
import { type ReadonlyURLSearchParams } from "next/navigation"; // Keep this import

// --- Mocks for next/navigation ---
let mockSearchParams = new URLSearchParams(); // Default empty params - MUTABLE

// Mock router.replace to ALSO update the mockSearchParams
// Correct signature to accept both arguments
const mockRouterReplace = vi.fn(
  (pathWithQuery: string, options?: { scroll: boolean }) => {
    try {
      // Use a dummy base URL as we only care about the search part
      const url = new URL(pathWithQuery, "http://localhost");
      mockSearchParams = new URLSearchParams(url.search);
    } catch (e) {
      // Handle potential URL parsing errors if needed, though unlikely for test paths
      mockSearchParams = new URLSearchParams(); // Default to empty on error
    }
  },
);

// Correct signature to accept both arguments
const mockRouterPush = vi.fn(
  (pathWithQuery: string, options?: { scroll: boolean }) => {
    // Also update params on push if used
    try {
      // Use a dummy base URL as we only care about the search part
      const url = new URL(pathWithQuery, "http://localhost");
      mockSearchParams = new URLSearchParams(url.search);
    } catch (e) {
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
  const actual =
    await vi.importActual<typeof import("next/navigation")>("next/navigation");
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

const mockWodTime: Wod = {
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
  results: [], // Results added per test case
};

const mockWodRounds: Wod = {
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
  results: [],
};

const mockWodLoad: Wod = {
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
  results: [],
};

const mockWodReps: Wod = {
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
  results: [],
};

const mockWodNoBenchmark: Wod = {
  wodUrl: "test.com/random",
  wodName: "Random WOD",
  results: [],
};

const mockResultTime = (seconds: number | null, rx = true): WodResult => ({
  score_time_seconds: seconds,
  score_reps: null,
  score_load: null,
  score_rounds_completed: null,
  score_partial_reps: null,
  rxStatus: rx ? "Rx" : "Scaled",
  date: "2024-01-15",
});

const mockResultRounds = (
  rounds: number | null,
  partialReps: number | null = 0,
  rx = true,
): WodResult => ({
  score_time_seconds: null,
  score_reps: null,
  score_load: null,
  score_rounds_completed: rounds,
  score_partial_reps: partialReps,
  rxStatus: rx ? "Rx" : "Scaled",
  date: "2024-01-16",
});

const mockResultLoad = (load: number | null, rx = true): WodResult => ({
  score_time_seconds: null,
  score_reps: null,
  score_load: load,
  score_rounds_completed: null,
  score_partial_reps: null,
  rxStatus: rx ? "Rx" : "Scaled",
  date: "2024-01-17",
});

const mockResultReps = (reps: number | null, rx = true): WodResult => ({
  score_time_seconds: null,
  score_reps: reps,
  score_load: null,
  score_rounds_completed: null,
  score_partial_reps: null,
  rxStatus: rx ? "Rx" : "Scaled",
  date: "2024-01-18",
});

const mockResultNoScore = (): WodResult => ({
  score_time_seconds: null,
  score_reps: null,
  score_load: null,
  score_rounds_completed: null,
  score_partial_reps: null,
  rxStatus: null,
  date: "2024-01-19",
});

// --- Tests ---

describe("WodViewer Helper Functions", () => {
  // ... (helper function tests remain the same) ...
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
    // Note: The 'currentLevel' parameter is no longer used to select the output, but we still pass it for function signature compatibility.
    it("should return correct multi-line tooltip for time benchmarks", () => {
      const expectedTooltip = [
        "Elite: 0:00 - 2:00",
        "Advanced: 0:00 - 3:00",
        "Intermediate: 0:00 - 5:00",
        "Beginner: 0:00 - 8:00",
      ].join("\n");
      // Call with only one argument
      expect(getPerformanceLevelTooltip(mockWodTime)).toBe(expectedTooltip);
      // The output should be the same regardless of the 'currentLevel' passed
      expect(getPerformanceLevelTooltip(mockWodTime)).toBe(expectedTooltip);
    });

    it("should return correct multi-line tooltip for rounds benchmarks", () => {
      const expectedTooltip = [
        "Elite: 25 - ∞ rounds",
        "Advanced: 20 - ∞ rounds",
        "Intermediate: 15 - ∞ rounds",
        "Beginner: 10 - ∞ rounds",
      ].join("\n");
      // Call with only one argument
      expect(getPerformanceLevelTooltip(mockWodRounds)).toBe(expectedTooltip);
      expect(getPerformanceLevelTooltip(mockWodRounds)).toBe(expectedTooltip);
    });

    it("should return correct multi-line tooltip for load benchmarks", () => {
      const expectedTooltip = [
        "Elite: 405 - ∞ lbs", // Updated unit
        "Advanced: 315 - ∞ lbs", // Updated unit
        "Intermediate: 225 - ∞ lbs", // Updated unit
        "Beginner: 135 - ∞ lbs", // Updated unit
      ].join("\n");
      // Call with only one argument
      expect(getPerformanceLevelTooltip(mockWodLoad)).toBe(expectedTooltip);
      expect(getPerformanceLevelTooltip(mockWodLoad)).toBe(expectedTooltip);
    });

    it("should return correct multi-line tooltip for reps benchmarks", () => {
      const expectedTooltip = [
        "Elite: 30 - ∞ reps",
        "Advanced: 20 - ∞ reps",
        "Intermediate: 10 - ∞ reps",
        "Beginner: 5 - ∞ reps",
      ].join("\n");
      // Call with only one argument
      expect(getPerformanceLevelTooltip(mockWodReps)).toBe(expectedTooltip);
      expect(getPerformanceLevelTooltip(mockWodReps)).toBe(expectedTooltip);
    });

    it("should return default message if no benchmarks", () => {
      // The function now ignores the 'currentLevel' if benchmarks are missing
      // Call with only one argument
      expect(getPerformanceLevelTooltip(mockWodNoBenchmark)).toBe(
        "No benchmark data available",
      );
      expect(getPerformanceLevelTooltip(mockWodNoBenchmark)).toBe(
        "No benchmark data available",
      );
    });
    // Test case where benchmarks exist but currentLevel is null (should still show all levels)
    it("should return all levels even if currentLevel is null", () => {
      const expectedTooltip = [
        "Elite: 0:00 - 2:00",
        "Advanced: 0:00 - 3:00",
        "Intermediate: 0:00 - 5:00",
        "Beginner: 0:00 - 8:00",
      ].join("\n");
      // Call with only one argument
      expect(getPerformanceLevelTooltip(mockWodTime)).toBe(expectedTooltip);
    });
  });

  describe("formatScore", () => {
    it("should format time scores", () => {
      expect(formatScore(mockResultTime(155))).toBe("2:35");
    });

    it("should format reps scores", () => {
      expect(formatScore(mockResultReps(25))).toBe("25 reps");
    });

    it("should format load scores", () => {
      expect(formatScore(mockResultLoad(225))).toBe("225 lbs");
    });

    it("should format rounds scores", () => {
      expect(formatScore(mockResultRounds(15))).toBe("15 rounds"); // Updated expectation
    });

    it("should format rounds + partial reps scores", () => {
      expect(formatScore(mockResultRounds(15, 10))).toBe("15+10");
    });

    it("should return dash if no score", () => {
      // Updated test description
      expect(formatScore(mockResultNoScore())).toBe("-"); // Updated expectation
    });
  });

  describe("getNumericScore", () => {
    it("should return time in seconds for time benchmarks", () => {
      expect(getNumericScore(mockWodTime, mockResultTime(110))).toBe(110);
    });

    it("should return reps for reps benchmarks", () => {
      expect(getNumericScore(mockWodReps, mockResultReps(22))).toBe(22);
    });

    it("should return load for load benchmarks", () => {
      expect(getNumericScore(mockWodLoad, mockResultLoad(350))).toBe(350);
    });

    it("should return rounds as integer for rounds benchmarks", () => {
      expect(getNumericScore(mockWodRounds, mockResultRounds(18))).toBe(18);
    });

    it("should return rounds + partial reps as decimal for rounds benchmarks", () => {
      expect(getNumericScore(mockWodRounds, mockResultRounds(18, 5))).toBe(
        18.05,
      );
    });

    it("should return null if benchmark type mismatch", () => {
      expect(getNumericScore(mockWodTime, mockResultReps(20))).toBe(null);
      expect(getNumericScore(mockWodReps, mockResultTime(120))).toBe(null);
    });

    it("should return null if no benchmarks", () => {
      expect(getNumericScore(mockWodNoBenchmark, mockResultTime(120))).toBe(
        null,
      );
    });

    it("should return null if no score", () => {
      expect(getNumericScore(mockWodTime, mockResultNoScore())).toBe(null);
    });
  });

  describe("getPerformanceLevel", () => {
    // Time (lower is better)
    it("should return correct level for time benchmarks", () => {
      expect(getPerformanceLevel(mockWodTime, mockResultTime(110))).toBe(
        "elite",
      ); // 1:50
      expect(getPerformanceLevel(mockWodTime, mockResultTime(120))).toBe(
        "elite",
      ); // 2:00
      expect(getPerformanceLevel(mockWodTime, mockResultTime(121))).toBe(
        "advanced",
      ); // 2:01
      expect(getPerformanceLevel(mockWodTime, mockResultTime(180))).toBe(
        "advanced",
      ); // 3:00
      expect(getPerformanceLevel(mockWodTime, mockResultTime(181))).toBe(
        "intermediate",
      ); // 3:01
      expect(getPerformanceLevel(mockWodTime, mockResultTime(300))).toBe(
        "intermediate",
      ); // 5:00
      expect(getPerformanceLevel(mockWodTime, mockResultTime(301))).toBe(
        "beginner",
      ); // 5:01
      expect(getPerformanceLevel(mockWodTime, mockResultTime(500))).toBe(
        "beginner",
      ); // 8:20
    });

    // Rounds (higher is better)
    it("should return correct level for rounds benchmarks", () => {
      expect(getPerformanceLevel(mockWodRounds, mockResultRounds(26))).toBe(
        "elite",
      );
      expect(getPerformanceLevel(mockWodRounds, mockResultRounds(25))).toBe(
        "elite",
      );
      expect(getPerformanceLevel(mockWodRounds, mockResultRounds(24))).toBe(
        "advanced",
      );
      expect(getPerformanceLevel(mockWodRounds, mockResultRounds(20))).toBe(
        "advanced",
      );
      expect(getPerformanceLevel(mockWodRounds, mockResultRounds(19))).toBe(
        "intermediate",
      );
      expect(getPerformanceLevel(mockWodRounds, mockResultRounds(15))).toBe(
        "intermediate",
      );
      expect(getPerformanceLevel(mockWodRounds, mockResultRounds(14))).toBe(
        "beginner",
      );
      expect(getPerformanceLevel(mockWodRounds, mockResultRounds(10))).toBe(
        "beginner",
      );
      expect(getPerformanceLevel(mockWodRounds, mockResultRounds(9))).toBe(
        "beginner",
      );
      // With partial reps
      expect(getPerformanceLevel(mockWodRounds, mockResultRounds(24, 5))).toBe(
        "advanced",
      ); // 24.05
      expect(getPerformanceLevel(mockWodRounds, mockResultRounds(19, 99))).toBe(
        "intermediate",
      ); // 19.99
    });

    // Load (higher is better)
    it("should return correct level for load benchmarks", () => {
      expect(getPerformanceLevel(mockWodLoad, mockResultLoad(410))).toBe(
        "elite",
      );
      expect(getPerformanceLevel(mockWodLoad, mockResultLoad(405))).toBe(
        "elite",
      );
      expect(getPerformanceLevel(mockWodLoad, mockResultLoad(400))).toBe(
        "advanced",
      );
      expect(getPerformanceLevel(mockWodLoad, mockResultLoad(315))).toBe(
        "advanced",
      );
      expect(getPerformanceLevel(mockWodLoad, mockResultLoad(310))).toBe(
        "intermediate",
      );
      expect(getPerformanceLevel(mockWodLoad, mockResultLoad(225))).toBe(
        "intermediate",
      );
      expect(getPerformanceLevel(mockWodLoad, mockResultLoad(220))).toBe(
        "beginner",
      );
      expect(getPerformanceLevel(mockWodLoad, mockResultLoad(135))).toBe(
        "beginner",
      );
      expect(getPerformanceLevel(mockWodLoad, mockResultLoad(130))).toBe(
        "beginner",
      );
    });

    // Reps (higher is better)
    it("should return correct level for reps benchmarks", () => {
      expect(getPerformanceLevel(mockWodReps, mockResultReps(35))).toBe(
        "elite",
      );
      expect(getPerformanceLevel(mockWodReps, mockResultReps(30))).toBe(
        "elite",
      );
      expect(getPerformanceLevel(mockWodReps, mockResultReps(29))).toBe(
        "advanced",
      );
      expect(getPerformanceLevel(mockWodReps, mockResultReps(20))).toBe(
        "advanced",
      );
      expect(getPerformanceLevel(mockWodReps, mockResultReps(19))).toBe(
        "intermediate",
      );
      expect(getPerformanceLevel(mockWodReps, mockResultReps(10))).toBe(
        "intermediate",
      );
      expect(getPerformanceLevel(mockWodReps, mockResultReps(9))).toBe(
        "beginner",
      );
      expect(getPerformanceLevel(mockWodReps, mockResultReps(5))).toBe(
        "beginner",
      );
      expect(getPerformanceLevel(mockWodReps, mockResultReps(4))).toBe(
        "beginner",
      );
    });

    it("should return null if no benchmarks", () => {
      expect(getPerformanceLevel(mockWodNoBenchmark, mockResultTime(120))).toBe(
        null,
      );
    });

    it("should return null if no numeric score can be determined", () => {
      expect(getPerformanceLevel(mockWodTime, mockResultNoScore())).toBe(null);
      expect(getPerformanceLevel(mockWodTime, mockResultReps(20))).toBe(null); // Mismatch
    });
  });

  describe("hasScore", () => {
    it("should return true if any score field is present", () => {
      expect(hasScore(mockResultTime(120))).toBe(true);
      expect(hasScore(mockResultReps(10))).toBe(true);
      expect(hasScore(mockResultLoad(135))).toBe(true);
      expect(hasScore(mockResultRounds(5))).toBe(true);
      expect(hasScore(mockResultRounds(5, 10))).toBe(true);
    });

    it("should return false if no score fields are present", () => {
      expect(hasScore(mockResultNoScore())).toBe(false);
      // Ensure the object conforms to WodResult type
      const resultWithNoScores: WodResult = {
        date: "2023-01-01",
        rxStatus: "Rx",
        score_time_seconds: null,
        score_reps: null,
        score_load: null,
        score_rounds_completed: null,
        score_partial_reps: null,
      };
      expect(hasScore(resultWithNoScores)).toBe(false);
    });
  });

  describe("sortWods", () => {
    const wodsToSort: Wod[] = [
      {
        // Wod A - Fran, faster time, older date, 1 attempt, elite
        ...mockWodTime,
        wodName: "Fran",
        results: [mockResultTime(110, true)], // Elite
        category: "Girl",
        tags: ["For Time", "Couplet"],
      },
      {
        // Wod B - Cindy, fewer rounds, newer date, 2 attempts, intermediate
        ...mockWodRounds,
        wodName: "Cindy",
        results: [
          { ...mockResultRounds(18, 0, true), date: "2024-02-10" }, // Intermediate
          { ...mockResultRounds(15, 0, true), date: "2023-11-05" }, // Intermediate
        ],
        category: "Girl",
        tags: ["AMRAP"],
      },
      {
        // Wod C - Deadlift, lower weight, middle date, 1 attempt, beginner (scaled)
        ...mockWodLoad,
        wodName: "Deadlift",
        results: [mockResultLoad(200, false)], // Beginner (Scaled)
        category: "Benchmark",
        tags: ["Ladder"],
      },
      {
        // Wod D - Fran, slower time, latest date, 1 attempt, advanced
        ...mockWodTime,
        wodName: "Fran", // Same name as A
        results: [{ ...mockResultTime(150, true), date: "2024-03-01" }], // Advanced
        category: "Girl",
        tags: ["For Time", "Couplet"],
      },
      {
        // Wod E - Cindy, more rounds, earliest date, 1 attempt, elite (scaled)
        ...mockWodRounds,
        wodName: "Cindy", // Same name as B
        results: [{ ...mockResultRounds(26, 0, false), date: "2023-05-15" }], // Elite (Scaled)
        category: "Girl",
        tags: ["AMRAP"],
      },
      {
        // Wod F - No results
        ...mockWodReps,
        wodName: "Pull-ups",
        results: [],
        category: "Benchmark",
      },
      {
        // Wod G - Result with no score
        ...mockWodReps,
        wodName: "Push-ups",
        results: [mockResultNoScore()],
        category: "Benchmark",
      },
      {
        // Wod H - Cindy, latest result is better
        ...mockWodRounds,
        wodName: "Cindy", // Same name as B, E
        results: [
          { ...mockResultRounds(15, 0, true), date: "2023-10-01" }, // Intermediate
          { ...mockResultRounds(22, 0, true), date: "2024-04-01" }, // Advanced (Latest)
        ],
        category: "Girl",
        tags: ["AMRAP"],
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

    it("should sort by date ascending (using first result date)", () => {
      const sorted = sortWods(wodsToSort, "date", "asc");
      // Expected order (Ascending): E (23-05-15), H (23-10-01), B (23-11-05), A (24-01-15), C (24-01-17), D (24-03-01), F (Inf), G (Inf)
      // Expected Names (Ascending): ['Cindy', 'Cindy', 'Cindy', 'Fran', 'Deadlift', 'Fran', 'Pull-ups', 'Push-ups']
      expect(sorted.map((w) => w.wodName)).toEqual([
        "Cindy",
        "Cindy",
        "Cindy",
        "Fran",
        "Deadlift",
        "Fran",
        "Pull-ups",
        "Push-ups",
      ]);
    });

    it("should sort by date descending (using first result date)", () => {
      const sorted = sortWods(wodsToSort, "date", "desc");
      // Expected Order (Descending): F (Inf), G (Inf), D (24-03-01), C (24-01-17), A (24-01-15), B (23-11-05), H (23-10-01), E (23-05-15)
      // Expected Names (Descending): ['Pull-ups', 'Push-ups', 'Fran', 'Deadlift', 'Fran', 'Cindy', 'Cindy', 'Cindy']
      expect(sorted.map((w) => w.wodName)).toEqual([
        "Pull-ups",
        "Push-ups",
        "Fran",
        "Deadlift",
        "Fran",
        "Cindy",
        "Cindy",
        "Cindy",
      ]);
    });

    it("should sort by attempts ascending", () => {
      const sorted = sortWods(wodsToSort, "attempts", "asc");
      // Attempts: F(0), G(0), A(1), C(1), D(1), E(1), B(2), H(2)
      // Order within same attempt count might vary based on original order or other factors if stable sort isn't guaranteed.
      // We expect F, G first, then A, C, D, E, then B, H
      const attempts = sorted.map(
        (w) => w.results.filter((r) => r.date && hasScore(r)).length,
      );
      expect(attempts).toEqual([0, 0, 1, 1, 1, 1, 2, 2]);
      // Check names for grouping
      expect(
        sorted
          .slice(0, 2)
          .map((w) => w.wodName)
          .sort(),
      ).toEqual(["Pull-ups", "Push-ups"]);
      expect(
        sorted
          .slice(2, 6)
          .map((w) => w.wodName)
          .sort(),
      ).toEqual(["Cindy", "Deadlift", "Fran", "Fran"]);
      // Removed incorrect screen.getByRole assertion from helper test
    });

    it("should sort by attempts descending", () => {
      const sorted = sortWods(wodsToSort, "attempts", "desc");
      // Attempts: B(2), H(2), A(1), C(1), D(1), E(1), F(0), G(0)
      const attempts = sorted.map(
        (w) => w.results.filter((r) => r.date && hasScore(r)).length,
      );
      expect(attempts).toEqual([2, 2, 1, 1, 1, 1, 0, 0]);
      // Check names for grouping
      expect(
        sorted
          .slice(0, 2)
          .map((w) => w.wodName)
          .sort(),
      ).toEqual(["Cindy", "Cindy"]);
      expect(
        sorted
          .slice(2, 6)
          .map((w) => w.wodName)
          .sort(),
      ).toEqual(["Cindy", "Deadlift", "Fran", "Fran"]);
      expect(
        sorted
          .slice(6, 8)
          .map((w) => w.wodName)
          .sort(),
      ).toEqual(["Pull-ups", "Push-ups"]);
    });

    // 'level' uses the *first* result for comparison
    it("should sort by level ascending (using first result)", () => {
      const sorted = sortWods(wodsToSort, "level", "asc");
      // Levels (first result): A(Elite Rx), B(Inter Rx), C(Beginner Scaled), D(Adv Rx), E(Elite Scaled), F(None), G(None), H(Inter Rx)
      // Expected Order (Ascending Score): F(0), G(0), C(1), E(4), B(12), H(12), D(13), A(14)
      // Expected Names (Ascending): ['Pull-ups', 'Push-ups', 'Deadlift', 'Cindy', 'Cindy', 'Cindy', 'Fran', 'Fran'] (B before H due to secondary sort)
      expect(sorted.map((w) => w.wodName)).toEqual([
        "Pull-ups",
        "Push-ups",
        "Deadlift",
        "Cindy",
        "Cindy",
        "Cindy",
        "Fran",
        "Fran",
      ]);
    });

    it("should sort by level descending (using first result)", () => {
      const sorted = sortWods(wodsToSort, "level", "desc");
      // Expected Order (Score): A(14), D(13), B(12), H(12), E(4), C(1), F(0), G(0)
      // Secondary Sort (Name Desc): A, D, H, B, E, C, G, F
      expect(sorted.map((w) => w.wodName)).toEqual([
        "Fran",
        "Fran",
        "Cindy",
        "Cindy",
        "Cindy",
        "Deadlift",
        "Push-ups",
        "Pull-ups",
      ]);
    });

    // 'latestLevel' uses the *latest valid* result for comparison
    it("should sort by latestLevel ascending", () => {
      const sorted = sortWods(wodsToSort, "latestLevel", "asc");
      // Expected Order (Score): F(0), G(0), C(1), E(4), B(12), D(13), H(13), A(14)
      // Secondary Sort (Name Asc): F, G, C, E, B, H, D, A (Cindy before Fran when scores are equal)
      expect(sorted.map((w) => w.wodName)).toEqual([
        "Pull-ups",
        "Push-ups",
        "Deadlift",
        "Cindy",
        "Cindy",
        "Cindy",
        "Fran",
        "Fran",
      ]);
    });

    it("should sort by latestLevel descending", () => {
      const sorted = sortWods(wodsToSort, "latestLevel", "desc");
      // Expected Order (Score): A(14), D(13), H(13), B(12), E(4), C(1), F(0), G(0)
      // Secondary Sort (Name Desc): A, D, H, B, E, C, G, F (Fran before Cindy when scores are equal)
      expect(sorted.map((w) => w.wodName)).toEqual([
        "Fran",
        "Fran",
        "Cindy",
        "Cindy",
        "Cindy",
        "Deadlift",
        "Push-ups",
        "Pull-ups",
      ]);
    });
  });
});

// --- Mock Child Components ---
// Mock WodTable and WodTimeline to check props passed to them
vi.mock("./WodTable", () => ({
  // Use default export syntax for mocked component
  // Add explicit types to parameters using locally defined types
  default: vi.fn(
    ({
      wods,
      sortBy,
      sortDirection,
      handleSort,
    }: {
      wods: Wod[];
      sortBy: SortByType;
      sortDirection: SortDirection;
      handleSort: (column: SortByType) => void;
    }) => (
      <div data-testid="wod-table">
        {/* Render something identifiable */}
        <span>WodTable Mock</span>
        {/* Optionally render props for easier debugging in tests */}
        <span data-testid="table-wod-count">{wods.length}</span>{" "}
        {/* Safe: wods is Wod[] */}
        <span data-testid="table-sort-by">{sortBy}</span>
        <span data-testid="table-sort-direction">{sortDirection}</span>
        {/* Mock button to trigger handleSort */}
        <button onClick={() => handleSort("wodName")}>
          Sort Table By Name
        </button>
      </div>
    ),
  ),
}));

vi.mock("./WodTimeline", () => ({
  // Add explicit types to parameters using locally defined types
  default: vi.fn(
    ({
      wods,
      sortBy,
      sortDirection,
      handleSort,
    }: {
      wods: Wod[];
      sortBy: SortByType;
      sortDirection: SortDirection;
      handleSort: (column: SortByType) => void;
    }) => (
      <div data-testid="wod-timeline">
        <span>WodTimeline Mock</span>
        <span data-testid="timeline-wod-count">{wods.length}</span>{" "}
        {/* Safe: wods is Wod[] */}
        <span data-testid="timeline-sort-by">{sortBy}</span>
        <span data-testid="timeline-sort-direction">{sortDirection}</span>
        {/* Mock button to trigger handleSort */}
        <button onClick={() => handleSort("date")}>
          Sort Timeline By Date
        </button>
      </div>
    ),
  ),
}));

// --- Component Tests ---
describe("WodViewer Component", () => {
  // Mock chart data and category/tag order
  const mockCategoryOrder = [
    "Girl",
    "Benchmark",
    "Hero",
    "Skill",
    "Open",
    "Quarterfinals",
    "Games",
    "Other",
  ];
  const mockTagOrder = [
    "For Time",
    "AMRAP",
    "Couplet",
    "Triplet",
    "Chipper",
    "Ladder",
    "EMOM",
  ];
  const mockChartDataProps = {
    tagChartData: [],
    categoryChartData: [],
    frequencyData: [], // Add missing prop
    performanceData: [], // Add missing prop
    categoryOrder: mockCategoryOrder,
    tagOrder: mockTagOrder, // Add tag order to props
  };

  // Use the same mock data from helper tests where applicable
  const testWods: Wod[] = [
    {
      // Wod A - Fran, Done, Girl, For Time, Couplet
      wodUrl: "test.com/fran",
      wodName: "Fran",
      category: "Girl",
      tags: ["For Time", "Couplet"],
      results: [mockResultTime(110, true)], // Elite
    },
    {
      // Wod B - Cindy, Done, Girl, AMRAP
      wodUrl: "test.com/cindy",
      wodName: "Cindy",
      category: "Girl",
      tags: ["AMRAP"],
      results: [mockResultRounds(18, 0, true)], // Intermediate
    },
    {
      // Wod C - Deadlift, Done (Scaled), Benchmark, Ladder
      wodUrl: "test.com/deadlift",
      wodName: "Deadlift",
      category: "Benchmark",
      tags: ["Ladder"],
      results: [mockResultLoad(200, false)], // Beginner (Scaled)
    },
    {
      // Wod D - Pull-ups, Not Done, Benchmark
      wodUrl: "test.com/pullups",
      wodName: "Pull-ups",
      category: "Benchmark",
      results: [],
    },
    {
      // Wod E - Push-ups, Not Done (no score), Benchmark
      wodUrl: "test.com/pushups",
      wodName: "Push-ups",
      category: "Benchmark",
      results: [mockResultNoScore()],
    },
    {
      // Wod F - Hero WOD, Done, Hero, Chipper
      wodUrl: "test.com/murph",
      wodName: "Murph",
      category: "Hero",
      tags: ["Chipper", "For Time"],
      results: [mockResultTime(2400, true)], // Example time
    },
  ];

  beforeEach(() => {
    // Reset mocks and search params before each test
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams(); // Reset to empty
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Ensure mocks are fully restored
  });

  it("should render table view by default and show only done WODs (no URL params)", () => {
    // No specific params set for this test
    render(<WodViewer wods={testWods} {...mockChartDataProps} />);

    // Check table is rendered by default
    expect(screen.getByTestId("wod-table")).toBeInTheDocument();
    expect(screen.queryByTestId("wod-timeline")).not.toBeInTheDocument();

    // Table view with "Done" filter should show WODs A, B, C, F
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("4");

    // Check default sort state passed to table (date/desc)
    expect(screen.getByTestId("table-sort-by")).toHaveTextContent("date");
    expect(screen.getByTestId("table-sort-direction")).toHaveTextContent(
      "desc",
    );

    // Completion filter should be visible and default to "Done"
    expect(
      screen.getByRole("radio", { name: /All \(\d+\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Done \(\d+\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Todo \(\d+\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Done \(\d+\)/i, checked: true }),
    ).toBeInTheDocument(); // Check Done is checked
  });

  it("should switch to timeline view and show only done WODs initially", () => {
    render(<WodViewer wods={testWods} {...mockChartDataProps} />);

    // Find the view switcher and switch to timeline
    const timelineViewButton = screen.getByRole("radio", {
      name: /Timeline View/i,
    });
    fireEvent.click(timelineViewButton);

    // Check timeline is rendered
    expect(screen.getByTestId("wod-timeline")).toBeInTheDocument();
    expect(screen.queryByTestId("wod-table")).not.toBeInTheDocument();

    // Timeline view should still reflect the "Done" filter initially (A, B, C, F)
    expect(screen.getByTestId("timeline-wod-count")).toHaveTextContent("4");

    // Check default sort state passed to timeline (date/desc)
    expect(screen.getByTestId("timeline-sort-by")).toHaveTextContent("date");
    expect(screen.getByTestId("timeline-sort-direction")).toHaveTextContent(
      "desc",
    );

    // Completion filter should be visible and default to "Done"
    expect(
      screen.getByRole("radio", { name: /All \(\d+\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Done \(\d+\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Todo \(\d+\)/i }),
    ).toBeInTheDocument();
    // Check that the "Done" filter is still checked after switching views
    expect(
      screen.getByRole("radio", { name: /Done \(\d+\)/i, checked: true }),
    ).toBeInTheDocument(); // Check Done is checked

    // Check initial counts (All: 6, Done: 4, Todo: 2)
    expect(
      screen.getByRole("radio", { name: /All \(6\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Done \(4\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Todo \(2\)/i }),
    ).toBeInTheDocument();
  });

  it('should filter by category, update counts, and update URL (starting from default "Done" filter)', async () => {
    render(<WodViewer wods={testWods} {...mockChartDataProps} />);
    // Table view is default, "Done" filter is default (A, B, C, F)
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("4");
    // Initial counts
    expect(
      screen.getByRole("radio", { name: /All \(6\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Done \(4\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Todo \(2\)/i }),
    ).toBeInTheDocument();

    // Find the category select trigger
    const categorySelect = screen.getByRole("combobox");
    fireEvent.click(categorySelect); // Open the dropdown with click

    // Use screen.findByText directly (no timers)
    const benchmarkItem = await screen.findByText(/Benchmark \(\d+\)/i);
    fireEvent.click(benchmarkItem);

    // Check that only "Done" Benchmark WODs are passed to the table (C)
    // Need to wait for the state update and re-render
    await waitFor(() => {
      expect(screen.getByTestId("table-wod-count")).toHaveTextContent("1");
      // Check updated counts for Benchmark category (All: 3, Done: 1, Todo: 2)
      expect(
        screen.getByRole("radio", { name: /All \(3\)/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /Done \(1\)/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /Todo \(2\)/i }),
      ).toBeInTheDocument();
      // Check URL update
      expect(mockRouterReplace).toHaveBeenCalledWith("/?category=Benchmark", {
        scroll: false,
      });
    });
    mockRouterReplace.mockClear(); // Clear mock for next assertion

    // Select 'All Categories' again by clicking
    fireEvent.click(categorySelect); // Re-open with click

    // Use screen.findByText directly (no timers)
    const allCategoriesItem = await screen.findByText(
      /All Categories \(\d+\)/i,
    );
    fireEvent.click(allCategoriesItem);

    await waitFor(() => {
      expect(screen.getByTestId("table-wod-count")).toHaveTextContent("4"); // Back to all "Done" WODs
      // Check counts reset to original (All: 6, Done: 4, Todo: 2)
      expect(
        screen.getByRole("radio", { name: /All \(6\)/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /Done \(4\)/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /Todo \(2\)/i }),
      ).toBeInTheDocument();
      // Check final URL state after returning to default (allow '/' or '/?')
      const lastCall = mockRouterReplace.mock.lastCall;
      expect(lastCall[0]).toMatch(/^\/\??$/); // Matches '/' or '/?'
      expect(lastCall[1]).toEqual({ scroll: false });
    });
  });

  it('should filter by tags, update counts, and update URL (multiple, starting from default "Done" filter)', async () => {
    render(<WodViewer wods={testWods} {...mockChartDataProps} />);
    // Table view, Done filter default (A, B, C, F)
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("4");
    // Initial counts
    expect(
      screen.getByRole("radio", { name: /All \(6\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Done \(4\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Todo \(2\)/i }),
    ).toBeInTheDocument();

    // Click 'For Time' tag (Done WODs: A, F)
    fireEvent.click(screen.getByText("For Time"));
    await waitFor(() => {
      expect(screen.getByTestId("table-wod-count")).toHaveTextContent("2");
      // Check counts for 'For Time' tag (All: 2, Done: 2, Todo: 0)
      expect(
        screen.getByRole("radio", { name: /All \(2\)/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /Done \(2\)/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /Todo \(0\)/i }),
      ).toBeInTheDocument();
      // Check URL update (URLSearchParams encodes space as '+')
      expect(mockRouterReplace).toHaveBeenCalledWith("/?tags=For+Time", {
        scroll: false,
      });
    });
    mockRouterReplace.mockClear();

    // Click 'AMRAP' tag (Done WODs: B)
    // Tag match means: no tags selected OR wod.tags includes *any* selected tag
    // Let's re-evaluate the filtering logic based on the code:
    // categoryMatch = selectedCategories.length === 0 || (wod.category && selectedCategories.includes(wod.category));
    // tagMatch = selectedTags.length === 0 || (wod.tags && wod.tags.some(tag => selectedTags.includes(tag)));
    // return categoryMatch && tagMatch;
    // So, clicking multiple tags acts as an OR filter within tags.

    // Click 'AMRAP' tag - now filters for ('For Time' OR 'AMRAP') among Done WODs (A, B, F)
    fireEvent.click(screen.getByText("AMRAP"));
    await waitFor(() => {
      expect(screen.getByTestId("table-wod-count")).toHaveTextContent("3");
      // Check counts for 'For Time' OR 'AMRAP' tags (All: 3, Done: 3, Todo: 0)
      expect(
        screen.getByRole("radio", { name: /All \(3\)/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /Done \(3\)/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /Todo \(0\)/i }),
      ).toBeInTheDocument();
      // Check URL update (URLSearchParams encodes space as '+', comma as '%2C')
      // Tags are joined in selection order, not alphabetized within the value.
      expect(mockRouterReplace).toHaveBeenCalledWith(
        "/?tags=For+Time%2CAMRAP", // Order: For Time, AMRAP
        { scroll: false },
      );
    });
    mockRouterReplace.mockClear();

    // Click 'For Time' again to deselect it - should show only 'AMRAP' among Done WODs (B)
    fireEvent.click(screen.getByText("For Time"));
    await waitFor(() => {
      expect(screen.getByTestId("table-wod-count")).toHaveTextContent("1");
      // Check counts for 'AMRAP' tag (All: 1, Done: 1, Todo: 0)
      expect(
        screen.getByRole("radio", { name: /All \(1\)/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /Done \(1\)/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /Todo \(0\)/i }),
      ).toBeInTheDocument();
      // Check URL update (URLSearchParams encodes space as '+')
      expect(mockRouterReplace).toHaveBeenCalledWith("/?tags=AMRAP", {
        scroll: false,
      });
    });
    mockRouterReplace.mockClear();

    // Click 'AMRAP' again to deselect - should show all Done WODs again
    fireEvent.click(screen.getByText("AMRAP"));
    await waitFor(() => {
      expect(screen.getByTestId("table-wod-count")).toHaveTextContent("4");
      // Check counts reset to original (All: 6, Done: 4, Todo: 2)
      expect(
        screen.getByRole("radio", { name: /All \(6\)/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /Done \(4\)/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /Todo \(2\)/i }),
      ).toBeInTheDocument();
      // Check final URL state after returning to default (allow '/' or '/?')
      const lastCall = mockRouterReplace.mock.lastCall;
      expect(lastCall[0]).toMatch(/^\/\??$/); // Matches '/' or '/?'
      expect(lastCall[1]).toEqual({ scroll: false });
    });
  });

  it("should filter by completion status, update counts, and update URL", async () => {
    render(<WodViewer wods={testWods} {...mockChartDataProps} />);
    // Table view, Done filter default (A, B, C, F)
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("4");

    // Click 'Done' filter again (should have no effect on URL as it's default)
    const doneFilter = screen.getByRole("radio", { name: /Done \(\d+\)/i });
    fireEvent.click(doneFilter);
    await waitFor(() => {
      expect(screen.getByTestId("table-wod-count")).toHaveTextContent("4");
      // Initial render might call replace if searchParams is initially different from calculated default
    });
    mockRouterReplace.mockClear(); // Clear after initial render check

    // Click 'Done' filter again (should have no effect)
    fireEvent.click(doneFilter);
    await waitFor(() => {
      expect(screen.getByTestId("table-wod-count")).toHaveTextContent("4");
      // Should NOT call replace again because state hasn't changed from default
      expect(mockRouterReplace).not.toHaveBeenCalled();
    });

    // Click 'Todo' filter (D, E)
    const todoFilter = screen.getByRole("radio", { name: /Todo \(\d+\)/i });
    fireEvent.click(todoFilter);
    await waitFor(() => {
      expect(screen.getByTestId("table-wod-count")).toHaveTextContent("2");
      // Check URL update
      expect(mockRouterReplace).toHaveBeenCalledWith("/?completion=notDone", {
        scroll: false,
      });
    });
    // mockRouterReplace.mockClear(); // Keep checking subsequent calls

    // Click 'All' filter - Use radio role
    const allFilter = screen.getByRole("radio", { name: /All \(\d+\)/i });
    fireEvent.click(allFilter);
    await waitFor(() => {
      expect(screen.getByTestId("table-wod-count")).toHaveTextContent("6");
      // Check URL update
      expect(mockRouterReplace).toHaveBeenCalledWith("/?completion=all", {
        scroll: false,
      });
    });
    // mockRouterReplace.mockClear();

    // Click 'Done' filter again (back to default)
    fireEvent.click(doneFilter);
    await waitFor(() => {
      expect(screen.getByTestId("table-wod-count")).toHaveTextContent("4");
      // Check final URL state after returning to default (allow '/' or '/?')
      const lastCall = mockRouterReplace.mock.lastCall;
      expect(lastCall[0]).toMatch(/^\/\??$/); // Matches '/' or '/?'
      expect(lastCall[1]).toEqual({ scroll: false });
    });
  });

  it("should handle sorting correctly and update URL", async () => {
    render(<WodViewer wods={testWods} {...mockChartDataProps} />);
    // Table view is default

    // Initial sort check (date/desc) - Default, so no URL params expected initially
    await waitFor(() => {
      expect(screen.getByTestId("table-sort-by")).toHaveTextContent("date");
      expect(screen.getByTestId("table-sort-direction")).toHaveTextContent(
        "desc",
      );
      // Check that router was NOT called initially for default sort/view
      // Initial render might call replace if searchParams is initially different from calculated default
    });
    mockRouterReplace.mockClear(); // Clear after initial render check

    // Simulate sort trigger from mocked child component (e.g., clicking name header)
    const sortButton = screen.getByRole("button", {
      name: /Sort Table By Name/i,
    }); // Mock button in WodTable mock
    fireEvent.click(sortButton);

    // Check sort state updated and passed down, and URL updated
    await waitFor(() => {
      expect(screen.getByTestId("table-sort-by")).toHaveTextContent("wodName");
      expect(screen.getByTestId("table-sort-direction")).toHaveTextContent(
        "asc",
      ); // Default asc for new column
      // URL should update: sortBy=wodName (sortDir=asc is default for wodName and omitted)
      expect(mockRouterReplace).toHaveBeenCalledWith("/?sortBy=wodName", {
        scroll: false,
      });
    });
    // mockRouterReplace.mockClear();

    // Click again to toggle direction
    fireEvent.click(sortButton);
    await waitFor(() => {
      expect(screen.getByTestId("table-sort-by")).toHaveTextContent("wodName");
      expect(screen.getByTestId("table-sort-direction")).toHaveTextContent(
        "desc",
      );
      // URL should update: sortBy=wodName&sortDir=desc (params sorted)
      expect(mockRouterReplace).toHaveBeenCalledWith(
        "/?sortBy=wodName&sortDir=desc",
        { scroll: false },
      );
    });
    // Removed attempt to click timeline sort button while table view is active
  });

  it("should render correctly with empty wods array (defaulting to table view)", () => {
    render(<WodViewer wods={[]} {...mockChartDataProps} />);

    // Should default to table view
    expect(screen.getByTestId("wod-table")).toBeInTheDocument();
    expect(screen.queryByTestId("wod-timeline")).not.toBeInTheDocument();
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("0");

    // Switch to timeline view
    fireEvent.click(screen.getByRole("radio", { name: /Timeline View/i }));
    expect(screen.getByTestId("wod-timeline")).toBeInTheDocument();
    expect(screen.getByTestId("timeline-wod-count")).toHaveTextContent("0");

    // Filters should still be present
    expect(screen.getByRole("combobox")).toBeInTheDocument(); // Category select
    // Check for a tag from the mockTagOrder
    expect(screen.getByText("For Time")).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Done \(\d+\)/i, checked: true }),
    ).toBeInTheDocument(); // Default filter is Done
  });

  it("should filter by completion status in timeline view and update URL (after switching)", async () => {
    render(<WodViewer wods={testWods} {...mockChartDataProps} />);
    // Switch to timeline view first
    fireEvent.click(screen.getByRole("radio", { name: /Timeline View/i }));

    // Timeline view starts with "Done" filter (A, B, C, F)
    await waitFor(() => {
      expect(screen.getByTestId("wod-timeline")).toBeInTheDocument();
      expect(screen.getByTestId("timeline-wod-count")).toHaveTextContent("4");
      // Initial render/switch might call replace
    });
    mockRouterReplace.mockClear(); // Clear after initial render/switch

    // Click 'Done' filter again (no effect)
    const doneFilter = screen.getByRole("radio", { name: /Done \(\d+\)/i });
    fireEvent.click(doneFilter);
    await waitFor(() => {
      expect(screen.getByTestId("timeline-wod-count")).toHaveTextContent("4");
      expect(mockRouterReplace).not.toHaveBeenCalled();
    });

    // Click 'Todo' filter (D, E)
    const todoFilter = screen.getByRole("radio", { name: /Todo \(\d+\)/i });
    fireEvent.click(todoFilter);
    await waitFor(() => {
      expect(screen.getByTestId("timeline-wod-count")).toHaveTextContent("2");
      // URL should include view=timeline and completion=notDone (params sorted)
      expect(mockRouterReplace).toHaveBeenCalledWith(
        "/?completion=notDone&view=timeline",
        { scroll: false },
      );
    });
    // mockRouterReplace.mockClear();

    // Click 'All' filter
    const allFilter = screen.getByRole("radio", { name: /All \(\d+\)/i });
    fireEvent.click(allFilter);
    await waitFor(() => {
      expect(screen.getByTestId("timeline-wod-count")).toHaveTextContent("6");
      // URL should include view=timeline and completion=all (params sorted)
      expect(mockRouterReplace).toHaveBeenCalledWith(
        "/?completion=all&view=timeline",
        { scroll: false },
      );
    });
    // mockRouterReplace.mockClear();

    // Click 'Done' filter again (back to default completion)
    fireEvent.click(doneFilter);
    await waitFor(() => {
      expect(screen.getByTestId("timeline-wod-count")).toHaveTextContent("4");
      // URL should only include view=timeline
      expect(mockRouterReplace).toHaveBeenLastCalledWith("/?view=timeline", {
        scroll: false,
      });
    });
  });

  // --- Tests for Initialization from URL ---

  it("should initialize with category from URL", () => {
    mockSearchParams = new URLSearchParams("?category=Benchmark");
    render(<WodViewer wods={testWods} {...mockChartDataProps} />);

    // Check category select reflects the URL param
    expect(screen.getByRole("combobox")).toHaveTextContent(
      /Benchmark \(\d+\)/i,
    );
    // Check filtered WODs (Done + Benchmark = Wod C)
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("1");
    // Check counts reflect the category filter (Benchmark: All 3, Done 1, Todo 2)
    expect(
      screen.getByRole("radio", { name: /All \(3\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Done \(1\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Todo \(2\)/i }),
    ).toBeInTheDocument();
  });

  it("should initialize with tags from URL", () => {
    mockSearchParams = new URLSearchParams("?tags=AMRAP%2CLadder"); // Cindy (B), Deadlift (C) are Done
    render(<WodViewer wods={testWods} {...mockChartDataProps} />);

    // Check tags are selected visually (assuming class indicates selection)
    expect(screen.getByText("AMRAP")).toHaveClass(
      "border-primary bg-primary text-primary-foreground",
    );
    expect(screen.getByText("Ladder")).toHaveClass(
      "border-primary bg-primary text-primary-foreground",
    );
    expect(screen.getByText("For Time")).not.toHaveClass(
      "border-primary bg-primary text-primary-foreground",
    );

    // Check filtered WODs (Done + (AMRAP or Ladder) = Wod B, Wod C)
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("2");
    // Check counts reflect the tag filter (AMRAP/Ladder: All 2, Done 2, Todo 0) - Corrected calculation
    // Wods with AMRAP or Ladder: B(Done), C(Done) -> Total 2
    expect(
      screen.getByRole("radio", { name: /All \(2\)/i }), // Corrected count
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Done \(2\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Todo \(0\)/i }), // Corrected count
    ).toBeInTheDocument();
  });

  it("should initialize with completion status from URL", () => {
    mockSearchParams = new URLSearchParams("?completion=all"); // view/sort default
    render(<WodViewer wods={testWods} {...mockChartDataProps} />);

    // Check completion filter is set to 'All'
    expect(
      screen.getByRole("radio", { name: /All \(\d+\)/i, checked: true }),
    ).toBeInTheDocument();
    // Check filtered WODs (All = 6)
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("6");
    // Check view/sort are defaults
    expect(screen.getByTestId("table-sort-by")).toHaveTextContent("date");
    expect(screen.getByTestId("table-sort-direction")).toHaveTextContent(
      "desc",
    );
    expect(
      screen.getByRole("radio", { name: /Table View/i, checked: true }),
    ).toBeInTheDocument();
  });

  it("should initialize with view=timeline from URL", () => {
    mockSearchParams = new URLSearchParams("?view=timeline");
    render(<WodViewer wods={testWods} {...mockChartDataProps} />);

    // Check timeline view is active
    expect(screen.getByTestId("wod-timeline")).toBeInTheDocument();
    expect(screen.queryByTestId("wod-table")).not.toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Timeline View/i, checked: true }),
    ).toBeInTheDocument();

    // Check default filters/sort
    expect(screen.getByTestId("timeline-wod-count")).toHaveTextContent("4"); // Default "Done" filter
    expect(screen.getByTestId("timeline-sort-by")).toHaveTextContent("date");
    expect(screen.getByTestId("timeline-sort-direction")).toHaveTextContent(
      "desc",
    );
  });

  it("should initialize with sortBy and sortDir from URL", () => {
    mockSearchParams = new URLSearchParams("?sortBy=wodName&sortDir=asc");
    render(<WodViewer wods={testWods} {...mockChartDataProps} />);

    // Check sort state is applied (table view is default)
    expect(screen.getByTestId("table-sort-by")).toHaveTextContent("wodName");
    expect(screen.getByTestId("table-sort-direction")).toHaveTextContent("asc");

    // Check default view/filters
    expect(screen.getByTestId("wod-table")).toBeInTheDocument();
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("4"); // Default "Done" filter
  });

  it("should initialize with multiple parameters from URL including view/sort", () => {
    mockSearchParams = new URLSearchParams(
      "?category=Girl&tags=AMRAP&completion=all&view=timeline&sortBy=latestLevel&sortDir=asc",
    );
    render(<WodViewer wods={testWods} {...mockChartDataProps} />);

    // Check category
    expect(screen.getByRole("combobox")).toHaveTextContent(/Girl \(\d+\)/i);
    // Check tag
    expect(screen.getByText("AMRAP")).toHaveClass(
      "border-primary bg-primary text-primary-foreground",
    );
    // Check completion
    expect(
      screen.getByRole("radio", { name: /All \(\d+\)/i, checked: true }),
    ).toBeInTheDocument();

    // Check filtered WODs (All + Girl + AMRAP = Wod B) - Should be timeline view
    expect(screen.getByTestId("timeline-wod-count")).toHaveTextContent("1");
    // Check counts reflect filters (Girl + AMRAP: All 1, Done 1, Todo 0)
    expect(
      screen.getByRole("radio", { name: /All \(1\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Done \(1\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Todo \(0\)/i }),
    ).toBeInTheDocument();
  });

  it("should ignore invalid URL parameters and use defaults", () => {
    mockSearchParams = new URLSearchParams(
      "?category=InvalidCat&tags=InvalidTag,AMRAP&completion=invalidStatus&view=invalidView&sortBy=invalidSort&sortDir=invalidDir",
    );
    render(<WodViewer wods={testWods} {...mockChartDataProps} />);

    // Check category defaults to 'All Categories'
    expect(screen.getByRole("combobox")).toHaveTextContent(/All Categories/i);
    // Check only valid tag 'AMRAP' is selected
    expect(screen.getByText("AMRAP")).toHaveClass(
      "border-primary bg-primary text-primary-foreground",
    );
    expect(screen.queryByText("InvalidTag")).toBeNull(); // Corrected check
    // Check completion defaults to 'Done'
    expect(
      screen.getByRole("radio", { name: /Done \(\d+\)/i, checked: true }),
    ).toBeInTheDocument();

    // Check filtered WODs (Done + AMRAP = Wod B)
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("1");
    // Check counts reflect filters (AMRAP: All 1, Done 1, Todo 0)
    expect(
      screen.getByRole("radio", { name: /All \(1\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Done \(1\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Todo \(0\)/i }),
    ).toBeInTheDocument();

    // Check view/sort defaults
    expect(screen.getByTestId("wod-table")).toBeInTheDocument(); // Default view
    expect(screen.getByTestId("table-sort-by")).toHaveTextContent("date"); // Default sort
    expect(screen.getByTestId("table-sort-direction")).toHaveTextContent(
      "desc",
    ); // Default direction
  });

  it("should update URL correctly when changing view", async () => {
    render(<WodViewer wods={testWods} {...mockChartDataProps} />);
    // Initial state: table view, no params in URL yet
    mockRouterReplace.mockClear(); // Clear after initial render

    // Switch to timeline
    const timelineViewButton = screen.getByRole("radio", {
      name: /Timeline View/i,
    });
    fireEvent.click(timelineViewButton);

    await waitFor(() => {
      expect(screen.getByTestId("wod-timeline")).toBeInTheDocument();
      expect(mockRouterReplace).toHaveBeenCalledWith("/?view=timeline", {
        scroll: false,
      });
    });
    // mockRouterReplace.mockClear(); // Don't clear, check final state

    // Switch back to table
    const tableViewButton = screen.getByRole("radio", { name: /Table View/i });
    fireEvent.click(tableViewButton);

    await waitFor(() => {
      expect(screen.getByTestId("wod-table")).toBeInTheDocument();
      // Check final URL state after returning to default view (allow '/' or '/?')
      const lastCall = mockRouterReplace.mock.lastCall;
      expect(lastCall[0]).toMatch(/^\/\??$/); // Matches '/' or '/?'
      expect(lastCall[1]).toEqual({ scroll: false });
    });
  });

  it("should update URL correctly when changing filters and view/sort are non-default", async () => {
    // Start with non-default view and sort
    mockSearchParams = new URLSearchParams("?view=timeline&sortBy=wodName"); // sortDir=asc is default for wodName
    render(<WodViewer wods={testWods} {...mockChartDataProps} />);

    // Check initial state
    await waitFor(() => {
      expect(screen.getByTestId("wod-timeline")).toBeInTheDocument();
      expect(screen.getByTestId("timeline-sort-by")).toHaveTextContent(
        "wodName",
      );
      expect(screen.getByTestId("timeline-sort-direction")).toHaveTextContent(
        "asc",
      ); // Default for wodName
    });
    mockRouterReplace.mockClear(); // Clear after initial render/state sync

    // Change completion filter to 'All'
    const allFilter = screen.getByRole("radio", { name: /All \(\d+\)/i });
    fireEvent.click(allFilter);

    await waitFor(() => {
      // URL should include view, sortBy, and completion. sortDir=asc is default for wodName and should be omitted.
      // Parameters sorted alphabetically: completion, sortBy, view
      expect(mockRouterReplace).toHaveBeenCalledWith(
        "/?completion=all&sortBy=wodName&view=timeline",
        { scroll: false },
      );
    });
    // mockRouterReplace.mockClear(); // Don't clear, check final state

    // Change category filter to 'Benchmark'
    const categorySelect = screen.getByRole("combobox");
    fireEvent.click(categorySelect);
    const benchmarkItem = await screen.findByText(/Benchmark \(\d+\)/i);
    fireEvent.click(benchmarkItem);

    await waitFor(() => {
      // URL should include view, sortBy, completion, and category. sortDir=asc is default for wodName and should be omitted.
      // Parameters sorted alphabetically: category, completion, sortBy, view
      expect(mockRouterReplace).toHaveBeenLastCalledWith(
        "/?category=Benchmark&completion=all&sortBy=wodName&view=timeline",
        { scroll: false },
      );
    });
  });
});
