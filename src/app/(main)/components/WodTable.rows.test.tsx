import { describe, it, expect, vi } from "vitest";
import { render, within, screen } from "~/test-utils";
import "@testing-library/jest-dom";
import WodTable from "./WodTable";

// Use shared mock for ~/trpc/react
import * as trpcMock from "~/trpc/__mocks__/react";
vi.doMock("~/trpc/react", () => trpcMock);

// Mock data and helpers (copied from original test)
const mockWod1_NoResults = {
  id: "1",
  createdAt: new Date(),
  updatedAt: new Date(),
  wodUrl: "test.com/wod1",
  wodName: "WOD Alpha",
  description: "Desc Alpha",
  category: "Benchmark" as const, // Use const assertion
  tags: ["AMRAP"],
  movements: [],
  timecap: null,
  difficulty: "Medium",
  difficultyExplanation: "Standard benchmark AMRAP.",
  countLikes: 15,
  benchmarks: {
    type: "reps" as const,
    levels: {
      elite: { min: 200, max: null },
      advanced: { min: 150, max: 199 },
      intermediate: { min: 100, max: 149 },
      beginner: { min: 0, max: 99 },
    },
  },
};

const mockWod2_OneResultRx = {
  id: "2",
  createdAt: new Date(),
  updatedAt: new Date(),
  wodUrl: "test.com/wod2",
  wodName: "WOD Bravo",
  description: "Desc Bravo",
  category: "Girl" as const, // Use const assertion
  tags: ["For Time"],
  movements: [],
  timecap: null,
  benchmarks: {
    type: "time" as const,
    levels: {
      elite: { min: null, max: 180 },
      advanced: { min: null, max: 300 },
      intermediate: { min: null, max: 420 },
      beginner: { min: null, max: 600 },
    },
  },
  difficulty: "Hard",
  difficultyExplanation: "Classic Girl WOD, tough time cap.",
  countLikes: 123,
};

const mockWod3_OneResultScaled = {
  id: "3",
  createdAt: new Date(),
  updatedAt: new Date(),
  wodUrl: null,
  wodName: "WOD Charlie",
  description: "Desc Charlie",
  category: "Hero" as const, // Use const assertion
  tags: ["Chipper"],
  movements: [],
  timecap: null,
  benchmarks: {
    type: "rounds" as const,
    levels: {
      elite: { min: 20, max: null },
      advanced: { min: 15, max: null },
      intermediate: { min: 10, max: null },
      beginner: { min: 5, max: null },
    },
  },
  difficulty: "Very Hard",
  difficultyExplanation: "Hero WOD, high volume chipper.",
  countLikes: 50,
};

const mockWod4_MultiResult = {
  id: "4",
  createdAt: new Date(),
  updatedAt: new Date(),
  wodUrl: "test.com/wod4",
  wodName: "WOD Delta",
  description: "Desc Delta",
  category: "Open" as const, // Use const assertion
  tags: ["Couplet"],
  movements: [],
  timecap: null,
  benchmarks: {
    type: "time" as const,
    levels: {
      elite: { min: null, max: 300 },
      advanced: { min: null, max: 420 },
      intermediate: { min: null, max: 600 },
      beginner: { min: null, max: 900 },
    },
  },
  difficulty: "Hard",
  difficultyExplanation: "Open WOD, tests multiple modalities.",
  countLikes: 200,
};

const mockWod5_NoBenchmark = {
  id: "5",
  createdAt: new Date(),
  updatedAt: new Date(),
  wodUrl: "test.com/wod5",
  wodName: "WOD Echo",
  description: "Desc Echo",
  tags: [],
  movements: [],
  timecap: null,
  category: null,
  benchmarks: null,
  difficulty: null,
  difficultyExplanation: null,
  countLikes: null,
};

const mockScoreWod2 = {
  id: "101",
  wodId: "2",
  userId: "test-user",
  scoreDate: new Date("2024-03-10"),
  createdAt: new Date("2024-03-10"),
  updatedAt: new Date("2024-03-10"),
  time_seconds: 290,
  reps: null,
  load: null,
  rounds_completed: null,
  partial_reps: null,
  notes: "Felt good",
  isRx: true,
};
const mockScoreWod3 = {
  id: "102",
  wodId: "3",
  userId: "test-user",
  scoreDate: new Date("2024-03-11"),
  createdAt: new Date("2024-03-11"),
  updatedAt: new Date("2024-03-11"),
  time_seconds: null,
  reps: null,
  load: null,
  rounds_completed: 12,
  partial_reps: 5,
  notes: "Used lighter weight",
  isRx: false,
};
const mockScoreWod4_1 = {
  id: "103",
  wodId: "4",
  userId: "test-user",
  scoreDate: new Date("2024-03-12"),
  createdAt: new Date("2024-03-12"),
  updatedAt: new Date("2024-03-12"),
  time_seconds: 580,
  reps: null,
  load: null,
  rounds_completed: null,
  partial_reps: null,
  notes: "First attempt",
  isRx: true,
};
const mockScoreWod4_2 = {
  id: "104",
  wodId: "4",
  userId: "test-user",
  scoreDate: new Date("2023-11-20"),
  createdAt: new Date("2023-11-20"),
  updatedAt: new Date("2023-11-20"),
  time_seconds: 550,
  reps: null,
  load: null,
  rounds_completed: null,
  partial_reps: null,
  notes: "PR!",
  isRx: true,
};
const mockScoreWod5 = {
  id: "105",
  wodId: "5",
  userId: "test-user",
  scoreDate: new Date("2024-01-04"),
  createdAt: new Date("2024-01-04"),
  updatedAt: new Date("2024-01-04"),
  time_seconds: null,
  reps: null,
  load: null,
  rounds_completed: 10,
  partial_reps: 0,
  notes: null,
  isRx: true,
};

const mockScoresByWodId = {
  "2": [mockScoreWod2],
  "3": [mockScoreWod3],
  "4": [mockScoreWod4_1, mockScoreWod4_2].sort(
    (a, b) => b.scoreDate.getTime() - a.scoreDate.getTime(),
  ),
  "5": [mockScoreWod5],
};

describe("WodTable Rows", () => {
  // Helper to find a row based on some text content
  const findRenderedRowByContent = (content: string) => {
    const cells = screen.getAllByText((text, node) =>
      node?.textContent?.includes(content),
    );
    const cell = cells.find((c) => c.closest('div[role="row"]'));
    if (!cell) throw new Error(`Row containing "${content}" not found`);
    const row = cell.closest('div[role="row"]');
    if (!row) throw new Error(`Row containing "${content}" not found`);
    return row as HTMLElement;
  };

  it("should render a row for WODs with no results", () => {
    render(
      <WodTable
        wods={[mockWod1_NoResults]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={vi.fn()}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={mockScoresByWodId}
        _isLoadingScores={false} // Renamed prop
      />,
    );
    const row = findRenderedRowByContent("WOD Alpha");
    // Difficulty badge should have correct class
    const difficultyText = within(row).getByText("Medium");
    expect(difficultyText).toHaveClass("text-yellow-500");
    // Likes cell
    const cells = within(row).getAllByRole("cell");
    expect(cells[4].textContent).toContain("Desc Alpha");
    // Should show the Log Score button in the cell
    expect(cells[5].textContent).toContain("Log score");
  });

  it("should render WOD with one Rx result correctly", () => {
    render(
      <WodTable
        wods={[mockWod2_OneResultRx]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={vi.fn()}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={mockScoresByWodId}
        _isLoadingScores={false} // Renamed prop
      />,
    );
    const row = findRenderedRowByContent("WOD Bravo");
    // Difficulty badge should have correct class
    const difficultyText = within(row).getByText("Hard");
    expect(difficultyText).toHaveClass("text-orange-500");
    // Score badge should show formatted score (e.g., "4:50 Rx")
    const scoresCell = within(row).getAllByRole("cell")[5];
    expect(scoresCell).toHaveTextContent("4:50 Rx");
    // No date in visible text
  });

  it("should render WOD with one Scaled result correctly", () => {
    render(
      <WodTable
        wods={[mockWod3_OneResultScaled]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={vi.fn()}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={mockScoresByWodId}
        _isLoadingScores={false} // Renamed prop
      />,
    );
    const row = findRenderedRowByContent("WOD Charlie");
    const difficultyText = within(row).getByText("Very Hard");
    expect(difficultyText).toHaveClass("text-red-500");
    const scoresCell = within(row).getAllByRole("cell")[5];
    expect(scoresCell).toHaveTextContent("12+5 Scaled");
  });

  it("should render WOD with multiple results correctly (checking first few rows)", () => {
    render(
      <WodTable
        wods={[mockWod4_MultiResult]}
        sortBy="date"
        sortDirection="desc"
        handleSort={vi.fn()}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={mockScoresByWodId}
        _isLoadingScores={false} // Renamed prop
      />,
    );
    const row1 = findRenderedRowByContent("WOD Delta");
    const difficultyText = within(row1).getByText("Hard");
    expect(difficultyText).toHaveClass("text-orange-500");
    const scoresCell = within(row1).getAllByRole("cell")[5];
    // Both scores should be present, most recent first
    expect(scoresCell).toHaveTextContent("9:40 Rx");
    expect(scoresCell).toHaveTextContent("9:10 Rx");
  });

  it("should render placeholder/dash for level/difficulty/likes if missing", () => {
    render(
      <WodTable
        wods={[mockWod5_NoBenchmark]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={vi.fn()}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={mockScoresByWodId}
        _isLoadingScores={false} // Renamed prop
      />,
    );
    const row = findRenderedRowByContent("WOD Echo");
    const cells = within(row).getAllByRole("cell");
    expect(cells[2].textContent).toContain("-"); // Difficulty
    expect(cells[3].textContent).toContain("-"); // Likes
    const scoresCell = cells[5];
    expect(scoresCell).toHaveTextContent("10 rounds Rx");
  });
});
