import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { ScoreImportWizard } from "./ScoreImportWizard";
import { api as trpcApi } from "~/trpc/react"; // Import the mocked api
import type { Wod } from "~/types/wodTypes";
// No need to import UseQueryResult if using queryMock's return type directly

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

// Use shared mock for ~/trpc/react
// The actual mock is already applied via vitest.config.ts or setup,
// but we import `api` to manipulate its mock implementations.
import * as trpcMockModule from "~/trpc/__mocks__/react";
// Import queryMock from the trpc mock module
import { queryMock } from "~/trpc/__mocks__/react";
vi.doMock("~/trpc/react", () => trpcMockModule);

// Cast the imported api to the correct type for mocking
const mockedTrpcApi = trpcApi as unknown as typeof trpcMockModule.api;

const stableEmptyWods: Wod[] = []; // For consistent data reference

describe("ScoreImportWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for successful WOD fetch (empty data)
    vi.mocked(mockedTrpcApi.wod.getAll.useQuery).mockReturnValue(
      queryMock<Wod[], Error>(stableEmptyWods, false, null),
    );
  });

  it("renders and shows the upload UI by default when WODs are loaded", () => {
    render(<ScoreImportWizard importType="sugarwod" />);
    expect(
      screen.getByText(/Import Scores from SugarWOD/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("csv-upload-zone")).toBeInTheDocument();
    // Loading indicator should not be present if WODs loaded successfully
    expect(screen.queryByTestId("loading-indicator")).not.toBeInTheDocument();
  });

  it("shows loading indicator when WODs are loading", () => {
    vi.mocked(mockedTrpcApi.wod.getAll.useQuery).mockReturnValue(
      queryMock<Wod[], Error>(undefined, true, null),
    );
    render(<ScoreImportWizard importType="sugarwod" />);
    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
    expect(screen.getByText("Loading WOD data...")).toBeInTheDocument();
  });

  it("shows error if WOD fetch fails", async () => {
    const mockError = new Error("Failed to fetch WODs");
    vi.mocked(mockedTrpcApi.wod.getAll.useQuery).mockReturnValue(
      queryMock<Wod[], Error>(undefined, false, mockError),
    );

    render(<ScoreImportWizard importType="sugarwod" />);

    // The error message is part of the UploadStep component, which is rendered conditionally
    // Wait for the error message to appear
    await waitFor(() => {
      expect(
        screen.getByText(/Error loading WOD data: Failed to fetch WODs/i),
      ).toBeInTheDocument();
    });
    // Upload zone should NOT be present if WOD loading failed
    expect(screen.queryByTestId("csv-upload-zone")).not.toBeInTheDocument();
  });

  // The following tests are placeholders for async UI update and would require more setup
  it.skip("shows error if CSV parsing fails", async () => {
    // Would mock papaparse and simulate file upload, then check for error UI
  });

  it.skip("handles valid CSV upload and shows review table", async () => {
    // Would mock papaparse and simulate file upload, then check for review table UI
  });
});
