import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { Wod } from "../../../../types/wodTypes";
import { HighlightMatch } from "../../../../utils/uiUtils";

const columnHelper = createColumnHelper<Wod>();

interface DescriptionColumnParams {
  searchTerm: string;
}

export const createDescriptionColumn = ({
  searchTerm,
}: DescriptionColumnParams): ColumnDef<Wod, string | null | undefined> => { // Wod.description can be string, null or undefined
  return columnHelper.accessor("description", {
    header: "Description",
    cell: (info) => {
      const row = info.row.original;
      if (!row.description) return null;
      const movements = row.movements ?? [];
      const hasMovements = movements.length > 0;
      const tooltipContent = hasMovements ? (
        <div style={{ maxWidth: 320 }}>
          <span className="mb-1 block text-sm font-semibold">Movements:</span>
          <ul className="list-disc pl-5 text-xs">
            {movements.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      ) : (
        <span className="text-xs text-gray-400">No movements listed</span>
      );
      return (
        <TooltipPrimitive.Root>
          <TooltipPrimitive.Trigger asChild>
            <span className="cursor-help whitespace-pre-wrap break-words">
              <HighlightMatch text={row.description} highlight={searchTerm} />
            </span>
          </TooltipPrimitive.Trigger>
          <TooltipPrimitive.Content
            className="max-w-[340px] rounded-sm border bg-white p-3 text-black shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            sideOffset={6}
          >
            {tooltipContent}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Root>
      );
    },
    size: 364,
  });
};
