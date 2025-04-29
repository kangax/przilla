import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "../../../test-utils";
import "@testing-library/jest-dom";
import WodTable from "./WodTable";

// Mock tRPC api at the module level (correct import path)
vi.mock("~/trpc/react", () => ({
  api: {
    useUtils: () => ({}),
    score: {
      deleteScore: {
        useMutation: () => ({
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          mutate: () => {},
          isLoading: false,
          isSuccess: true,
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          reset: () => {},
        }),
      },
      logScore: {
        useMutation: () => ({
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          mutate: () => {},
          isLoading: false,
          isSuccess: true,
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          reset: () => {},
        }),
      },
      updateScore: {
        useMutation: () => ({
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          mutate: () => {},
          isLoading: false,
          isSuccess: true,
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          reset: () => {},
        }),
      },
      importScores: {
        useMutation: () => ({
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          mutate: () => {},
          isLoading: false,
          isSuccess: true,
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          reset: () => {},
        }),
      },
      getAllByUser: {
        useQuery: () => ({
          data: [],
          isLoading: false,
          isSuccess: true,
        }),
      },
    },
    wod: {
      getAll: {
        useQuery: () => ({
          data: [],
          isLoading: false,
          isSuccess: true,
        }),
      },
    },
  },
}));

// Minimal mock for handleSort
let handleSortMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  handleSortMock = vi.fn();
});

describe("WodTable Headers", () => {
  it("should render table headers correctly", () => {
    render(
      <WodTable
        wods={[]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={{}}
        _isLoadingScores={false} // Renamed prop
      />,
    );
    expect(
      screen.getByRole("columnheader", { name: /Workout/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /Category \/ Tags/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /Difficulty/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /Likes/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /Description/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /Your scores/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: /Date/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: /Notes/ }),
    ).not.toBeInTheDocument();
  });

  it("should display sort indicators correctly", () => {
    const { rerender } = render(
      <WodTable
        wods={[]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={{}}
        _isLoadingScores={false} // Renamed prop
      />,
    );
    expect(
      screen.getByRole("columnheader", { name: /Workout ▲/ }),
    ).toBeInTheDocument();

    rerender(
      <WodTable
        wods={[]}
        sortBy="wodName"
        sortDirection="desc"
        handleSort={handleSortMock}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={{}}
        _isLoadingScores={false} // Renamed prop
      />,
    );
    expect(
      screen.getByRole("columnheader", { name: /Workout ▼/ }),
    ).toBeInTheDocument();

    rerender(
      <WodTable
        wods={[]}
        sortBy="countLikes"
        sortDirection="desc"
        handleSort={handleSortMock}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={{}}
        _isLoadingScores={false} // Renamed prop
      />,
    );
    expect(
      screen.getByRole("columnheader", { name: /Likes ▼/ }),
    ).toBeInTheDocument();
  });

  it("should call handleSort when clicking sortable headers", () => {
    render(
      <WodTable
        wods={[]}
        sortBy="wodName"
        sortDirection="asc"
        handleSort={handleSortMock}
        tableHeight={500}
        searchTerm=""
        scoresByWodId={{}}
        _isLoadingScores={false} // Renamed prop
      />,
    );
    screen.getByText(/Workout/).click();
    expect(handleSortMock).toHaveBeenCalledWith("wodName");
    screen.getByText(/Difficulty/).click();
    expect(handleSortMock).toHaveBeenCalledWith("difficulty");
    screen.getByText(/Likes/).click();
    expect(handleSortMock).toHaveBeenCalledWith("countLikes");
    screen.getByText(/Category \/ Tags/).click();
    expect(handleSortMock).toHaveBeenCalledTimes(3);
  });
});
