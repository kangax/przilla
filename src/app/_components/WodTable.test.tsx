import { describe, it, expect, vi, beforeEach, Mock } from "vitest"; // Import Mock type
import { render, screen, fireEvent, within } from "../../test-utils"; // Use custom render
import "@testing-library/jest-dom";
import { TableVirtuoso } from "react-virtuoso";
import WodTable from "./WodTable";
import type { Wod, WodResult, SortByType } from "~/types/wodTypes"; // Added SortByType

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

// --- Mock react-virtuoso ---
// Mock TableVirtuoso to render all items for testing, bypassing virtualization
vi.mock("react-virtuoso", async (importOriginal) => {
  const original = await importOriginal<typeof import("react-virtuoso")>();
  return {
    ...original,
    TableVirtuoso: vi.fn(
      ({ data, itemContent, fixedHeaderContent, components }) => {
        const {
          Table = "table",
          TableHead = "thead",
          TableBody = "tbody",
          TableRow = "tr",
        } = components ?? {};
        return (
          <Table>
            <TableHead>
              <TableRow>{fixedHeaderContent()}</TableRow>
            </TableHead>
            <TableBody>
              {data.map((item: any, index: number) =>
                // Render the itemContent which should return the cells wrapped in a TableRow
                itemContent(index, item),
              )}
            </TableBody>
          </Table>
        );
      },
    ),
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
  let handleSortMock: ReturnType<typeof vi.fn>; // Use inferred type or ReturnType

  beforeEach(() => {
    handleSortMock = vi.fn();
    // Clear mocks before each test if TableVirtuoso mock needs reset
    vi.clearAllMocks();
  });

  it("should render table headers correctly", () => {
    render(
      <WodTable
        wods={[]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
      />,
    );
    expect(
      screen.getByRole("columnheader", { name: /Workout/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /Type/ }),
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
    // Added Difficulty Header Check
    expect(
      screen.getByRole("columnheader", { name: /Difficulty/ }),
    ).toBeInTheDocument();
    // Added Likes Header Check
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

  it('should render a "Not attempted" row for WODs with no results', () => {
    render(
      <WodTable
        wods={[mockWod1_NoResults]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
      />,
    );
    // Find cell content first, then verify row context if needed
    expect(screen.getByText("WOD Alpha")).toBeInTheDocument();
    const alphaRow = screen.getByText("WOD Alpha").closest("tr");
    expect(alphaRow).toBeInTheDocument();
    expect(within(alphaRow!).getByText("Benchmark")).toBeInTheDocument(); // Category Badge
    expect(within(alphaRow!).getByText("AMRAP")).toBeInTheDocument(); // Tag Badge
    expect(within(alphaRow!).getByText("Medium")).toBeInTheDocument(); // Difficulty
    expect(within(alphaRow!).getByText("Medium")).toHaveClass(
      "text-yellow-500",
    ); // Difficulty Color
    expect(within(alphaRow!).getByText("15")).toBeInTheDocument(); // Likes
    // Check for 3 dashes: Date, Score, Level, Notes (Likes has value)
    expect(within(alphaRow!).getAllByText("-")).toHaveLength(3);
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
    expect(screen.getByText("WOD Bravo")).toBeInTheDocument();
    const bravoRow = screen.getByText("WOD Bravo").closest("tr");
    expect(bravoRow).toBeInTheDocument();
    expect(within(bravoRow!).getByText("Girl")).toBeInTheDocument(); // Category
    expect(within(bravoRow!).getByText("For Time")).toBeInTheDocument(); // Tag
    expect(within(bravoRow!).getByText("2024-03-10")).toBeInTheDocument(); // Date
    expect(within(bravoRow!).getByText(/4:50/)).toBeInTheDocument(); // Score (290s)
    expect(within(bravoRow!).getByText("Rx")).toBeInTheDocument(); // Rx Status
    expect(within(bravoRow!).getByText("Advanced")).toBeInTheDocument(); // Level
    // Check color class (might be brittle, depends on exact class names)
    expect(within(bravoRow!).getByText("Advanced")).toHaveClass(
      "text-green-600",
    ); // Level Color
    expect(within(bravoRow!).getByText("Hard")).toBeInTheDocument(); // Difficulty
    expect(within(bravoRow!).getByText("Hard")).toHaveClass("text-orange-500"); // Difficulty Color
    expect(within(bravoRow!).getByText("123")).toBeInTheDocument(); // Likes
    expect(within(bravoRow!).getByText("Felt good")).toBeInTheDocument(); // Notes (truncated potentially)
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
    expect(screen.getByText("WOD Charlie")).toBeInTheDocument();
    const charlieRow = screen.getByText("WOD Charlie").closest("tr");
    expect(charlieRow).toBeInTheDocument();
    expect(within(charlieRow!).getByText("Hero")).toBeInTheDocument(); // Category
    expect(within(charlieRow!).getByText("Chipper")).toBeInTheDocument(); // Tag
    expect(within(charlieRow!).getByText("2024-03-11")).toBeInTheDocument(); // Date
    const scoreCell = within(charlieRow!).getByText(/12\+5/).closest("td");
    expect(within(scoreCell!).getByText("Scaled")).toBeInTheDocument(); // Rx Status within Score cell
    const levelCell = within(charlieRow!)
      .getByText("Scaled", { selector: "span.rt-Text" })
      .closest("td"); // Find Scaled text specifically in Level cell span
    expect(levelCell).toHaveClass("rt-TableCell"); // Ensure it's the level cell
    expect(within(levelCell!).getByText("Scaled")).toHaveClass(
      "text-foreground/70",
    ); // Check class on the specific span
    expect(within(charlieRow!).getByText("Very Hard")).toBeInTheDocument(); // Difficulty
    expect(within(charlieRow!).getByText("Very Hard")).toHaveClass(
      "text-red-500",
    ); // Difficulty Color
    expect(within(charlieRow!).getByText("50")).toBeInTheDocument(); // Likes
    expect(
      within(charlieRow!).getByText("Used lighter weight"),
    ).toBeInTheDocument(); // Notes
  });

  it("should render WOD with multiple results correctly", () => {
    render(
      <WodTable
        wods={[mockWod4_MultiResult]}
        sortBy="date"
        sortDirection="desc"
        handleSort={handleSortMock}
      />,
    ); // Sort by date desc (doesn't affect mock rendering order)

    // Find rows based on unique content for each flattened item
    const row1 = screen.getByText("2024-03-12").closest("tr"); // First result
    const row2 = screen.getByText("2023-11-20").closest("tr"); // Second result

    expect(row1).toBeInTheDocument();
    expect(row2).toBeInTheDocument();

    // Check first result row (isFirstResult = true)
    expect(within(row1!).getByText("WOD Delta")).toBeInTheDocument(); // Name on first row
    expect(within(row1!).getByText("Open")).toBeInTheDocument(); // Category on first row
    expect(within(row1!).getByText("Couplet")).toBeInTheDocument(); // Tag on first row
    expect(within(row1!).getByText("2024-03-12")).toBeInTheDocument();
    expect(within(row1!).getByText(/9:40/)).toBeInTheDocument(); // Score (580s)
    expect(within(row1!).getByText("Intermediate")).toBeInTheDocument(); // Level
    expect(within(row1!).getByText("Hard")).toBeInTheDocument(); // Difficulty (only on first row)
    expect(within(row1!).getByText("Hard")).toHaveClass("text-orange-500"); // Difficulty Color
    expect(within(row1!).getByText("200")).toBeInTheDocument(); // Likes (only on first row)
    expect(within(row1!).getByText("First attempt")).toBeInTheDocument(); // Notes

    // Check second result row (isFirstResult = false)
    // WOD Name, Category, Tags, Difficulty, Likes should NOT be present
    const nameCellRow2 = within(row2!).getAllByRole("cell")[0];
    const typeCellRow2 = within(row2!).getAllByRole("cell")[1];
    const difficultyCellRow2 = within(row2!).getAllByRole("cell")[5];
    const likesCellRow2 = within(row2!).getAllByRole("cell")[6];

    expect(nameCellRow2).toBeEmptyDOMElement();
    expect(typeCellRow2).toBeEmptyDOMElement();
    expect(difficultyCellRow2).toBeEmptyDOMElement();
    expect(likesCellRow2).toBeEmptyDOMElement();

    // Check the specific data for the second result
    expect(within(row2!).getByText("2023-11-20")).toBeInTheDocument();
    expect(within(row2!).getByText(/9:10/)).toBeInTheDocument(); // Score (550s)
    expect(within(row2!).getByText("Intermediate")).toBeInTheDocument(); // Level
    expect(within(row2!).getByText("PR!")).toBeInTheDocument(); // Notes
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
    const link = screen.getByRole("link", { name: /WOD Bravo/ });
    // Check for the arrow character or a specific class/element if used
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
    const nameElement = screen.getByText("WOD Charlie");
    // Ensure it's not a link and doesn't contain the icon
    expect(nameElement.tagName).not.toBe("A");
    expect(within(nameElement).queryByText("↗")).not.toBeInTheDocument();
  });

  it("should render N/A for level if no benchmarks", () => {
    render(
      <WodTable
        wods={[mockWod5_NoBenchmark]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
      />,
    );
    expect(screen.getByText("WOD Echo")).toBeInTheDocument();
    const echoRow = screen.getByText("WOD Echo").closest("tr");
    expect(echoRow).toBeInTheDocument();
    const cells = within(echoRow!).getAllByRole("cell");
    // Level column (index 4) should contain a dash (-)
    expect(within(cells[4]).getByText("-")).toBeInTheDocument();
    // Difficulty column (index 5) should contain a dash (-) as no difficulty was provided
    expect(within(cells[5]).getByText("-")).toBeInTheDocument();
    // Likes column (index 6) should contain a dash (-) as no likes were provided
    expect(within(cells[6]).getByText("-")).toBeInTheDocument();
  });

  it("should call handleSort when clicking sortable headers", () => {
    render(
      <WodTable
        wods={testWods}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
      />,
    );

    fireEvent.click(screen.getByRole("columnheader", { name: /Workout ▲/ }));
    expect(handleSortMock).toHaveBeenCalledWith("wodName");

    fireEvent.click(screen.getByRole("columnheader", { name: /Date/ }));
    expect(handleSortMock).toHaveBeenCalledWith("date");

    fireEvent.click(screen.getByRole("columnheader", { name: /Level/ }));
    expect(handleSortMock).toHaveBeenCalledWith("level");

    // Click the new sortable header
    fireEvent.click(screen.getByRole("columnheader", { name: /Difficulty/ }));
    expect(handleSortMock).toHaveBeenCalledWith("difficulty");

    // Click the new Likes header
    fireEvent.click(screen.getByRole("columnheader", { name: /Likes/ }));
    expect(handleSortMock).toHaveBeenCalledWith("count_likes");

    // Non-sortable headers should not trigger handleSort
    fireEvent.click(screen.getByRole("columnheader", { name: /Type/ }));
    fireEvent.click(screen.getByRole("columnheader", { name: /Score/ }));
    fireEvent.click(screen.getByRole("columnheader", { name: /Notes/ }));
    expect(handleSortMock).toHaveBeenCalledTimes(5); // Now 5 sortable headers
  });
});
