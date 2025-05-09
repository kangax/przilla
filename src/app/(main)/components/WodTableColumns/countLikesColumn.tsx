import React from "react";
import { Tooltip as ThemeTooltip } from "@radix-ui/themes";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { Wod, SortByType } from "../../../../types/wodTypes";
import { getSortIndicator } from "./columnUtils";

const columnHelper = createColumnHelper<Wod>();

interface CountLikesColumnParams {
  handleSort: (column: SortByType) => void;
  sortBy: SortByType;
  sortDirection: "asc" | "desc";
}

export const createCountLikesColumn = ({
  handleSort,
  sortBy,
  sortDirection,
}: CountLikesColumnParams): ColumnDef<Wod, number | null | undefined> => { // Wod.countLikes can be number, null or undefined
  return columnHelper.accessor("countLikes", {
    header: () => (
      <ThemeTooltip content="Number of likes on wodwell.com">
        <span
          onClick={() => handleSort("countLikes")}
          className="cursor-pointer whitespace-nowrap underline decoration-dotted underline-offset-4"
          tabIndex={0} // Add tabIndex for accessibility
        >
          Likes{getSortIndicator("countLikes", sortBy, sortDirection)}
        </span>
      </ThemeTooltip>
    ),
    cell: (info) => {
      const row = info.row.original;
      return (
        <span className="whitespace-nowrap">{row.countLikes ?? "-"} </span>
      );
    },
    size: 70,
  });
};
