import { describe, it, expect, vi, beforeEach } from 'vitest'; // Remove afterEach
import { render, screen, fireEvent } from '../../test-utils'; // Removed 'within'
import '@testing-library/jest-dom';
import WodViewer, { // Import component itself
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
  // Removed 'Benchmarks' type import
} from './WodViewer';

// Define types locally for mocks as they are not exported from component
type SortByType = "wodName" | "date" | "level" | "attempts" | "latestLevel";
type SortDirection = "asc" | "desc";

// --- Mocks and Test Data ---

const mockWodTime: Wod = {
  wodUrl: 'test.com/fran',
  wodName: 'Fran',
  benchmarks: {
    type: 'time',
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
  wodUrl: 'test.com/cindy',
  wodName: 'Cindy',
  benchmarks: {
    type: 'rounds',
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
  wodUrl: 'test.com/deadlift',
  wodName: 'Deadlift 1RM',
  benchmarks: {
    type: 'load',
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
  wodUrl: 'test.com/max-pullups',
  wodName: 'Max Pull-ups',
  benchmarks: {
    type: 'reps',
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
  wodUrl: 'test.com/random',
  wodName: 'Random WOD',
  results: [],
};

const mockResultTime = (seconds: number | null, rx = true): WodResult => ({
  score_time_seconds: seconds,
  score_reps: null,
  score_load: null,
  score_rounds_completed: null,
  score_partial_reps: null,
  rxStatus: rx ? 'Rx' : 'Scaled',
  date: '2024-01-15',
});

const mockResultRounds = (rounds: number | null, partialReps: number | null = 0, rx = true): WodResult => ({
  score_time_seconds: null,
  score_reps: null,
  score_load: null,
  score_rounds_completed: rounds,
  score_partial_reps: partialReps,
  rxStatus: rx ? 'Rx' : 'Scaled',
  date: '2024-01-16',
});

const mockResultLoad = (load: number | null, rx = true): WodResult => ({
  score_time_seconds: null,
  score_reps: null,
  score_load: load,
  score_rounds_completed: null,
  score_partial_reps: null,
  rxStatus: rx ? 'Rx' : 'Scaled',
  date: '2024-01-17',
});

const mockResultReps = (reps: number | null, rx = true): WodResult => ({
  score_time_seconds: null,
  score_reps: reps,
  score_load: null,
  score_rounds_completed: null,
  score_partial_reps: null,
  rxStatus: rx ? 'Rx' : 'Scaled',
  date: '2024-01-18',
});

const mockResultNoScore = (): WodResult => ({
  score_time_seconds: null,
  score_reps: null,
  score_load: null,
  score_rounds_completed: null,
  score_partial_reps: null,
  rxStatus: null,
  date: '2024-01-19',
});

// --- Tests ---

describe('WodViewer Helper Functions', () => {
  describe('getPerformanceLevelColor', () => {
    it('should return correct color class for each level', () => {
      expect(getPerformanceLevelColor('elite')).toBe('text-purple-600 dark:text-purple-400');
      expect(getPerformanceLevelColor('advanced')).toBe('text-green-600 dark:text-green-400');
      expect(getPerformanceLevelColor('intermediate')).toBe('text-yellow-600 dark:text-yellow-400');
      expect(getPerformanceLevelColor('beginner')).toBe('text-red-600 dark:text-red-400');
    });

    it('should return default color class for null or unknown levels', () => {
      expect(getPerformanceLevelColor(null)).toBe('text-foreground/70 dark:text-foreground/60');
      expect(getPerformanceLevelColor('unknown')).toBe('text-foreground/70 dark:text-foreground/60'); // Based on switch default
    });
  });

  describe('formatSecondsToMMSS', () => {
    it('should format seconds correctly', () => {
      expect(formatSecondsToMMSS(0)).toBe('0:00');
      expect(formatSecondsToMMSS(59)).toBe('0:59');
      expect(formatSecondsToMMSS(60)).toBe('1:00');
      expect(formatSecondsToMMSS(95)).toBe('1:35');
      expect(formatSecondsToMMSS(120)).toBe('2:00');
      expect(formatSecondsToMMSS(3661)).toBe('61:01'); // Over an hour
    });
  });

  describe('getPerformanceLevelTooltip', () => {
    it('should return correct tooltip for time benchmarks', () => {
      expect(getPerformanceLevelTooltip(mockWodTime, 'elite')).toBe('Elite: 0:00 - 2:00');
      expect(getPerformanceLevelTooltip(mockWodTime, 'beginner')).toBe('Beginner: 0:00 - 8:00');
    });

    it('should return correct tooltip for rounds benchmarks', () => {
      expect(getPerformanceLevelTooltip(mockWodRounds, 'elite')).toBe('Elite: 25 - ∞ rounds');
      expect(getPerformanceLevelTooltip(mockWodRounds, 'beginner')).toBe('Beginner: 10 - ∞ rounds');
    });
     it('should return correct tooltip for load benchmarks', () => {
      expect(getPerformanceLevelTooltip(mockWodLoad, 'elite')).toBe('Elite: 405 - ∞ load');
      expect(getPerformanceLevelTooltip(mockWodLoad, 'beginner')).toBe('Beginner: 135 - ∞ load');
    });
     it('should return correct tooltip for reps benchmarks', () => {
      expect(getPerformanceLevelTooltip(mockWodReps, 'elite')).toBe('Elite: 30 - ∞ reps');
      expect(getPerformanceLevelTooltip(mockWodReps, 'beginner')).toBe('Beginner: 5 - ∞ reps');
    });

    it('should return default message if no benchmarks or level', () => {
      expect(getPerformanceLevelTooltip(mockWodNoBenchmark, 'elite')).toBe('No benchmark data available');
      expect(getPerformanceLevelTooltip(mockWodTime, null)).toBe('No benchmark data available');
    });
  });

  describe('formatScore', () => {
    it('should format time scores', () => {
      expect(formatScore(mockResultTime(155))).toBe('2:35');
    });

    it('should format reps scores', () => {
      expect(formatScore(mockResultReps(25))).toBe('25 reps');
    });

    it('should format load scores', () => {
      expect(formatScore(mockResultLoad(225))).toBe('225 lbs');
    });

    it('should format rounds scores', () => {
      expect(formatScore(mockResultRounds(15))).toBe('15');
    });

    it('should format rounds + partial reps scores', () => {
      expect(formatScore(mockResultRounds(15, 10))).toBe('15+10');
    });

    it('should return empty string if no score', () => {
      expect(formatScore(mockResultNoScore())).toBe('');
    });
  });

  describe('getNumericScore', () => {
    it('should return time in seconds for time benchmarks', () => {
      expect(getNumericScore(mockWodTime, mockResultTime(110))).toBe(110);
    });

    it('should return reps for reps benchmarks', () => {
      expect(getNumericScore(mockWodReps, mockResultReps(22))).toBe(22);
    });

    it('should return load for load benchmarks', () => {
      expect(getNumericScore(mockWodLoad, mockResultLoad(350))).toBe(350);
    });

    it('should return rounds as integer for rounds benchmarks', () => {
      expect(getNumericScore(mockWodRounds, mockResultRounds(18))).toBe(18);
    });

    it('should return rounds + partial reps as decimal for rounds benchmarks', () => {
      expect(getNumericScore(mockWodRounds, mockResultRounds(18, 5))).toBe(18.05);
    });

    it('should return null if benchmark type mismatch', () => {
      expect(getNumericScore(mockWodTime, mockResultReps(20))).toBe(null);
      expect(getNumericScore(mockWodReps, mockResultTime(120))).toBe(null);
    });

    it('should return null if no benchmarks', () => {
      expect(getNumericScore(mockWodNoBenchmark, mockResultTime(120))).toBe(null);
    });

    it('should return null if no score', () => {
      expect(getNumericScore(mockWodTime, mockResultNoScore())).toBe(null);
    });
  });

  describe('getPerformanceLevel', () => {
    // Time (lower is better)
    it('should return correct level for time benchmarks', () => {
      expect(getPerformanceLevel(mockWodTime, mockResultTime(110))).toBe('elite'); // 1:50
      expect(getPerformanceLevel(mockWodTime, mockResultTime(120))).toBe('elite'); // 2:00
      expect(getPerformanceLevel(mockWodTime, mockResultTime(121))).toBe('advanced'); // 2:01
      expect(getPerformanceLevel(mockWodTime, mockResultTime(180))).toBe('advanced'); // 3:00
      expect(getPerformanceLevel(mockWodTime, mockResultTime(181))).toBe('intermediate'); // 3:01
      expect(getPerformanceLevel(mockWodTime, mockResultTime(300))).toBe('intermediate'); // 5:00
      expect(getPerformanceLevel(mockWodTime, mockResultTime(301))).toBe('beginner'); // 5:01
      expect(getPerformanceLevel(mockWodTime, mockResultTime(500))).toBe('beginner'); // 8:20
    });

    // Rounds (higher is better)
    it('should return correct level for rounds benchmarks', () => {
      expect(getPerformanceLevel(mockWodRounds, mockResultRounds(26))).toBe('elite');
      expect(getPerformanceLevel(mockWodRounds, mockResultRounds(25))).toBe('elite');
      expect(getPerformanceLevel(mockWodRounds, mockResultRounds(24))).toBe('advanced');
      expect(getPerformanceLevel(mockWodRounds, mockResultRounds(20))).toBe('advanced');
      expect(getPerformanceLevel(mockWodRounds, mockResultRounds(19))).toBe('intermediate');
      expect(getPerformanceLevel(mockWodRounds, mockResultRounds(15))).toBe('intermediate');
      expect(getPerformanceLevel(mockWodRounds, mockResultRounds(14))).toBe('beginner');
      expect(getPerformanceLevel(mockWodRounds, mockResultRounds(10))).toBe('beginner');
      expect(getPerformanceLevel(mockWodRounds, mockResultRounds(9))).toBe('beginner');
      // With partial reps
      expect(getPerformanceLevel(mockWodRounds, mockResultRounds(24, 5))).toBe('advanced'); // 24.05
      expect(getPerformanceLevel(mockWodRounds, mockResultRounds(19, 99))).toBe('intermediate'); // 19.99
    });

    // Load (higher is better)
    it('should return correct level for load benchmarks', () => {
      expect(getPerformanceLevel(mockWodLoad, mockResultLoad(410))).toBe('elite');
      expect(getPerformanceLevel(mockWodLoad, mockResultLoad(405))).toBe('elite');
      expect(getPerformanceLevel(mockWodLoad, mockResultLoad(400))).toBe('advanced');
      expect(getPerformanceLevel(mockWodLoad, mockResultLoad(315))).toBe('advanced');
      expect(getPerformanceLevel(mockWodLoad, mockResultLoad(310))).toBe('intermediate');
      expect(getPerformanceLevel(mockWodLoad, mockResultLoad(225))).toBe('intermediate');
      expect(getPerformanceLevel(mockWodLoad, mockResultLoad(220))).toBe('beginner');
      expect(getPerformanceLevel(mockWodLoad, mockResultLoad(135))).toBe('beginner');
      expect(getPerformanceLevel(mockWodLoad, mockResultLoad(130))).toBe('beginner');
    });

    // Reps (higher is better)
    it('should return correct level for reps benchmarks', () => {
       expect(getPerformanceLevel(mockWodReps, mockResultReps(35))).toBe('elite');
       expect(getPerformanceLevel(mockWodReps, mockResultReps(30))).toBe('elite');
       expect(getPerformanceLevel(mockWodReps, mockResultReps(29))).toBe('advanced');
       expect(getPerformanceLevel(mockWodReps, mockResultReps(20))).toBe('advanced');
       expect(getPerformanceLevel(mockWodReps, mockResultReps(19))).toBe('intermediate');
       expect(getPerformanceLevel(mockWodReps, mockResultReps(10))).toBe('intermediate');
       expect(getPerformanceLevel(mockWodReps, mockResultReps(9))).toBe('beginner');
       expect(getPerformanceLevel(mockWodReps, mockResultReps(5))).toBe('beginner');
       expect(getPerformanceLevel(mockWodReps, mockResultReps(4))).toBe('beginner');
    });

    it('should return null if no benchmarks', () => {
      expect(getPerformanceLevel(mockWodNoBenchmark, mockResultTime(120))).toBe(null);
    });

    it('should return null if no numeric score can be determined', () => {
      expect(getPerformanceLevel(mockWodTime, mockResultNoScore())).toBe(null);
      expect(getPerformanceLevel(mockWodTime, mockResultReps(20))).toBe(null); // Mismatch
    });
  });

  describe('hasScore', () => {
    it('should return true if any score field is present', () => {
      expect(hasScore(mockResultTime(120))).toBe(true);
      expect(hasScore(mockResultReps(10))).toBe(true);
      expect(hasScore(mockResultLoad(135))).toBe(true);
      expect(hasScore(mockResultRounds(5))).toBe(true);
      expect(hasScore(mockResultRounds(5, 10))).toBe(true);
    });
 
     it('should return false if no score fields are present', () => {
       expect(hasScore(mockResultNoScore())).toBe(false);
       // Ensure the object conforms to WodResult type
       const resultWithNoScores: WodResult = {
         date: '2023-01-01',
         rxStatus: 'Rx',
         score_time_seconds: null,
         score_reps: null,
         score_load: null,
         score_rounds_completed: null,
         score_partial_reps: null,
       };
       expect(hasScore(resultWithNoScores)).toBe(false);
     });
   });

  describe('sortWods', () => {
    const wodsToSort: Wod[] = [
      { // Wod A - Fran, faster time, older date, 1 attempt, elite
        ...mockWodTime,
        wodName: 'Fran',
        results: [mockResultTime(110, true)], // Elite
        category: 'Girl',
        tags: ['For Time', 'Couplet'],
      },
      { // Wod B - Cindy, fewer rounds, newer date, 2 attempts, intermediate
        ...mockWodRounds,
        wodName: 'Cindy',
        results: [
          { ...mockResultRounds(18, 0, true), date: '2024-02-10' }, // Intermediate
          { ...mockResultRounds(15, 0, true), date: '2023-11-05' }, // Intermediate
        ],
        category: 'Girl',
        tags: ['AMRAP'],
      },
      { // Wod C - Deadlift, lower weight, middle date, 1 attempt, beginner (scaled)
        ...mockWodLoad,
        wodName: 'Deadlift',
        results: [mockResultLoad(200, false)], // Beginner (Scaled)
        category: 'Benchmark',
        tags: ['Ladder'],
      },
       { // Wod D - Fran, slower time, latest date, 1 attempt, advanced
        ...mockWodTime,
        wodName: 'Fran', // Same name as A
        results: [{ ...mockResultTime(150, true), date: '2024-03-01' }], // Advanced
        category: 'Girl',
        tags: ['For Time', 'Couplet'],
      },
       { // Wod E - Cindy, more rounds, earliest date, 1 attempt, elite (scaled)
        ...mockWodRounds,
        wodName: 'Cindy', // Same name as B
        results: [{ ...mockResultRounds(26, 0, false), date: '2023-05-15' }], // Elite (Scaled)
        category: 'Girl',
        tags: ['AMRAP'],
      },
      { // Wod F - No results
        ...mockWodReps,
        wodName: 'Pull-ups',
        results: [],
        category: 'Benchmark',
      },
      { // Wod G - Result with no score
        ...mockWodReps,
        wodName: 'Push-ups',
        results: [mockResultNoScore()],
        category: 'Benchmark',
      },
       { // Wod H - Cindy, latest result is better
        ...mockWodRounds,
        wodName: 'Cindy', // Same name as B, E
        results: [
          { ...mockResultRounds(15, 0, true), date: '2023-10-01' }, // Intermediate
          { ...mockResultRounds(22, 0, true), date: '2024-04-01' }, // Advanced (Latest)
        ],
        category: 'Girl',
        tags: ['AMRAP'],
      },
    ];

    it('should sort by wodName ascending', () => {
      const sorted = sortWods(wodsToSort, 'wodName', 'asc');
      expect(sorted.map(w => w.wodName)).toEqual(['Cindy', 'Cindy', 'Cindy', 'Deadlift', 'Fran', 'Fran', 'Pull-ups', 'Push-ups']);
    });

    it('should sort by wodName descending', () => {
      const sorted = sortWods(wodsToSort, 'wodName', 'desc');
      expect(sorted.map(w => w.wodName)).toEqual(['Push-ups', 'Pull-ups', 'Fran', 'Fran', 'Deadlift', 'Cindy', 'Cindy', 'Cindy']);
    });

    it('should sort by date ascending (using first result date)', () => {
      const sorted = sortWods(wodsToSort, 'date', 'asc');
      // Expected order (Ascending): E (23-05-15), H (23-10-01), B (23-11-05), A (24-01-15), C (24-01-17), D (24-03-01), F (Inf), G (Inf)
      // Expected Names (Ascending): ['Cindy', 'Cindy', 'Cindy', 'Fran', 'Deadlift', 'Fran', 'Pull-ups', 'Push-ups']
      expect(sorted.map(w => w.wodName)).toEqual(['Cindy', 'Cindy', 'Cindy', 'Fran', 'Deadlift', 'Fran', 'Pull-ups', 'Push-ups']);
    });

     it('should sort by date descending (using first result date)', () => {
      const sorted = sortWods(wodsToSort, 'date', 'desc');
      // Expected Order (Descending): F (Inf), G (Inf), D (24-03-01), C (24-01-17), A (24-01-15), B (23-11-05), H (23-10-01), E (23-05-15)
      // Expected Names (Descending): ['Pull-ups', 'Push-ups', 'Fran', 'Deadlift', 'Fran', 'Cindy', 'Cindy', 'Cindy']
      expect(sorted.map(w => w.wodName)).toEqual(['Pull-ups', 'Push-ups', 'Fran', 'Deadlift', 'Fran', 'Cindy', 'Cindy', 'Cindy']);
    });

    it('should sort by attempts ascending', () => {
      const sorted = sortWods(wodsToSort, 'attempts', 'asc');
      // Attempts: F(0), G(0), A(1), C(1), D(1), E(1), B(2), H(2)
      // Order within same attempt count might vary based on original order or other factors if stable sort isn't guaranteed.
      // We expect F, G first, then A, C, D, E, then B, H
      const attempts = sorted.map(w => w.results.filter(r => r.date && hasScore(r)).length);
      expect(attempts).toEqual([0, 0, 1, 1, 1, 1, 2, 2]);
      // Check names for grouping
      expect(sorted.slice(0, 2).map(w => w.wodName).sort()).toEqual(['Pull-ups', 'Push-ups']);
      expect(sorted.slice(2, 6).map(w => w.wodName).sort()).toEqual(['Cindy', 'Deadlift', 'Fran', 'Fran']);
      expect(sorted.slice(6, 8).map(w => w.wodName).sort()).toEqual(['Cindy', 'Cindy']);
    });

    it('should sort by attempts descending', () => {
      const sorted = sortWods(wodsToSort, 'attempts', 'desc');
      // Attempts: B(2), H(2), A(1), C(1), D(1), E(1), F(0), G(0)
      const attempts = sorted.map(w => w.results.filter(r => r.date && hasScore(r)).length);
      expect(attempts).toEqual([2, 2, 1, 1, 1, 1, 0, 0]);
       // Check names for grouping
      expect(sorted.slice(0, 2).map(w => w.wodName).sort()).toEqual(['Cindy', 'Cindy']);
      expect(sorted.slice(2, 6).map(w => w.wodName).sort()).toEqual(['Cindy', 'Deadlift', 'Fran', 'Fran']);
      expect(sorted.slice(6, 8).map(w => w.wodName).sort()).toEqual(['Pull-ups', 'Push-ups']);
    });

    // 'level' uses the *first* result for comparison
    it('should sort by level ascending (using first result)', () => {
      const sorted = sortWods(wodsToSort, 'level', 'asc');
      // Levels (first result): A(Elite Rx), B(Inter Rx), C(Beginner Scaled), D(Adv Rx), E(Elite Scaled), F(None), G(None), H(Inter Rx)
      // Expected Order (Ascending Score): F(0), G(0), C(1), E(4), B(12), H(12), D(13), A(14)
      // Expected Names (Ascending): ['Pull-ups', 'Push-ups', 'Deadlift', 'Cindy', 'Cindy', 'Cindy', 'Fran', 'Fran'] (B before H due to secondary sort)
      expect(sorted.map(w => w.wodName)).toEqual(['Pull-ups', 'Push-ups', 'Deadlift', 'Cindy', 'Cindy', 'Cindy', 'Fran', 'Fran']);
    });

    it('should sort by level descending (using first result)', () => {
      const sorted = sortWods(wodsToSort, 'level', 'desc');
      // Expected Order (Score): A(14), D(13), B(12), H(12), E(4), C(1), F(0), G(0)
      // Secondary Sort (Name Desc): A, D, H, B, E, C, G, F
      expect(sorted.map(w => w.wodName)).toEqual(['Fran', 'Fran', 'Cindy', 'Cindy', 'Cindy', 'Deadlift', 'Push-ups', 'Pull-ups']);
    });

    // 'latestLevel' uses the *latest valid* result for comparison
    it('should sort by latestLevel ascending', () => {
      const sorted = sortWods(wodsToSort, 'latestLevel', 'asc');
      // Expected Order (Score): F(0), G(0), C(1), E(4), B(12), D(13), H(13), A(14)
      // Secondary Sort (Name Asc): F, G, C, E, B, H, D, A (Cindy before Fran when scores are equal)
      expect(sorted.map(w => w.wodName)).toEqual(['Pull-ups', 'Push-ups', 'Deadlift', 'Cindy', 'Cindy', 'Cindy', 'Fran', 'Fran']);
    });

    it('should sort by latestLevel descending', () => {
      const sorted = sortWods(wodsToSort, 'latestLevel', 'desc');
      // Expected Order (Score): A(14), D(13), H(13), B(12), E(4), C(1), F(0), G(0)
      // Secondary Sort (Name Desc): A, D, H, B, E, C, G, F (Fran before Cindy when scores are equal)
      expect(sorted.map(w => w.wodName)).toEqual(['Fran', 'Fran', 'Cindy', 'Cindy', 'Cindy', 'Deadlift', 'Push-ups', 'Pull-ups']);
    });
  });
});


// --- Mock Child Components ---
// Mock WodTable and WodTimeline to check props passed to them
vi.mock('./WodTable', () => ({
  // Use default export syntax for mocked component
  // Add explicit types to parameters using locally defined types
  default: vi.fn(({ wods, sortBy, sortDirection, handleSort }: { wods: Wod[], sortBy: SortByType, sortDirection: SortDirection, handleSort: (column: SortByType) => void }) => (
    <div data-testid="wod-table">
      {/* Render something identifiable */}
      <span>WodTable Mock</span>
      {/* Optionally render props for easier debugging in tests */}
      <span data-testid="table-wod-count">{wods.length}</span> {/* Safe: wods is Wod[] */}
      <span data-testid="table-sort-by">{sortBy}</span>
      <span data-testid="table-sort-direction">{sortDirection}</span>
      {/* Mock button to trigger handleSort */}
      <button onClick={() => handleSort('wodName')}>Sort Table By Name</button>
    </div>
  )),
}));

vi.mock('./WodTimeline', () => ({
  // Add explicit types to parameters using locally defined types
  default: vi.fn(({ wods, sortBy, sortDirection, handleSort }: { wods: Wod[], sortBy: SortByType, sortDirection: SortDirection, handleSort: (column: SortByType) => void }) => (
    <div data-testid="wod-timeline">
      <span>WodTimeline Mock</span>
      <span data-testid="timeline-wod-count">{wods.length}</span> {/* Safe: wods is Wod[] */}
       <span data-testid="timeline-sort-by">{sortBy}</span>
      <span data-testid="timeline-sort-direction">{sortDirection}</span>
       {/* Mock button to trigger handleSort */}
      <button onClick={() => handleSort('date')}>Sort Timeline By Date</button>
    </div>
  )),
}));

// --- Component Tests ---
describe('WodViewer Component', () => {
  // Remove fake timer setup/teardown

  // Use the same mock data from helper tests where applicable
   const testWods: Wod[] = [
      { // Wod A - Fran, Done, Girl, For Time, Couplet
        wodUrl: 'test.com/fran', wodName: 'Fran', category: 'Girl', tags: ['For Time', 'Couplet'],
        results: [mockResultTime(110, true)], // Elite
      },
      { // Wod B - Cindy, Done, Girl, AMRAP
        wodUrl: 'test.com/cindy', wodName: 'Cindy', category: 'Girl', tags: ['AMRAP'],
        results: [mockResultRounds(18, 0, true)], // Intermediate
      },
      { // Wod C - Deadlift, Done (Scaled), Benchmark, Ladder
        wodUrl: 'test.com/deadlift', wodName: 'Deadlift', category: 'Benchmark', tags: ['Ladder'],
        results: [mockResultLoad(200, false)], // Beginner (Scaled)
      },
       { // Wod D - Pull-ups, Not Done, Benchmark
        wodUrl: 'test.com/pullups', wodName: 'Pull-ups', category: 'Benchmark',
        results: [],
      },
       { // Wod E - Push-ups, Not Done (no score), Benchmark
        wodUrl: 'test.com/pushups', wodName: 'Push-ups', category: 'Benchmark',
        results: [mockResultNoScore()],
      },
       { // Wod F - Hero WOD, Done, Hero, Chipper
        wodUrl: 'test.com/murph', wodName: 'Murph', category: 'Hero', tags: ['Chipper', 'For Time'],
        results: [mockResultTime(2400, true)], // Example time
      },
    ];

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('should render timeline view by default and show only done WODs', () => {
    render(<WodViewer wods={testWods} />);

    // Check timeline is rendered
    expect(screen.getByTestId('wod-timeline')).toBeInTheDocument();
    expect(screen.queryByTestId('wod-table')).not.toBeInTheDocument();

    // Timeline view should only show WODs with valid scores (A, B, C, F)
     // Timeline view with "All" filter should show all WODs initially
     expect(screen.getByTestId('timeline-wod-count')).toHaveTextContent(testWods.length.toString());

    // Check default sort state passed to timeline
    expect(screen.getByTestId('timeline-sort-by')).toHaveTextContent('attempts');
    expect(screen.getByTestId('timeline-sort-direction')).toHaveTextContent('desc');

    // Completion filter should be visible and default to "All"
    expect(screen.getByRole('radio', { name: /All \(\d+\)/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Done \(\d+\)/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Todo \(\d+\)/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /All \(\d+\)/i, checked: true })).toBeInTheDocument();
  });

  it('should switch to table view and show all WODs by default', () => {
    render(<WodViewer wods={testWods} />);

    // Find the view switcher - assuming Tooltip wraps the button/icon
    const tableViewButton = screen.getByRole('radio', { name: /Table View/i });
    fireEvent.click(tableViewButton);

    // Check table is rendered
    expect(screen.getByTestId('wod-table')).toBeInTheDocument();
    expect(screen.queryByTestId('wod-timeline')).not.toBeInTheDocument();

    // Table view with "All" filter should show all WODs initially
    expect(screen.getByTestId('table-wod-count')).toHaveTextContent(testWods.length.toString());

    // Check default sort state passed to table
    expect(screen.getByTestId('table-sort-by')).toHaveTextContent('attempts');
    expect(screen.getByTestId('table-sort-direction')).toHaveTextContent('desc');

    // Completion filter should be visible and default to "All"
    // Using radio role based on error output and matching text including count
    expect(screen.getByRole('radio', { name: /All \(\d+\)/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Done \(\d+\)/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Todo \(\d+\)/i })).toBeInTheDocument();
    // Check which radio button is checked using aria-checked or data-state
     expect(screen.getByRole('radio', { name: /All \(\d+\)/i, checked: true })).toBeInTheDocument();
  });

  it('should filter by category', async () => {
    render(<WodViewer wods={testWods} />);
     // Switch to table view to see all WODs initially
    fireEvent.click(screen.getByRole('radio', { name: /Table View/i }));
    expect(screen.getByTestId('table-wod-count')).toHaveTextContent('6'); // All WODs

    // Find the category select trigger
    const categorySelect = screen.getByRole('combobox');
    fireEvent.click(categorySelect); // Open the dropdown with click

    // Use screen.findByText directly (no timers)
    const benchmarkItem = await screen.findByText(/Benchmark \(\d+\)/i);
    fireEvent.click(benchmarkItem);

    // Check that only Benchmark WODs are passed to the table (C, D, E)
    // Need to wait for the state update and re-render
    await vi.waitFor(() => {
        expect(screen.getByTestId('table-wod-count')).toHaveTextContent('3');
    });


     // Select 'All Categories' again by clicking
    fireEvent.click(categorySelect); // Re-open with click

    // Use screen.findByText directly (no timers)
    const allCategoriesItem = await screen.findByText(/All Categories \(\d+\)/i);
    fireEvent.click(allCategoriesItem);

    await vi.waitFor(() => {
        expect(screen.getByTestId('table-wod-count')).toHaveTextContent('6'); // Back to all
    });
  });

  it('should filter by tags (multiple)', () => {
    render(<WodViewer wods={testWods} />);
    fireEvent.click(screen.getByRole('radio', { name: /Table View/i }));
    expect(screen.getByTestId('table-wod-count')).toHaveTextContent('6');

    // Click 'For Time' tag (A, F) - Use getByText based on error output
    fireEvent.click(screen.getByText('For Time'));
    expect(screen.getByTestId('table-wod-count')).toHaveTextContent('2');

    // Click 'AMRAP' tag (B) - Use getByText. Tags are OR filter.
    // The logic is: (category match) AND (tag match)
    // Tag match means: no tags selected OR wod.tags includes *any* selected tag
    // Let's re-evaluate the filtering logic based on the code:
    // categoryMatch = selectedCategories.length === 0 || (wod.category && selectedCategories.includes(wod.category));
    // tagMatch = selectedTags.length === 0 || (wod.tags && wod.tags.some(tag => selectedTags.includes(tag)));
    // return categoryMatch && tagMatch;
    // So, clicking multiple tags acts as an OR filter within tags.

    // Click 'AMRAP' tag (B) - now filters for 'For Time' OR 'AMRAP' (A, B, F) - Use getByText
    fireEvent.click(screen.getByText('AMRAP'));
    expect(screen.getByTestId('table-wod-count')).toHaveTextContent('3');

    // Click 'For Time' again to deselect it - should show only 'AMRAP' (B) - Use getByText
    fireEvent.click(screen.getByText('For Time'));
    expect(screen.getByTestId('table-wod-count')).toHaveTextContent('1');

    // Click 'AMRAP' again to deselect - should show all again - Use getByText
    fireEvent.click(screen.getByText('AMRAP'));
    expect(screen.getByTestId('table-wod-count')).toHaveTextContent('6');
  });

   it('should filter by completion status in table view', () => {
    render(<WodViewer wods={testWods} />);
    fireEvent.click(screen.getByRole('radio', { name: /Table View/i }));
    expect(screen.getByTestId('table-wod-count')).toHaveTextContent('6'); // All

    // Click 'Done' filter (A, B, C, F) - Use radio role
    const doneFilter = screen.getByRole('radio', { name: /Done \(\d+\)/i });
    fireEvent.click(doneFilter);
    expect(screen.getByTestId('table-wod-count')).toHaveTextContent('4');

    // Click 'Todo' filter (D, E) - Use radio role
    const todoFilter = screen.getByRole('radio', { name: /Todo \(\d+\)/i });
    fireEvent.click(todoFilter);
    expect(screen.getByTestId('table-wod-count')).toHaveTextContent('2');

    // Click 'All' filter - Use radio role
    const allFilter = screen.getByRole('radio', { name: /All \(\d+\)/i });
    fireEvent.click(allFilter);
    expect(screen.getByTestId('table-wod-count')).toHaveTextContent('6');
  });

  it('should handle sorting correctly', () => {
     render(<WodViewer wods={testWods} />);
     fireEvent.click(screen.getByRole('radio', { name: /Table View/i }));

     // Initial sort check
     expect(screen.getByTestId('table-sort-by')).toHaveTextContent('attempts');
     expect(screen.getByTestId('table-sort-direction')).toHaveTextContent('desc');

     // Simulate sort trigger from mocked child component
     const sortButton = screen.getByRole('button', { name: /Sort Table By Name/i });
     fireEvent.click(sortButton);

     // Check sort state updated and passed down
     expect(screen.getByTestId('table-sort-by')).toHaveTextContent('wodName');
     expect(screen.getByTestId('table-sort-direction')).toHaveTextContent('asc'); // Default asc for new column

     // Click again to toggle direction
     fireEvent.click(sortButton);
     expect(screen.getByTestId('table-sort-by')).toHaveTextContent('wodName');
     expect(screen.getByTestId('table-sort-direction')).toHaveTextContent('desc');
   });

   it('should render correctly with empty wods array', () => {
     render(<WodViewer wods={[]} />);

     // Should default to timeline view
     expect(screen.getByTestId('wod-timeline')).toBeInTheDocument();
     expect(screen.getByTestId('timeline-wod-count')).toHaveTextContent('0');

     // Switch to table view
     fireEvent.click(screen.getByRole('radio', { name: /Table View/i }));
     expect(screen.getByTestId('wod-table')).toBeInTheDocument();
     expect(screen.getByTestId('table-wod-count')).toHaveTextContent('0');

     // Filters should still be present
     expect(screen.getByRole('combobox')).toBeInTheDocument(); // Category select
     expect(screen.getByText('Chipper')).toBeInTheDocument(); // Example tag - Use getByText
     expect(screen.getByRole('radio', { name: /All \(\d+\)/i })).toBeInTheDocument(); // Completion filter - Use radio
   });

   it('should filter by completion status in timeline view', () => {
    render(<WodViewer wods={testWods} />);
    // Timeline view is default
    expect(screen.getByTestId('wod-timeline')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-wod-count')).toHaveTextContent('6'); // All

    // Click 'Done' filter (A, B, C, F)
    const doneFilter = screen.getByRole('radio', { name: /Done \(\d+\)/i });
    fireEvent.click(doneFilter);
    expect(screen.getByTestId('timeline-wod-count')).toHaveTextContent('4');

    // Click 'Todo' filter (D, E)
    const todoFilter = screen.getByRole('radio', { name: /Todo \(\d+\)/i });
    fireEvent.click(todoFilter);
    expect(screen.getByTestId('timeline-wod-count')).toHaveTextContent('2');

    // Click 'All' filter
    const allFilter = screen.getByRole('radio', { name: /All \(\d+\)/i });
    fireEvent.click(allFilter);
    expect(screen.getByTestId('timeline-wod-count')).toHaveTextContent('6');
  });
});
