import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as trpcReact from "~/trpc/react";
import * as exportUtil from "~/utils/exportUserData";
import AuthControls from "./AuthControls";

// Mock trpc/react module
import * as trpcMock from "~/trpc/__mocks__/react";
vi.mock("~/trpc/react", () => trpcMock);

// Mock auth-client module
vi.mock("~/lib/auth-client", () => ({
  useSession: () => ({
    data: {
      user: {
        name: "Test User",
        email: "test@example.com",
      },
    },
    isPending: false,
  }),
  signOut: vi.fn(),
}));

// Mock src/env.js module to stub environment variables during tests
vi.mock("../../env.js", () => ({
  env: {
    BETTER_AUTH_SECRET: "test-secret",
    BETTER_AUTH_URL: "http://localhost",
    NEXT_PUBLIC_BETTER_AUTH_URL: "http://localhost",
    GITHUB_CLIENT_ID: "test-github-client-id",
    GITHUB_CLIENT_SECRET: "test-github-client-secret",
    GOOGLE_CLIENT_ID: "test-google-client-id",
    GOOGLE_CLIENT_SECRET: "test-google-client-secret",
  },
}));

// Mock tRPC hooks and export utility
const mockScores = [
  {
    wodId: "w1",
    scoreDate: "2024-04-21T12:00:00Z",
    time_seconds: 123,
    reps: 50,
    rounds_completed: 3,
    partial_reps: 5,
    load: 100,
    isRx: true,
    notes: "Felt good",
  },
];
const mockWods = [
  {
    id: "w1",
    wodName: "Fran",
    category: "Benchmark",
    tags: ["For Time", "Chipper"],
    difficulty: "Hard",
    description: "21-15-9 Thrusters and Pull-Ups",
  },
];

beforeEach(() => {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument -- test: mock tRPC hook return */
  vi.spyOn(trpcReact.api.score.getAllByUser, "useQuery").mockReturnValue({
    data: mockScores,
    isLoading: false,
    isError: false,
    refetch: vi.fn().mockResolvedValue({ data: mockScores }),
  } as any);
  vi.spyOn(trpcReact.api.wod.getAll, "useQuery").mockReturnValue({
    data: mockWods,
    isLoading: false,
    isError: false,
    refetch: vi.fn().mockResolvedValue({ data: mockWods }),
  } as any);
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
  vi.spyOn(exportUtil, "exportUserData").mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AuthControls Dropdown Export", () => {
  it("renders profile name as dropdown trigger", () => {
    render(<AuthControls />);
    // The profile name is rendered as a span with tabIndex and aria attributes
    const trigger = screen.getByText("Test User");
    expect(trigger).toBeInTheDocument();
  });

  it("opens dropdown and shows Export as CSV as a top-level item", async () => {
    render(<AuthControls />);
    const trigger = screen.getByText("Test User");
    await userEvent.click(trigger);
    // Look for "Export as CSV" as a top-level item
    expect(screen.getByText(/export as csv/i)).toBeInTheDocument();
  });

  it("enables export option when data is loaded", async () => {
    render(<AuthControls />);
    const trigger = screen.getByText("Test User");
    await userEvent.click(trigger);
    const csvOption = screen.getByText(/export as csv/i);
    expect(csvOption).not.toHaveAttribute("aria-disabled", "true");
  });

  it("calls export utility with correct args when export is clicked", async () => {
    render(<AuthControls />);
    const trigger = screen.getByText("Test User");
    await userEvent.click(trigger);
    const csvOption = screen.getByText(/export as csv/i);
    await userEvent.click(csvOption);
    await waitFor(() => {
      expect(exportUtil.exportUserData).toHaveBeenCalledWith(
        mockScores,
        mockWods,
      );
    });
  });

  it("disables export option when data is loading", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- test: mock tRPC hook return
    (trpcReact.api.score.getAllByUser.useQuery as any).mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isFetching: true,
      isError: false,
      refetch: vi.fn(),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- test: mock tRPC hook return
    (trpcReact.api.wod.getAll.useQuery as any).mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isFetching: true,
      isError: false,
      refetch: vi.fn(),
    });
    render(<AuthControls />);
    const trigger = screen.getByText("Test User");
    await userEvent.click(trigger);
    const csvOption = screen.getByText(/exporting/i);
    expect(csvOption).toHaveAttribute("aria-disabled", "true");
  });
});
