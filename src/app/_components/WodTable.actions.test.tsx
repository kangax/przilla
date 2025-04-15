import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "../../test-utils";
import "@testing-library/jest-dom";
import WodTable from "./WodTable";

// Mock tRPC api at the module level (correct import path)
vi.mock("~/trpc/react", () => ({
  api: {
    useUtils: () => ({}),
    score: {
      deleteScore: {
        useMutation: () => ({
          mutate: () => {},
          isLoading: false,
          isSuccess: true,
          reset: () => {},
        }),
      },
      logScore: {
        useMutation: () => ({
          mutate: () => {},
          isLoading: false,
          isSuccess: true,
          reset: () => {},
        }),
      },
      updateScore: {
        useMutation: () => ({
          mutate: () => {},
          isLoading: false,
          isSuccess: true,
          reset: () => {},
        }),
      },
      importScores: {
        useMutation: () => ({
          mutate: () => {},
          isLoading: false,
          isSuccess: true,
          reset: () => {},
        }),
      },
      getAllByUser: {
        useQuery: () => ({
          data: [],
          isLoading: false,
          isSuccess: true,
        }),
      },
    },
    wod: {
      getAll: {
        useQuery: () => ({
          data: [],
          isLoading: false,
          isSuccess: true,
        }),
      },
    },
  },
}));

// Minimal mock data for actions
const mockWodWithScore = {
  id: "2",
  createdAt: new Date(),
  updatedAt: new Date(),
  wodUrl: "test.com/wod2",
  wodName: "WOD Bravo",
  description: "Desc Bravo",
  category: "Girl",
  tags: ["For Time"],
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

const mockScore = {
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
  isRx: false, // For "Scaled" badge
};

const mockScoresByWodId = {
  "2": [mockScore],
};

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

describe("WodTable Actions", () => {
  it("should display the 'Scaled' badge for non-Rx scores", () => {
    render(
      <WodTable
        wods={[mockWodWithScore]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={vi.fn()}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={mockScoresByWodId}
        isLoadingScores={false}
      />,
    );
    const row = findRenderedRowByContent("WOD Bravo");
    // Look for the "Scaled" badge in the row
    expect(within(row).getByText(/Scaled/i)).toBeInTheDocument();
  });

  it("should show edit and delete icons for each score", () => {
    render(
      <WodTable
        wods={[mockWodWithScore]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={vi.fn()}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={mockScoresByWodId}
        isLoadingScores={false}
      />,
    );
    const row = findRenderedRowByContent("WOD Bravo");
    // Check for edit (pencil) and delete (trash) icons by label or role
    expect(within(row).getByLabelText(/edit score/i)).toBeInTheDocument();
    expect(within(row).getByLabelText(/delete score/i)).toBeInTheDocument();
  });

  it("should show the log score button when there are no scores", () => {
    const mockWodNoScore = {
      ...mockWodWithScore,
      id: "3",
      wodName: "WOD NoScore",
    };
    render(
      <WodTable
        wods={[mockWodNoScore]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={vi.fn()}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={{}}
        isLoadingScores={false}
      />,
    );
    const row = findRenderedRowByContent("WOD NoScore");
    // Look for the log score button (plus icon) by label
    expect(within(row).getByLabelText(/log score/i)).toBeInTheDocument();
  });

  it("should open the log score popover when the log score button is clicked", () => {
    const mockWodNoScore = {
      ...mockWodWithScore,
      id: "4",
      wodName: "WOD NoScorePopover",
    };
    render(
      <WodTable
        wods={[mockWodNoScore]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={vi.fn()}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={{}}
        isLoadingScores={false}
      />,
    );
    const row = findRenderedRowByContent("WOD NoScorePopover");
    const logScoreButton = within(row).getByLabelText(/log score/i);
    fireEvent.click(logScoreButton);

    // The popover should now be visible. Look for a field or button unique to the popover.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should show validation error when submitting invalid score", () => {
    const mockWodNoScore = {
      ...mockWodWithScore,
      id: "5",
      wodName: "WOD NoScoreValidation",
    };
    render(
      <WodTable
        wods={[mockWodNoScore]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={vi.fn()}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={{}}
        isLoadingScores={false}
      />,
    );
    const row = findRenderedRowByContent("WOD NoScoreValidation");
    const logScoreButton = within(row).getByLabelText(/log score/i);
    fireEvent.click(logScoreButton);

    // The popover should now be visible
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Try submitting with no input (should trigger validation error)
    // Find the submit button inside the dialog (type="submit")
    const dialog = screen.getByRole("dialog");
    const submitButton = within(dialog).getByRole("button", {
      name: /log score|save/i,
    });
    fireEvent.click(submitButton);

    // Look for a validation error message (adjust regex as needed to match actual error text)
    expect(
      screen.getByText(/required|enter|invalid|please/i),
    ).toBeInTheDocument();
  });
});
