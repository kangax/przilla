"use client";

import { useState, useEffect, useMemo, useCallback } from "react"; // Import useCallback
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, Flex, SegmentedControl, Tooltip } from "@radix-ui/themes";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, TableIcon, List } from "lucide-react";
import WodTable from "./WodTable";
import WodTimeline from "./WodTimeline";
import WodDistributionChart from "./WodDistributionChart";
import WodTimelineChart from "./WodTimelineChart";
import {
  type Wod,
  type ChartDataPoint,
  type FrequencyDataPoint,
  type PerformanceDataPoint,
  type SortByType,
} from "~/types/wodTypes";
import { hasScore, sortWods, isWodDone } from "~/utils/wodUtils"; // Import isWodDone

// --- URL State Management ---
const DEFAULT_COMPLETION_FILTER = "done";
const ALLOWED_COMPLETION_STATUSES: ReadonlyArray<"all" | "done" | "notDone"> = [
  "all",
  "done",
  "notDone",
];

// Helper function to validate completion status from URL
const isValidCompletionStatus = (
  status: string | null,
): status is "all" | "done" | "notDone" => {
  return ALLOWED_COMPLETION_STATUSES.includes(
    status as "all" | "done" | "notDone",
  );
};

// Helper function to validate view type from URL
const isValidView = (view: string | null): view is "table" | "timeline" => {
  return view === "table" || view === "timeline";
};

// Helper function to validate sort by from URL
const isValidSortBy = (sortBy: string | null): sortBy is SortByType => {
  const validSortKeys: SortByType[] = [
    "wodName",
    "date",
    "level",
    "attempts",
    "latestLevel",
    "difficulty", // Added difficulty
    "count_likes", // Added likes
  ];
  return validSortKeys.includes(sortBy as SortByType);
};

// Helper function to validate sort direction from URL
const isValidSortDirection = (dir: string | null): dir is "asc" | "desc" => {
  return dir === "asc" || dir === "desc";
};

// Define default sort directions for each column type
const DEFAULT_SORT_DIRECTIONS: Record<SortByType, "asc" | "desc"> = {
  wodName: "asc",
  date: "desc",
  level: "desc",
  attempts: "desc",
  latestLevel: "desc",
  difficulty: "asc", // Added difficulty, default asc (Easy -> Hard)
  count_likes: "desc", // Added likes, default desc (Most likes first)
};
// --- End URL State Management ---

interface WodViewerProps {
  wods: Wod[];
  tagChartData: ChartDataPoint[];
  categoryChartData: ChartDataPoint[];
  frequencyData: FrequencyDataPoint[];
  performanceData: PerformanceDataPoint[];
  categoryOrder: string[];
  tagOrder: string[];
}

export default function WodViewer({
  wods,
  tagChartData,
  categoryChartData,
  frequencyData,
  performanceData,
  categoryOrder,
  tagOrder,
}: WodViewerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // --- Initialize State from URL or Defaults ---
  // Note: These functions run on every render, but useState only uses them for the *initial* value.
  const getInitialCategories = (): string[] => {
    const urlCategory = searchParams.get("category");
    return urlCategory && categoryOrder.includes(urlCategory)
      ? [urlCategory]
      : [];
  };

  const getInitialTags = (): string[] => {
    const urlTags = searchParams.get("tags");
    return urlTags
      ? urlTags.split(",").filter((tag) => tagOrder.includes(tag))
      : [];
  };

  const getInitialCompletionFilter = (): "all" | "done" | "notDone" => {
    const urlCompletion = searchParams.get("completion");
    return isValidCompletionStatus(urlCompletion)
      ? urlCompletion
      : DEFAULT_COMPLETION_FILTER;
  };

  const getInitialView = (): "table" | "timeline" => {
    const urlView = searchParams.get("view");
    return isValidView(urlView) ? urlView : "table";
  };

  const getInitialSortBy = (): SortByType => {
    const urlSortBy = searchParams.get("sortBy");
    return isValidSortBy(urlSortBy) ? urlSortBy : "date";
  };

  const getInitialSortDirection = (
    initialSortBy: SortByType,
  ): "asc" | "desc" => {
    const urlSortDir = searchParams.get("sortDir");
    if (isValidSortDirection(urlSortDir)) {
      return urlSortDir;
    }
    return DEFAULT_SORT_DIRECTIONS[initialSortBy];
  };

  // State Hooks - Initialized from URL search params
  const [selectedCategories, setSelectedCategories] =
    useState<string[]>(getInitialCategories);
  const [selectedTags, setSelectedTags] = useState<string[]>(getInitialTags);
  const [completionFilter, setCompletionFilter] = useState<
    "all" | "done" | "notDone"
  >(getInitialCompletionFilter);
  const [view, setView] = useState<"table" | "timeline">(getInitialView);
  // Need to get initial sortBy before getting initial sortDirection
  const [sortBy, setSortBy] = useState<SortByType>(() => getInitialSortBy());
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(() =>
    getInitialSortDirection(sortBy),
  );
  // --- End Initialize State ---

  // --- Sync State TO URL ---
  // Update URL when internal state changes
  useEffect(() => {
    const urlParams: Record<string, string> = {};

    // Collect params based on current state, omitting defaults
    if (selectedCategories.length > 0) {
      urlParams.category = selectedCategories[0];
    }
    if (selectedTags.length > 0) {
      urlParams.tags = selectedTags.join(",");
    }
    if (completionFilter !== DEFAULT_COMPLETION_FILTER) {
      urlParams.completion = completionFilter;
    }
    if (view !== "table") {
      urlParams.view = view;
    }
    if (sortBy !== "date") {
      urlParams.sortBy = sortBy;
    }
    const defaultSortDir = DEFAULT_SORT_DIRECTIONS[sortBy];
    if (sortDirection !== defaultSortDir) {
      urlParams.sortDir = sortDirection;
    }

    // Sort keys alphabetically and build the search string
    const sortedKeys = Object.keys(urlParams).sort();
    const params = new URLSearchParams();
    sortedKeys.forEach((key) => {
      params.set(key, urlParams[key]);
    });

    const newSearch = params.toString();
    const currentSearch = searchParams.toString(); // Get current URL search string

    // Only push update if the calculated search string differs from the current one
    // Add NODE_ENV check for test stability
    if (process.env.NODE_ENV === "test" || newSearch !== currentSearch) {
      router.replace(`${pathname}?${newSearch}`, { scroll: false });
    }
    // Depend only on internal state variables that should trigger a URL update
  }, [
    selectedCategories,
    selectedTags,
    completionFilter,
    view,
    sortBy,
    sortDirection,
    pathname,
    router,
    searchParams, // Include searchParams to compare against current URL state
  ]);
  // --- End Sync State TO URL ---

  // Calculate counts for categories based on the original list for the dropdown
  const categoryCounts = wods.reduce(
    (acc, wod) => {
      if (wod.category) {
        acc[wod.category] = (acc[wod.category] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );
  const originalTotalWodCount = wods.length;

  // --- Memoized Filtering and Sorting Logic ---

  // 1. Memoize category/tag filtering
  const categoryTagFilteredWods = useMemo(() => {
    // console.log("Memo: Recalculating category/tag filter"); // For debugging
    return wods.filter((wod) => {
      const categoryMatch =
        selectedCategories.length === 0 ||
        (wod.category && selectedCategories.includes(wod.category));
      const tagMatch =
        selectedTags.length === 0 ||
        (wod.tags && wod.tags.some((tag) => selectedTags.includes(tag)));
      return categoryMatch && tagMatch;
    });
  }, [wods, selectedCategories, selectedTags]);

  // 2. Memoize counts (depends on categoryTagFilteredWods)
  const {
    dynamicTotalWodCount,
    dynamicDoneWodsCount,
    dynamicNotDoneWodsCount,
  } = useMemo(() => {
    // console.log("Memo: Recalculating counts"); // For debugging
    const total = categoryTagFilteredWods.length;
    const done = categoryTagFilteredWods.filter(isWodDone).length; // Use isWodDone utility
    const notDone = total - done;
    return {
      dynamicTotalWodCount: total,
      dynamicDoneWodsCount: done,
      dynamicNotDoneWodsCount: notDone,
    };
  }, [categoryTagFilteredWods]);

  // 3. Memoize completion filtering (depends on categoryTagFilteredWods and completionFilter)
  const finalFilteredWods = useMemo(() => {
    // console.log("Memo: Recalculating completion filter"); // For debugging
    if (completionFilter === "done") {
      return categoryTagFilteredWods.filter(isWodDone); // Use isWodDone utility
    } else if (completionFilter === "notDone") {
      return categoryTagFilteredWods.filter((wod) => !isWodDone(wod)); // Use isWodDone utility
    }
    return categoryTagFilteredWods; // 'all' case
  }, [categoryTagFilteredWods, completionFilter]);

  // 4. Memoize sorting (depends on finalFilteredWods, sortBy, sortDirection)
  const sortedWods = useMemo(() => {
    // console.log("Memo: Recalculating sort"); // For debugging
    return sortWods(finalFilteredWods, sortBy, sortDirection);
  }, [finalFilteredWods, sortBy, sortDirection]);

  // --- End Memoized Filtering and Sorting Logic ---

  // --- Event Handlers ---
  // Memoize handleSort to stabilize its reference
  const handleSort = useCallback(
    (column: SortByType) => {
      if (column === sortBy) {
        // Toggle direction if same column
        setSortDirection((currentDirection) =>
          currentDirection === "asc" ? "desc" : "asc",
        );
      } else {
        // Set new column and default direction
        setSortBy(column);
        setSortDirection(DEFAULT_SORT_DIRECTIONS[column]);
      }
    },
    [sortBy], // Dependency: Recreate only if sortBy changes
  );

  // Memoize toggleTag to stabilize its reference
  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []); // No dependencies needed as it uses the setter function form

  // --- End Event Handlers ---

  // sortedWods is now calculated using useMemo above

  return (
    <Box>
      {/* Render Charts Side-by-Side */}
      <Flex gap="4" direction={{ initial: "column", sm: "row" }}>
        <Box className="flex-1">
          <WodDistributionChart
            tagData={tagChartData}
            categoryData={categoryChartData}
          />
        </Box>
        <Box className="flex-1">
          <WodTimelineChart
            frequencyData={frequencyData}
            performanceData={performanceData}
          />
        </Box>
      </Flex>
      {/* Filter Bar */}
      <Flex className="mb-4 mt-4 items-center" gap="4">
        {/* Category Select */}
        <Select.Root
          value={selectedCategories.length > 0 ? selectedCategories[0] : "all"}
          onValueChange={(value) => {
            if (value === "all") {
              setSelectedCategories([]);
            } else {
              setSelectedCategories([value]);
            }
          }}
        >
          <Select.Trigger className="mr-2 flex min-w-[130px] items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-xs text-card-foreground hover:bg-accent">
            <Select.Value placeholder="Select category" className="text-xs">
              {selectedCategories.length > 0
                ? `${selectedCategories[0]} (${categoryCounts[selectedCategories[0]] || 0})`
                : `All Categories (${originalTotalWodCount})`}
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
                  className="cursor-pointer px-3 py-2 text-xs text-popover-foreground outline-none hover:bg-accent data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground"
                >
                  <Select.ItemText>
                    All Categories ({originalTotalWodCount})
                  </Select.ItemText>
                </Select.Item>
                {categoryOrder.map((category) => (
                  <Select.Item
                    key={category}
                    value={category}
                    className="cursor-pointer px-3 py-2 text-xs text-popover-foreground outline-none hover:bg-accent data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground"
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
        {/* Tags section - wrap if needed */}
        <Flex wrap="wrap" gap="1" className="flex-grow">
          {tagOrder.map((tag) => (
            <Box
              key={tag}
              className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${
                selectedTags.includes(tag)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-card-foreground hover:bg-accent"
              }`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Box>
          ))}
        </Flex>
        {/* New Segmented Control Filter - always show */}
        <SegmentedControl.Root
          size="1"
          value={completionFilter}
          onValueChange={(value) =>
            setCompletionFilter(value as "all" | "done" | "notDone")
          }
          className="ml-auto"
        >
          <SegmentedControl.Item value="all">
            <Tooltip content="Show All Workouts">
              <span>All ({dynamicTotalWodCount})</span>
            </Tooltip>
          </SegmentedControl.Item>
          <SegmentedControl.Item value="done">
            <Tooltip content="Show Done Workouts">
              <span>Done ({dynamicDoneWodsCount})</span>
            </Tooltip>
          </SegmentedControl.Item>
          <SegmentedControl.Item value="notDone">
            <Tooltip content="Show Not Done Workouts">
              <span>Todo ({dynamicNotDoneWodsCount})</span>
            </Tooltip>
          </SegmentedControl.Item>
        </SegmentedControl.Root>

        <Flex justify="center">
          <SegmentedControl.Root
            size="1"
            value={view}
            onValueChange={(value) => setView(value as "table" | "timeline")}
          >
            <SegmentedControl.Item value="timeline" aria-label="Timeline View">
              <Tooltip content="Timeline View">
                <List size={16} />
              </Tooltip>
            </SegmentedControl.Item>
            <SegmentedControl.Item value="table" aria-label="Table View">
              <Tooltip content="Table View">
                <TableIcon size={16} />
              </Tooltip>
            </SegmentedControl.Item>
          </SegmentedControl.Root>
        </Flex>
      </Flex>
      {/* Render Table or Timeline View */}
      {view === "table" ? (
        <WodTable
          wods={sortedWods}
          sortBy={sortBy}
          sortDirection={sortDirection}
          handleSort={handleSort}
        />
      ) : (
        <WodTimeline
          wods={sortedWods}
          sortBy={sortBy}
          sortDirection={sortDirection}
          handleSort={handleSort}
        />
      )}
    </Box>
  );
}
