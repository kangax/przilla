"use client";

import React from "react";
import { IconButton, DropdownMenu } from "@radix-ui/themes";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, ListFilter, ArrowUp, ArrowDown } from "lucide-react";
import TagSelector from "./TagSelector";
import CompletionFilterControl, {
  type CompletionFilterType,
} from "./CompletionFilterControl"; // Imported CompletionFilterType
import {
  WOD_CATEGORIES,
  type WodCategory,
  type SortByType,
} from "~/types/wodTypes";

interface FilterBarProps {
  filterBarRef: React.RefObject<HTMLDivElement>;
  isMobile: boolean;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedCategories: WodCategory[];
  setSelectedCategories: (value: WodCategory[]) => void;
  categoryCounts: Record<string, number>;
  originalTotalWodCount: number;
  tagOrder: string[];
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  completionFilter: CompletionFilterType; // Updated type
  setCompletionFilter: (value: CompletionFilterType) => void; // Updated type
  dynamicTotalWodCount: number;
  dynamicDoneWodsCount: number;
  dynamicNotDoneWodsCount: number;
  isLoggedIn: boolean;
  sortBy: SortByType;
  sortDirection: "asc" | "desc";
  handleSort: (column: SortByType) => void;
}

export function FilterBar({
  filterBarRef,
  isMobile,
  searchTerm,
  setSearchTerm,
  selectedCategories,
  setSelectedCategories,
  categoryCounts,
  originalTotalWodCount,
  tagOrder,
  selectedTags,
  toggleTag,
  completionFilter,
  setCompletionFilter,
  dynamicTotalWodCount,
  dynamicDoneWodsCount,
  dynamicNotDoneWodsCount,
  isLoggedIn,
  sortBy,
  sortDirection,
  handleSort,
}: FilterBarProps) {
  return (
    <div
      ref={filterBarRef}
      className={`mb-4 mt-4 ${
        isMobile ? "flex flex-col gap-2 px-2" : "flex items-center gap-2"
      }`}
    >
      <div className={isMobile ? "flex gap-2" : "flex flex-grow gap-2"}>
        <input
          type="search"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`placeholder:text-muted-foreground rounded border border-input px-3 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
            isMobile ? "flex-1 py-2 text-base" : "w-40 py-1.5 text-sm"
          }`}
        />

        <Select.Root
          value={selectedCategories.length > 0 ? selectedCategories[0] : "all"}
          onValueChange={(value) => {
            if (value === "all") {
              setSelectedCategories([]);
            } else if ((WOD_CATEGORIES as readonly string[]).includes(value)) {
              setSelectedCategories([value as WodCategory]);
            } else {
              setSelectedCategories([]);
            }
          }}
        >
          <Select.Trigger
            className={`flex min-w-[120px] items-center justify-between rounded-md border border-border bg-card px-3 text-card-foreground hover:bg-accent ${
              isMobile ? "py-2 text-base" : "py-2 text-xs"
            }`}
          >
            <Select.Value placeholder="Select category">
              {selectedCategories.length > 0
                ? `${selectedCategories[0]} (${categoryCounts[selectedCategories[0]] || 0})`
                : `All (${originalTotalWodCount})`}
            </Select.Value>
            <Select.Icon>
              <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content
              className="z-50 rounded-md border border-border bg-popover shadow-md"
              position="popper"
            >
              <Select.Viewport>
                <Select.Item
                  value="all"
                  className="cursor-pointer px-3 py-2 text-base text-popover-foreground outline-none hover:bg-accent data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground"
                >
                  <Select.ItemText>
                    All ({originalTotalWodCount})
                  </Select.ItemText>
                </Select.Item>
                {WOD_CATEGORIES.map((category) => (
                  <Select.Item
                    key={category}
                    value={category}
                    className="cursor-pointer px-3 py-2 text-base text-popover-foreground outline-none hover:bg-accent data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground"
                  >
                    <Select.ItemText>
                      {category} ({categoryCounts[category] || 0})
                    </Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>

        <TagSelector
          tagOrder={tagOrder}
          selectedTags={selectedTags}
          toggleTag={toggleTag}
          isMobile={isMobile}
        />
      </div>

      {isMobile ? (
        <div className="mt-2 flex w-full flex-row items-center gap-2">
          <CompletionFilterControl
            completionFilter={completionFilter}
            setCompletionFilter={setCompletionFilter}
            dynamicTotalWodCount={dynamicTotalWodCount}
            dynamicDoneWodsCount={dynamicDoneWodsCount}
            dynamicNotDoneWodsCount={dynamicNotDoneWodsCount}
            isLoggedIn={isLoggedIn}
            isMobile={isMobile}
          />
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <IconButton variant="ghost" aria-label="Sort WODs">
                <ListFilter size={20} />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              className="z-50 min-w-[180px] rounded-md border border-border bg-popover p-1 shadow-md"
              sideOffset={5}
              align="end"
            >
              <DropdownMenu.Label className="px-2 py-1.5 text-sm font-semibold text-popover-foreground">
                Sort By
              </DropdownMenu.Label>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              {(isLoggedIn
                ? [
                    { key: "wodName", label: "Name" },
                    { key: "date", label: "Date Added" },
                    { key: "difficulty", label: "Difficulty" },
                    { key: "countLikes", label: "Likes" },
                    { key: "results", label: "Your Score" },
                  ]
                : [
                    { key: "wodName", label: "Name" },
                    { key: "date", label: "Date Added" },
                    { key: "difficulty", label: "Difficulty" },
                    { key: "countLikes", label: "Likes" },
                  ]
              ).map((item) => (
                <DropdownMenu.Item
                  key={item.key}
                  data-testid={`sort-menuitem-${item.key}`}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-popover-foreground outline-none transition-colors hover:bg-accent focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  onSelect={() => handleSort(item.key as SortByType)}
                >
                  <span className="flex-grow">{item.label}</span>
                  {sortBy === item.key && (
                    <>
                      {sortDirection === "asc" ? (
                        <ArrowUp className="ml-auto h-4 w-4" />
                      ) : (
                        <ArrowDown className="ml-auto h-4 w-4" />
                      )}
                    </>
                  )}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      ) : (
        <CompletionFilterControl
          completionFilter={completionFilter}
          setCompletionFilter={setCompletionFilter}
          dynamicTotalWodCount={dynamicTotalWodCount}
          dynamicDoneWodsCount={dynamicDoneWodsCount}
          dynamicNotDoneWodsCount={dynamicNotDoneWodsCount}
          isLoggedIn={isLoggedIn}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
