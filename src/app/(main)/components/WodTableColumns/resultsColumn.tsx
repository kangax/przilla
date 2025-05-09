import React from "react";
import {
  createColumnHelper,
  type ColumnDef,
  type SortingFn,
  type Row,
} from "@tanstack/react-table";
import type { Wod, Score, SortByType } from "../../../../types/wodTypes";
import { getPerformanceLevel } from "../../../../utils/wodUtils";
import { ScoresCell } from "../WodTableCells/ScoresCell"; // Corrected path
import { getSortIndicator, performanceLevelValues } from "./columnUtils";

const columnHelper = createColumnHelper<Wod>();

// Define the type for the value accessed by this column
type ResultsColumnValue = { wod: Wod; scores?: Score[] };

interface ResultsColumnParams {
  scoresByWodId: Record<string, Score[]>;
  handleSort: (column: SortByType) => void;
  sortBy: SortByType;
  sortDirection: "asc" | "desc";
  openLogDialog?: (wod: Wod) => void;
  openEditDialog?: (score: Score, wod: Wod) => void;
  handleDeleteScore?: (score: Score, wod: Wod) => void;
}

export const createResultsColumn = ({
  scoresByWodId,
  handleSort,
  sortBy,
  sortDirection,
  openLogDialog,
  openEditDialog,
  handleDeleteScore,
}: ResultsColumnParams): ColumnDef<Wod, ResultsColumnValue> => {
  const sortByLatestScoreLevel: SortingFn<Wod> = (
    rowA: Row<Wod>,
    rowB: Row<Wod>,
    _columnId: string,
  ) => {
    const getLevelValue = (row: Row<Wod>): number => {
      const wod = row.original;
      const scores = scoresByWodId?.[wod.id] ?? [];
      if (scores.length === 0) {
        return performanceLevelValues.noScore;
      }
      const latestScore = scores[0]; // Assuming scores are sorted descending by date
      if (!latestScore.isRx) {
        return performanceLevelValues.scaled;
      }
      const level = getPerformanceLevel(wod, latestScore);
      return level
        ? performanceLevelValues[level] ?? performanceLevelValues.rx
        : performanceLevelValues.rx;
    };

    const levelA = getLevelValue(rowA);
    const levelB = getLevelValue(rowB);

    return levelA - levelB;
  };

  return columnHelper.accessor(
    (row) => ({ wod: row, scores: scoresByWodId[row.id] }),
    {
      id: "results",
      header: () => (
        <span
          onClick={() => handleSort("results")}
          className="cursor-pointer whitespace-nowrap"
        >
          Your scores{getSortIndicator("results", sortBy, sortDirection)}
        </span>
      ),
      cell: (info) => {
        const { wod, scores } = info.getValue();
        return (
          <ScoresCell
            wod={wod}
            scores={scores}
            openLogDialog={openLogDialog}
            openEditDialog={openEditDialog}
            handleDeleteScore={handleDeleteScore}
          />
        );
      },
      size: 250,
      enableSorting: true,
      sortingFn: sortByLatestScoreLevel,
    },
  );
};
