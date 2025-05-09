import React from "react";
import { Text, Tooltip as ThemeTooltip } from "@radix-ui/themes";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { Wod, SortByType } from "../../../../types/wodTypes";
import { getSortIndicator } from "./columnUtils";
import { DifficultyHeaderTooltipContent } from "./DifficultyHeaderTooltip";
import { safeString, getDifficultyColor } from "../wodTableUtils"; // Corrected path

const columnHelper = createColumnHelper<Wod>();

interface DifficultyColumnParams {
  handleSort: (column: SortByType) => void;
  sortBy: SortByType;
  sortDirection: "asc" | "desc";
}

export const createDifficultyColumn = ({
  handleSort,
  sortBy,
  sortDirection,
}: DifficultyColumnParams): ColumnDef<Wod, string | null | undefined> => { // Wod.difficulty can be string, null, or undefined
  return columnHelper.accessor("difficulty", {
    header: () => (
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <span
            onClick={() => handleSort("difficulty")}
            className="cursor-pointer whitespace-nowrap underline decoration-dotted underline-offset-4"
            tabIndex={0}
          >
            Difficulty{getSortIndicator("difficulty", sortBy, sortDirection)}
          </span>
        </TooltipPrimitive.Trigger>
        <DifficultyHeaderTooltipContent />
      </TooltipPrimitive.Root>
    ),
    cell: (info) => {
      const row = info.row.original;
      if (!row.difficulty) return <Text>-</Text>;
      return (
        <ThemeTooltip
          content={
            <span style={{ whiteSpace: "pre-wrap" }}>
              {safeString(row.difficultyExplanation)}
            </span>
          }
        >
          <Text
            className={`font-medium ${getDifficultyColor(row.difficulty)}`}
          >
            {row.difficulty}
          </Text>
        </ThemeTooltip>
      );
    },
    size: 100,
  });
};
