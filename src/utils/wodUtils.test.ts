import {
  getPerformanceLevelColor,
  formatSecondsToMMSS,
  getPerformanceLevelTooltip,
  formatScore,
  getNumericScore,
  getPerformanceLevel,
  hasScore,
  sortWods,
} from "./wodUtils";
import type { Wod, Score } from "~/types/wodTypes";

// --- Helper Functions Tests ---
describe("wodUtils", () => {
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
        description: "Test description",
        category: "Benchmark",
        tags: [],
        difficulty: "Medium",
        difficultyExplanation: "Test explanation",
        countLikes: 0,
        movements: [],
        timecap: null,
        benchmarks: {
          type: "time",
          levels: {
            elite: { min: null, max: 180 },
            advanced: { min: 180, max: 240 },
            intermediate: { min: 240, max: 300 },
            beginner: { min: 300, max: null },
          },
        },
        updatedAt: new Date(),
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
        description: "Test description",
        category: "Benchmark",
        tags: [],
        difficulty: "Medium",
        difficultyExplanation: "Test explanation",
        countLikes: 0,
        movements: [],
        timecap: null,
        benchmarks: {
          type: "rounds",
          levels: {
            elite: { min: 20, max: null },
            advanced: { min: 15, max: 20 },
            intermediate: { min: 10, max: 15 },
            beginner: { min: null, max: 10 },
          },
        },
        updatedAt: new Date(),
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
        description: "Test description",
        category: "Benchmark",
        tags: [],
        difficulty: "Medium",
        difficultyExplanation: "Test explanation",
        countLikes: 0,
        movements: [],
        timecap: null,
        benchmarks: {
          type: "load",
          levels: {
            elite: { min: 300, max: null },
            advanced: { min: 250, max: 300 },
            intermediate: { min: 200, max: 250 },
            beginner: { min: null, max: 200 },
          },
        },
        updatedAt: new Date(),
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
        description: "Test description",
        category: "Benchmark",
        tags: [],
        difficulty: "Medium",
        difficultyExplanation: "Test explanation",
        countLikes: 0,
        movements: [],
        timecap: null,
        benchmarks: {
          type: "reps",
          levels: {
            elite: { min: 100, max: null },
            advanced: { min: 75, max: 100 },
            intermediate: { min: 50, max: 75 },
            beginner: { min: null, max: 50 },
          },
        },
        updatedAt: new Date(),
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
      const wod: Wod = {
        id: "wod1",
        wodName: "Test Time WOD",
        wodUrl: "test.com",
        createdAt: new Date(),
        description: "desc",
        category: "Benchmark",
        tags: [],
        difficulty: "Medium",
        difficultyExplanation: "Test explanation",
        countLikes: 0,
        movements: [],
        timecap: null,
        benchmarks: {
          type: "time",
          levels: {
            elite: { min: null, max: 180 },
            advanced: { min: 180, max: 240 },
            intermediate: { min: 240, max: 300 },
            beginner: { min: 300, max: null },
          },
        },
        updatedAt: new Date(),
      };
      expect(formatScore(score, wod)).toBe("1:05");
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
      const wod: Wod = {
        id: "wod1",
        wodName: "Test Reps WOD",
        wodUrl: "test.com",
        createdAt: new Date(),
        description: "desc",
        category: "Benchmark",
        tags: [],
        difficulty: "Medium",
        difficultyExplanation: "Test explanation",
        countLikes: 0,
        movements: [],
        timecap: null,
        benchmarks: {
          type: "reps",
          levels: {
            elite: { min: 100, max: null },
            advanced: { min: 75, max: 100 },
            intermediate: { min: 50, max: 75 },
            beginner: { min: null, max: 50 },
          },
        },
        updatedAt: new Date(),
      };
      expect(formatScore(score, wod)).toBe("42 reps");
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
      const wod: Wod = {
        id: "wod1",
        wodName: "Test Load WOD",
        wodUrl: "test.com",
        createdAt: new Date(),
        description: "desc",
        category: "Benchmark",
        tags: [],
        difficulty: "Medium",
        difficultyExplanation: "Test explanation",
        countLikes: 0,
        movements: [],
        timecap: null,
        benchmarks: {
          type: "load",
          levels: {
            elite: { min: 300, max: null },
            advanced: { min: 250, max: 300 },
            intermediate: { min: 200, max: 250 },
            beginner: { min: null, max: 200 },
          },
        },
        updatedAt: new Date(),
      };
      expect(formatScore(score, wod)).toBe("225 lbs");
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
      const wod: Wod = {
        id: "wod1",
        wodName: "Test Rounds WOD",
        wodUrl: "test.com",
        createdAt: new Date(),
        description: "desc",
        category: "Benchmark",
        tags: [],
        difficulty: "Medium",
        difficultyExplanation: "Test explanation",
        countLikes: 0,
        movements: [],
        timecap: null,
        benchmarks: {
          type: "rounds",
          levels: {
            elite: { min: 20, max: null },
            advanced: { min: 15, max: 20 },
            intermediate: { min: 10, max: 15 },
            beginner: { min: null, max: 10 },
          },
        },
        updatedAt: new Date(),
      };
      expect(formatScore(score, wod)).toBe("5 rounds");
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
      const wod: Wod = {
        id: "wod1",
        wodName: "Test Rounds WOD",
        wodUrl: "test.com",
        createdAt: new Date(),
        description: "desc",
        category: "Benchmark",
        tags: [],
        difficulty: "Medium",
        difficultyExplanation: "Test explanation",
        countLikes: 0,
        movements: [],
        timecap: null,
        benchmarks: {
          type: "rounds",
          levels: {
            elite: { min: 20, max: null },
            advanced: { min: 15, max: 20 },
            intermediate: { min: 10, max: 15 },
            beginner: { min: null, max: 10 },
          },
        },
        updatedAt: new Date(),
      };
      expect(formatScore(score, wod)).toBe("5+12");
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
      const wod: Wod = {
        id: "wod1",
        wodName: "Test No Score WOD",
        wodUrl: "test.com",
        createdAt: new Date(),
        description: "desc",
        category: "Benchmark",
        tags: [],
        difficulty: "Medium",
        difficultyExplanation: "Test explanation",
        countLikes: 0,
        movements: [],
        timecap: null,
        benchmarks: {
          type: "time",
          levels: {
            elite: { min: null, max: 180 },
            advanced: { min: 180, max: 240 },
            intermediate: { min: 240, max: 300 },
            beginner: { min: 300, max: null },
          },
        },
        updatedAt: new Date(),
      };
      expect(formatScore(score, wod)).toBe("-");
    });
  });

  // --- New logic tests for formatScore ---
  describe("formatScore - new logic", () => {
    const baseScore: Partial<Score> = {
      id: "s1",
      userId: "u1",
      wodId: "w1",
      isRx: true,
      scoreDate: new Date(),
      notes: null,
      createdAt: new Date(),
      updatedAt: null,
    };

    const baseWod: Partial<Wod> = {
      id: "w1",
      wodName: "Test WOD",
      wodUrl: "test.com",
      createdAt: new Date(),
      description: "desc",
      category: "Benchmark",
      tags: [],
      difficulty: "Medium",
      difficultyExplanation: "Test explanation",
      countLikes: 0,
      movements: [],
      updatedAt: new Date(),
    };

    it("should display reps when timecap is hit for reps WOD", () => {
      const wod: Wod = {
        ...baseWod,
        timecap: 300,
        benchmarks: {
          type: "reps",
          levels: {
            elite: { min: 100, max: null },
            advanced: { min: 75, max: 100 },
            intermediate: { min: 50, max: 75 },
            beginner: { min: null, max: 50 },
          },
        },
      } as Wod;
      const score: Score = {
        ...baseScore,
        time_seconds: 300,
        reps: 55,
        load: null,
        rounds_completed: null,
        partial_reps: null,
      } as Score;
      expect(formatScore(score, wod)).toBe("55 reps");
    });

    it("should display load when timecap is hit for load WOD", () => {
      const wod: Wod = {
        ...baseWod,
        timecap: 600,
        benchmarks: {
          type: "load",
          levels: {
            elite: { min: 300, max: null },
            advanced: { min: 250, max: 300 },
            intermediate: { min: 200, max: 250 },
            beginner: { min: null, max: 200 },
          },
        },
      } as Wod;
      const score: Score = {
        ...baseScore,
        time_seconds: 600,
        reps: null,
        load: 185,
        rounds_completed: null,
        partial_reps: null,
      } as Score;
      expect(formatScore(score, wod)).toBe("185 lbs");
    });

    it("should display rounds when timecap is hit for rounds WOD (no partial reps)", () => {
      const wod: Wod = {
        ...baseWod,
        timecap: 900,
        benchmarks: {
          type: "rounds",
          levels: {
            elite: { min: 20, max: null },
            advanced: { min: 15, max: 20 },
            intermediate: { min: 10, max: 15 },
            beginner: { min: null, max: 10 },
          },
        },
      } as Wod;
      const score: Score = {
        ...baseScore,
        time_seconds: 900,
        reps: null,
        load: null,
        rounds_completed: 7,
        partial_reps: 0,
      } as Score;
      expect(formatScore(score, wod)).toBe("7 rounds");
    });

    it("should display rounds+partial when timecap is hit for rounds WOD (with partial reps)", () => {
      const wod: Wod = {
        ...baseWod,
        timecap: 900,
        benchmarks: {
          type: "rounds",
          levels: {
            elite: { min: 20, max: null },
            advanced: { min: 15, max: 20 },
            intermediate: { min: 10, max: 15 },
            beginner: { min: null, max: 10 },
          },
        },
      } as Wod;
      const score: Score = {
        ...baseScore,
        time_seconds: 900,
        reps: null,
        load: null,
        rounds_completed: 7,
        partial_reps: 8,
      } as Score;
      expect(formatScore(score, wod)).toBe("7+8");
    });

    it("should fallback to MM:SS (TC) if timecap hit for non-time WOD but no matching score value", () => {
      const wod: Wod = {
        ...baseWod,
        timecap: 400,
        benchmarks: {
          type: "reps",
          levels: {
            elite: { min: 100, max: null },
            advanced: { min: 75, max: 100 },
            intermediate: { min: 50, max: 75 },
            beginner: { min: null, max: 50 },
          },
        },
      } as Wod;
      const score: Score = {
        ...baseScore,
        time_seconds: 400,
        reps: null,
        load: null,
        rounds_completed: null,
        partial_reps: null,
      } as Score;
      expect(formatScore(score, wod)).toBe("6:40 (TC)");
    });

    it("should format time as normal if timecap hit for time WOD", () => {
      const wod: Wod = {
        ...baseWod,
        timecap: 180,
        benchmarks: {
          type: "time",
          levels: {
            elite: { min: null, max: 100 },
            advanced: { min: 100, max: 120 },
            intermediate: { min: 120, max: 150 },
            beginner: { min: 150, max: null },
          },
        },
      } as Wod;
      const score: Score = {
        ...baseScore,
        time_seconds: 180,
        reps: null,
        load: null,
        rounds_completed: null,
        partial_reps: null,
      } as Score;
      expect(formatScore(score, wod)).toBe("3:00");
    });

    it("should append suffix if provided (basic case)", () => {
      const wod: Wod = {
        ...baseWod,
        timecap: 0,
        benchmarks: {
          type: "time",
          levels: {
            elite: { min: null, max: 100 },
            advanced: { min: 100, max: 120 },
            intermediate: { min: 120, max: 150 },
            beginner: { min: 150, max: null },
          },
        },
      } as Wod;
      const score: Score = {
        ...baseScore,
        time_seconds: 95,
        reps: null,
        load: null,
        rounds_completed: null,
        partial_reps: null,
      } as Score;
      expect(formatScore(score, wod, "Rx")).toBe("1:35 Rx");
    });

    it("should append suffix if provided (timecap hit for non-time WOD)", () => {
      const wod: Wod = {
        ...baseWod,
        timecap: 300,
        benchmarks: {
          type: "reps",
          levels: {
            elite: { min: 100, max: null },
            advanced: { min: 75, max: 100 },
            intermediate: { min: 50, max: 75 },
            beginner: { min: null, max: 50 },
          },
        },
      } as Wod;
      const score: Score = {
        ...baseScore,
        time_seconds: 300,
        reps: 60,
        load: null,
        rounds_completed: null,
        partial_reps: null,
      } as Score;
      expect(formatScore(score, wod, "Scaled")).toBe("60 reps Scaled");
    });

    it("should not display +0 for partial reps = 0 (should show X rounds)", () => {
      const wod: Wod = {
        ...baseWod,
        timecap: 900,
        benchmarks: {
          type: "rounds",
          levels: {
            elite: { min: 20, max: null },
            advanced: { min: 15, max: 20 },
            intermediate: { min: 10, max: 15 },
            beginner: { min: null, max: 10 },
          },
        },
      } as Wod;
      const score: Score = {
        ...baseScore,
        time_seconds: 900,
        reps: null,
        load: null,
        rounds_completed: 5,
        partial_reps: 0,
      } as Score;
      expect(formatScore(score, wod)).toBe("5 rounds");
    });

    it("should return dash if all score fields are null and timecap is hit", () => {
      const wod: Wod = {
        ...baseWod,
        timecap: 200,
        benchmarks: {
          type: "reps",
          levels: {
            elite: { min: 100, max: null },
            advanced: { min: 75, max: 100 },
            intermediate: { min: 50, max: 75 },
            beginner: { min: null, max: 50 },
          },
        },
      } as Wod;
      const score: Score = {
        ...baseScore,
        time_seconds: 200,
        reps: null,
        load: null,
        rounds_completed: null,
        partial_reps: null,
      } as Score;
      // This will fallback to MM:SS (TC) as per logic, not dash
      expect(formatScore(score, wod)).toBe("3:20 (TC)");
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
        description: "Test description",
        category: "Benchmark",
        tags: [],
        difficulty: "Medium",
        difficultyExplanation: "Test explanation",
        countLikes: 0,
        movements: [],
        timecap: null,
        benchmarks: {
          type: "time",
          levels: {
            elite: { min: null, max: 180 },
            advanced: { min: 180, max: 240 },
            intermediate: { min: 240, max: 300 },
            beginner: { min: 300, max: null },
          },
        },
        updatedAt: new Date(),
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
        description: "Test description",
        category: "Benchmark",
        tags: [],
        difficulty: "Medium",
        difficultyExplanation: "Test explanation",
        countLikes: 0,
        movements: [],
        timecap: null,
        benchmarks: {
          type: "reps",
          levels: {
            elite: { min: 100, max: null },
            advanced: { min: 75, max: 100 },
            intermediate: { min: 50, max: 75 },
            beginner: { min: null, max: 50 },
          },
        },
        updatedAt: new Date(),
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
        description: "Test description",
        category: "Benchmark",
        tags: [],
        difficulty: "Medium",
        difficultyExplanation: "Test explanation",
        countLikes: 0,
        movements: [],
        timecap: null,
        benchmarks: {
          type: "load",
          levels: {
            elite: { min: 300, max: null },
            advanced: { min: 250, max: 300 },
            intermediate: { min: 200, max: 250 },
            beginner: { min: null, max: 200 },
          },
        },
        updatedAt: new Date(),
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
        description: "Test description",
        category: "Benchmark",
        tags: [],
        difficulty: "Medium",
        difficultyExplanation: "Test explanation",
        countLikes: 0,
        movements: [],
        timecap: null,
        benchmarks: {
          type: "rounds",
          levels: {
            elite: { min: 20, max: null },
            advanced: { min: 15, max: 20 },
            intermediate: { min: 10, max: 15 },
            beginner: { min: null, max: 10 },
          },
        },
        updatedAt: new Date(),
      };
      expect(getNumericScore(mockWod, score)).toBe(5);
    });

    it("should return null when benchmark type doesn't match score type", () => {
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
        wodName: "Test Load WOD",
        wodUrl: "test.com",
        createdAt: new Date(),
        description: "Test description",
        category: "Benchmark",
        tags: [],
        difficulty: "Medium",
        difficultyExplanation: "Test explanation",
        countLikes: 0,
        movements: [],
        timecap: null,
        benchmarks: {
          type: "load",
          levels: {
            elite: { min: 300, max: null },
            advanced: { min: 250, max: 300 },
            intermediate: { min: 200, max: 250 },
            beginner: { min: null, max: 200 },
          },
        },
        updatedAt: new Date(),
      };
      // When benchmark type (load) doesn't match score type (rounds), return null
      expect(getNumericScore(mockWod, score)).toBeNull();
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
        wodName: "Test Rounds WOD",
        wodUrl: "test.com",
        createdAt: new Date(),
        description: "Test description",
        category: "Benchmark",
        tags: [],
        difficulty: "Medium",
        difficultyExplanation: "Test explanation",
        countLikes: 0,
        movements: [],
        timecap: null,
        benchmarks: {
          type: "rounds",
          levels: {
            elite: { min: 20, max: null },
            advanced: { min: 15, max: 20 },
            intermediate: { min: 10, max: 15 },
            beginner: { min: null, max: 10 },
          },
        },
        updatedAt: new Date(),
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
        description: "Test description",
        category: "Benchmark",
        tags: [],
        difficulty: "Medium",
        difficultyExplanation: "Test explanation",
        countLikes: 0,
        movements: [],
        timecap: null,
        benchmarks: {
          type: "time",
          levels: {
            elite: { min: null, max: 180 },
            advanced: { min: 180, max: 240 },
            intermediate: { min: 240, max: 300 },
            beginner: { min: 300, max: null },
          },
        },
        updatedAt: new Date(),
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
        description: "Test description",
        category: "Benchmark",
        tags: [],
        difficulty: "Medium",
        difficultyExplanation: "Test explanation",
        countLikes: 0,
        movements: [],
        timecap: null,
        benchmarks: {
          type: "time",
          levels: {
            elite: { min: null, max: 180 },
            advanced: { min: 180, max: 240 },
            intermediate: { min: 240, max: 300 },
            beginner: { min: 300, max: null },
          },
        },
        updatedAt: new Date(),
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
        description: "Test description",
        category: "Benchmark",
        tags: [],
        difficulty: "Medium",
        difficultyExplanation: "Test explanation",
        countLikes: 0,
        movements: [],
        timecap: null,
        benchmarks: {
          type: "rounds",
          levels: {
            elite: { min: 20, max: null },
            advanced: { min: 15, max: 20 },
            intermediate: { min: 10, max: 15 },
            beginner: { min: null, max: 10 },
          },
        },
        updatedAt: new Date(),
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
        description: "Test description",
        category: "Benchmark",
        tags: [],
        difficulty: "Medium",
        difficultyExplanation: "Test explanation",
        countLikes: 0,
        movements: [],
        timecap: null,
        benchmarks: {
          type: "load",
          levels: {
            elite: { min: 300, max: null },
            advanced: { min: 250, max: 300 },
            intermediate: { min: 200, max: 250 },
            beginner: { min: null, max: 200 },
          },
        },
        updatedAt: new Date(),
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
        description: "Test description",
        category: "Benchmark",
        tags: [],
        difficulty: "Medium",
        difficultyExplanation: "Test explanation",
        countLikes: 0,
        movements: [],
        timecap: null,
        benchmarks: {
          type: "reps",
          levels: {
            elite: { min: 100, max: null },
            advanced: { min: 75, max: 100 },
            intermediate: { min: 50, max: 75 },
            beginner: { min: null, max: 50 },
          },
        },
        updatedAt: new Date(),
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
        description: "Test description",
        category: "Benchmark",
        tags: [],
        difficulty: "Medium",
        difficultyExplanation: "Test explanation",
        countLikes: 0,
        movements: [],
        timecap: null,
        benchmarks: {
          type: "time",
          levels: {
            elite: { min: null, max: 180 },
            advanced: { min: 180, max: 240 },
            intermediate: { min: 240, max: 300 },
            beginner: { min: 300, max: null },
          },
        },
        updatedAt: new Date(),
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
        wodName: "Test",
        category: "Girl",
        difficulty: "Medium",
        countLikes: 100,
        createdAt: new Date(),
        wodUrl: "test.com/test",
        updatedAt: new Date(),
        description: "Test WOD",
        difficultyExplanation: "Test explanation",
        tags: ["AMRAP"],
        benchmarks: null,
        movements: [],
        timecap: null,
      },
      {
        id: "2",
        wodName: "Test2",
        category: "Girl",
        difficulty: "Hard",
        countLikes: 200,
        createdAt: new Date(),
        wodUrl: "test.com/test2",
        updatedAt: new Date(),
        description: "Test WOD 2",
        difficultyExplanation: "Test explanation 2",
        tags: ["For Time"],
        benchmarks: null,
        movements: [],
        timecap: null,
      },
      {
        id: "3",
        wodName: "Test3",
        category: "Girl",
        difficulty: "Easy",
        countLikes: 50,
        createdAt: new Date(),
        wodUrl: "test.com/test3",
        updatedAt: new Date(),
        description: "Test WOD 3",
        difficultyExplanation: "Test explanation 3",
        tags: ["For Time"],
        benchmarks: null,
        movements: [],
        timecap: null,
      },
    ];

    it("should sort by wodName ascending", () => {
      const sorted = sortWods(wods, "wodName", "asc");
      expect(sorted[0].wodName).toBe("Test");
      expect(sorted[1].wodName).toBe("Test2");
      expect(sorted[2].wodName).toBe("Test3");
    });

    it("should sort by wodName descending", () => {
      const sorted = sortWods(wods, "wodName", "desc");
      expect(sorted[0].wodName).toBe("Test3");
      expect(sorted[1].wodName).toBe("Test2");
      expect(sorted[2].wodName).toBe("Test");
    });

    it("should sort by countLikes ascending", () => {
      const sorted = sortWods(wods, "countLikes", "asc");
      expect(sorted[0].wodName).toBe("Test3");
      expect(sorted[1].wodName).toBe("Test");
      expect(sorted[2].wodName).toBe("Test2");
    });

    it("should sort by countLikes descending", () => {
      const sorted = sortWods(wods, "countLikes", "desc");
      expect(sorted[0].wodName).toBe("Test2");
      expect(sorted[1].wodName).toBe("Test");
      expect(sorted[2].wodName).toBe("Test3");
    });
  });
});
