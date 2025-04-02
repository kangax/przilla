import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "../../test-utils";
import "@testing-library/jest-dom";
import WodViewer, {
  getPerformanceLevelColor,
  formatSecondsToMMSS,
  getPerformanceLevelTooltip,
  formatScore,
  getNumericScore,
  getPerformanceLevel,
  hasScore,
  sortWods,
  type Wod,
  type WodResult,
} from "./WodViewer";

// Define types locally for mocks as they are not exported from component
type SortByType = "wodName" | "date" | "level" | "attempts" | "latestLevel";
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
      expect(getPerformanceLevelTooltip(mockWodTime, "elite")).toBe(
        expectedTooltip,
      );
      // The output should be the same regardless of the 'currentLevel' passed
      expect(getPerformanceLevelTooltip(mockWodTime, "beginner")).toBe(
        expectedTooltip,
      );
    });

    it("should return correct multi-line tooltip for rounds benchmarks", () => {
      const expectedTooltip = [
        "Elite: 25 - ∞ rounds",
        "Advanced: 20 - ∞ rounds",
        "Intermediate: 15 - ∞ rounds",
        "Beginner: 10 - ∞ rounds",
      ].join("\n");
      expect(getPerformanceLevelTooltip(mockWodRounds, "elite")).toBe(
        expectedTooltip,
      );
      expect(getPerformanceLevelTooltip(mockWodRounds, "beginner")).toBe(
        expectedTooltip,
      );
    });

    it("should return correct multi-line tooltip for load benchmarks", () => {
      const expectedTooltip = [
        "Elite: 405 - ∞ load",
        "Advanced: 315 - ∞ load",
        "Intermediate: 225 - ∞ load",
        "Beginner: 135 - ∞ load",
      ].join("\n");
      expect(getPerformanceLevelTooltip(mockWodLoad, "elite")).toBe(
        expectedTooltip,
      );
      expect(getPerformanceLevelTooltip(mockWodLoad, "beginner")).toBe(
        expectedTooltip,
      );
    });

    it("should return correct multi-line tooltip for reps benchmarks", () => {
      const expectedTooltip = [
        "Elite: 30 - ∞ reps",
        "Advanced: 20 - ∞ reps",
        "Intermediate: 10 - ∞ reps",
        "Beginner: 5 - ∞ reps",
      ].join("\n");
      expect(getPerformanceLevelTooltip(mockWodReps, "elite")).toBe(
        expectedTooltip,
      );
      expect(getPerformanceLevelTooltip(mockWodReps, "beginner")).toBe(
        expectedTooltip,
      );
    });

    it("should return default message if no benchmarks", () => {
      // The function now ignores the 'currentLevel' if benchmarks are missing
      expect(getPerformanceLevelTooltip(mockWodNoBenchmark, "elite")).toBe(
        "No benchmark data available",
      );
      expect(getPerformanceLevelTooltip(mockWodNoBenchmark, null)).toBe(
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
      expect(getPerformanceLevelTooltip(mockWodTime, null)).toBe(
        expectedTooltip,
      );
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
      expect(formatScore(mockResultRounds(15))).toBe("15");
    });

    it("should format rounds + partial reps scores", () => {
      expect(formatScore(mockResultRounds(15, 10))).toBe("15+10");
    });

    it("should return empty string if no score", () => {
      expect(formatScore(mockResultNoScore())).toBe("");
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
      expect(
        sorted
          .slice(6, 8)
          .map((w) => w.wodName)
          .sort(),
      ).toEqual(["Cindy", "Cindy"]);
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
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it("should render table view by default and show only done WODs", () => {
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
    ).toBeInTheDocument();
  });

  it('should filter by category (starting from default "Done" filter)', async () => {
    render(<WodViewer wods={testWods} {...mockChartDataProps} />);
    // Table view is default, "Done" filter is default (A, B, C, F)
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("4");

    // Find the category select trigger
    const categorySelect = screen.getByRole("combobox");
    fireEvent.click(categorySelect); // Open the dropdown with click

    // Use screen.findByText directly (no timers)
    const benchmarkItem = await screen.findByText(/Benchmark \(\d+\)/i);
    fireEvent.click(benchmarkItem);

    // Check that only "Done" Benchmark WODs are passed to the table (C)
    // Need to wait for the state update and re-render
    await vi.waitFor(() => {
      expect(screen.getByTestId("table-wod-count")).toHaveTextContent("1");
    });

    // Select 'All Categories' again by clicking
    fireEvent.click(categorySelect); // Re-open with click

    // Use screen.findByText directly (no timers)
    const allCategoriesItem = await screen.findByText(
      /All Categories \(\d+\)/i,
    );
    fireEvent.click(allCategoriesItem);

    await vi.waitFor(() => {
      expect(screen.getByTestId("table-wod-count")).toHaveTextContent("4"); // Back to all "Done" WODs
    });
  });

  it('should filter by tags (multiple, starting from default "Done" filter)', () => {
    render(<WodViewer wods={testWods} {...mockChartDataProps} />);
    // Table view, Done filter default (A, B, C, F)
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("4");

    // Click 'For Time' tag (Done WODs: A, F)
    fireEvent.click(screen.getByText("For Time"));
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("2");

    // Click 'AMRAP' tag (Done WODs: B)
    // Tag match means: no tags selected OR wod.tags includes *any* selected tag
    // Let's re-evaluate the filtering logic based on the code:
    // categoryMatch = selectedCategories.length === 0 || (wod.category && selectedCategories.includes(wod.category));
    // tagMatch = selectedTags.length === 0 || (wod.tags && wod.tags.some(tag => selectedTags.includes(tag)));
    // return categoryMatch && tagMatch;
    // So, clicking multiple tags acts as an OR filter within tags.

    // Click 'AMRAP' tag - now filters for ('For Time' OR 'AMRAP') among Done WODs (A, B, F)
    fireEvent.click(screen.getByText("AMRAP"));
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("3");

    // Click 'For Time' again to deselect it - should show only 'AMRAP' among Done WODs (B)
    fireEvent.click(screen.getByText("For Time"));
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("1");

    // Click 'AMRAP' again to deselect - should show all Done WODs again
    fireEvent.click(screen.getByText("AMRAP"));
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("4");
  });

  it("should filter by completion status in table view (default view)", () => {
    render(<WodViewer wods={testWods} {...mockChartDataProps} />);
    // Table view, Done filter default (A, B, C, F)
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("4");

    // Click 'Done' filter again (should have no effect)
    const doneFilter = screen.getByRole("radio", { name: /Done \(\d+\)/i });
    fireEvent.click(doneFilter);
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("4");

    // Click 'Todo' filter (D, E)
    const todoFilter = screen.getByRole("radio", { name: /Todo \(\d+\)/i });
    fireEvent.click(todoFilter);
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("2");

    // Click 'All' filter - Use radio role
    const allFilter = screen.getByRole("radio", { name: /All \(\d+\)/i });
    fireEvent.click(allFilter);
    expect(screen.getByTestId("table-wod-count")).toHaveTextContent("6");
  });

  it("should handle sorting correctly (starting from default date/desc)", () => {
    render(<WodViewer wods={testWods} {...mockChartDataProps} />);
    // Table view is default

    // Initial sort check (date/desc)
    expect(screen.getByTestId("table-sort-by")).toHaveTextContent("date");
    expect(screen.getByTestId("table-sort-direction")).toHaveTextContent(
      "desc",
    );

    // Simulate sort trigger from mocked child component (e.g., clicking name header)
    const sortButton = screen.getByRole("button", {
      name: /Sort Table By Name/i,
    }); // Mock button in WodTable mock
    fireEvent.click(sortButton);

    // Check sort state updated and passed down
    expect(screen.getByTestId("table-sort-by")).toHaveTextContent("wodName");
    expect(screen.getByTestId("table-sort-direction")).toHaveTextContent("asc"); // Default asc for new column

    // Click again to toggle direction
    fireEvent.click(sortButton);
    expect(screen.getByTestId("table-sort-by")).toHaveTextContent("wodName");
    expect(screen.getByTestId("table-sort-direction")).toHaveTextContent(
      "desc",
    );
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

  it("should filter by completion status in timeline view (after switching)", () => {
    render(<WodViewer wods={testWods} {...mockChartDataProps} />);
    // Switch to timeline view first
    fireEvent.click(screen.getByRole("radio", { name: /Timeline View/i }));

    // Timeline view starts with "Done" filter (A, B, C, F)
    expect(screen.getByTestId("wod-timeline")).toBeInTheDocument();
    expect(screen.getByTestId("timeline-wod-count")).toHaveTextContent("4");

    // Click 'Done' filter again (no effect)
    const doneFilter = screen.getByRole("radio", { name: /Done \(\d+\)/i });
    fireEvent.click(doneFilter);
    expect(screen.getByTestId("timeline-wod-count")).toHaveTextContent("4");

    // Click 'Todo' filter (D, E)
    const todoFilter = screen.getByRole("radio", { name: /Todo \(\d+\)/i });
    fireEvent.click(todoFilter);
    expect(screen.getByTestId("timeline-wod-count")).toHaveTextContent("2");

    // Click 'All' filter
    const allFilter = screen.getByRole("radio", { name: /All \(\d+\)/i });
    fireEvent.click(allFilter);
    expect(screen.getByTestId("timeline-wod-count")).toHaveTextContent("6");
  });
});
