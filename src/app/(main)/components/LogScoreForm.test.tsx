import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest"; // Removed Mock
import {
  QueryClient,
  QueryClientProvider,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { useSession } from "~/lib/auth-client";
import { LogScoreForm } from "./LogScoreForm";
import type { Wod, Score } from "~/types/wodTypes";
import type { RouterInputs } from "~/trpc/react"; // This will now be AppRouterInputs from the mock
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

// Mock ~/trpc/react with a factory to control its spies
vi.mock("~/trpc/react", async () => {
  const originalMockModule = await vi.importActual<typeof TRPCMockModuleType>(
    "~/trpc/__mocks__/react",
  );
  return {
    ...originalMockModule, // Spread other exports like TRPCReactProvider, RouterInputs etc.
    api: {
      // Deep clone or reconstruct parts of api to ensure spies are fresh if needed
      ...originalMockModule.api,
      score: {
        ...originalMockModule.api.score,
        // Ensure these are fresh vi.fn() instances for each test suite run,
        // or ensure the ones from originalMockModule are correctly managed.
        // For simplicity, let's use the ones from originalMockModule and rely on beforeEach to set impl.
        logScore: {
          useMutation: vi.fn(), // Will be implemented in beforeEach/test
        },
        updateScore: {
          useMutation: vi.fn(), // Will be implemented in beforeEach/test
        },
        // Keep other score methods if they exist and are used by LogScoreForm
        deleteScore: originalMockModule.api.score.deleteScore,
        importScores: originalMockModule.api.score.importScores,
        getAllByUser: originalMockModule.api.score.getAllByUser,
      },
      wod: originalMockModule.api.wod,
      favorite: originalMockModule.api.favorite,
      useUtils: originalMockModule.api.useUtils,
    },
  };
});

const mockWod: Wod = {
  id: "wod1",
  wodName: "Test WOD",
  description: "Test description",
  tags: ["For Time"],
  movements: [],
  timecap: null,
  benchmarks: {
    type: "time",
    levels: {
      elite: { min: 0, max: 300 },
      advanced: { min: 301, max: 400 },
      intermediate: { min: 401, max: 600 },
      beginner: { min: 601, max: null },
    },
  },
  difficulty: "Medium",
  difficultyExplanation: "Medium difficulty",
  countLikes: 0,
  wodUrl: null,
  category: "Benchmark",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockScore: Score = {
  id: "score1",
  userId: "user1",
  wodId: "wod1",
  scoreDate: new Date(),
  isRx: true,
  time_seconds: 360,
  reps: null,
  load: null,
  rounds_completed: null,
  partial_reps: null,
  notes: "Test notes",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("LogScoreForm Toast Notifications", () => {
  let queryClient: QueryClient;
  let mockedTrpcApi: typeof TRPCMockModuleType.api; // To hold the api from the vi.mock factory

  beforeEach(async () => {
    queryClient = new QueryClient();
    // vi.clearAllMocks(); // May not be needed if vi.mock factory re-creates spies, or handled by Vitest
    mockShowToast.mockClear();

    // Import the mocked trpc/react to get access to its 'api' object with our controlled spies
    // This ensures we are configuring the same spy instances the component will use.
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

    // Set default SUCCESS implementations using the 'actualMutationMockFactory'
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

  it("shows success toast when adding a score", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <LogScoreForm wod={mockWod} onCancel={vi.fn()} />
        </ToastProvider>
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText("Minutes"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("Seconds"), {
      target: { value: "30" },
    });
    fireEvent.click(screen.getByText("Log Score"));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        "success",
        'Score added. Find it in your "Done" tab.',
      );
    });
  });

  it("shows error toast when adding a score fails", async () => {
    // Override for failure, using the 'mockedTrpcApi' from beforeEach
    vi.mocked(mockedTrpcApi.score.logScore.useMutation).mockImplementation(
      (
        hookOptions?: UseMutationOptions<
          Score,
          Error,
          RouterInputs["score"]["logScore"]
        >,
      ) => actualMutationMockFactory(false, undefined, hookOptions), // Removed cast
    );

    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <LogScoreForm wod={mockWod} onCancel={vi.fn()} />
        </ToastProvider>
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText("Minutes"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("Seconds"), {
      target: { value: "30" },
    });
    fireEvent.click(screen.getByText("Log Score"));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        "error",
        "Failed to add score",
      );
    });
  });

  it("shows success toast when updating a score", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <LogScoreForm
            wod={mockWod}
            initialScore={mockScore}
            onCancel={vi.fn()}
          />
        </ToastProvider>
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByText("Update Score"));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("success", "Score updated");
    });
  });

  it("shows error toast when updating a score fails", async () => {
    // Override for failure, using the 'mockedTrpcApi' from beforeEach
    vi.mocked(mockedTrpcApi.score.updateScore.useMutation).mockImplementation(
      (
        hookOptions?: UseMutationOptions<
          Score,
          Error,
          RouterInputs["score"]["updateScore"]
        >,
      ) => actualMutationMockFactory(false, undefined, hookOptions), // Removed cast
    );

    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <LogScoreForm
            wod={mockWod}
            initialScore={mockScore}
            onCancel={vi.fn()}
          />
        </ToastProvider>
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByText("Update Score"));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        "error",
        "Failed to update score",
      );
    });
  });
});
