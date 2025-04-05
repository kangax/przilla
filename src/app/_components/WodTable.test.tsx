import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "../../test-utils"; // Use custom render
import "@testing-library/jest-dom";
import { useVirtualizer } from "@tanstack/react-virtual"; // Import useVirtualizer
import WodTable from "./WodTable";
import type { Wod, WodResult, SortByType } from "~/types/wodTypes"; // Import SortByType

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
    useVirtualizer: vi.fn((options) => {
      // Simple mock: return all items and a fixed total size
      const virtualItems = Array.from(
        { length: options.count },
        (_, index) => ({
          index,
          start: index * options.estimateSize(),
          size: options.estimateSize(),
          key: index, // Ensure key is present
          measureElement: vi.fn(), // Mock measureElement if needed
          end: (index + 1) * options.estimateSize(), // Mock end if needed
          lane: 0, // Mock lane if needed
        }),
      );
      return {
        getVirtualItems: () => virtualItems,
        getTotalSize: () => options.count * options.estimateSize(),
        // Mock other properties/methods if needed by the component
        scrollOffset: 0,
        scrollToOffset: vi.fn(),
        scrollToIndex: vi.fn(),
        measure: vi.fn(),
        virtualItems, // Also return the items directly if accessed
      };
    }),
  };
});

// --- Mock Data ---
// Re-use or adapt mocks from WodViewer.test.tsx if suitable
const mockResultTime = (
  seconds: number | null,
  rx = true,
  date = "2024-01-15",
  notes = "",
): WodResult => ({
  score_time_seconds: seconds,
  score_reps: null,
  score_load: null,
  score_rounds_completed: null,
  score_partial_reps: null,
  rxStatus: rx ? "Rx" : "Scaled",
  date,
  notes,
});

const mockResultRounds = (
  rounds: number | null,
  partialReps: number | null = 0,
  rx = true,
  date = "2024-01-16",
  notes = "",
): WodResult => ({
  score_time_seconds: null,
  score_reps: null,
  score_load: null,
  score_rounds_completed: rounds,
  score_partial_reps: partialReps,
  rxStatus: rx ? "Rx" : "Scaled",
  date,
  notes,
});

const mockWod1_NoResults: Wod = {
  wodUrl: "test.com/wod1",
  wodName: "WOD Alpha",
  description: "Desc Alpha",
  category: "Benchmark",
  tags: ["AMRAP"],
  results: [],
  difficulty: "Medium",
  difficulty_explanation: "Standard benchmark AMRAP.",
  count_likes: 15, // Added likes
};

const mockWod2_OneResultRx: Wod = {
  wodUrl: "test.com/wod2",
  wodName: "WOD Bravo",
  description: "Desc Bravo",
  category: "Girl",
  tags: ["For Time"],
  benchmarks: {
    type: "time",
    levels: {
      elite: { min: null, max: 180 },
      advanced: { min: null, max: 300 },
      intermediate: { min: null, max: 420 },
      beginner: { min: null, max: 600 },
    },
  },
  results: [mockResultTime(290, true, "2024-03-10", "Felt good")], // Advanced
  difficulty: "Hard",
  difficulty_explanation: "Classic Girl WOD, tough time cap.",
  count_likes: 123, // Added likes
};

const mockWod3_OneResultScaled: Wod = {
  wodUrl: "",
  wodName: "WOD Charlie",
  description: "Desc Charlie",
  category: "Hero",
  tags: ["Chipper"],
  benchmarks: {
    type: "rounds",
    levels: {
      elite: { min: 20, max: null },
      advanced: { min: 15, max: null },
      intermediate: { min: 10, max: null },
      beginner: { min: 5, max: null },
    },
  },
  results: [
    mockResultRounds(12, 5, false, "2024-03-11", "Used lighter weight"),
  ], // Scaled (Intermediate level if Rx)
  difficulty: "Very Hard",
  difficulty_explanation: "Hero WOD, high volume chipper.",
  count_likes: 50, // Added likes
};

const mockWod4_MultiResult: Wod = {
  wodUrl: "test.com/wod4",
  wodName: "WOD Delta",
  description: "Desc Delta",
  category: "Open",
  tags: ["Couplet"],
  benchmarks: {
    type: "time",
    levels: {
      elite: { min: null, max: 300 },
      advanced: { min: null, max: 420 },
      intermediate: { min: null, max: 600 },
      beginner: { min: null, max: 900 },
    },
  },
  results: [
    mockResultTime(580, true, "2024-03-12", "First attempt"), // Intermediate
    mockResultTime(550, true, "2023-11-20", "PR!"), // Intermediate
  ],
  difficulty: "Hard",
  difficulty_explanation: "Open WOD, tests multiple modalities.",
  count_likes: 200, // Added likes
};

const mockWod5_NoBenchmark: Wod = {
  wodUrl: "test.com/wod5",
  wodName: "WOD Echo",
  description: "Desc Echo",
  results: [mockResultRounds(10, 0, true, "2024-01-05")],
  // No difficulty or likes specified for this one to test placeholder
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
    const row = cell.closest('div[role="row"]');
    if (!row || !(row instanceof HTMLElement)) {
      throw new Error(
        `Row containing "${content}" not found or is not an HTMLElement`,
      );
    }
    return row;
  };

  it("should render table headers correctly", () => {
    render(
      <WodTable
        wods={[]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
      />,
    );
    // Headers are sticky and should always be present
    expect(
      screen.getByRole("columnheader", { name: /Workout/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /Category/ }), // Changed from Type
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /Tags/ }), // Added Tags
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
      screen.getByRole("columnheader", { name: /Notes/ }),
    ).toBeInTheDocument();
  });

  it("should display sort indicators correctly", () => {
    const { rerender } = render(
      <WodTable
        wods={[]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
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
        sortBy="count_likes"
        sortDirection="desc"
        handleSort={handleSortMock}
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
      />,
    );
    // Find the row by the unique WOD name which should be rendered
    const row = findRenderedRowByContent("WOD Alpha");
    expect(within(row).getByText("WOD Alpha")).toBeInTheDocument();
    expect(within(row).getByText("Benchmark")).toBeInTheDocument(); // Category Badge (now in its own column)
    expect(within(row).getByText("AMRAP")).toBeInTheDocument(); // Tag Badge (now in its own column)
    expect(within(row).getByText("Medium")).toBeInTheDocument(); // Difficulty
    expect(within(row).getByText("Medium")).toHaveClass("text-yellow-500"); // Difficulty Color
    expect(within(row).getByText("15")).toBeInTheDocument(); // Likes
    // Check for dashes in specific cells (Date, Score, Level, Notes) - Indices shifted
    const cells = within(row).getAllByRole("cell") as HTMLElement[]; // Assert type
    expect(within(cells[3]).getByText("-")).toBeInTheDocument(); // Date (index +1)
    expect(within(cells[4]).getByText("-")).toBeInTheDocument(); // Score (index +1)
    expect(within(cells[5]).getByText("-")).toBeInTheDocument(); // Level (index +1)
    expect(within(cells[8]).getByText("-")).toBeInTheDocument(); // Notes (index +1)
  });

  it("should render WOD with one Rx result correctly", () => {
    render(
      <WodTable
        wods={[mockWod2_OneResultRx]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
      />,
    );
    const row = findRenderedRowByContent("WOD Bravo");
    expect(within(row).getByText("WOD Bravo")).toBeInTheDocument();
    expect(within(row).getByText("Girl")).toBeInTheDocument(); // Category (own column)
    expect(within(row).getByText("For Time")).toBeInTheDocument(); // Tag (own column)
    expect(within(row).getByText("2024-03-10")).toBeInTheDocument(); // Date
    expect(within(row).getByText(/4:50/)).toBeInTheDocument(); // Score (290s)
    expect(within(row).getByText("Rx")).toBeInTheDocument(); // Rx Status
    expect(within(row).getByText("Advanced")).toBeInTheDocument(); // Level
    expect(within(row).getByText("Advanced")).toHaveClass("text-green-600"); // Level Color (Adjust if needed)
    expect(within(row).getByText("Hard")).toBeInTheDocument(); // Difficulty
    expect(within(row).getByText("Hard")).toHaveClass("text-orange-500"); // Difficulty Color
    expect(within(row).getByText("123")).toBeInTheDocument(); // Likes
    expect(within(row).getByText("Felt good")).toBeInTheDocument(); // Notes
  });

  it("should render WOD with one Scaled result correctly", () => {
    render(
      <WodTable
        wods={[mockWod3_OneResultScaled]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
      />,
    );
    const row = findRenderedRowByContent("WOD Charlie");
    expect(within(row).getByText("WOD Charlie")).toBeInTheDocument();
    expect(within(row).getByText("Hero")).toBeInTheDocument(); // Category (own column)
    expect(within(row).getByText("Chipper")).toBeInTheDocument(); // Tag (own column)
    expect(within(row).getByText("2024-03-11")).toBeInTheDocument(); // Date
    const scoreCell = within(row)
      .getByText(/12\+5/)
      .closest('div[role="cell"]'); // Use div role
    expect(scoreCell).not.toBeNull();
    // Assert scoreCell type for within
    expect(
      within(scoreCell as HTMLElement).getByText("Scaled"),
    ).toBeInTheDocument(); // Rx Status within Score cell

    // Find the Level cell more robustly - Index shifted
    const cells = within(row).getAllByRole("cell") as HTMLElement[]; // Assert type
    const levelCell = cells[5]; // Assuming Level is the 6th column (index 5)
    expect(within(levelCell).getByText("Scaled")).toBeInTheDocument();
    expect(within(levelCell).getByText("Scaled")).toHaveClass(
      "text-foreground/70", // Adjust if needed
    );

    expect(within(row).getByText("Very Hard")).toBeInTheDocument(); // Difficulty
    expect(within(row).getByText("Very Hard")).toHaveClass("text-red-500"); // Difficulty Color
    expect(within(row).getByText("50")).toBeInTheDocument(); // Likes
    expect(within(row).getByText("Used lighter weight")).toBeInTheDocument(); // Notes
  });

  it("should render WOD with multiple results correctly (checking first few rows)", () => {
    render(
      <WodTable
        wods={[mockWod4_MultiResult]}
        sortBy="date" // Sort doesn't matter much here as we check rendered content
        sortDirection="desc"
        handleSort={handleSortMock}
      />,
    );

    // Due to virtualization, we can only reliably check rows that are initially rendered.
    // Let's check the content based on the flattened data structure.

    // Find the first result row (latest date: 2024-03-12) by its unique date/score
    const row1 = findRenderedRowByContent("2024-03-12");
    expect(within(row1).getByText("WOD Delta")).toBeInTheDocument(); // Name on first row
    expect(within(row1).getByText("Open")).toBeInTheDocument(); // Category on first row (own column)
    expect(within(row1).getByText("Couplet")).toBeInTheDocument(); // Tag on first row (own column)
    expect(within(row1).getByText("2024-03-12")).toBeInTheDocument();
    expect(within(row1).getByText(/9:40/)).toBeInTheDocument(); // Score (580s)
    expect(within(row1).getByText("Intermediate")).toBeInTheDocument(); // Level
    expect(within(row1).getByText("Hard")).toBeInTheDocument(); // Difficulty (only on first row)
    expect(within(row1).getByText("Hard")).toHaveClass("text-orange-500"); // Difficulty Color
    expect(within(row1).getByText("200")).toBeInTheDocument(); // Likes (only on first row)
    expect(within(row1).getByText("First attempt")).toBeInTheDocument(); // Notes

    // Find the second result row (older date: 2023-11-20) by its unique date/score
    const row2 = findRenderedRowByContent("2023-11-20");
    // Check that name/category/tags/difficulty/likes are NOT rendered (cells should be empty based on cell logic) - Indices shifted
    const cells2 = within(row2).getAllByRole("cell") as HTMLElement[]; // Assert type
    expect(cells2[0].textContent).toBe(""); // WodName cell empty
    expect(cells2[1].textContent).toBe(""); // Category cell empty
    expect(cells2[2].textContent).toBe(""); // Tags cell empty
    expect(cells2[6].textContent).toBe(""); // Difficulty cell empty (index +1)
    expect(cells2[7].textContent).toBe(""); // Likes cell empty (index +1)

    // Check the unique data for the second row:
    expect(within(row2).getByText("2023-11-20")).toBeInTheDocument();
    expect(within(row2).getByText(/9:10/)).toBeInTheDocument(); // Score (550s)
    expect(within(row2).getByText("Intermediate")).toBeInTheDocument(); // Level
    expect(within(row2).getByText("PR!")).toBeInTheDocument(); // Notes
  });

  it("should render external link icon when wodUrl is present", () => {
    render(
      <WodTable
        wods={[mockWod2_OneResultRx]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
      />,
    );
    // Find the row, then the link within it
    const row = findRenderedRowByContent("WOD Bravo");
    // Assert link type for within
    const link = within(row).getByRole("link", {
      name: /WOD Bravo/,
    }) as HTMLLinkElement;
    expect(within(link).getByText("↗")).toBeInTheDocument();
  });

  it("should NOT render external link icon when wodUrl is absent", () => {
    render(
      <WodTable
        wods={[mockWod3_OneResultScaled]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
      />,
    );
    const row = findRenderedRowByContent("WOD Charlie");
    const nameElement = within(row).getByText("WOD Charlie") as HTMLElement; // Assert type
    // Ensure it's not a link and doesn't contain the icon
    expect(nameElement.closest("a")).toBeNull(); // Check it's not inside an anchor
    expect(within(nameElement).queryByText("↗")).not.toBeInTheDocument();
  });

  it("should render placeholder/dash for level/difficulty/likes if missing", () => {
    render(
      <WodTable
        wods={[mockWod5_NoBenchmark]} // This mock has results but no benchmarks/difficulty/likes
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
      />,
    );
    const row = findRenderedRowByContent("WOD Echo");
    const cells = within(row).getAllByRole("cell") as HTMLElement[]; // Assert type
    // Level column (index 5) should contain a dash (-) - Index shifted
    expect(within(cells[5]).getByText("-")).toBeInTheDocument();
    // Difficulty column (index 6) should contain a dash (-) - Index shifted
    expect(within(cells[6]).getByText("-")).toBeInTheDocument();
    // Likes column (index 7) should contain a dash (-) - Index shifted
    expect(within(cells[7]).getByText("-")).toBeInTheDocument();
  });

  it("should call handleSort when clicking sortable headers", () => {
    render(
      <WodTable
        wods={testWods} // Use testWods to ensure rows are rendered for clicking
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
      />,
    );

    // Click headers by their text content
    fireEvent.click(screen.getByText(/Workout/));
    expect(handleSortMock).toHaveBeenCalledWith("wodName");

    fireEvent.click(screen.getByText(/Date/));
    expect(handleSortMock).toHaveBeenCalledWith("date");

    fireEvent.click(screen.getByText(/Level/));
    expect(handleSortMock).toHaveBeenCalledWith("level");

    fireEvent.click(screen.getByText(/Difficulty/));
    expect(handleSortMock).toHaveBeenCalledWith("difficulty");

    fireEvent.click(screen.getByText(/Likes/));
    expect(handleSortMock).toHaveBeenCalledWith("count_likes");

    // Non-sortable headers (check Category and Tags)
    fireEvent.click(screen.getByText(/Category/));
    fireEvent.click(screen.getByText(/Tags/));
    // The count should still be 5 from the sortable headers
    expect(handleSortMock).toHaveBeenCalledTimes(5);
  });
});
