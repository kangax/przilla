import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WodListMobile } from "./WodListMobile";
import type { Wod, Score } from "~/types/wodTypes";

// Use Vitest mocking API
import { vi } from "vitest";

// Mock LogScoreForm to avoid full form logic in this test
// eslint-disable-next-line @typescript-eslint/no-explicit-any
vi.mock("./LogScoreForm", () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  default: ({ wod, initialScore, onScoreLogged, onCancel }: any) => (
    <div data-testid="log-score-form">
      {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
      {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
      <div>WOD: {wod.wodName}</div>
      {initialScore ? (
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        <div>
          {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
          <div>Editing score: {initialScore.id}</div>
        </div>
      ) : (
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        <div>Logging new score</div>
      )}
      {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
      <button onClick={onScoreLogged}>Submit</button>
      {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

// Mock tRPC deleteScore mutation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
vi.mock("../../../trpc/react", () => {
  return {
    api: {
      useUtils: () => ({
        score: {
          getAllByUser: { invalidate: vi.fn() },
        },
      }),
      score: {
        deleteScore: {
          useMutation: () => ({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
            mutate: (opts: any) => {
              // Simulate async onSuccess
              setTimeout(() => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                if (opts && opts.onSuccess) opts.onSuccess();
              }, 10);
            },
            status: "idle",
          }),
        },
      },
    },
  };
});

const now = new Date();

const mockWod: Wod = {
  id: "wod1",
  wodName: "Fran",
  description: "21-15-9 Thrusters and Pull-ups",
  tags: ["For Time", "Benchmark"],
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

describe("WodListMobile", () => {
  it("renders WOD and allows logging a new score", () => {
    render(<WodListMobile wods={[mockWod]} scoresByWodId={{}} searchTerm="" />);
    expect(screen.getByText("Fran")).toBeInTheDocument();

    // Expand the card
    fireEvent.click(screen.getByText("Fran"));

    expect(screen.getByText("Log score")).toBeInTheDocument();

    // Open log score drawer
    fireEvent.click(screen.getByText("Log score"));
    expect(screen.getByTestId("log-score-form")).toBeInTheDocument();
    expect(screen.getByText("Logging new score")).toBeInTheDocument();

    // Submit closes drawer
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.queryByTestId("log-score-form")).not.toBeInTheDocument();
  });

  it("renders existing score and allows editing", () => {
    render(
      <WodListMobile
        wods={[mockWod]}
        scoresByWodId={{ wod1: [mockScore] }}
        searchTerm=""
      />,
    );
    expect(screen.getByText("Fran")).toBeInTheDocument();

    // Expand the card
    fireEvent.click(screen.getByText("Fran"));

    expect(screen.getByText("Your Scores:")).toBeInTheDocument();
    // The UI renders "3:00 Rx" (no leading zero)
    expect(screen.getByText("3:00 Rx")).toBeInTheDocument();

    // Open edit drawer
    fireEvent.click(screen.getByLabelText("Edit score"));
    expect(screen.getByTestId("log-score-form")).toBeInTheDocument();
    expect(screen.getByText("Editing score: score1")).toBeInTheDocument();

    // Submit closes drawer
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.queryByTestId("log-score-form")).not.toBeInTheDocument();
  });

  it("shows and cancels delete confirmation dialog", async () => {
    render(
      <WodListMobile
        wods={[mockWod]}
        scoresByWodId={{ wod1: [mockScore] }}
        searchTerm=""
      />,
    );
    // Expand the card
    fireEvent.click(screen.getByText("Fran"));

    // Open delete dialog
    fireEvent.click(screen.getByLabelText("Delete score"));
    expect(screen.getByText("Delete Score")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Are you sure you want to delete this score? This action cannot be undone.",
      ),
    ).toBeInTheDocument();

    // Cancel closes dialog
    fireEvent.click(screen.getByText("Cancel"));
    await waitFor(
      () => expect(screen.queryByText("Delete Score")).not.toBeInTheDocument(),
      { timeout: 1000 },
    );
  });

  it("confirms delete and closes dialog", async () => {
    render(
      <WodListMobile
        wods={[mockWod]}
        scoresByWodId={{ wod1: [mockScore] }}
        searchTerm=""
      />,
    );
    // Expand the card
    fireEvent.click(screen.getByText("Fran"));

    // Open delete dialog
    fireEvent.click(screen.getByLabelText("Delete score"));
    expect(screen.getByText("Delete Score")).toBeInTheDocument();

    // Confirm delete
    fireEvent.click(screen.getByText("Delete"));
    // Wait for the dialog to be removed by role (robust to animation)
    await waitFor(
      () => {
        const dialog = screen.queryByRole("dialog");
        if (dialog) {
          // If dialog is present, check if it's hidden (Radix may keep it in DOM for animation)
          expect(dialog).not.toBeVisible();
        } else {
          // If dialog is removed, test passes
          expect(dialog).toBeNull();
        }
      },
      { timeout: 1000 },
    );
  });

  it("closes drawer on cancel", () => {
    render(
      <WodListMobile
        wods={[mockWod]}
        scoresByWodId={{ wod1: [mockScore] }}
        searchTerm=""
      />,
    );
    // Expand the card
    fireEvent.click(screen.getByText("Fran"));

    // Open edit drawer
    fireEvent.click(screen.getByLabelText("Edit score"));
    expect(screen.getByTestId("log-score-form")).toBeInTheDocument();

    // Cancel closes drawer
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByTestId("log-score-form")).not.toBeInTheDocument();
  });
});
