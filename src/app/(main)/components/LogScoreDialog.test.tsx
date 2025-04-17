import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Theme } from "@radix-ui/themes";
import { LogScoreDialog } from "./LogScoreDialog";
import type { Wod, Score } from "../../../types/wodTypes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the tRPC API client
vi.mock("../../../trpc/react", () => ({
  api: {
    score: {
      logScore: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn().mockResolvedValue({}),
        })),
      },
      updateScore: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn().mockResolvedValue({}),
        })),
      },
    },
  },
}));

// Mock portal container
beforeEach(() => {
  const portalContainer = document.createElement("div");
  portalContainer.id = "page-layout-container";
  document.body.appendChild(portalContainer);
});

const queryClient = new QueryClient();

const mockWodTimecapped: Wod = {
  id: "wod1",
  wodName: "Timecapped WOD",
  description: "Do stuff",
  tags: ["For Time"],
  timecap: 600, // 10 minutes
  benchmarks: null,
  difficulty: null,
  difficultyExplanation: null,
  countLikes: 0,
  wodUrl: null,
  category: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockWodNonTimecapped: Wod = {
  id: "wod2",
  wodName: "AMRAP WOD",
  description: "Do more stuff",
  tags: ["AMRAP"],
  timecap: null,
  benchmarks: null,
  difficulty: null,
  difficultyExplanation: null,
  countLikes: 0,
  wodUrl: null,
  category: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockScoreTime: Score = {
  id: "score1",
  userId: "user1",
  wodId: "wod1",
  scoreDate: new Date(),
  isRx: true,
  time_seconds: 540, // 9 minutes
  reps: null,
  load: null,
  rounds_completed: null,
  partial_reps: null,
  notes: "Good time",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockScoreReps: Score = {
  id: "score2",
  userId: "user1",
  wodId: "wod1",
  scoreDate: new Date(),
  isRx: false,
  time_seconds: null, // Hit timecap
  reps: 150,
  load: null,
  rounds_completed: 5,
  partial_reps: 10,
  notes: "Hit the cap",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockScoreAmrap: Score = {
  id: "score3",
  userId: "user1",
  wodId: "wod2",
  scoreDate: new Date(),
  isRx: true,
  time_seconds: null,
  reps: 200,
  load: null,
  rounds_completed: 10,
  partial_reps: 5,
  notes: "AMRAP score",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const renderComponent = (
  wod: Wod,
  initialScore: Score | null = null,
  isOpen = true,
) => {
  const onOpenChange = vi.fn();
  const onScoreLogged = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <Theme>
        <LogScoreDialog
          wod={wod}
          initialScore={initialScore}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          onScoreLogged={onScoreLogged}
        />
      </Theme>
    </QueryClientProvider>,
  );
  return { onOpenChange, onScoreLogged };
};

describe("LogScoreDialog", () => {
  it("defaults to 'Yes' for timecap radio when editing a time-based score (timecapped WOD)", () => {
    renderComponent(mockWodTimecapped, mockScoreTime);

    const radioYes = screen.getByLabelText(
      "Yes, finished within timecap (enter your time)",
    );
    expect(radioYes).toBeChecked();

    // Check visibility of inputs
    expect(screen.getByLabelText("Minutes")).toBeVisible();
    expect(screen.getByLabelText("Seconds")).toBeVisible();
    expect(screen.queryByLabelText("Reps")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Rounds")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Partial Reps")).not.toBeInTheDocument();
  });

  it("defaults to 'No' for timecap radio when editing a reps/rounds-based score (timecapped WOD)", () => {
    renderComponent(mockWodTimecapped, mockScoreReps);

    const radioNo = screen.getByLabelText(
      "No, hit the timecap (enter reps or rounds+reps)",
    );
    expect(radioNo).toBeChecked();

    // Check visibility of inputs
    expect(screen.queryByLabelText("Minutes")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Seconds")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Reps")).toBeVisible();
    expect(screen.getByLabelText("Rounds")).toBeVisible();
    expect(screen.getByLabelText("Partial Reps")).toBeVisible();
  });

  it("does not show the timecap radio group when editing a score for a non-timecapped WOD", () => {
    renderComponent(mockWodNonTimecapped, mockScoreAmrap);

    // Check radio group is not rendered
    expect(
      screen.queryByRole("radiogroup", {
        name: /Finished within .* timecap\?/i,
      }),
    ).not.toBeInTheDocument();

    // Check standard AMRAP inputs are visible
    expect(screen.queryByLabelText("Minutes")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Seconds")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Reps")).toBeVisible();
    expect(screen.getByLabelText("Rounds")).toBeVisible();
    expect(screen.getByLabelText("Partial Reps")).toBeVisible();
  });

  // Add more tests for logging new scores, validation, submission etc. if needed
});
