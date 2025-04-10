import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"; // Added afterEach
import { render, screen, fireEvent, within, cleanup } from "../../test-utils"; // Use custom render, added cleanup
import "@testing-library/jest-dom";
import WodTimeline from "./WodTimeline";
import { type Wod } from "~/types/wodTypes"; // Corrected import path, removed WodResult

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

const mockWod1_MultiResultSorted: Wod = {
  id: "1", // Change placeholder ID to string
  createdAt: new Date(), // Add placeholder date
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
  // results removed
};

const mockWod2_SomeInvalidResults: Wod = {
  id: "2", // Change placeholder ID to string
  createdAt: new Date(), // Add placeholder date
  wodUrl: "",
  wodName: "WOD Bravo",
  description: "Desc Bravo",
  category: "Girl",
  tags: ["For Time"],
  // results removed
};

const mockWod3_NoValidResults: Wod = {
  id: "3", // Change placeholder ID to string
  createdAt: new Date(), // Add placeholder date
  wodUrl: "test.com/wod3",
  wodName: "WOD Charlie",
  description: "Desc Charlie",
  // results removed
};

const mockWod4_SingleValidResult: Wod = {
  id: "4", // Change placeholder ID to string
  createdAt: new Date(), // Add placeholder date
  wodUrl: "test.com/wod4",
  wodName: "WOD Delta",
  description: "Desc Delta",
  // results removed
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
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
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
        searchTerm="" // Add missing prop
      />,
    );
    expect(
      screen.getByRole("columnheader", { name: /Workout/ }),
    ).toBeInTheDocument();
    // Removed check for "Progress Timeline" header
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
        searchTerm="" // Add missing prop
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
        searchTerm="" // Add missing prop
      />,
    );
    expect(
      screen.getByRole("columnheader", { name: /^Workout$/i }), // Exact match, case-insensitive
    ).toBeInTheDocument(); // No indicator
    // Removed check for "Progress Timeline" sort indicator
  });

  it("should render all passed WODs", () => {
    // Updated test description
    render(
      <WodTimeline
        wods={testWods}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={600} // Add tableHeight
        searchTerm="" // Add missing prop
      />,
    );
    // Use helper to find rows
    expect(findRowByName(/WOD Alpha/i)).toBeInTheDocument();
    expect(findRowByName(/WOD Bravo/i)).toBeInTheDocument();
    expect(findRowByName(/WOD Charlie/i)).toBeInTheDocument();
    expect(findRowByName(/WOD Delta/i)).toBeInTheDocument();
  });

  // Removed tests related to the "Progress Timeline" column as it no longer exists:
  // - 'should render "n/a" for WODs with no valid results'
  // - 'should render results chronologically within a WOD row'
  // - 'should render score, badge, and color correctly for each result'

  it("should render WOD description correctly (including newlines)", () => {
    render(
      <WodTimeline
        wods={[mockWod1_MultiResultSorted]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={600} // Add tableHeight
        searchTerm="" // Add missing prop
      />,
    );
    const row = findRowByName(/WOD Alpha/i); // Use helper
    const descriptionCell = within(row).getAllByRole("cell")[1]; // Corrected index from 2 to 1
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
        searchTerm="" // Add missing prop
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
        searchTerm="" // Add missing prop
      />,
    );
    const nameElement = screen.getByText(/WOD Bravo/i); // Case-insensitive
    expect(nameElement.tagName).not.toBe("A");
    // Check within the row's first cell for the icon
    const row = findRowByName(/WOD Bravo/i);
    const firstCell = within(row).getAllByRole("cell")[0];
    expect(within(firstCell).queryByText("↗")).not.toBeInTheDocument();
  });

  // Removed test 'should have tooltips on results' as the timeline column is gone.

  it("should call handleSort when clicking sortable headers", () => {
    render(
      <WodTimeline
        wods={testWods}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={600} // Add tableHeight
        searchTerm="" // Add missing prop
      />,
    );

    // Find the clickable span within the header
    const workoutHeader = screen.getByRole("columnheader", {
      name: /Workout ▲/i,
    });
    fireEvent.click(within(workoutHeader).getByText(/Workout/));
    expect(handleSortMock).toHaveBeenCalledWith("wodName");

    // Removed click check for "Progress Timeline" header

    // Non-sortable header - click should not trigger sort
    const descriptionHeader = screen.getByRole("columnheader", {
      name: /Description/i,
    });
    fireEvent.click(descriptionHeader); // Click the div itself
    expect(handleSortMock).toHaveBeenCalledTimes(1); // Only the "Workout" header is sortable now
  });
});
