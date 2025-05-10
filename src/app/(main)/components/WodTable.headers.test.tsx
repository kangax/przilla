import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "../../../test-utils";
import "@testing-library/jest-dom";
import WodTable from "./WodTable";

// Use shared mock for ~/trpc/react
import * as trpcMock from "~/trpc/__mocks__/react";
vi.mock("~/trpc/react", () => trpcMock);

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
