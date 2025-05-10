import { describe, it, expect, vi } from "vitest";
import { render, within, screen } from "../../../test-utils";
import "@testing-library/jest-dom";
import WodTable from "./WodTable";

// Use shared mock for ~/trpc/react
import * as trpcMock from "~/trpc/__mocks__/react";
vi.mock("~/trpc/react", () => trpcMock);

const mockWodWithUrl = {
  id: "2",
  createdAt: new Date(),
  updatedAt: new Date(),
  wodUrl: "test.com/wod2",
  wodName: "WOD Bravo",
  description: "Desc Bravo",
  category: "Girl" as const, // Use const assertion
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

const mockWodWithoutUrl = {
  id: "3",
  createdAt: new Date(),
  updatedAt: new Date(),
  wodUrl: null,
  wodName: "WOD Charlie",
  description: "Desc Charlie",
  category: "Hero" as const, // Use const assertion
  tags: ["Chipper"],
  movements: [],
  timecap: null,
  benchmarks: {
    type: "rounds" as const,
    levels: {
      elite: { min: 20, max: null },
      advanced: { min: 15, max: null },
      intermediate: { min: 10, max: null },
      beginner: { min: 5, max: null },
    },
  },
  difficulty: "Very Hard",
  difficultyExplanation: "Hero WOD, high volume chipper.",
  countLikes: 50,
};

const mockScoresByWodId = {
  "2": [
    {
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
      isRx: true,
    },
  ],
  "3": [
    {
      id: "102",
      wodId: "3",
      userId: "test-user",
      scoreDate: new Date("2024-03-11"),
      createdAt: new Date("2024-03-11"),
      updatedAt: new Date("2024-03-11"),
      time_seconds: null,
      reps: null,
      load: null,
      rounds_completed: 12,
      partial_reps: 5,
      notes: "Used lighter weight",
      isRx: false,
    },
  ],
};

describe("WodTable External Link Icon", () => {
  // Helper to find a row based on some text content
  const findRenderedRowByContent = (content: string) => {
    // Use getAllByText to avoid "multiple elements" error
    const cells = screen.getAllByText((text, node) =>
      node?.textContent?.includes(content),
    );
    // Find the first cell that is inside a row
    const cell = cells.find((c) => c.closest('div[role="row"]'));
    if (!cell) throw new Error(`Row containing "${content}" not found`);
    const row = cell.closest('div[role="row"]');
    if (!row) throw new Error(`Row containing "${content}" not found`);
    return row as HTMLElement;
  };

  it("should render external link icon when wodUrl is present", () => {
    render(
      <WodTable
        wods={[mockWodWithUrl]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={vi.fn()}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={mockScoresByWodId}
        _isLoadingScores={false} // Renamed prop
      />,
    );
    const row = findRenderedRowByContent("WOD Bravo");
    const link = within(row).getByRole("link", {
      name: /WOD Bravo/,
    });
    expect(within(link).getByText("↗")).toBeInTheDocument();
  });

  it("should NOT render external link icon when wodUrl is absent", () => {
    render(
      <WodTable
        wods={[mockWodWithoutUrl]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={vi.fn()}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={mockScoresByWodId}
        _isLoadingScores={false} // Renamed prop
      />,
    );
    const row = findRenderedRowByContent("WOD Charlie");
    // Use getAllByText to avoid "multiple elements" error
    const nameElements = within(row).getAllByText((t, n) =>
      n?.textContent?.includes("WOD Charlie"),
    );
    // Find the element that is not inside a link
    const nameElement = nameElements.find((el) => !el.closest("a"));
    expect(nameElement).toBeDefined();
    expect(
      nameElement && within(nameElement).queryByText("↗"),
    ).not.toBeInTheDocument();
  });
});
