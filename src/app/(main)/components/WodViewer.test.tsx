import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import {
  mockWods,
  setupLoggedInSession,
  setupLoggedOutSession,
} from "./WodViewer.test-utils";

// --- Explicitly mock useSession ---
vi.mock("~/lib/auth-client", () => ({
  useSession: vi.fn(),
}));

// --- Mock tRPC ---
import * as trpcMock from "~/trpc/__mocks__/react";
vi.mock("~/trpc/react", () => trpcMock);

// --- Mock next/navigation ---
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  })),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(),
    getAll: vi.fn(),
    has: vi.fn(),
    forEach: vi.fn(),
    entries: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    toString: vi.fn(),
  })),
  usePathname: vi.fn(() => "/"),
}));

// --- Mock WodTable component ---
vi.mock("./WodTable", () => ({
  default: vi.fn(({ wods, sortBy, sortDirection, searchTerm }) => {
    // Safely access length with type checking
    const wodsLength = Array.isArray(wods) ? wods.length : 0;

    return (
      <div data-testid="wod-table">
        <span>WodTable Mock</span>
        <span data-testid="table-wod-count">{wodsLength}</span>
        <span data-testid="table-sort-by">{sortBy}</span>
        <span data-testid="table-sort-direction">{sortDirection}</span>
        <span data-testid="table-search-term">{searchTerm}</span>
        <button>Sort Table By Name</button>
      </div>
    );
  }),
}));

import React from "react";
import { render, screen, fireEvent, within } from "~/test-utils";
import WodViewer from "./WodViewer";
import { Theme } from "@radix-ui/themes";

// Mock useMediaQuery to always return true (mobile)
vi.mock("~/utils/useMediaQuery", () => ({
  useMediaQuery: () => true,
}));

describe("WodViewer Mobile Sorting UI", () => {
  beforeEach(() => {
    setupLoggedInSession();
  });

  it("renders the sort button and segmented control on the same line", () => {
    render(
      <Theme>
        <WodViewer initialWods={mockWods} />
      </Theme>,
    );
    expect(screen.queryByTestId("segmented-all")).not.toBeNull();
    expect(screen.queryByTestId("segmented-done")).not.toBeNull();
    expect(screen.queryByTestId("segmented-todo")).not.toBeNull();
    const sortButton = screen.getByLabelText(/Sort WODs/i);
    expect(sortButton).toBeInTheDocument();
  });

  it("does not show 'Your Score' sort option when logged out", async () => {
    setupLoggedOutSession();

    render(
      <Theme>
        <WodViewer initialWods={mockWods} />
      </Theme>,
    );

    expect(screen.queryByTestId("segmented-all")).toBeNull();
    expect(screen.queryByTestId("segmented-done")).toBeNull();
    expect(screen.queryByTestId("segmented-todo")).toBeNull();

    const sortButton = screen.getByLabelText(/Sort WODs/i);
    fireEvent.keyDown(sortButton, { key: "Enter" });

    const menu = await screen.findByRole("menu");
    expect(menu).toBeInTheDocument();

    expect(within(menu).queryByTestId("sort-menuitem-results")).toBeNull();
  });

  it("always shows sort button regardless of auth state", () => {
    // Test with logged in user (default)
    const { rerender } = render(
      <Theme>
        <WodViewer initialWods={mockWods} />
      </Theme>,
    );
    expect(screen.getByLabelText(/Sort WODs/i)).toBeInTheDocument();
    expect(screen.queryByTestId("segmented-all")).not.toBeNull();
    expect(screen.queryByTestId("segmented-done")).not.toBeNull();
    expect(screen.queryByTestId("segmented-todo")).not.toBeNull();

    // Test with logged out user
    setupLoggedOutSession();

    rerender(
      <Theme>
        <WodViewer initialWods={mockWods} />
      </Theme>,
    );
    expect(screen.getByLabelText(/Sort WODs/i)).toBeInTheDocument();
    expect(screen.queryByTestId("segmented-all")).toBeNull();
    expect(screen.queryByTestId("segmented-done")).toBeNull();
    expect(screen.queryByTestId("segmented-todo")).toBeNull();
  });

  it("shows SegmentedControl only when logged in", () => {
    // Logged in user (default)
    const { rerender } = render(
      <Theme>
        <WodViewer initialWods={mockWods} />
      </Theme>,
    );
    expect(screen.queryByTestId("segmented-all")).not.toBeNull();
    expect(screen.queryByTestId("segmented-done")).not.toBeNull();
    expect(screen.queryByTestId("segmented-todo")).not.toBeNull();

    // Logged out user
    setupLoggedOutSession();

    rerender(
      <Theme>
        <WodViewer initialWods={mockWods} />
      </Theme>,
    );
    expect(screen.queryByTestId("segmented-all")).toBeNull();
    expect(screen.queryByTestId("segmented-done")).toBeNull();
    expect(screen.queryByTestId("segmented-todo")).toBeNull();
  });

  it("opens the sort dropdown and allows changing sort field and direction", async () => {
    render(
      <Theme>
        <WodViewer initialWods={mockWods} />
      </Theme>,
    );
    const sortButton = screen.getByLabelText(/Sort WODs/i);
    fireEvent.keyDown(sortButton, { key: "Enter" });

    const menu = await screen.findByRole("menu");
    expect(menu).toBeInTheDocument();
    expect(
      within(menu).getByTestId("sort-menuitem-wodName"),
    ).toBeInTheDocument();
    expect(within(menu).getByTestId("sort-menuitem-date")).toBeInTheDocument();
    expect(
      within(menu).getByTestId("sort-menuitem-difficulty"),
    ).toBeInTheDocument();
    expect(
      within(menu).getByTestId("sort-menuitem-countLikes"),
    ).toBeInTheDocument();
    expect(
      within(menu).getByTestId("sort-menuitem-results"),
    ).toBeInTheDocument();

    fireEvent.click(within(menu).getByTestId("sort-menuitem-wodName"));

    fireEvent.keyDown(sortButton, { key: "Enter" });
    const menuAgain = await screen.findByRole("menu");
    const nameMenuItem = within(menuAgain)
      .getByTestId("sort-menuitem-wodName")
      .closest('[role="menuitem"]');
    expect(nameMenuItem).not.toBeNull();
    expect(
      within(menuAgain).getByTestId("sort-menuitem-wodName"),
    ).toBeInTheDocument();

    fireEvent.click(within(menuAgain).getByTestId("sort-menuitem-wodName"));

    fireEvent.keyDown(sortButton, { key: "Enter" });
    const menuOneMoreTime = await screen.findByRole("menu");
    expect(menuOneMoreTime).toBeInTheDocument();
  });

  it("allows keyboard navigation of the sort dropdown for accessibility", async () => {
    render(
      <Theme>
        <WodViewer initialWods={mockWods} />
      </Theme>,
    );
    const sortButton = screen.getByLabelText(/Sort WODs/i);
    sortButton.focus();
    expect(sortButton).toHaveFocus();
    fireEvent.keyDown(sortButton, { key: "Enter" });

    const menu = await screen.findByRole("menu");
    expect(menu).toBeInTheDocument();
    expect(
      within(menu).getByTestId("sort-menuitem-wodName"),
    ).toBeInTheDocument();
    expect(within(menu).getByTestId("sort-menuitem-date")).toBeInTheDocument();
    expect(
      within(menu).getByTestId("sort-menuitem-difficulty"),
    ).toBeInTheDocument();
    expect(
      within(menu).getByTestId("sort-menuitem-countLikes"),
    ).toBeInTheDocument();
    expect(
      within(menu).getByTestId("sort-menuitem-results"),
    ).toBeInTheDocument();

    fireEvent.keyDown(document.activeElement || sortButton, {
      key: "ArrowDown",
    });
    expect(
      within(menu).getByTestId("sort-menuitem-wodName"),
    ).toBeInTheDocument();

    fireEvent.keyDown(document.activeElement || sortButton, {
      key: "ArrowDown",
    });
    expect(within(menu).getByTestId("sort-menuitem-date")).toBeInTheDocument();

    fireEvent.keyDown(document.activeElement || sortButton, { key: "Enter" });
  });
});
