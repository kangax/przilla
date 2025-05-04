import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WodListMobile } from "./WodListMobile";
import type { Wod, Score } from "~/types/wodTypes";

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

// Mock LogScoreForm to avoid full form logic in this test
/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
vi.mock("./LogScoreForm", () => ({
  __esModule: true,
  default: ({ wod, initialScore, onScoreLogged, onCancel }) => (
    <div data-testid="log-score-form">
      <div>WOD: {wod.wodName}</div>
      {initialScore ? (
        <div>
          <div>Editing score: {initialScore.id}</div>
        </div>
      ) : (
        <div>Logging new score</div>
      )}
      <button onClick={onScoreLogged}>Submit</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));
/* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

// Mock tRPC API
let mockMutateSuccess = vi.fn();
let mockMutateError = vi.fn();

/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
vi.mock("~/trpc/react", () => ({
  api: {
    useUtils: () => ({
      score: {
        getAllByUser: { invalidate: vi.fn() },
      },
    }),
    score: {
      deleteScore: {
        useMutation: ({ onSuccess, onError }) => ({
          mutate: (params) => {
            if (mockMutateSuccess) {
              mockMutateSuccess(params);
              onSuccess?.();
            } else if (mockMutateError) {
              mockMutateError(params);
              onError?.(new Error("API Error"));
            }
          },
          status: "idle",
        }),
      },
    },
  },
}));
/* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

// Mock scrollIntoView globally for all tests in this file
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
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockShowToast.mockClear();
    mockMutateSuccess = vi.fn();
    mockMutateError = vi.fn();
  });

  it("shows success toast when deleting a score", async () => {
    // Set up the mock to succeed
    mockMutateSuccess = vi.fn();
    mockMutateError = null;

    render(
      <WodListMobile
        wods={[mockWod]}
        scoresByWodId={{ wod1: [mockScore] }}
        searchTerm=""
      />,
    );

    // Expand the card
    fireEvent.click(screen.getByText("Fran"));

    // Find and click the delete button
    const deleteButton = screen.getByLabelText("Delete score");
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

  it("shows error toast when deleting a score fails", async () => {
    // Set up the mock to fail
    mockMutateSuccess = null;
    mockMutateError = vi.fn();

    render(
      <WodListMobile
        wods={[mockWod]}
        scoresByWodId={{ wod1: [mockScore] }}
        searchTerm=""
      />,
    );

    // Expand the card
    fireEvent.click(screen.getByText("Fran"));

    // Find and click the delete button
    const deleteButton = screen.getByLabelText("Delete score");
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
