import React from "react"; // Added React import for JSX
import Link from "next/link";
import { Flex } from "@radix-ui/themes";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Star } from "lucide-react";
import type { Wod, SortByType } from "../../../../types/wodTypes";
import { HighlightMatch } from "../../../../utils/uiUtils"; // Changed to relative path
import { getSortIndicator } from "./columnUtils";

const columnHelper = createColumnHelper<Wod>();

interface WodNameColumnParams {
  handleSort: (column: SortByType) => void;
  sortBy: SortByType;
  sortDirection: "asc" | "desc";
  searchTerm: string;
  isUserLoggedIn: boolean;
  handleToggleFavorite: (wodId: string, currentIsFavorited: boolean) => void;
}

export const createWodNameColumn = ({
  handleSort,
  sortBy,
  sortDirection,
  searchTerm,
  isUserLoggedIn,
  handleToggleFavorite,
}: WodNameColumnParams): ColumnDef<Wod, string> => { // Changed unknown to string
  return columnHelper.accessor("wodName", {
    header: () => (
      <span onClick={() => handleSort("wodName")} className="cursor-pointer">
        Workout{getSortIndicator("wodName", sortBy, sortDirection)}
      </span>
    ),
    cell: (info) => {
      const wod = info.row.original;
      const starIcon = (
        <Star
          size={16}
          className={`mr-2 flex-shrink-0 ${
            isUserLoggedIn
              ? "cursor-pointer hover:text-yellow-400"
              : "cursor-not-allowed opacity-50"
          } ${wod.isFavorited ? "fill-yellow-400 text-yellow-500" : "text-gray-400"}`}
          onClick={(e) => {
            if (isUserLoggedIn && handleToggleFavorite) {
              e.preventDefault(); // Prevent link navigation if star is inside Link
              e.stopPropagation();
              handleToggleFavorite(wod.id, !!wod.isFavorited); // Pass current state
            }
          }}
          aria-label={wod.isFavorited ? "Unfavorite WOD" : "Favorite WOD"}
        />
      );

      return (
        <Flex align="center" className="max-w-[200px]">
          {starIcon}
          {wod.wodUrl ? (
            <Link
              href={wod.wodUrl}
              target="_blank"
              className="flex items-center truncate whitespace-nowrap font-medium text-primary hover:underline"
            >
              <HighlightMatch text={wod.wodName} highlight={searchTerm} />
              <span className="ml-1 flex-shrink-0 text-xs opacity-70">
                ↗
              </span>
            </Link>
          ) : (
            <span className="truncate whitespace-nowrap font-medium">
              <HighlightMatch text={wod.wodName} highlight={searchTerm} />
            </span>
          )}
        </Flex>
      );
    },
    size: 220, // Increased size to accommodate star
  });
};
