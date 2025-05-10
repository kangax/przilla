import { describe, it, expect, vi, beforeEach } from "vitest"; // Removed Mock
import {
  render,
  screen,
  within,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { TooltipProvider } from "@radix-ui/react-tooltip";
// import { ToastProvider } from "~/components/ToastProvider"; // Will use mocked version
import "@testing-library/jest-dom";
import { useSession } from "~/lib/auth-client";
import WodTable from "./WodTable";
import type { Score } from "~/types/wodTypes";
import type { RouterInputs } from "~/trpc/react";
import {
  mutationMock as actualMutationMockFactory,
  // Removed SimplifiedMockMutationResult import as it's not used for casting anymore
} from "~/trpc/__mocks__/react";
import type * as TRPCMockModuleType from "~/trpc/__mocks__/react";

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

const ToastProvider = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

// Mock ~/trpc/react with a factory
vi.mock("~/trpc/react", async () => {
  const originalMockModule = await vi.importActual<typeof TRPCMockModuleType>(
    "~/trpc/__mocks__/react",
  );
  return {
    ...originalMockModule,
    api: {
      ...originalMockModule.api,
      score: {
        ...originalMockModule.api.score,
        deleteScore: {
          // The only mutation used directly by WodTable Actions for toasts
          useMutation: vi.fn(),
        },
        // Keep other score methods as they are from the original mock module
        logScore: originalMockModule.api.score.logScore, // WodTable uses LogScorePopover which uses LogScoreForm
        updateScore: originalMockModule.api.score.updateScore,
        importScores: originalMockModule.api.score.importScores,
        getAllByUser: originalMockModule.api.score.getAllByUser,
      },
      wod: originalMockModule.api.wod,
      favorite: originalMockModule.api.favorite,
      useUtils: originalMockModule.api.useUtils,
    },
  };
});

const mockWodWithScore = {
  id: "2",
  createdAt: new Date(),
  updatedAt: new Date(),
  wodUrl: "test.com/wod2",
  wodName: "WOD Bravo",
  description: "Desc Bravo",
  category: "Girl" as const,
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
  isRx: false,
};

const mockScoresByWodId = { "2": [mockScore] };

const findRenderedRowByContent = (content: string) => {
  const cells = screen.getAllByText((_text, node) =>
    node?.textContent?.includes(content),
  );
  const cell = cells.find((c) => c.closest('div[role="row"]'));
  if (!cell) throw new Error(`Row containing "${content}" not found`);
  const row = cell.closest('div[role="row"]');
  if (!row) throw new Error(`Row containing "${content}" not found`);
  return row as HTMLElement;
};

describe("WodTable Actions", () => {
  let queryClient: QueryClient;
  let mockedTrpcApi: typeof TRPCMockModuleType.api;

  beforeEach(async () => {
    queryClient = new QueryClient();
    mockShowToast.mockClear();

    const mockedTrpcModule =
      await vi.importMock<typeof TRPCMockModuleType>("~/trpc/react");
    mockedTrpcApi = mockedTrpcModule.api;

    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: "test-user-id",
          email: "test@example.com",
          name: "Test User",
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: "test-session-id",
          userId: "test-user-id",
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          token: "test-session-token",
        },
      },
      isPending: false,
      error: null,
      refetch: vi.fn(),
    });

    // Set default SUCCESS implementation for deleteScore.useMutation
    // Also for logScore and updateScore as LogScorePopover (used by WodTable) might trigger them via LogScoreForm
    vi.mocked(mockedTrpcApi.score.deleteScore.useMutation).mockImplementation(
      (
        hookOptions?: UseMutationOptions<
          void,
          Error,
          RouterInputs["score"]["deleteScore"]
        >,
      ) => actualMutationMockFactory(true, undefined, hookOptions), // Removed cast
    );
    vi.mocked(mockedTrpcApi.score.logScore.useMutation).mockImplementation(
      (
        hookOptions?: UseMutationOptions<
          Score,
          Error,
          RouterInputs["score"]["logScore"]
        >,
      ) => actualMutationMockFactory(true, undefined, hookOptions), // Removed cast
    );
    vi.mocked(mockedTrpcApi.score.updateScore.useMutation).mockImplementation(
      (
        hookOptions?: UseMutationOptions<
          Score,
          Error,
          RouterInputs["score"]["updateScore"]
        >,
      ) => actualMutationMockFactory(true, undefined, hookOptions), // Removed cast
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
              _isLoadingScores={false}
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
              _isLoadingScores={false}
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
              _isLoadingScores={false}
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
              _isLoadingScores={false}
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

  it("should show validation error when submitting invalid score", async () => {
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
              _isLoadingScores={false}
            />
          </QueryClientProvider>
        </ToastProvider>
      </TooltipProvider>,
    );
    const row = findRenderedRowByContent("WOD NoScoreValidation");
    fireEvent.click(within(row).getByLabelText(/log score/i));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: /log score|save|update/i }),
    ); // Made button name more robust
    // Expect a specific validation error message for time-based WODs when time is empty
    await waitFor(() => {
      expect(
        screen.getByText("Please enter a time (minutes or seconds)."),
      ).toBeInTheDocument();
    });
  });

  it("should show success toast when deleting a score", async () => {
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
              _isLoadingScores={false}
            />
          </QueryClientProvider>
        </ToastProvider>
      </TooltipProvider>,
    );
    const row = findRenderedRowByContent("WOD Bravo");
    fireEvent.click(within(row).getByLabelText(/delete score/i));
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        "success",
        "Score deleted successfully",
      );
    });
  });

  it("should show error toast when deleting a score fails", async () => {
    vi.mocked(mockedTrpcApi.score.deleteScore.useMutation).mockImplementation(
      (
        hookOptions?: UseMutationOptions<
          void,
          Error,
          RouterInputs["score"]["deleteScore"]
        >,
      ) => actualMutationMockFactory(false, undefined, hookOptions), // Removed cast
    );
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
              _isLoadingScores={false}
            />
          </QueryClientProvider>
        </ToastProvider>
      </TooltipProvider>,
    );
    const row = findRenderedRowByContent("WOD Bravo");
    fireEvent.click(within(row).getByLabelText(/delete score/i));
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        "error",
        "Failed to delete score: Mock API Error",
      );
    });
  });
});
