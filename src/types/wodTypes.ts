// Type definitions for WOD data

export type WodResult = {
  date?: string;
  rxStatus?: string | null;
  notes?: string;
  // New score fields replacing the old 'score' field
  score_time_seconds: number | null;
  score_reps: number | null;
  score_load: number | null;
  score_rounds_completed: number | null;
  score_partial_reps: number | null;
};

export type BenchmarkLevel = {
  min: number | null;
  max: number | null;
};

export type Benchmarks = {
  type: "time" | "rounds" | "reps" | "load";
  levels: {
    elite: BenchmarkLevel;
    advanced: BenchmarkLevel;
    intermediate: BenchmarkLevel;
    beginner: BenchmarkLevel;
  };
};

// Define allowed tags and categories as types for better safety
export type WodTag =
  | "Chipper"
  | "Couplet"
  | "Triplet"
  | "EMOM"
  | "AMRAP"
  | "For Time"
  | "Ladder";

export type WodCategory =
  | "Girl"
  | "Hero"
  | "Games"
  | "Open"
  | "Quarterfinals" // Added Quarterfinals based on page.tsx
  | "Benchmark"
  | "Skill" // Added Skill based on page.tsx
  | "Other";

export type Wod = {
  id: string; // Added from DB schema
  wodUrl: string | null; // Updated to match DB schema (can be null)
  wodName: string;
  description?: string | null; // Updated to match DB schema (can be null)
  benchmarks?: Benchmarks | null; // Updated to match DB schema (can be null)
  // results: WodResult[]; // Removed - results are fetched separately
  category?: string | null; // Simplified type to match DB 'text' column, resolving lint error
  tags?: string[] | null; // Simplified type to match DB 'text' column (JSON array), resolving lint error
  difficulty?: string | null; // Updated to match DB schema (can be null)
  difficultyExplanation?: string | null; // Renamed from difficulty_explanation, match DB (can be null)
  countLikes?: number | null; // Renamed from count_likes, match DB (can be null)
  createdAt: Date; // Added from DB schema (Drizzle returns Date)
  updatedAt?: Date | null; // Added from DB schema (Drizzle returns Date or null)
};

// Define the structure for an individual score record based on the DB schema
export type Score = {
  id: string;
  userId: string;
  wodId: string;
  time_seconds: number | null;
  reps: number | null;
  load: number | null;
  rounds_completed: number | null;
  partial_reps: number | null;
  scoreDate: Date; // Drizzle returns Date for timestamp mode
  notes: string | null;
  createdAt: Date; // Drizzle returns Date for timestamp mode
  updatedAt: Date | null; // Drizzle returns Date or null for timestamp mode
};

// Type for chart data points (used in WodViewer and passed from page.tsx)
export type ChartDataPoint = {
  name: string;
  value: number;
};

// Types for timeline chart data points (passed from page.tsx to WodViewer)
export type FrequencyDataPoint = {
  month: string;
  count: number;
};
export type PerformanceDataPoint = {
  month: string;
  averageLevel: number;
};

// Type for sorting columns in WodTable/WodViewer
export type SortByType =
  | "wodName"
  | "date"
  | "level"
  | "attempts"
  | "latestLevel"
  | "difficulty"
  | "countLikes"; // Corrected to camelCase
