import React from "react";
import { Flex, Badge } from "@radix-ui/themes";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { Wod } from "../../../../types/wodTypes";
import { HighlightMatch } from "../../../../utils/uiUtils";

const columnHelper = createColumnHelper<Wod>();

interface CategoryAndTagsColumnParams {
  searchTerm: string;
}

export const createCategoryAndTagsColumn = ({
  searchTerm,
}: CategoryAndTagsColumnParams): ColumnDef<Wod, { category?: string | null; tags?: string[] | null }> => {
  return columnHelper.accessor(
    (row) => ({ category: row.category, tags: row.tags }),
    {
      id: "categoryAndTags",
      header: "Category / Tags",
      cell: (info) => {
        const { category, tags } = info.getValue();
        const safeTags = tags ?? [];
        if (!category && safeTags.length === 0) return null;

        return (
          <Flex direction="column" gap="1" align="start">
            {category && (
              <Badge
                color="indigo"
                variant="soft"
                radius="full"
                className="w-fit"
              >
                <HighlightMatch text={category} highlight={searchTerm} />
              </Badge>
            )}
            {safeTags.length > 0 && (
              <Flex gap="1" wrap="wrap" className="mt-1">
                {safeTags.map((tag) => (
                  <Badge
                    key={tag}
                    color="gray"
                    variant="soft"
                    radius="full"
                    className="flex-shrink-0 text-xs"
                  >
                    <HighlightMatch text={tag} highlight={searchTerm} />
                  </Badge>
                ))}
              </Flex>
            )}
          </Flex>
        );
      },
      size: 200,
    },
  );
};
