import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LogScoreForm } from "./LogScoreForm";
import type { Wod, Score } from "~/types/wodTypes";

// Create a mock for showToast function
const mockShowToast = vi.fn();

// Import ToastProvider for mocking

// Mock the useToast hook
vi.mock("~/components/ToastProvider", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

// Define ToastProvider for use in tests
const ToastProvider = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

// Mock the tRPC API client
let mockLogScoreSuccess = vi.fn();
let mockLogScoreError = vi.fn();
let mockUpdateScoreSuccess = vi.fn();
let mockUpdateScoreError = vi.fn();

/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
vi.mock("~/trpc/react", () => ({
  api: {
    score: {
      logScore: {
        useMutation: ({ onSuccess, onError }) => ({
          mutateAsync: async (params) => {
            if (mockLogScoreSuccess) {
              await mockLogScoreSuccess(params);
              onSuccess?.({});
              return {};
            } else if (mockLogScoreError) {
              await mockLogScoreError(params);
              onError?.(new Error("API Error"));
              throw new Error("API Error");
            }
          },
          status: "idle",
        }),
      },
      updateScore: {
        useMutation: ({ onSuccess, onError }) => ({
          mutateAsync: async (params) => {
            if (mockUpdateScoreSuccess) {
              await mockUpdateScoreSuccess(params);
              onSuccess?.({});
              return {};
            } else if (mockUpdateScoreError) {
              await mockUpdateScoreError(params);
              onError?.(new Error("API Error"));
              throw new Error("API Error");
            }
          },
          status: "idle",
        }),
      },
    },
    /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
    useUtils: () => ({
      score: {
        getAllByUser: {
          invalidate: vi.fn(),
        },
      },
    }),
  },
}));

// Create a mock wod for testing
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
  category: "Benchmark", // Use a valid WodCategory
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Create a mock score for testing
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

  beforeEach(() => {
    queryClient = new QueryClient();

    // Reset mocks
    vi.clearAllMocks();
    mockShowToast.mockClear();
    mockLogScoreSuccess = vi.fn();
    mockLogScoreError = vi.fn();
    mockUpdateScoreSuccess = vi.fn();
    mockUpdateScoreError = vi.fn();
  });

  it("shows success toast when adding a score", async () => {
    // Set up the mock to succeed
    mockLogScoreSuccess = vi.fn();
    mockLogScoreError = null;

    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <LogScoreForm wod={mockWod} onCancel={vi.fn()} />
        </ToastProvider>
      </QueryClientProvider>,
    );

    // Fill form with valid data
    fireEvent.change(screen.getByLabelText("Minutes"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("Seconds"), {
      target: { value: "30" },
    });

    // Submit form
    fireEvent.click(screen.getByText("Log Score"));

    // Wait for the mutation to complete
    /* eslint-disable @typescript-eslint/no-unsafe-call */
    await waitFor(() => {
      // Verify showToast was called with success message
      expect(mockShowToast).toHaveBeenCalledWith(
        "success",
        'Score added. Find it in your "Done" tab.',
      );
    });
    /* eslint-enable @typescript-eslint/no-unsafe-call */
  });

  it("shows error toast when adding a score fails", async () => {
    // Set up the mock to fail
    mockLogScoreSuccess = null;
    mockLogScoreError = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <LogScoreForm wod={mockWod} onCancel={vi.fn()} />
        </ToastProvider>
      </QueryClientProvider>,
    );

    // Fill form with valid data
    fireEvent.change(screen.getByLabelText("Minutes"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("Seconds"), {
      target: { value: "30" },
    });

    // Submit form
    fireEvent.click(screen.getByText("Log Score"));

    // Wait for the mutation to complete
    /* eslint-disable @typescript-eslint/no-unsafe-call */
    await waitFor(() => {
      // Verify showToast was called with error message
      expect(mockShowToast).toHaveBeenCalledWith(
        "error",
        "Failed to add score",
      );
    });
    /* eslint-enable @typescript-eslint/no-unsafe-call */
  });

  it("shows success toast when updating a score", async () => {
    // Set up the mock to succeed
    mockUpdateScoreSuccess = vi.fn();
    mockUpdateScoreError = null;

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

    // The form should be pre-filled with the initial score data
    // Just submit the form
    fireEvent.click(screen.getByText("Update Score"));

    // Wait for the mutation to complete
    /* eslint-disable @typescript-eslint/no-unsafe-call */
    await waitFor(() => {
      // Verify showToast was called with success message
      expect(mockShowToast).toHaveBeenCalledWith("success", "Score updated");
    });
    /* eslint-enable @typescript-eslint/no-unsafe-call */
  });

  it("shows error toast when updating a score fails", async () => {
    // Set up the mock to fail
    mockUpdateScoreSuccess = null;
    mockUpdateScoreError = vi.fn();

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

    // The form should be pre-filled with the initial score data
    // Just submit the form
    fireEvent.click(screen.getByText("Update Score"));

    // Wait for the mutation to complete
    /* eslint-disable @typescript-eslint/no-unsafe-call */
    await waitFor(() => {
      // Verify showToast was called with error message
      expect(mockShowToast).toHaveBeenCalledWith(
        "error",
        "Failed to update score",
      );
    });
    /* eslint-enable @typescript-eslint/no-unsafe-call */
  });
});
