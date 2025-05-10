import React from "react";
import { render, screen, fireEvent, waitFor } from "~/test-utils";
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest"; // Removed Mock
import { useSession } from "~/lib/auth-client";
import { WodListMobile } from "./WodListMobile";
import type { Wod, Score } from "~/types/wodTypes";
import type { UseMutationOptions } from "@tanstack/react-query";
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

// Mock LogScoreForm
interface MockLogScoreFormProps {
  wod: Wod;
  initialScore?: Score | null;
  onScoreLogged?: () => void;
  onCancel: () => void;
}
vi.mock("./LogScoreForm", () => ({
  __esModule: true,
  default: ({
    wod,
    initialScore,
    onScoreLogged,
    onCancel,
  }: MockLogScoreFormProps) => (
    <div data-testid="log-score-form">
      <div>WOD: {wod.wodName}</div>
      {initialScore ? (
        <div>Editing score: {initialScore.id}</div>
      ) : (
        <div>Logging new score</div>
      )}
      <button onClick={onScoreLogged}>Submit</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

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
          // The only mutation used directly by WodListMobile for toasts
          useMutation: vi.fn(),
        },
        // Keep other score methods as they are from the original mock module
        logScore: originalMockModule.api.score.logScore,
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

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

const now = new Date();
const mockWod: Wod = {
  id: "wod1",
  wodName: "Fran",
  description: "21-15-9 Thrusters and Pull-ups",
  tags: ["For Time", "Benchmark"],
  category: "Benchmark",
  difficultyExplanation: "Classic benchmark WOD",
  movements: ["Thruster", "Pull-up"],
  timecap: null,
  difficulty: "Hard",
  countLikes: 10,
  wodUrl: "https://wodwell.com/wod/fran/",
  benchmarks: {
    type: "time",
    levels: {
      elite: { min: null, max: 120 },
      advanced: { min: 121, max: 180 },
      intermediate: { min: 181, max: 240 },
      beginner: { min: 241, max: null },
    },
  },
  createdAt: now,
  updatedAt: now,
};
const mockScore: Score = {
  id: "score1",
  wodId: "wod1",
  userId: "user1",
  scoreDate: new Date("2024-04-19"),
  isRx: true,
  notes: "Felt great",
  time_seconds: 180,
  reps: null,
  load: null,
  rounds_completed: null,
  partial_reps: null,
  createdAt: now,
  updatedAt: now,
};

describe("WodListMobile Toast Notifications", () => {
  let mockedTrpcApi: typeof TRPCMockModuleType.api;

  beforeEach(async () => {
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
    vi.mocked(mockedTrpcApi.score.deleteScore.useMutation).mockImplementation(
      (
        hookOptions?: UseMutationOptions<
          void,
          Error,
          RouterInputs["score"]["deleteScore"]
        >,
      ) => actualMutationMockFactory(true, undefined, hookOptions), // Removed cast
    );
  });

  // afterEach(() => {
  // If vi.restoreAllMocks() is used globally, this might not be needed.
  // Otherwise, restore individual spies if they were created with vi.spyOn and assigned to module-level vars.
  // Since we are using vi.mock factory, spies are generally reset/recreated per test file run.
  // });

  it("shows success toast when deleting a score", async () => {
    render(
      <WodListMobile
        wods={[mockWod]}
        scoresByWodId={{ wod1: [mockScore] }}
        searchTerm=""
      />,
    );
    fireEvent.click(screen.getByText("Fran"));
    fireEvent.click(
      screen.getByLabelText(
        `Delete score ${mockScore.id} for ${mockWod.wodName}`,
      ),
    );
    fireEvent.click(screen.getByLabelText("Confirm delete score"));
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("success", "Score deleted");
    });
  });

  it("shows error toast when deleting a score fails", async () => {
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
      <WodListMobile
        wods={[mockWod]}
        scoresByWodId={{ wod1: [mockScore] }}
        searchTerm=""
      />,
    );
    fireEvent.click(screen.getByText("Fran"));
    fireEvent.click(
      screen.getByLabelText(
        `Delete score ${mockScore.id} for ${mockWod.wodName}`,
      ),
    );
    fireEvent.click(screen.getByLabelText("Confirm delete score"));
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        "error",
        "Failed to delete score: Mock API Error",
      );
    });
  });
});
