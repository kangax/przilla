import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "../../test-utils"; // Use custom render
import "@testing-library/jest-dom";
// Removed unused useVirtualizer import
import WodTable from "./WodTable";
import type { Wod, WodResult } from "~/types/wodTypes"; // Removed unused SortByType

// --- Mock next/link ---
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// --- Mock @tanstack/react-virtual ---
vi.mock("@tanstack/react-virtual", async () => {
  const actual = await vi.importActual("@tanstack/react-virtual");
  return {
    ...actual,
    // Add type safety to the mock
    useVirtualizer: vi.fn(
      (options: { count: number; estimateSize: () => number }) => {
        // Simple mock: return all items and a fixed total size
        const estimateSizeValue = options.estimateSize(); // Call once
        const virtualItems = Array.from(
          { length: options.count },
          (_, index) => ({
            index,
            start: index * estimateSizeValue,
            size: estimateSizeValue,
            key: index, // Ensure key is present
            measureElement: vi.fn(), // Mock measureElement if needed
            end: (index + 1) * estimateSizeValue, // Mock end if needed
            lane: 0, // Mock lane if needed
          }),
        );
        return {
          getVirtualItems: () => virtualItems,
          getTotalSize: () => options.count * estimateSizeValue,
          // Mock other properties/methods if needed by the component
          scrollOffset: 0,
          scrollToOffset: vi.fn(),
          scrollToIndex: vi.fn(),
          measure: vi.fn(),
          virtualItems, // Also return the items directly if accessed
        };
      },
    ),
  };
});

// --- Mock Data ---
// Removed unused mockResultTime and mockResultRounds functions

// --- Updated Mock Data ---

const mockWod1_NoResults: Wod = {
  id: "1", // Changed to string
  createdAt: new Date(),
  updatedAt: new Date(),
  wodUrl: "test.com/wod1",
  wodName: "WOD Alpha",
  description: "Desc Alpha",
  category: "Benchmark",
  tags: ["AMRAP"], // Changed back to string[]
  // results: [], // Removed results
  difficulty: "Medium",
  difficultyExplanation: "Standard benchmark AMRAP.", // Renamed
  countLikes: 15,
};

const mockWod2_OneResultRx: Wod = {
  id: "2", // Changed to string
  createdAt: new Date(),
  updatedAt: new Date(),
  wodUrl: "test.com/wod2",
  wodName: "WOD Bravo",
  description: "Desc Bravo",
  category: "Girl",
  tags: ["For Time"], // Changed back to string[]
  benchmarks: {
    type: "time",
    levels: {
      elite: { min: null, max: 180 },
      advanced: { min: null, max: 300 },
      intermediate: { min: null, max: 420 },
      beginner: { min: null, max: 600 },
    },
  },
  // results: [mockResultTime(290, true, "2024-03-10", "Felt good")], // Removed results
  difficulty: "Hard",
  difficultyExplanation: "Classic Girl WOD, tough time cap.", // Renamed
  countLikes: 123,
};

const mockWod3_OneResultScaled: Wod = {
  id: "3", // Changed to string
  createdAt: new Date(),
  updatedAt: new Date(),
  wodUrl: null,
  wodName: "WOD Charlie",
  description: "Desc Charlie",
  category: "Hero",
  tags: ["Chipper"], // Changed back to string[]
  benchmarks: {
    type: "rounds",
    levels: {
      elite: { min: 20, max: null },
      advanced: { min: 15, max: null },
      intermediate: { min: 10, max: null },
      beginner: { min: 5, max: null },
    },
  },
  // results: [mockResultRounds(12, 5, false, "2024-03-11", "Used lighter weight")], // Removed results
  difficulty: "Very Hard",
  difficultyExplanation: "Hero WOD, high volume chipper.", // Renamed
  countLikes: 50,
};

const mockWod4_MultiResult: Wod = {
  id: "4", // Changed to string
  createdAt: new Date(),
  updatedAt: new Date(),
  wodUrl: "test.com/wod4",
  wodName: "WOD Delta",
  description: "Desc Delta",
  category: "Open",
  tags: ["Couplet"], // Changed back to string[]
  benchmarks: {
    type: "time",
    levels: {
      elite: { min: null, max: 300 },
      advanced: { min: null, max: 420 },
      intermediate: { min: null, max: 600 },
      beginner: { min: null, max: 900 },
    },
  },
  // results: [mockResultTime(580, true, "2024-03-12", "First attempt"), mockResultTime(550, true, "2023-11-20", "PR!")], // Removed results
  difficulty: "Hard",
  difficultyExplanation: "Open WOD, tests multiple modalities.", // Renamed
  countLikes: 200,
};

const mockWod5_NoBenchmark: Wod = {
  id: "5", // Changed to string
  createdAt: new Date(),
  updatedAt: new Date(),
  wodUrl: "test.com/wod5",
  wodName: "WOD Echo",
  description: "Desc Echo",
  tags: [], // Changed back to string[]
  // results: [mockResultRounds(10, 0, true, "2024-01-05")], // Removed results
  // No difficulty or likes specified for this one to test placeholder
  category: null,
  benchmarks: null,
  difficulty: null,
  difficultyExplanation: null, // Renamed
  countLikes: null,
};

// Define mock Score type matching Score from wodTypes.ts
// (simplified, add fields as needed by tests)
type MockScore = {
  id: string; // Changed to string
  wodId: string; // Changed to string
  userId: string;
  scoreDate: Date; // Keep as Date for mock logic
  time_seconds: number | null;
  reps: number | null;
  load: number | null;
  rounds_completed: number | null;
  partial_reps: number | null;
  notes: string | null;
  isRx: boolean; // Added required isRx field
  // Add createdAt/updatedAt if needed by tests, otherwise omit for simplicity
  createdAt: Date; // Added
  updatedAt: Date | null; // Added
};

// Create mock scores (adjust data based on old results)
const mockScoreWod2: MockScore = {
  id: "101",
  wodId: "2",
  userId: "test-user",
  scoreDate: new Date("2024-03-10"),
  createdAt: new Date("2024-03-10"), // Added
  updatedAt: new Date("2024-03-10"), // Added
  time_seconds: 290,
  reps: null,
  load: null,
  rounds_completed: null,
  partial_reps: null,
  notes: "Felt good",
  isRx: true, // Derived from rxStatus: "Rx"
};
const mockScoreWod3: MockScore = {
  id: "102",
  wodId: "3",
  userId: "test-user",
  scoreDate: new Date("2024-03-11"),
  createdAt: new Date("2024-03-11"), // Added
  updatedAt: new Date("2024-03-11"), // Added
  time_seconds: null,
  reps: null,
  load: null,
  rounds_completed: 12,
  partial_reps: 5,
  notes: "Used lighter weight",
  isRx: false, // Derived from rxStatus: "Scaled"
};
const mockScoreWod4_1: MockScore = {
  id: "103",
  wodId: "4",
  userId: "test-user",
  scoreDate: new Date("2024-03-12"),
  createdAt: new Date("2024-03-12"), // Added
  updatedAt: new Date("2024-03-12"), // Added
  time_seconds: 580,
  reps: null,
  load: null,
  rounds_completed: null,
  partial_reps: null,
  notes: "First attempt",
  isRx: true, // Derived from rxStatus: "Rx"
};
const mockScoreWod4_2: MockScore = {
  id: "104",
  wodId: "4",
  userId: "test-user",
  scoreDate: new Date("2023-11-20"),
  createdAt: new Date("2023-11-20"), // Added
  updatedAt: new Date("2023-11-20"), // Added
  time_seconds: 550,
  reps: null,
  load: null,
  rounds_completed: null,
  partial_reps: null,
  notes: "PR!",
  isRx: true, // Derived from rxStatus: "Rx"
};
const mockScoreWod5: MockScore = {
  id: "105",
  wodId: "5",
  userId: "test-user",
  scoreDate: new Date("2024-01-05"),
  createdAt: new Date("2024-01-05"), // Added
  updatedAt: new Date("2024-01-05"), // Added
  time_seconds: null,
  reps: null,
  load: null,
  rounds_completed: 10,
  partial_reps: 0,
  notes: null,
  isRx: true, // Derived from rxStatus: "Rx"
};

// Create mock scoresByWodId Record (object)
const mockScoresByWodId: Record<string, MockScore[]> = {
  "2": [mockScoreWod2],
  "3": [mockScoreWod3],
  "4": [mockScoreWod4_1, mockScoreWod4_2].sort(
    (a, b) => b.scoreDate.getTime() - a.scoreDate.getTime(),
  ), // Ensure sorted desc by date
  "5": [mockScoreWod5],
};

const testWods: Wod[] = [
  mockWod1_NoResults,
  mockWod2_OneResultRx,
  mockWod3_OneResultScaled,
  mockWod4_MultiResult,
  mockWod5_NoBenchmark,
];

describe("WodTable Component", () => {
  let handleSortMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    handleSortMock = vi.fn();
  });

  // Helper to find a row based on some text content (since virtualization makes indexing unreliable)
  // Note: This assumes the text uniquely identifies the row within the *rendered* virtual items.
  const findRenderedRowByContent = (content: string | RegExp): HTMLElement => {
    const cell = screen.getByText(content);
    // Use closest and assert the type or throw error
    const row = cell.closest('div[role="row"]'); // row can be Element | null
    if (!row) {
      // Check for null first
      throw new Error(`Row containing "${content}" not found`);
    }
    // Now we know row is an Element, but TS might still complain about HTMLElement methods
    // We can assert the type if we are confident based on the selector
    return row as HTMLElement;
  };

  it("should render table headers correctly", () => {
    render(
      <WodTable
        wods={[]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={{}} // Changed Map to empty object {}
      />,
    );
    // Headers are sticky and should always be present
    expect(
      screen.getByRole("columnheader", { name: /Workout/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /Category \/ Tags/ }), // Combined header
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /Date/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /Score/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /Level/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /Difficulty/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /Likes/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /Description/ }), // Added Description header
    ).toBeInTheDocument();
    // Ensure Notes header is NOT expected
    expect(
      screen.queryByRole("columnheader", { name: /Notes/ }),
    ).not.toBeInTheDocument();
  });

  it("should display sort indicators correctly", () => {
    const { rerender } = render(
      <WodTable
        wods={[]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={{}} // Changed Map to empty object {}
      />,
    );
    expect(
      screen.getByRole("columnheader", { name: /Workout ▲/ }),
    ).toBeInTheDocument();

    rerender(
      <WodTable
        wods={[]}
        sortBy="wodName"
        sortDirection="desc"
        handleSort={handleSortMock}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={{}} // Changed Map to empty object {}
      />,
    );
    expect(
      screen.getByRole("columnheader", { name: /Workout ▼/ }),
    ).toBeInTheDocument();

    rerender(
      <WodTable
        wods={[]}
        sortBy="date"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={{}} // Changed Map to empty object {}
      />,
    );
    expect(
      screen.getByRole("columnheader", { name: /Workout/ }),
    ).toBeInTheDocument(); // No indicator
    expect(
      screen.getByRole("columnheader", { name: /Date ▲/ }),
    ).toBeInTheDocument();

    rerender(
      <WodTable
        wods={[]}
        sortBy="countLikes" // Changed to camelCase
        sortDirection="desc"
        handleSort={handleSortMock}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={{}} // Changed Map to empty object {}
      />,
    );
    expect(
      screen.getByRole("columnheader", { name: /Likes ▼/ }),
    ).toBeInTheDocument();
  });

  it("should render a row for WODs with no results", () => {
    render(
      <WodTable
        wods={[mockWod1_NoResults]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={mockScoresByWodId}
      />,
    );
    // Find the row by the unique WOD name which should be rendered
    const row = findRenderedRowByContent("WOD Alpha");
    expect(within(row).getByText("WOD Alpha")).toBeInTheDocument();
    expect(within(row).getByText("Benchmark")).toBeInTheDocument();
    expect(within(row).getByText("AMRAP")).toBeInTheDocument();
    expect(within(row).getByText("Medium")).toBeInTheDocument();
    expect(within(row).getByText("Medium")).toHaveClass("text-yellow-500");
    expect(within(row).getByText("15")).toBeInTheDocument();
    // Check for dashes in specific cells
    const cells = within(row).getAllByRole("cell");
    expect(cells[5].textContent).toBe("-"); // Score
    expect(cells[6].textContent).toBe("-"); // Level
    // Check Description cell
    expect(cells[7].textContent).toContain("Desc Alpha");
  });

  it("should render WOD with one Rx result correctly", () => {
    render(
      <WodTable
        wods={[mockWod2_OneResultRx]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={mockScoresByWodId}
      />,
    );
    const row = findRenderedRowByContent("WOD Bravo");
    expect(within(row).getByText("WOD Bravo")).toBeInTheDocument();
    expect(within(row).getByText("Girl")).toBeInTheDocument();
    expect(within(row).getByText("For Time")).toBeInTheDocument();
    expect(
      within(row).getByText(
        /3\/10\/2024|Mar 10, 2024|March 10, 2024|3\/9\/2024|Mar 9, 2024|March 9, 2024/,
      ),
    ).toBeInTheDocument();
    expect(within(row).getByText(/4:50/)).toBeInTheDocument();
    expect(within(row).getByText("advanced")).toBeInTheDocument();
    expect(within(row).getByText("advanced")).toHaveClass("text-green-600");
    expect(within(row).getByText("Hard")).toBeInTheDocument();
    expect(within(row).getByText("Hard")).toHaveClass("text-orange-500");
    expect(within(row).getByText("123")).toBeInTheDocument();
    expect(within(row).getByText("Desc Bravo")).toBeInTheDocument();
  });

  it("should render WOD with one Scaled result correctly", () => {
    render(
      <WodTable
        wods={[mockWod3_OneResultScaled]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={mockScoresByWodId}
      />,
    );
    const row = findRenderedRowByContent("WOD Charlie");
    expect(within(row).getByText("WOD Charlie")).toBeInTheDocument();
    expect(within(row).getByText("Hero")).toBeInTheDocument();
    expect(within(row).getByText("Chipper")).toBeInTheDocument();
    expect(
      within(row).getByText(
        /3\/11\/2024|Mar 11, 2024|March 11, 2024|3\/10\/2024|Mar 10, 2024|March 10, 2024/,
      ),
    ).toBeInTheDocument();
    const scoreCell = within(row).getAllByRole("cell")[5];
    expect(scoreCell.textContent).toContain("12+5");
    expect(within(row).getByText("intermediate")).toBeInTheDocument();
    expect(within(row).getByText("intermediate")).toHaveClass(
      "text-yellow-600",
    );
    expect(within(row).getByText("Very Hard")).toBeInTheDocument();
    expect(within(row).getByText("Very Hard")).toHaveClass("text-red-500");
    expect(within(row).getByText("50")).toBeInTheDocument();
    expect(within(row).getByText("Desc Charlie")).toBeInTheDocument();
  });

  it("should render WOD with multiple results correctly (checking first few rows)", () => {
    render(
      <WodTable
        wods={[mockWod4_MultiResult]}
        sortBy="date"
        sortDirection="desc"
        handleSort={handleSortMock}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={mockScoresByWodId}
      />,
    );

    // Find the first result row (latest date: 2024-03-12) by its unique date
    const row1 = findRenderedRowByContent("WOD Delta");
    expect(within(row1).getByText("WOD Delta")).toBeInTheDocument(); // Assert type
    expect(within(row1).getByText("Open")).toBeInTheDocument(); // Assert type
    expect(within(row1).getByText("Couplet")).toBeInTheDocument(); // Assert type
    expect(
      within(row1).getByText(
        /3\/12\/2024|Mar 12, 2024|March 12, 2024|3\/11\/2024|Mar 11, 2024|March 11, 2024/,
      ),
    ).toBeInTheDocument();
    const scoreCell1 = within(row1).getAllByRole("cell")[5];
    expect(scoreCell1.textContent).toContain("9:40");
    expect(within(row1).getByText("intermediate")).toBeInTheDocument();
    expect(within(row1).getByText("Hard")).toBeInTheDocument();
    expect(within(row1).getByText("Hard")).toHaveClass("text-orange-500");
    expect(within(row1).getByText("200")).toBeInTheDocument();
    expect(within(row1).getByText("Desc Delta")).toBeInTheDocument();

    // Since multiple results might render in additional rows or within the same row, check for the second score
    const allRows = screen.getAllByRole("row");
    let row2 = null;
    for (const row of allRows) {
      const cells = within(row).getAllByRole("cell"); // Assert type
      if (cells.length > 5 && cells[5].textContent.includes("9:10")) {
        row2 = row; // Assert type on assignment
        break;
      }
    }
    expect(row2).not.toBeNull();
    if (row2) {
      const cells2 = within(row2 as HTMLElement).getAllByRole("cell"); // Assert type
      if (cells2[0].textContent !== "WOD Delta") {
        expect(cells2[0].textContent).toBe("");
        expect(cells2[1].textContent).toBe("");
        expect(cells2[2].textContent).toBe("");
        expect(cells2[3].textContent).toBe("");
      }
      expect(
        within(row2 as HTMLElement).getByText(
          // Assert type
          /11\/20\/2023|Nov 20, 2023|November 20, 2023/,
        ),
      ).toBeInTheDocument();
      expect(cells2[5].textContent).toContain("9:10");
      expect(
        within(row2 as HTMLElement).getByText("intermediate"),
      ).toBeInTheDocument(); // Assert type
      expect(
        within(row2 as HTMLElement).getByText("Desc Delta"),
      ).toBeInTheDocument(); // Assert type
    }
  });

  it("should render external link icon when wodUrl is present", () => {
    render(
      <WodTable
        wods={[mockWod2_OneResultRx]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={500} // Added prop
        searchTerm="" // Added prop
        scoresByWodId={mockScoresByWodId} // Added prop
      />,
    );
    // Find the row, then the link within it
    const row = findRenderedRowByContent("WOD Bravo");
    // Assert link type for within
    const link = within(row).getByRole("link", {
      name: /WOD Bravo/,
    });
    expect(within(link).getByText("↗")).toBeInTheDocument();
  });

  it("should NOT render external link icon when wodUrl is absent", () => {
    render(
      <WodTable
        wods={[mockWod3_OneResultScaled]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={500} // Added prop
        searchTerm="" // Added prop
        scoresByWodId={mockScoresByWodId} // Added prop
      />,
    );
    const row = findRenderedRowByContent("WOD Charlie");
    const nameElement = within(row).getByText("WOD Charlie"); // Assert type
    // Ensure it's not a link and doesn't contain the icon
    expect(nameElement.closest("a")).toBeNull(); // Check it's not inside an anchor
    expect(within(nameElement).queryByText("↗")).not.toBeInTheDocument();
  });

  it("should render placeholder/dash for level/difficulty/likes if missing", () => {
    render(
      <WodTable
        wods={[mockWod5_NoBenchmark]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={mockScoresByWodId}
      />,
    );
    const row = findRenderedRowByContent("WOD Echo");
    const cells = within(row).getAllByRole("cell");
    expect(cells[2].textContent).toContain("-"); // Difficulty
    expect(cells[3].textContent).toContain("-"); // Likes
    expect(cells[4].textContent).toMatch(
      /1\/5\/2024|Jan 5, 2024|January 5, 2024|1\/4\/2024|Jan 4, 2024|January 4, 2024/,
    ); // Date
    expect(cells[5].textContent).toContain("10 rounds"); // Score
    expect(cells[6].textContent).toContain("-"); // Level
  });

  it("should call handleSort when clicking sortable headers", () => {
    render(
      <WodTable
        wods={testWods} // Use testWods to ensure rows are rendered for clicking
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={500} // Added prop
        searchTerm="" // Added prop
        scoresByWodId={mockScoresByWodId} // Added prop
      />,
    );

    // Click headers by their text content
    fireEvent.click(screen.getByText(/Workout/));
    expect(handleSortMock).toHaveBeenCalledWith("wodName");

    fireEvent.click(screen.getByText(/Date/));
    expect(handleSortMock).toHaveBeenCalledWith("date");

    fireEvent.click(screen.getByText(/Difficulty/));
    expect(handleSortMock).toHaveBeenCalledWith("difficulty");

    fireEvent.click(screen.getByText(/Likes/));
    expect(handleSortMock).toHaveBeenCalledWith("countLikes"); // Changed to camelCase

    // Non-sortable headers (check Category / Tags)
    fireEvent.click(screen.getByText(/Category \/ Tags/));
    // The count should still be 5 from the sortable headers
    expect(handleSortMock).toHaveBeenCalledTimes(5);
  });
});
