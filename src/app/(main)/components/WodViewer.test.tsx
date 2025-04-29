import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import "@testing-library/jest-dom";
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
import type { Wod, Score } from "~/types/wodTypes"; // Import types

// --- Explicitly mock useSession ---
vi.mock("~/lib/auth-client", () => ({
  useSession: vi.fn(),
}));
import { useSession } from "~/lib/auth-client";

// --- Mock tRPC ---
vi.mock("~/trpc/react", () => ({
  api: {
    wod: {
      getAll: {
        useQuery: vi.fn(() => ({
          data: undefined, // Return undefined so initialWods is used
          isLoading: false,
          error: null,
        })),
      },
      logScore: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isLoading: false,
          isSuccess: false,
          isError: false,
          error: null,
          reset: vi.fn(),
        })),
      },
    },
    score: {
      getAllByUser: {
        useQuery: vi.fn(() => ({
          data: [],
          isLoading: false,
          error: null,
        })),
      },
      deleteScore: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isLoading: false,
          isSuccess: false,
          isError: false,
          error: null,
          reset: vi.fn(),
        })),
      },
    },
    useUtils: () => ({
      score: {
        getAllByUser: {
          invalidate: vi.fn(),
        },
      },
    }),
  },
}));

// --- Mock next/navigation ---
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  })),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(),
    getAll: vi.fn(),
    has: vi.fn(),
    forEach: vi.fn(),
    entries: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    toString: vi.fn(),
  })),
  usePathname: vi.fn(() => "/"),
}));

// --- Mock WodTable component ---
vi.mock("./WodTable", () => ({
  default: vi.fn(({ wods, sortBy, sortDirection, searchTerm }) => {
    // Safely access length with type checking
    const wodsLength = Array.isArray(wods) ? wods.length : 0;

    return (
      <div data-testid="wod-table">
        <span>WodTable Mock</span>
        <span data-testid="table-wod-count">{wodsLength}</span>
        <span data-testid="table-sort-by">{sortBy}</span>
        <span data-testid="table-sort-direction">{sortDirection}</span>
        <span data-testid="table-search-term">{searchTerm}</span>
        <button>Sort Table By Name</button>
      </div>
    );
  }),
}));

// --- Helper Functions Tests ---
describe("WodViewer Helper Functions", () => {
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
      expect(getPerformanceLevelColor("unknown" as string)).toBe(
        "text-foreground/70 dark:text-foreground/60",
      );
    });
  });

  describe("formatSecondsToMMSS", () => {
    it("should format seconds correctly", () => {
      expect(formatSecondsToMMSS(65)).toBe("1:05");
      expect(formatSecondsToMMSS(3661)).toBe("61:01");
      expect(formatSecondsToMMSS(0)).toBe("0:00");
    });
  });

  describe("getPerformanceLevelTooltip", () => {
    it("should return correct multi-line tooltip for time benchmarks", () => {
      const mockWod: Wod = {
        id: "1",
        wodName: "Test WOD",
        wodUrl: "test.com",
        createdAt: new Date(),
        benchmarks: {
          type: "time",
          levels: {
            elite: { min: null, max: 180 },
            advanced: { min: 180, max: 240 },
            intermediate: { min: 240, max: 300 },
            beginner: { min: 300, max: null },
          },
        },
      };
      const tooltip = getPerformanceLevelTooltip(mockWod);
      expect(Array.isArray(tooltip)).toBe(true);
      expect(tooltip).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            levelName: "Elite",
            formattedRange: "0:00 - 3:00",
          }),
          expect.objectContaining({
            levelName: "Advanced",
            formattedRange: "3:00 - 4:00",
          }),
          expect.objectContaining({
            levelName: "Intermediate",
            formattedRange: "4:00 - 5:00",
          }),
          expect.objectContaining({
            levelName: "Beginner",
            formattedRange: "5:00 - ∞",
          }),
        ]),
      );
    });

    it("should return correct multi-line tooltip for rounds benchmarks", () => {
      const mockWod: Wod = {
        id: "2",
        wodName: "Test Rounds WOD",
        wodUrl: "test.com",
        createdAt: new Date(),
        benchmarks: {
          type: "rounds",
          levels: {
            elite: { min: 20, max: null },
            advanced: { min: 15, max: 20 },
            intermediate: { min: 10, max: 15 },
            beginner: { min: null, max: 10 },
          },
        },
      };
      const tooltip = getPerformanceLevelTooltip(mockWod);
      expect(Array.isArray(tooltip)).toBe(true);
      expect(tooltip).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            levelName: "Elite",
            formattedRange: "> 20",
          }),
          expect.objectContaining({
            levelName: "Advanced",
            formattedRange: "15 - 20",
          }),
          expect.objectContaining({
            levelName: "Intermediate",
            formattedRange: "10 - 15",
          }),
          expect.objectContaining({
            levelName: "Beginner",
            formattedRange: "0 - 10",
          }),
        ]),
      );
    });

    it("should return correct multi-line tooltip for load benchmarks", () => {
      const mockWod: Wod = {
        id: "3",
        wodName: "Test Load WOD",
        wodUrl: "test.com",
        createdAt: new Date(),
        benchmarks: {
          type: "load",
          levels: {
            elite: { min: 300, max: null },
            advanced: { min: 250, max: 300 },
            intermediate: { min: 200, max: 250 },
            beginner: { min: null, max: 200 },
          },
        },
      };
      const tooltip = getPerformanceLevelTooltip(mockWod);
      expect(Array.isArray(tooltip)).toBe(true);
      expect(tooltip).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            levelName: "Elite",
            formattedRange: "> 300 lbs",
          }),
          expect.objectContaining({
            levelName: "Advanced",
            formattedRange: "250 - 300 lbs",
          }),
          expect.objectContaining({
            levelName: "Intermediate",
            formattedRange: "200 - 250 lbs",
          }),
          expect.objectContaining({
            levelName: "Beginner",
            formattedRange: "0 - 200 lbs",
          }),
        ]),
      );
    });

    it("should return correct multi-line tooltip for reps benchmarks", () => {
      const mockWod: Wod = {
        id: "4",
        wodName: "Test Reps WOD",
        wodUrl: "test.com",
        createdAt: new Date(),
        benchmarks: {
          type: "reps",
          levels: {
            elite: { min: 100, max: null },
            advanced: { min: 75, max: 100 },
            intermediate: { min: 50, max: 75 },
            beginner: { min: null, max: 50 },
          },
        },
      };
      const tooltip = getPerformanceLevelTooltip(mockWod);
      expect(Array.isArray(tooltip)).toBe(true);
      expect(tooltip).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            levelName: "Elite",
            formattedRange: "> 100",
          }),
          expect.objectContaining({
            levelName: "Advanced",
            formattedRange: "75 - 100",
          }),
          expect.objectContaining({
            levelName: "Intermediate",
            formattedRange: "50 - 75",
          }),
          expect.objectContaining({
            levelName: "Beginner",
            formattedRange: "0 - 50",
          }),
        ]),
      );
    });

    it("should return empty array if no benchmarks", () => {
      const mockWod = null as unknown as Omit<Wod, "benchmarks">;
      expect(getPerformanceLevelTooltip(mockWod as Wod)).toEqual([]);
    });
  });

  describe("formatScore", () => {
    it("should format time scores", () => {
      const score: Score = {
        id: "1",
        userId: "user1",
        wodId: "wod1",
        time_seconds: 65,
        reps: null,
        load: null,
        rounds_completed: null,
        partial_reps: null,
        isRx: true,
        scoreDate: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: null,
      };
      expect(formatScore(score)).toBe("1:05");
    });

    it("should format reps scores", () => {
      const score: Score = {
        id: "1",
        userId: "user1",
        wodId: "wod1",
        time_seconds: null,
        reps: 42,
        load: null,
        rounds_completed: null,
        partial_reps: null,
        isRx: true,
        scoreDate: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: null,
      };
      expect(formatScore(score)).toBe("42 reps");
    });

    it("should format load scores", () => {
      const score: Score = {
        id: "1",
        userId: "user1",
        wodId: "wod1",
        time_seconds: null,
        reps: null,
        load: 225,
        rounds_completed: null,
        partial_reps: null,
        isRx: true,
        scoreDate: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: null,
      };
      expect(formatScore(score)).toBe("225 lbs");
    });

    it("should format rounds scores", () => {
      const score: Score = {
        id: "1",
        userId: "user1",
        wodId: "wod1",
        time_seconds: null,
        reps: null,
        load: null,
        rounds_completed: 5,
        partial_reps: null,
        isRx: true,
        scoreDate: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: null,
      };
      expect(formatScore(score)).toBe("5 rounds");
    });

    it("should format rounds + partial reps scores", () => {
      const score: Score = {
        id: "1",
        userId: "user1",
        wodId: "wod1",
        time_seconds: null,
        reps: null,
        load: null,
        rounds_completed: 5,
        partial_reps: 12,
        isRx: true,
        scoreDate: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: null,
      };
      expect(formatScore(score)).toBe("5+12");
    });

    it("should return dash if no score", () => {
      const score: Score = {
        id: "1",
        userId: "user1",
        wodId: "wod1",
        time_seconds: null,
        reps: null,
        load: null,
        rounds_completed: null,
        partial_reps: null,
        isRx: true,
        scoreDate: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: null,
      };
      expect(formatScore(score)).toBe("-");
    });
  });

  describe("getNumericScore", () => {
    it("should return time in seconds for time benchmarks", () => {
      const score: Score = {
        id: "1",
        userId: "user1",
        wodId: "wod1",
        time_seconds: 65,
        reps: null,
        load: null,
        rounds_completed: null,
        partial_reps: null,
        isRx: true,
        scoreDate: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: null,
      };
      const mockWod: Wod = {
        id: "wod1",
        wodName: "Test Time WOD",
        wodUrl: "test.com",
        createdAt: new Date(),
        benchmarks: {
          type: "time",
          levels: {
            elite: { min: null, max: 180 },
            advanced: { min: 180, max: 240 },
            intermediate: { min: 240, max: 300 },
            beginner: { min: 300, max: null },
          },
        },
      };
      expect(getNumericScore(mockWod, score)).toBe(65);
    });

    it("should return reps for reps benchmarks", () => {
      const score: Score = {
        id: "1",
        userId: "user1",
        wodId: "wod1",
        time_seconds: null,
        reps: 42,
        load: null,
        rounds_completed: null,
        partial_reps: null,
        isRx: true,
        scoreDate: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: null,
      };
      const mockWod: Wod = {
        id: "wod1",
        wodName: "Test Reps WOD",
        wodUrl: "test.com",
        createdAt: new Date(),
        benchmarks: {
          type: "reps",
          levels: {
            elite: { min: 100, max: null },
            advanced: { min: 75, max: 100 },
            intermediate: { min: 50, max: 75 },
            beginner: { min: null, max: 50 },
          },
        },
      };
      expect(getNumericScore(mockWod, score)).toBe(42);
    });

    it("should return load for load benchmarks", () => {
      const score: Score = {
        id: "1",
        userId: "user1",
        wodId: "wod1",
        time_seconds: null,
        reps: null,
        load: 225,
        rounds_completed: null,
        partial_reps: null,
        isRx: true,
        scoreDate: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: null,
      };
      const mockWod: Wod = {
        id: "wod1",
        wodName: "Test Load WOD",
        wodUrl: "test.com",
        createdAt: new Date(),
        benchmarks: {
          type: "load",
          levels: {
            elite: { min: 300, max: null },
            advanced: { min: 250, max: 300 },
            intermediate: { min: 200, max: 250 },
            beginner: { min: null, max: 200 },
          },
        },
      };
      expect(getNumericScore(mockWod, score)).toBe(225);
    });

    it("should return rounds as integer for rounds benchmarks", () => {
      const score: Score = {
        id: "1",
        userId: "user1",
        wodId: "wod1",
        time_seconds: null,
        reps: null,
        load: null,
        rounds_completed: 5,
        partial_reps: null,
        isRx: true,
        scoreDate: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: null,
      };
      const mockWod: Wod = {
        id: "wod1",
        wodName: "Test Rounds WOD",
        wodUrl: "test.com",
        createdAt: new Date(),
        benchmarks: {
          type: "rounds",
          levels: {
            elite: { min: 20, max: null },
            advanced: { min: 15, max: 20 },
            intermediate: { min: 10, max: 15 },
            beginner: { min: null, max: 10 },
          },
        },
      };
      expect(getNumericScore(mockWod, score)).toBe(5);
    });

    it("should return rounds + partial reps as decimal for rounds benchmarks", () => {
      const score: Score = {
        id: "1",
        userId: "user1",
        wodId: "wod1",
        time_seconds: null,
        reps: null,
        load: null,
        rounds_completed: 5,
        partial_reps: 12,
        isRx: true,
        scoreDate: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: null,
      };
      const mockWod: Wod = {
        id: "wod1",
        wodName: "Test Rounds WOD",
        wodUrl: "test.com",
        createdAt: new Date(),
        benchmarks: {
          type: "rounds",
          levels: {
            elite: { min: 20, max: null },
            advanced: { min: 15, max: 20 },
            intermediate: { min: 10, max: 15 },
            beginner: { min: null, max: 10 },
          },
        },
      };
      // The implementation treats partial reps as a decimal (e.g., 12 becomes 0.12)
      expect(getNumericScore(mockWod, score)).toBeCloseTo(5.12, 2);
    });

    it("should return null if benchmark type mismatch", () => {
      const score: Score = {
        id: "1",
        userId: "user1",
        wodId: "wod1",
        time_seconds: 65,
        reps: null,
        load: null,
        rounds_completed: null,
        partial_reps: null,
        isRx: true,
        scoreDate: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: null,
      };
      const mockWod: Wod = {
        id: "wod1",
        wodName: "Test Mismatch WOD",
        wodUrl: "test.com",
        createdAt: new Date(),
        benchmarks: {
          type: "reps",
          levels: {
            elite: { min: 100, max: null },
            advanced: { min: 75, max: 100 },
            intermediate: { min: 50, max: 75 },
            beginner: { min: null, max: 50 },
          },
        },
      };
      expect(getNumericScore(mockWod, score)).toBeNull();
    });

    it("should return null if no benchmarks", () => {
      const score: Score = {
        id: "1",
        userId: "user1",
        wodId: "wod1",
        time_seconds: 65,
        reps: null,
        load: null,
        rounds_completed: null,
        partial_reps: null,
        isRx: true,
        scoreDate: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: null,
      };
      expect(getNumericScore(null, score)).toBeNull();
    });

    it("should return null if no score", () => {
      const score: Score = {
        id: "1",
        userId: "user1",
        wodId: "wod1",
        time_seconds: null,
        reps: null,
        load: null,
        rounds_completed: null,
        partial_reps: null,
        isRx: true,
        scoreDate: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: null,
      };
      const mockWod: Wod = {
        id: "wod1",
        wodName: "Test No Score WOD",
        wodUrl: "test.com",
        createdAt: new Date(),
        benchmarks: {
          type: "time",
          levels: {
            elite: { min: null, max: 180 },
            advanced: { min: 180, max: 240 },
            intermediate: { min: 240, max: 300 },
            beginner: { min: 300, max: null },
          },
        },
      };
      expect(getNumericScore(mockWod, score)).toBeNull();
    });
  });

  describe("getPerformanceLevel", () => {
    it("should return correct level for time benchmarks", () => {
      const score: Score = {
        id: "1",
        userId: "user1",
        wodId: "wod1",
        time_seconds: 200,
        reps: null,
        load: null,
        rounds_completed: null,
        partial_reps: null,
        isRx: true,
        scoreDate: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: null,
      };
      const mockWod: Wod = {
        id: "wod1",
        wodName: "Test Time WOD",
        wodUrl: "test.com",
        createdAt: new Date(),
        benchmarks: {
          type: "time",
          levels: {
            elite: { min: null, max: 180 },
            advanced: { min: 180, max: 240 },
            intermediate: { min: 240, max: 300 },
            beginner: { min: 300, max: null },
          },
        },
      };
      expect(getPerformanceLevel(mockWod, score)).toBe("advanced");
    });

    it("should return correct level for rounds benchmarks", () => {
      const score: Score = {
        id: "1",
        userId: "user1",
        wodId: "wod1",
        time_seconds: null,
        reps: null,
        load: null,
        rounds_completed: 17,
        partial_reps: null,
        isRx: true,
        scoreDate: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: null,
      };
      const mockWod: Wod = {
        id: "wod1",
        wodName: "Test Rounds WOD",
        wodUrl: "test.com",
        createdAt: new Date(),
        benchmarks: {
          type: "rounds",
          levels: {
            elite: { min: 20, max: null },
            advanced: { min: 15, max: 20 },
            intermediate: { min: 10, max: 15 },
            beginner: { min: null, max: 10 },
          },
        },
      };
      expect(getPerformanceLevel(mockWod, score)).toBe("advanced");
    });

    it("should return correct level for load benchmarks", () => {
      const score: Score = {
        id: "1",
        userId: "user1",
        wodId: "wod1",
        time_seconds: null,
        reps: null,
        load: 275,
        rounds_completed: null,
        partial_reps: null,
        isRx: true,
        scoreDate: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: null,
      };
      const mockWod: Wod = {
        id: "wod1",
        wodName: "Test Load WOD",
        wodUrl: "test.com",
        createdAt: new Date(),
        benchmarks: {
          type: "load",
          levels: {
            elite: { min: 300, max: null },
            advanced: { min: 250, max: 300 },
            intermediate: { min: 200, max: 250 },
            beginner: { min: null, max: 200 },
          },
        },
      };
      expect(getPerformanceLevel(mockWod, score)).toBe("advanced");
    });

    it("should return correct level for reps benchmarks", () => {
      const score: Score = {
        id: "1",
        userId: "user1",
        wodId: "wod1",
        time_seconds: null,
        reps: 60,
        load: null,
        rounds_completed: null,
        partial_reps: null,
        isRx: true,
        scoreDate: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: null,
      };
      const mockWod: Wod = {
        id: "wod1",
        wodName: "Test Reps WOD",
        wodUrl: "test.com",
        createdAt: new Date(),
        benchmarks: {
          type: "reps",
          levels: {
            elite: { min: 100, max: null },
            advanced: { min: 75, max: 100 },
            intermediate: { min: 50, max: 75 },
            beginner: { min: null, max: 50 },
          },
        },
      };
      expect(getPerformanceLevel(mockWod, score)).toBe("intermediate");
    });

    it("should return null if no benchmarks", () => {
      const score: Score = {
        id: "1",
        userId: "user1",
        wodId: "wod1",
        time_seconds: 65,
        reps: null,
        load: null,
        rounds_completed: null,
        partial_reps: null,
        isRx: true,
        scoreDate: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: null,
      };
      expect(getPerformanceLevel(null, score)).toBeNull();
    });

    it("should return null if no numeric score can be determined", () => {
      const score: Score = {
        id: "1",
        userId: "user1",
        wodId: "wod1",
        time_seconds: null,
        reps: null,
        load: null,
        rounds_completed: null,
        partial_reps: null,
        isRx: true,
        scoreDate: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: null,
      };
      const mockWod: Wod = {
        id: "wod1",
        wodName: "Test No Score WOD",
        wodUrl: "test.com",
        createdAt: new Date(),
        benchmarks: {
          type: "time",
          levels: {
            elite: { min: null, max: 180 },
            advanced: { min: 180, max: 240 },
            intermediate: { min: 240, max: 300 },
            beginner: { min: 300, max: null },
          },
        },
      };
      expect(getPerformanceLevel(mockWod, score)).toBeNull();
    });
  });

  describe("hasScore", () => {
    it("should return true if any score field is present", () => {
      const score: Score = {
        id: "1",
        userId: "user1",
        wodId: "wod1",
        time_seconds: 65,
        reps: null,
        load: null,
        rounds_completed: null,
        partial_reps: null,
        isRx: true,
        scoreDate: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: null,
      };
      expect(hasScore(score)).toBe(true);
    });

    it("should return false if no score fields are present", () => {
      const score: Score = {
        id: "1",
        userId: "user1",
        wodId: "wod1",
        time_seconds: null,
        reps: null,
        load: null,
        rounds_completed: null,
        partial_reps: null,
        isRx: true,
        scoreDate: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: null,
      };
      expect(hasScore(score)).toBe(false);
    });
  });

  describe("sortWods", () => {
    const wods: Wod[] = [
      {
        id: "1",
        wodName: "Cindy",
        category: "Girl",
        difficulty: "Medium",
        countLikes: 100,
        createdAt: new Date(),
        wodUrl: "test.com/cindy",
        updatedAt: new Date(),
        description: "AMRAP in 20 minutes",
        difficultyExplanation: "Classic benchmark AMRAP.",
        tags: ["AMRAP"],
      },
      {
        id: "2",
        wodName: "Fran",
        category: "Girl",
        difficulty: "Hard",
        countLikes: 200,
        createdAt: new Date(),
        wodUrl: "test.com/fran",
        updatedAt: new Date(),
        description: "21-15-9 reps",
        difficultyExplanation: "Classic benchmark couplet.",
        tags: ["For Time"],
      },
      {
        id: "3",
        wodName: "Annie",
        category: "Girl",
        difficulty: "Easy",
        countLikes: 50,
        createdAt: new Date(),
        wodUrl: "test.com/annie",
        updatedAt: new Date(),
        description: "50-40-30-20-10 reps",
        difficultyExplanation: "Classic benchmark couplet.",
        tags: ["For Time"],
      },
    ];

    it("should sort by wodName ascending", () => {
      const sorted = sortWods(wods, "wodName", "asc");
      expect(sorted[0].wodName).toBe("Annie");
      expect(sorted[1].wodName).toBe("Cindy");
      expect(sorted[2].wodName).toBe("Fran");
    });

    it("should sort by wodName descending", () => {
      const sorted = sortWods(wods, "wodName", "desc");
      expect(sorted[0].wodName).toBe("Fran");
      expect(sorted[1].wodName).toBe("Cindy");
      expect(sorted[2].wodName).toBe("Annie");
    });

    it("should sort by countLikes ascending", () => {
      const sorted = sortWods(wods, "countLikes", "asc");
      expect(sorted[0].wodName).toBe("Annie");
      expect(sorted[1].wodName).toBe("Cindy");
      expect(sorted[2].wodName).toBe("Fran");
    });

    it("should sort by countLikes descending", () => {
      const sorted = sortWods(wods, "countLikes", "desc");
      expect(sorted[0].wodName).toBe("Fran");
      expect(sorted[1].wodName).toBe("Cindy");
      expect(sorted[2].wodName).toBe("Annie");
    });
  });
});

// --- Component Tests ---
import React from "react";
import { render, screen, fireEvent, within } from "~/test-utils";
import WodViewer from "./WodViewer";
import { Theme } from "@radix-ui/themes";

// Mock useMediaQuery to always return true (mobile)
vi.mock("~/utils/useMediaQuery", () => ({
  useMediaQuery: () => true,
}));

describe("WodViewer Mobile Sorting UI", () => {
  const mockWods = [
    {
      id: "1",
      wodName: "Cindy",
      category: "Girl" as const, // Use const assertion
      difficulty: "Medium",
      countLikes: 100,
      createdAt: new Date(),
      wodUrl: "test.com/cindy",
      updatedAt: new Date(),
      description: "AMRAP in 20 minutes",
      difficultyExplanation: "Classic benchmark AMRAP.",
      tags: ["AMRAP"],
    },
    {
      id: "2",
      wodName: "Fran",
      category: "Girl" as const, // Use const assertion
      difficulty: "Hard",
      countLikes: 200,
      createdAt: new Date(),
      wodUrl: "test.com/fran",
      updatedAt: new Date(),
      description: "21-15-9 reps",
      difficultyExplanation: "Classic benchmark couplet.",
      tags: ["For Time"],
    },
    {
      id: "3",
      wodName: "Annie",
      category: "Girl" as const, // Use const assertion
      difficulty: "Easy",
      countLikes: 50,
      createdAt: new Date(),
      wodUrl: "test.com/annie",
      updatedAt: new Date(),
      description: "50-40-30-20-10 reps",
      difficultyExplanation: "Classic benchmark couplet.",
      tags: ["For Time"],
    },
  ];

  beforeEach(() => {
    // Default: logged in user
    (useSession as Mock).mockReturnValue({
      data: {
        user: {
          id: "user1",
          name: "Test User",
          email: "test@example.com",
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          image: undefined,
        },
        session: {
          id: "session1",
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(),
          userId: "user1",
          userAgent: "test-agent",
          ipAddress: "127.0.0.1",
          token: "test-token",
        },
      },
      isPending: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it("renders the sort button and segmented control on the same line", () => {
    render(
      <Theme>
        <WodViewer initialWods={mockWods} />
      </Theme>,
    );
    expect(screen.queryByTestId("segmented-all")).not.toBeNull();
    expect(screen.queryByTestId("segmented-done")).not.toBeNull();
    expect(screen.queryByTestId("segmented-todo")).not.toBeNull();
    const sortButton = screen.getByLabelText(/Sort WODs/i);
    expect(sortButton).toBeInTheDocument();
  });

  it("does not show 'Your Score' sort option when logged out", async () => {
    (useSession as Mock).mockReturnValue({
      data: null,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <Theme>
        <WodViewer initialWods={mockWods} />
      </Theme>,
    );

    expect(screen.queryByTestId("segmented-all")).toBeNull();
    expect(screen.queryByTestId("segmented-done")).toBeNull();
    expect(screen.queryByTestId("segmented-todo")).toBeNull();

    const sortButton = screen.getByLabelText(/Sort WODs/i);
    fireEvent.keyDown(sortButton, { key: "Enter" });

    const menu = await screen.findByRole("menu");
    expect(menu).toBeInTheDocument();

    expect(within(menu).queryByTestId("sort-menuitem-results")).toBeNull();
  });

  it("always shows sort button regardless of auth state", () => {
    // Test with logged in user (default)
    const { rerender } = render(
      <Theme>
        <WodViewer initialWods={mockWods} />
      </Theme>,
    );
    expect(screen.getByLabelText(/Sort WODs/i)).toBeInTheDocument();
    expect(screen.queryByTestId("segmented-all")).not.toBeNull();
    expect(screen.queryByTestId("segmented-done")).not.toBeNull();
    expect(screen.queryByTestId("segmented-todo")).not.toBeNull();

    // Test with logged out user
    (useSession as Mock).mockReturnValue({
      data: null,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    });

    rerender(
      <Theme>
        <WodViewer initialWods={mockWods} />
      </Theme>,
    );
    expect(screen.getByLabelText(/Sort WODs/i)).toBeInTheDocument();
    expect(screen.queryByTestId("segmented-all")).toBeNull();
    expect(screen.queryByTestId("segmented-done")).toBeNull();
    expect(screen.queryByTestId("segmented-todo")).toBeNull();
  });

  it("shows SegmentedControl only when logged in", () => {
    // Logged in user (default)
    const { rerender } = render(
      <Theme>
        <WodViewer initialWods={mockWods} />
      </Theme>,
    );
    expect(screen.queryByTestId("segmented-all")).not.toBeNull();
    expect(screen.queryByTestId("segmented-done")).not.toBeNull();
    expect(screen.queryByTestId("segmented-todo")).not.toBeNull();

    // Logged out user
    (useSession as Mock).mockReturnValue({
      data: null,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    });

    rerender(
      <Theme>
        <WodViewer initialWods={mockWods} />
      </Theme>,
    );
    expect(screen.queryByTestId("segmented-all")).toBeNull();
    expect(screen.queryByTestId("segmented-done")).toBeNull();
    expect(screen.queryByTestId("segmented-todo")).toBeNull();
  });

  it("opens the sort dropdown and allows changing sort field and direction", async () => {
    render(
      <Theme>
        <WodViewer initialWods={mockWods} />
      </Theme>,
    );
    const sortButton = screen.getByLabelText(/Sort WODs/i);
    fireEvent.keyDown(sortButton, { key: "Enter" });

    const menu = await screen.findByRole("menu");
    expect(menu).toBeInTheDocument();
    expect(
      within(menu).getByTestId("sort-menuitem-wodName"),
    ).toBeInTheDocument();
    expect(within(menu).getByTestId("sort-menuitem-date")).toBeInTheDocument();
    expect(
      within(menu).getByTestId("sort-menuitem-difficulty"),
    ).toBeInTheDocument();
    expect(
      within(menu).getByTestId("sort-menuitem-countLikes"),
    ).toBeInTheDocument();
    expect(
      within(menu).getByTestId("sort-menuitem-results"),
    ).toBeInTheDocument();

    fireEvent.click(within(menu).getByTestId("sort-menuitem-wodName"));

    fireEvent.keyDown(sortButton, { key: "Enter" });
    const menuAgain = await screen.findByRole("menu");
    const nameMenuItem = within(menuAgain)
      .getByTestId("sort-menuitem-wodName")
      .closest('[role="menuitem"]');
    expect(nameMenuItem).not.toBeNull();
    expect(
      within(menuAgain).getByTestId("sort-menuitem-wodName"),
    ).toBeInTheDocument();

    fireEvent.click(within(menuAgain).getByTestId("sort-menuitem-wodName"));

    fireEvent.keyDown(sortButton, { key: "Enter" });
    const menuOneMoreTime = await screen.findByRole("menu");
    expect(menuOneMoreTime).toBeInTheDocument();
  });

  it("allows keyboard navigation of the sort dropdown for accessibility", async () => {
    render(
      <Theme>
        <WodViewer initialWods={mockWods} />
      </Theme>,
    );
    const sortButton = screen.getByLabelText(/Sort WODs/i);
    sortButton.focus();
    expect(sortButton).toHaveFocus();
    fireEvent.keyDown(sortButton, { key: "Enter" });

    const menu = await screen.findByRole("menu");
    expect(menu).toBeInTheDocument();
    expect(
      within(menu).getByTestId("sort-menuitem-wodName"),
    ).toBeInTheDocument();
    expect(within(menu).getByTestId("sort-menuitem-date")).toBeInTheDocument();
    expect(
      within(menu).getByTestId("sort-menuitem-difficulty"),
    ).toBeInTheDocument();
    expect(
      within(menu).getByTestId("sort-menuitem-countLikes"),
    ).toBeInTheDocument();
    expect(
      within(menu).getByTestId("sort-menuitem-results"),
    ).toBeInTheDocument();

    fireEvent.keyDown(document.activeElement || sortButton, {
      key: "ArrowDown",
    });
    expect(
      within(menu).getByTestId("sort-menuitem-wodName"),
    ).toBeInTheDocument();

    fireEvent.keyDown(document.activeElement || sortButton, {
      key: "ArrowDown",
    });
    expect(within(menu).getByTestId("sort-menuitem-date")).toBeInTheDocument();

    fireEvent.keyDown(document.activeElement || sortButton, { key: "Enter" });
  });
});
