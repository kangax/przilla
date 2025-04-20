import React from "react";
import { render, screen } from "@testing-library/react";
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

// --- Mock WODs for each benchmarks.type ---

const mockWodTime: Wod = {
  id: "wod1",
  wodName: "Time WOD",
  description: "For time",
  tags: [],
  timecap: 600, // 10 minutes
  benchmarks: {
    type: "time",
    levels: {
      elite: { min: 0, max: 300 },
      advanced: { min: 301, max: 400 },
      intermediate: { min: 401, max: 600 },
      beginner: { min: 601, max: null },
    },
  },
  difficulty: null,
  difficultyExplanation: null,
  countLikes: 0,
  wodUrl: null,
  category: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockWodReps: Wod = {
  id: "wod2",
  wodName: "Reps WOD",
  description: "Max reps",
  tags: [],
  timecap: null,
  benchmarks: {
    type: "reps",
    levels: {
      elite: { min: 200, max: null },
      advanced: { min: 150, max: 199 },
      intermediate: { min: 100, max: 149 },
      beginner: { min: 0, max: 99 },
    },
  },
  difficulty: null,
  difficultyExplanation: null,
  countLikes: 0,
  wodUrl: null,
  category: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockWodLoad: Wod = {
  id: "wod3",
  wodName: "Load WOD",
  description: "Max load",
  tags: [],
  timecap: null,
  benchmarks: {
    type: "load",
    levels: {
      elite: { min: 400, max: null },
      advanced: { min: 300, max: 399 },
      intermediate: { min: 200, max: 299 },
      beginner: { min: 0, max: 199 },
    },
  },
  difficulty: null,
  difficultyExplanation: null,
  countLikes: 0,
  wodUrl: null,
  category: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockWodRounds: Wod = {
  id: "wod4",
  wodName: "Rounds WOD",
  description: "Max rounds",
  tags: [],
  timecap: null,
  benchmarks: {
    type: "rounds",
    levels: {
      elite: { min: 10, max: null },
      advanced: { min: 7, max: 9 },
      intermediate: { min: 4, max: 6 },
      beginner: { min: 0, max: 3 },
    },
  },
  difficulty: null,
  difficultyExplanation: null,
  countLikes: 0,
  wodUrl: null,
  category: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// --- Mock Scores ---

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
  wodId: "wod2",
  scoreDate: new Date(),
  isRx: false,
  time_seconds: null,
  reps: 150,
  load: null,
  rounds_completed: null,
  partial_reps: null,
  notes: "Reps score",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockScoreLoad: Score = {
  id: "score3",
  userId: "user1",
  wodId: "wod3",
  scoreDate: new Date(),
  isRx: true,
  time_seconds: null,
  reps: null,
  load: 350,
  rounds_completed: null,
  partial_reps: null,
  notes: "Load score",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockScoreRounds: Score = {
  id: "score4",
  userId: "user1",
  wodId: "wod4",
  scoreDate: new Date(),
  isRx: false,
  time_seconds: null,
  reps: null,
  load: null,
  rounds_completed: 8,
  partial_reps: 5,
  notes: "Rounds score",
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
  it("shows only time fields for benchmarks.type='time'", () => {
    renderComponent(mockWodTime, mockScoreTime);

    expect(screen.getByLabelText("Minutes")).toBeVisible();
    expect(screen.getByLabelText("Seconds")).toBeVisible();
    expect(screen.queryByLabelText("Reps")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Rounds")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Partial Reps")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Load")).not.toBeInTheDocument();
  });

  it("shows only reps field for benchmarks.type='reps'", () => {
    renderComponent(mockWodReps, mockScoreReps);

    expect(screen.getByLabelText("Reps")).toBeVisible();
    expect(screen.queryByLabelText("Minutes")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Seconds")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Rounds")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Partial Reps")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Load")).not.toBeInTheDocument();
  });

  it("shows only load field for benchmarks.type='load'", () => {
    renderComponent(mockWodLoad, mockScoreLoad);

    expect(screen.getByLabelText("Load")).toBeVisible();
    expect(screen.queryByLabelText("Minutes")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Seconds")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Reps")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Rounds")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Partial Reps")).not.toBeInTheDocument();
  });

  it("shows only rounds and partial reps fields for benchmarks.type='rounds'", () => {
    renderComponent(mockWodRounds, mockScoreRounds);

    expect(screen.getByLabelText("Rounds")).toBeVisible();
    expect(screen.getByLabelText("Partial Reps")).toBeVisible();
    expect(screen.queryByLabelText("Minutes")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Seconds")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Reps")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Load")).not.toBeInTheDocument();
  });

  it("shows timecap radio and correct fields for timecapped WOD", () => {
    renderComponent(mockWodTime, mockScoreTime);

    const radioYes = screen.getByLabelText(
      "Yes, finished within timecap (enter your time)",
    );
    expect(radioYes).toBeChecked();

    // Time fields visible, others not
    expect(screen.getByLabelText("Minutes")).toBeVisible();
    expect(screen.getByLabelText("Seconds")).toBeVisible();
    expect(screen.queryByLabelText("Reps")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Rounds")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Partial Reps")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Load")).not.toBeInTheDocument();
  });

  // Add more tests for logging new scores, validation, submission etc. if needed
});
