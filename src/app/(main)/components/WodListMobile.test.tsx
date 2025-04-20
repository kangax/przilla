import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { waitForElementToBeRemoved } from "@testing-library/react";
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
              // Call onSuccess synchronously for test reliability
              if (opts && opts.onSuccess) opts.onSuccess();
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

  it("updates UI after logging a new score", async () => {
    // Start with no scores
    const { rerender } = render(
      <WodListMobile wods={[mockWod]} scoresByWodId={{}} searchTerm="" />,
    );
    fireEvent.click(screen.getByText("Fran"));
    fireEvent.click(screen.getByText("Log score"));
    // Simulate logging a new score (onScoreLogged)
    fireEvent.click(screen.getByText("Submit"));
    // Rerender with new score
    rerender(
      <WodListMobile
        wods={[mockWod]}
        scoresByWodId={{ wod1: [mockScore] }}
        searchTerm=""
      />,
    );
    // Wait for the new score to appear
    expect(await screen.findByText("3:00 Rx")).toBeInTheDocument();
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

  it("updates UI after editing a score", async () => {
    // Start with an existing score
    const updatedScore = { ...mockScore, time_seconds: 200, isRx: false };
    const { rerender } = render(
      <WodListMobile
        wods={[mockWod]}
        scoresByWodId={{ wod1: [mockScore] }}
        searchTerm=""
      />,
    );
    fireEvent.click(screen.getByText("Fran"));
    fireEvent.click(screen.getByLabelText("Edit score"));
    // Simulate editing the score (onScoreLogged)
    fireEvent.click(screen.getByText("Submit"));
    // Rerender with updated score
    rerender(
      <WodListMobile
        wods={[mockWod]}
        scoresByWodId={{ wod1: [updatedScore] }}
        searchTerm=""
      />,
    );
    // Wait for the updated score to appear (should be "3:20" and not Rx)
    expect(
      await screen.findByText((content) => content.includes("3:20"), {
        exact: false,
      }),
    ).toBeInTheDocument();
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
    const dialog = screen.getByRole("dialog");
    expect(screen.getByText("Delete Score")).toBeInTheDocument();

    // Confirm delete
    fireEvent.click(screen.getByText("Delete"));
    // Wait for the dialog to be removed from the DOM (Radix may remove it)
    await waitFor(
      () => {
        expect(screen.queryByRole("dialog")).toBeNull();
      },
      { timeout: 2000 },
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
