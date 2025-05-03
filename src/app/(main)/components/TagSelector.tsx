"use client";

import React from "react";
import { Box, DropdownMenu } from "@radix-ui/themes";
import { ChevronDown } from "lucide-react";

interface TagSelectorProps {
  tagOrder: string[];
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  isMobile: boolean;
}

export default function TagSelector({
  tagOrder,
  selectedTags,
  toggleTag,
  isMobile,
}: TagSelectorProps) {
  // JSX for the tag selector will be moved here
  return (
    <div className="flex min-w-[120px] items-center rounded-md border border-border bg-card">
      {/* Label */}
      <span className={`px-2 ${isMobile ? "text-base" : "text-xs"}`}>
        Tags:
      </span>

      {/* Selected Tags */}
      <div className="flex flex-grow flex-wrap items-center gap-1 px-1 py-1">
        {selectedTags.length === 0 ? (
          <span
            className={`text-slate-500 dark:text-slate-400 ${isMobile ? "text-xs" : "text-xs"}`}
          >
            None
          </span>
        ) : (
          selectedTags.map((tag) => (
            <div
              key={tag}
              className={`flex items-center whitespace-nowrap rounded-full border border-blue-300 bg-blue-100 text-blue-700 transition-colors duration-150 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-200 ${
                isMobile ? "px-2 py-0.5 text-xs" : "px-2 py-0.5 text-xs"
              }`}
            >
              <span>{tag}</span>
              <button
                type="button"
                className="ml-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-200 text-blue-700 hover:bg-blue-300 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700"
                onClick={() => toggleTag(tag)}
                aria-label={`Remove ${tag} tag`}
              >
                <span className="text-[10px] leading-none">×</span>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Tags Dropdown */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <button
            className={`flex items-center justify-center border-l border-border bg-card px-2 text-card-foreground hover:bg-accent ${
              isMobile ? "py-2" : "py-2"
            }`}
            aria-label="Select tags"
          >
            <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-70" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          className="z-50 min-w-[180px] max-w-[260px] rounded-md border border-border bg-popover p-2 shadow-md"
          sideOffset={5}
          align="start"
        >
          <div className="flex flex-wrap gap-1">
            {tagOrder
              .filter((tag) => !selectedTags.includes(tag))
              .map((tag) => (
                <Box
                  key={tag}
                  className={`cursor-pointer whitespace-nowrap rounded-full border border-slate-300 bg-white text-slate-700 transition-colors duration-150 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 ${
                    isMobile
                      ? "px-4 py-1 text-sm font-medium"
                      : "px-3 py-1 text-xs font-medium"
                  }`}
                  onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                    // Prevent the dropdown from closing when clicking a tag
                    e.preventDefault();
                    e.stopPropagation();
                    toggleTag(tag);
                  }}
                >
                  {tag}
                </Box>
              ))}
          </div>
          {tagOrder.filter((tag) => !selectedTags.includes(tag)).length ===
            0 && (
            <div className="px-2 py-1 text-sm text-slate-500 dark:text-slate-400">
              All tags selected
            </div>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  );
}
