import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { ScoreImportWizard } from "./ScoreImportWizard";

// Mock dependencies
vi.mock("./CsvUploadZone", () => ({
  CsvUploadZone: () => <div data-testid="csv-upload-zone">CSV Upload Zone</div>,
}));
vi.mock("../../_components/LoadingIndicator", () => ({
  LoadingIndicator: ({ message }: { message: string }) => (
    <div data-testid="loading-indicator">{message}</div>
  ),
}));
vi.mock("./ScoreReviewTable", () => ({
  ScoreReviewTable: () => (
    <div data-testid="score-review-table">Score Review Table</div>
  ),
}));
vi.mock("./ImportConfirmation", () => ({
  ImportConfirmation: () => (
    <div data-testid="import-confirmation">Import Confirmation</div>
  ),
}));

// Mocks for tRPC API state
let mockWodsData = [{ id: "wod-1", wodName: "Test WOD" }];
let mockWodsLoading = false;
let mockWodsError: unknown = null;

vi.mock("~/trpc/react", () => ({
  api: {
    wod: {
      getAll: {
        useQuery: () => ({
          data: mockWodsData,
          isLoading: mockWodsLoading,
          error: mockWodsError,
        }),
      },
    },
    score: {
      importScores: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
        }),
      },
    },
  },
}));

describe("ScoreImportWizard", () => {
  beforeEach(() => {
    mockWodsData = [{ id: "wod-1", wodName: "Test WOD" }];
    mockWodsLoading = false;
    mockWodsError = null;
  });

  it("renders and shows the upload UI by default", () => {
    render(<ScoreImportWizard />);
    expect(
      screen.getByText(/Import Scores from SugarWOD/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("csv-upload-zone")).toBeInTheDocument();
  });

  it("shows loading indicator when WODs are loading", () => {
    mockWodsData = undefined;
    mockWodsLoading = true;
    render(<ScoreImportWizard />);
    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
  });

  it("shows error if WOD fetch fails", () => {
    mockWodsData = undefined;
    mockWodsLoading = false;
    mockWodsError = { message: "Failed to fetch WODs" };
    render(<ScoreImportWizard />);
    expect(
      screen.getByText(/Error loading WOD data: Failed to fetch WODs/i),
    ).toBeInTheDocument();
  });

  // The following tests are placeholders for async UI update and would require more setup
  it.skip("shows error if CSV parsing fails", async () => {
    // Would mock papaparse and simulate file upload, then check for error UI
  });

  it.skip("handles valid CSV upload and shows review table", async () => {
    // Would mock papaparse and simulate file upload, then check for review table UI
  });
});
