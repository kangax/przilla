import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  within,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { ToastProvider } from "~/components/ToastProvider";
import "@testing-library/jest-dom";
import WodTable from "./WodTable";

// Create a mock for showToast function
const mockShowToast = vi.fn();

// Mock the useToast hook
vi.mock("~/components/ToastProvider", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

// Mock tRPC API
let mockDeleteScoreSuccess = vi.fn();
let mockDeleteScoreError = vi.fn();

// Use shared mock for ~/trpc/react
import * as trpcMock from "~/trpc/__mocks__/react";
import type { Mock } from "vitest";
vi.mock("~/trpc/react", () => trpcMock);

// Minimal mock data for actions
const mockWodWithScore = {
  id: "2",
  createdAt: new Date(),
  updatedAt: new Date(),
  wodUrl: "test.com/wod2",
  wodName: "WOD Bravo",
  description: "Desc Bravo",
  category: "Girl" as const, // Explicitly use a valid WodCategory literal
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
  const queryClient = new QueryClient();

  // Patch the shared mock's deleteScore.useMutation to support custom success/error logic
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockShowToast.mockClear();
    mockDeleteScoreSuccess = vi.fn();
    mockDeleteScoreError = vi.fn();

    // Patch the shared mock's deleteScore.useMutation
    const trpc = trpcMock;
    (trpc.api.score.deleteScore.useMutation as Mock).mockImplementation(
      (
        options: {
          onSuccess?: () => void;
          onError?: (error: Error) => void;
        } = {},
      ) => ({
        mutate: (params: unknown) => {
          if (mockDeleteScoreSuccess) {
            mockDeleteScoreSuccess(params);
            options.onSuccess?.();
          } else if (mockDeleteScoreError) {
            mockDeleteScoreError(params);
            options.onError?.(new Error("API Error"));
          }
        },
        isLoading: false,
        status: "idle",
        reset: vi.fn(),
      }),
    );
  });

  it("should display the 'Scaled' badge for non-Rx scores", () => {
    render(
      <TooltipProvider>
        <ToastProvider>
          <QueryClientProvider client={queryClient}>
            <WodTable
              wods={[mockWodWithScore]}
              sortBy="wodName"
              sortDirection="asc"
              handleSort={vi.fn()}
              tableHeight={500}
              searchTerm=""
              scoresByWodId={mockScoresByWodId}
              _isLoadingScores={false} // Renamed prop
            />
          </QueryClientProvider>
        </ToastProvider>
      </TooltipProvider>,
    );
    const row = findRenderedRowByContent("WOD Bravo");
    expect(within(row).getByText(/Scaled/i)).toBeInTheDocument();
  });

  it("should show edit and delete icons for each score", () => {
    render(
      <TooltipProvider>
        <ToastProvider>
          <QueryClientProvider client={queryClient}>
            <WodTable
              wods={[mockWodWithScore]}
              sortBy="wodName"
              sortDirection="asc"
              handleSort={vi.fn()}
              tableHeight={500}
              searchTerm=""
              scoresByWodId={mockScoresByWodId}
              _isLoadingScores={false} // Renamed prop
            />
          </QueryClientProvider>
        </ToastProvider>
      </TooltipProvider>,
    );
    const row = findRenderedRowByContent("WOD Bravo");
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
      <TooltipProvider>
        <ToastProvider>
          <QueryClientProvider client={queryClient}>
            <WodTable
              wods={[mockWodNoScore]}
              sortBy="wodName"
              sortDirection="asc"
              handleSort={vi.fn()}
              tableHeight={500}
              searchTerm=""
              scoresByWodId={{}}
              _isLoadingScores={false} // Renamed prop
            />
          </QueryClientProvider>
        </ToastProvider>
      </TooltipProvider>,
    );
    const row = findRenderedRowByContent("WOD NoScore");
    expect(within(row).getByLabelText(/log score/i)).toBeInTheDocument();
  });

  it("should open the log score popover when the log score button is clicked", () => {
    const mockWodNoScore = {
      ...mockWodWithScore,
      id: "4",
      wodName: "WOD NoScorePopover",
    };
    render(
      <TooltipProvider>
        <ToastProvider>
          <QueryClientProvider client={queryClient}>
            <WodTable
              wods={[mockWodNoScore]}
              sortBy="wodName"
              sortDirection="asc"
              handleSort={vi.fn()}
              tableHeight={500}
              searchTerm=""
              scoresByWodId={{}}
              _isLoadingScores={false} // Renamed prop
            />
          </QueryClientProvider>
        </ToastProvider>
      </TooltipProvider>,
    );
    const row = findRenderedRowByContent("WOD NoScorePopover");
    const logScoreButton = within(row).getByLabelText(/log score/i);
    fireEvent.click(logScoreButton);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should show validation error when submitting invalid score", () => {
    const mockWodNoScore = {
      ...mockWodWithScore,
      id: "5",
      wodName: "WOD NoScoreValidation",
    };
    render(
      <TooltipProvider>
        <ToastProvider>
          <QueryClientProvider client={queryClient}>
            <WodTable
              wods={[mockWodNoScore]}
              sortBy="wodName"
              sortDirection="asc"
              handleSort={vi.fn()}
              tableHeight={500}
              searchTerm=""
              scoresByWodId={{}}
              _isLoadingScores={false} // Renamed prop
            />
          </QueryClientProvider>
        </ToastProvider>
      </TooltipProvider>,
    );
    const row = findRenderedRowByContent("WOD NoScoreValidation");
    const logScoreButton = within(row).getByLabelText(/log score/i);
    fireEvent.click(logScoreButton);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const dialog = screen.getByRole("dialog");
    const submitButton = within(dialog).getByRole("button", {
      name: /log score|save/i,
    });
    fireEvent.click(submitButton);

    expect(
      screen.getByText(/required|enter|invalid|please/i),
    ).toBeInTheDocument();
  });

  it("should show success toast when deleting a score", async () => {
    // Set up the mock to succeed
    mockDeleteScoreSuccess = vi.fn();
    mockDeleteScoreError = null;

    render(
      <TooltipProvider>
        <ToastProvider>
          <QueryClientProvider client={queryClient}>
            <WodTable
              wods={[mockWodWithScore]}
              sortBy="wodName"
              sortDirection="asc"
              handleSort={vi.fn()}
              tableHeight={500}
              searchTerm=""
              scoresByWodId={mockScoresByWodId}
              _isLoadingScores={false} // Renamed prop
            />
          </QueryClientProvider>
        </ToastProvider>
      </TooltipProvider>,
    );

    // Find the row and click the delete button
    const row = findRenderedRowByContent("WOD Bravo");
    const deleteButton = within(row).getByLabelText(/delete score/i);
    fireEvent.click(deleteButton);

    // Confirm deletion in the dialog
    const confirmButton = screen.getByRole("button", { name: /delete/i });
    fireEvent.click(confirmButton);

    // Wait for the mutation to complete
    await waitFor(() => {
      // Verify showToast was called with success message
      expect(mockShowToast).toHaveBeenCalledWith("success", "Score deleted");
    });
  });

  it("should show error toast when deleting a score fails", async () => {
    // Set up the mock to fail
    mockDeleteScoreSuccess = null;
    mockDeleteScoreError = vi.fn();

    render(
      <TooltipProvider>
        <ToastProvider>
          <QueryClientProvider client={queryClient}>
            <WodTable
              wods={[mockWodWithScore]}
              sortBy="wodName"
              sortDirection="asc"
              handleSort={vi.fn()}
              tableHeight={500}
              searchTerm=""
              scoresByWodId={mockScoresByWodId}
              _isLoadingScores={false} // Renamed prop
            />
          </QueryClientProvider>
        </ToastProvider>
      </TooltipProvider>,
    );

    // Find the row and click the delete button
    const row = findRenderedRowByContent("WOD Bravo");
    const deleteButton = within(row).getByLabelText(/delete score/i);
    fireEvent.click(deleteButton);

    // Confirm deletion in the dialog
    const confirmButton = screen.getByRole("button", { name: /delete/i });
    fireEvent.click(confirmButton);

    // Wait for the mutation to complete
    await waitFor(() => {
      // Verify showToast was called with error message
      expect(mockShowToast).toHaveBeenCalledWith(
        "error",
        "Failed to delete score",
      );
    });
  });
});
