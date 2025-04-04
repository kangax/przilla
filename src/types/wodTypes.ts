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
  wodUrl: string;
  wodName: string;
  description?: string;
  benchmarks?: Benchmarks;
  results: WodResult[];
  category?: WodCategory;
  tags?: WodTag[];
  difficulty?: string; // Added difficulty
  difficulty_explanation?: string; // Added explanation for tooltip
  count_likes?: number; // Added likes count
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
  | "count_likes";
