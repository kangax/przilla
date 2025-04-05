import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"; // Added afterEach
import { render, screen, fireEvent, within, cleanup } from "../../test-utils"; // Use custom render, added cleanup
import "@testing-library/jest-dom";
import WodTimeline from "./WodTimeline";
import { type Wod, type WodResult } from "~/types/wodTypes"; // Corrected import path

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

// --- Mock Data ---
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

const mockResultNoScore = (date = "2024-01-19"): WodResult => ({
  score_time_seconds: null,
  score_reps: null,
  score_load: null,
  score_rounds_completed: null,
  score_partial_reps: null,
  rxStatus: null,
  date,
});

const mockWod1_MultiResultSorted: Wod = {
  wodUrl: "test.com/wod1",
  wodName: "WOD Alpha",
  description: "Desc Alpha\nLine 2",
  category: "Benchmark",
  tags: ["AMRAP"],
  benchmarks: {
    type: "time",
    levels: {
      elite: { min: null, max: 180 },
      advanced: { min: null, max: 300 },
      intermediate: { min: null, max: 420 },
      beginner: { min: null, max: 600 },
    },
  },
  results: [
    mockResultTime(310, true, "2024-03-10", "Tough one"), // Intermediate
    mockResultTime(290, true, "2024-01-05", "First try"), // Advanced
    mockResultTime(250, false, "2024-05-15", "Scaled but faster"), // Advanced (if Rx)
  ],
};

const mockWod2_SomeInvalidResults: Wod = {
  wodUrl: "",
  wodName: "WOD Bravo",
  description: "Desc Bravo",
  category: "Girl",
  tags: ["For Time"],
  results: [
    mockResultTime(400, true, "2024-02-20", "Good pace"),
    mockResultNoScore("2024-02-21"), // No score, should be filtered by hasScore
    { ...mockResultTime(380, true, "", "Forgot date"), date: undefined }, // No date, should be filtered
  ],
};

const mockWod3_NoValidResults: Wod = {
  wodUrl: "test.com/wod3",
  wodName: "WOD Charlie",
  description: "Desc Charlie",
  results: [
    mockResultNoScore("2024-01-01"),
    { ...mockResultTime(380, true, "", "No date"), date: undefined },
  ],
};

const mockWod4_SingleValidResult: Wod = {
  wodUrl: "test.com/wod4",
  wodName: "WOD Delta",
  description: "Desc Delta",
  results: [mockResultTime(500, true, "2023-12-15", "Solo effort")],
};

const testWods: Wod[] = [
  mockWod1_MultiResultSorted,
  mockWod2_SomeInvalidResults,
  mockWod3_NoValidResults,
  mockWod4_SingleValidResult,
];

import type { VirtualizerOptions } from "@tanstack/react-virtual"; // Correct Import the type

// Mock the virtualizer to render all rows for testing
vi.mock("@tanstack/react-virtual", async (importOriginal) => {
  // Use import type for type-only imports
  const mod = await importOriginal<typeof import("@tanstack/react-virtual")>();
  return {
    ...mod,
    // Add proper typing for opts and return value
    useVirtualizer: (
      opts: VirtualizerOptions<HTMLDivElement, HTMLDivElement>,
    ) => {
      // Specify Element types
      // Correct type annotation
      const estimateSizeFn = opts.estimateSize ?? (() => 50); // Provide default if undefined
      const virtualItems = Array.from({ length: opts.count }, (_, index) => ({
        index,
        start: index * estimateSizeFn(index),
        size: estimateSizeFn(index),
        key: opts.getItemKey?.(index) ?? index, // Use getItemKey if provided
      }));
      return {
        getVirtualItems: () => virtualItems,
        getTotalSize: () =>
          virtualItems.reduce((sum, item) => sum + item.size, 0), // Calculate total size correctly
        options: opts,
        measureElement: vi.fn(),
        scrollToIndex: vi.fn(),
        scrollToOffset: vi.fn(),
      };
    },
  };
});

describe("WodTimeline Component", () => {
  let handleSortMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    handleSortMock = vi.fn();
    // Mock window.innerHeight for consistent tableHeight calculation
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(800);
  });

  afterEach(() => {
    cleanup(); // Clean up DOM after each test
    vi.restoreAllMocks(); // Restore mocks
  });

  // Helper to find row based on WOD name text/link
  const findRowByName = (name: string | RegExp) => {
    // Try finding by link first
    let element = screen.queryByRole("link", { name });
    if (!element) {
      // Fallback to finding by text if no link
      element = screen.queryByText(name);
    }
    if (!element) {
      throw new Error(`Could not find element with name/text: ${name}`);
    }
    // Find the closest element with the role="row" attribute
    const rowElement = element.closest('[role="row"]');
    if (!rowElement) {
      throw new Error(`Could not find row for element: ${name}`);
    }
    // Ensure it's an HTMLElement before returning
    if (!(rowElement instanceof HTMLElement)) {
      throw new Error(`Found row element is not an HTMLElement: ${name}`);
    }
    return rowElement;
  };

  it("should render table headers correctly", () => {
    render(
      <WodTimeline
        wods={[]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={600} // Add tableHeight
      />,
    );
    expect(
      screen.getByRole("columnheader", { name: /Workout/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /Progress Timeline/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /Description/ }),
    ).toBeInTheDocument();
  });

  it("should display sort indicators correctly", () => {
    const { rerender } = render(
      <WodTimeline
        wods={[]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={600} // Add tableHeight
      />,
    );
    expect(
      screen.getByRole("columnheader", { name: /Workout ▲/i }), // Case-insensitive
    ).toBeInTheDocument();

    rerender(
      <WodTimeline
        wods={[]}
        sortBy="latestLevel"
        sortDirection="desc"
        handleSort={handleSortMock}
        tableHeight={600} // Add tableHeight
      />,
    );
    expect(
      screen.getByRole("columnheader", { name: /^Workout$/i }), // Exact match, case-insensitive
    ).toBeInTheDocument(); // No indicator
    expect(
      screen.getByRole("columnheader", { name: /Progress Timeline.*▼/i }), // Case-insensitive
    ).toBeInTheDocument();
  });

  it("should render all passed WODs, including those without valid results", () => {
    render(
      <WodTimeline
        wods={testWods}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={600} // Add tableHeight
      />,
    );
    // Use helper to find rows
    expect(findRowByName(/WOD Alpha/i)).toBeInTheDocument();
    expect(findRowByName(/WOD Bravo/i)).toBeInTheDocument();
    expect(findRowByName(/WOD Charlie/i)).toBeInTheDocument();
    expect(findRowByName(/WOD Delta/i)).toBeInTheDocument();
  });

  it('should render "n/a" for WODs with no valid results', () => {
    render(
      <WodTimeline
        wods={[mockWod3_NoValidResults]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={600} // Add tableHeight
      />,
    );
    const row = findRowByName(/WOD Charlie/i); // Use helper
    const timelineCell = within(row).getAllByRole("cell")[1]; // Second cell is the timeline
    expect(within(timelineCell).getByText("n/a")).toBeInTheDocument();
    expect(within(timelineCell).getByText("n/a")).toHaveClass("italic");
  });

  it("should render results chronologically within a WOD row", () => {
    render(
      <WodTimeline
        wods={[mockWod1_MultiResultSorted]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={600} // Add tableHeight
      />,
    );
    const row = findRowByName(/WOD Alpha/i); // Use helper
    const resultsContainer = within(row).getAllByRole("cell")[1]; // Second cell contains the timeline Flex
    const resultsText =
      within(resultsContainer).getAllByText(/^[0-9]+:[0-9]{2}$/); // Match MM:SS format exactly

    // Expected order based on dates: 2024-01-05 (290s), 2024-03-10 (310s), 2024-05-15 (250s)
    expect(resultsText[0]).toHaveTextContent("4:50"); // 290s
    expect(resultsText[1]).toHaveTextContent("5:10"); // 310s
    expect(resultsText[2]).toHaveTextContent("4:10"); // 250s

    // Check separators
    expect(within(resultsContainer).getAllByText("→")).toHaveLength(2);
  });

  it("should render score, badge, and color correctly for each result", () => {
    render(
      <WodTimeline
        wods={[mockWod1_MultiResultSorted]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={600} // Add tableHeight
      />,
    );
    const row = findRowByName(/WOD Alpha/i); // Use helper
    const resultsContainer = within(row).getAllByRole("cell")[1];

    // Result 1: 2024-01-05, 290s, Rx (Advanced) - Find score span directly
    const result1ScoreSpan = within(resultsContainer).getByText("4:50");
    expect(result1ScoreSpan).toHaveClass("text-green-600"); // Advanced color
    expect(
      within(result1ScoreSpan.closest("div")).getByText("Rx"), // Find badge within the result's Flex container
    ).toBeInTheDocument();

    // Result 2: 2024-03-10, 310s, Rx (Intermediate)
    const result2ScoreSpan = within(resultsContainer).getByText("5:10");
    expect(result2ScoreSpan).toHaveClass("text-yellow-600"); // Intermediate color
    expect(
      within(result2ScoreSpan.closest("div")).getByText("Rx"),
    ).toBeInTheDocument();

    // Result 3: 2024-05-15, 250s, Scaled
    const result3ScoreSpan = within(resultsContainer).getByText("4:10");
    expect(result3ScoreSpan).toHaveClass("text-foreground/70"); // Scaled color (default)
    expect(
      within(result3ScoreSpan.closest("div")).getByText("Scaled"),
    ).toBeInTheDocument();
  });

  it("should render WOD description correctly (including newlines)", () => {
    render(
      <WodTimeline
        wods={[mockWod1_MultiResultSorted]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={600} // Add tableHeight
      />,
    );
    const row = findRowByName(/WOD Alpha/i); // Use helper
    const descriptionCell = within(row).getAllByRole("cell")[2];
    // Check for text content, whitespace might be tricky
    expect(descriptionCell).toHaveTextContent(/Desc Alpha/); // Use regex for flexibility
    expect(descriptionCell).toHaveTextContent("Line 2");
    // Check for pre-line whitespace style
    expect(descriptionCell.querySelector("span")).toHaveClass(
      "whitespace-pre-line",
    );
  });

  it("should render external link icon when wodUrl is present", () => {
    render(
      <WodTimeline
        wods={[mockWod1_MultiResultSorted]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={600} // Add tableHeight
      />,
    );
    const link = screen.getByRole("link", { name: /WOD Alpha/i }); // Case-insensitive
    expect(within(link).getByText("↗")).toBeInTheDocument();
  });

  it("should NOT render external link icon when wodUrl is absent", () => {
    render(
      <WodTimeline
        wods={[mockWod2_SomeInvalidResults]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={600} // Add tableHeight
      />,
    );
    const nameElement = screen.getByText(/WOD Bravo/i); // Case-insensitive
    expect(nameElement.tagName).not.toBe("A");
    // Check within the row's first cell for the icon
    const row = findRowByName(/WOD Bravo/i);
    const firstCell = within(row).getAllByRole("cell")[0];
    expect(within(firstCell).queryByText("↗")).not.toBeInTheDocument();
  });

  // Tooltip testing is limited, just check presence of tooltip trigger/content structure if possible
  it("should have tooltips on results", () => {
    render(
      <WodTimeline
        wods={[mockWod1_MultiResultSorted]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={600} // Add tableHeight
      />,
    );
    const row = findRowByName(/WOD Alpha/i); // Use helper
    const resultsContainer = within(row).getAllByRole("cell")[1];
    const resultElements =
      within(resultsContainer).getAllByText(/^[0-9]+:[0-9]{2}$/); // Find scores again

    // Check if the parent element (Text) acts as a tooltip trigger (has cursor-help)
    resultElements.forEach((el) => {
      // The score span itself is inside the Text component which has the class
      expect(el.parentElement).toHaveClass("cursor-help");
    });
    // Note: Verifying tooltip *content* on hover is complex in JSDOM and usually skipped or done in E2E tests.
  });

  it("should call handleSort when clicking sortable headers", () => {
    render(
      <WodTimeline
        wods={testWods}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={600} // Add tableHeight
      />,
    );

    // Find the clickable span within the header
    const workoutHeader = screen.getByRole("columnheader", {
      name: /Workout ▲/i,
    });
    fireEvent.click(within(workoutHeader).getByText(/Workout/));
    expect(handleSortMock).toHaveBeenCalledWith("wodName");

    const timelineHeader = screen.getByRole("columnheader", {
      name: /Progress Timeline/i,
    });
    fireEvent.click(within(timelineHeader).getByText(/Progress Timeline/));
    expect(handleSortMock).toHaveBeenCalledWith("latestLevel");

    // Non-sortable header - click should not trigger sort
    const descriptionHeader = screen.getByRole("columnheader", {
      name: /Description/i,
    });
    fireEvent.click(descriptionHeader); // Click the div itself
    expect(handleSortMock).toHaveBeenCalledTimes(2); // Only the 2 sortable ones called
  });
});
