"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import { api } from "~/trpc/react";
import { useSession } from "~/lib/auth-client";
import {
  Box,
  Flex,
  Tooltip,
  SegmentedControl,
  IconButton,
  DropdownMenu,
} from "@radix-ui/themes";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, ListFilter, ArrowUp, ArrowDown } from "lucide-react";
import WodTable from "./WodTable";
import WodListMobile from "./WodListMobile";
import { useMediaQuery } from "~/utils/useMediaQuery";
import { useWodViewerFilters } from "./hooks/useWodViewerFilters";
import { useWodViewerData } from "./hooks/useWodViewerData";

/**
 * Client-only wrapper for WodListMobile to ensure searchParams is read after hydration.
 * (Avoids duplicate import of useState/useEffect)
 */
function WodListMobileWrapper(
  props: Omit<
    React.ComponentProps<typeof WodListMobile>,
    "expandedWodIdFromUrl"
  >,
) {
  const [expandedWodIdFromUrl, setExpandedWodIdFromUrl] = useState<
    string | null
  >(null);

  const locationSearch =
    typeof window !== "undefined" ? window.location.search : "";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      // eslint-disable-next-line no-console
      console.log(
        "WodListMobileWrapper window.location.search",
        window.location.search,
        "expandedWodId:",
        params.get("expandedWodId"),
      );
      setExpandedWodIdFromUrl(params.get("expandedWodId"));
    }
  }, [locationSearch]);

  return (
    <WodListMobile {...props} expandedWodIdFromUrl={expandedWodIdFromUrl} />
  );
}
import {
  type Wod,
  type SortByType,
  type ScoreFromQuery,
  type Benchmarks,
  type WodCategory, // Import WodCategory
  BenchmarksSchema,
} from "~/types/wodTypes";

// --- URL State Management ---

interface WodViewerProps {
  initialWods: Wod[];
}

const DEFAULT_COMPLETION_FILTER = "all";
const DEFAULT_SORT_DIRECTIONS: Record<SortByType, "asc" | "desc"> = {
  wodName: "asc",
  date: "desc",
  difficulty: "asc",
  countLikes: "desc",
  results: "desc",
};

export default function WodViewer({ initialWods }: WodViewerProps) {
  // Runtime assertion: filter out any objects missing required fields
  const safeInitialWods: Wod[] = Array.isArray(initialWods)
    ? initialWods
        .filter((w) => typeof w.id === "string" && w.id.length > 0)
        .map((w) => ({
          id: w.id ?? "",
          wodName: w.wodName ?? "",
          wodUrl: w.wodUrl ?? null,
          description: w.description ?? null,
          benchmarks: (() => {
            if (!w.benchmarks) return null;
            const parsed = BenchmarksSchema.safeParse(w.benchmarks);
            // Ensure 'type' is present and valid *after* successful parsing
            if (
              parsed.success &&
              typeof parsed.data.type === "string" && // Check type exists and is string
              ["time", "rounds", "reps", "load"].includes(parsed.data.type) && // Check type is valid enum
              parsed.data.levels && // Check levels exist
              typeof parsed.data.levels === "object" && // Check levels is object
              ["elite", "advanced", "intermediate", "beginner"].every((lvl) => {
                const levelData =
                  parsed.data.levels[lvl as keyof typeof parsed.data.levels];
                return (
                  typeof levelData === "object" &&
                  levelData !== null &&
                  typeof levelData.min === "number" &&
                  typeof levelData.max === "number"
                );
              })
            ) {
              // Now we are sure it matches the Benchmarks type
              return parsed.data as Benchmarks; // Explicit cast after checks
            }
            // If parse failed OR type/levels validation failed, return null
            return null;
          })(),
          category:
            typeof w.category === "string" &&
            [
              "Girl",
              "Hero",
              "Games",
              "Open",
              "Quarterfinals",
              "AGOQ",
              "Benchmark",
              "Skill",
              "Other",
            ].includes(w.category)
              ? w.category
              : null,
          tags: Array.isArray(w.tags)
            ? w.tags
            : typeof w.tags === "string"
              ? [w.tags]
              : [],
          difficulty: w.difficulty ?? null,
          difficultyExplanation: w.difficultyExplanation ?? null,
          countLikes:
            typeof w.countLikes === "number"
              ? w.countLikes
              : w.countLikes === null || typeof w.countLikes === "undefined"
                ? null
                : Number(w.countLikes),
          movements: Array.isArray(w.movements)
            ? w.movements
            : typeof w.movements === "string"
              ? [w.movements]
              : [],
          timecap:
            typeof w.timecap === "number"
              ? w.timecap
              : w.timecap === null || typeof w.timecap === "undefined"
                ? null
                : Number(w.timecap),
          createdAt:
            typeof w.createdAt === "string"
              ? new Date(w.createdAt)
              : w.createdAt instanceof Date
                ? w.createdAt
                : new Date(),
          updatedAt:
            typeof w.updatedAt === "string"
              ? new Date(w.updatedAt)
              : w.updatedAt instanceof Date
                ? w.updatedAt
                : null,
        }))
    : [];
  if (safeInitialWods.length !== (initialWods?.length ?? 0)) {
    // eslint-disable-next-line no-console
    console.warn(
      "[WodViewer] Some initialWods are missing required fields and were filtered out.",
    );
  }

  const { data: session, isPending: isSessionLoading } = useSession();
  const isLoggedIn = !!session?.user;
  const isMobile = useMediaQuery("(max-width: 767px)");

  // tRPC utils for query invalidation
  const utils = api.useUtils();

  const {
    data: wodsData,
    isLoading: isLoadingWods,
    error: errorWods,
  } = api.wod.getAll.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: scoresData,
    isLoading: isLoadingScores,
    error: errorScores,
  } = api.score.getAllByUser.useQuery(undefined, {
    enabled: isLoggedIn,
  });

  // Use custom filter/sort/search hook
  // Start with empty arrays, will update after data loads
  const {
    selectedCategories,
    setSelectedCategories,
    selectedTags,
    setSelectedTags,
    completionFilter,
    setCompletionFilter,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    searchTerm,
    setSearchTerm,
  } = useWodViewerFilters(
    [], // will update after data loads
    [],
    isLoggedIn,
    DEFAULT_SORT_DIRECTIONS,
    DEFAULT_COMPLETION_FILTER,
  );

  // Normalize wodsData to Wod[] if present
  const safeWodsData: Wod[] | undefined = Array.isArray(wodsData)
    ? wodsData
        .filter((w) => typeof w.id === "string" && w.id.length > 0)
        .map((w) => ({
          id: w.id,
          wodName: w.wodName ?? "",
          wodUrl: w.wodUrl ?? null,
          description: w.description ?? null,
          benchmarks: (() => {
            if (!w.benchmarks) return null;
            const parsed = BenchmarksSchema.safeParse(w.benchmarks);
            // Ensure 'type' is present and valid *after* successful parsing
            if (
              parsed.success &&
              typeof parsed.data.type === "string" && // Check type exists and is string
              ["time", "rounds", "reps", "load"].includes(parsed.data.type) && // Check type is valid enum
              parsed.data.levels && // Check levels exist
              typeof parsed.data.levels === "object" && // Check levels is object
              ["elite", "advanced", "intermediate", "beginner"].every((lvl) => {
                const levelData =
                  parsed.data.levels[lvl as keyof typeof parsed.data.levels];
                return (
                  typeof levelData === "object" &&
                  levelData !== null &&
                  typeof levelData.min === "number" &&
                  typeof levelData.max === "number"
                );
              })
            ) {
              // Now we are sure it matches the Benchmarks type
              return parsed.data as Benchmarks; // Explicit cast after checks
            }
            // If parse failed OR type/levels validation failed, return null
            return null;
          })(),
          category:
            typeof w.category === "string" &&
            [
              "Girl",
              "Hero",
              "Games",
              "Open",
              "Quarterfinals",
              "AGOQ",
              "Benchmark",
              "Skill",
              "Other",
            ].includes(w.category)
              ? (w.category as WodCategory) // Re-added 'as WodCategory'
              : null,
          tags: w.tags ?? [],
          difficulty: w.difficulty ?? null,
          difficultyExplanation: w.difficultyExplanation ?? null,
          countLikes: w.countLikes ?? 0,
          movements: w.movements ?? [],
          timecap: w.timecap ?? null,
          createdAt:
            typeof w.createdAt === "string"
              ? new Date(w.createdAt)
              : (w.createdAt ?? new Date()),
          updatedAt:
            typeof w.updatedAt === "string"
              ? new Date(w.updatedAt)
              : (w.updatedAt ?? null),
        }))
    : undefined;

  // Use custom data transformation hook
  const {
    wods,
    scoresByWodId,
    categoryOrder,
    tagOrder,
    categoryCounts,
    originalTotalWodCount,
    dynamicTotalWodCount,
    dynamicDoneWodsCount,
    dynamicNotDoneWodsCount,
    sortedWods,
  } = useWodViewerData(
    safeWodsData,
    safeInitialWods,
    (scoresData ?? []) as ScoreFromQuery[],
    selectedCategories,
    selectedTags,
    completionFilter,
    sortBy,
    sortDirection,
    searchTerm,
  );

  // Sync filter state with available categories/tags from data
  // If selectedCategories/tags are no longer valid, reset them
  useEffect(() => {
    if (
      selectedCategories.length > 0 &&
      !categoryOrder.includes(selectedCategories[0] as WodCategory)
    ) {
      setSelectedCategories([]);
    }
    if (
      selectedTags.length > 0 &&
      selectedTags.some((tag) => !tagOrder.includes(tag))
    ) {
      setSelectedTags((prev) => prev.filter((tag) => tagOrder.includes(tag)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryOrder, tagOrder]);

  // Now, re-initialize the filter hook with the real categoryOrder/tagOrder
  // (This is a workaround; ideally, the filter hook would support dynamic updates)

  const filterBarRef = useRef<HTMLDivElement>(null);
  const [tableHeight, setTableHeight] = useState<number>(600);

  useLayoutEffect(() => {
    const calculateHeight = () => {
      if (filterBarRef.current) {
        const filterBarHeight = filterBarRef.current.offsetHeight;
        const TOTAL_VERTICAL_OFFSET = 64 + 24 + 16 + filterBarHeight + 16 + 32;

        const availableHeight = window.innerHeight - TOTAL_VERTICAL_OFFSET;
        setTableHeight(Math.max(300, availableHeight));
      }
    };

    calculateHeight();
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, [filterBarRef]);

  const handleSort = useCallback(
    (column: SortByType) => {
      if (column === sortBy) {
        setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(column);
        setSortDirection(DEFAULT_SORT_DIRECTIONS[column]);
      }
    },
    [sortBy, setSortBy, setSortDirection],
  );

  const toggleTag = useCallback(
    (tag: string) => {
      setSelectedTags((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
      );
    },
    [setSelectedTags],
  );

  // Invalidate scores after logging
  const handleScoreLogged = useCallback(() => {
    void utils.score.getAllByUser.invalidate();
  }, [utils.score.getAllByUser]);

  const showScoreLoading = isLoggedIn && (isLoadingScores || isSessionLoading);
  const showWodLoading = isLoadingWods && !wodsData && !initialWods;
  if (showWodLoading) {
    return (
      <Flex align="center" justify="center" className="h-[300px] w-full">
        Loading WOD data...
      </Flex>
    );
  }

  if (errorWods) {
    return <Box>Error loading WODs: {errorWods.message}</Box>;
  }
  if (isLoggedIn && errorScores) {
    return <Box>Error loading scores: {errorScores.message}</Box>;
  }

  if (!wods || wods.length === 0) {
    return <Box>No WOD data available.</Box>;
  }

  return (
    <Box>
      {/* Filter Bar */}
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
            value={
              selectedCategories.length > 0 ? selectedCategories[0] : "all"
            }
            onValueChange={(value) => {
              if (value === "all") {
                setSelectedCategories([]);
              } else if (
                [
                  "Girl",
                  "Hero",
                  "Games",
                  "Open",
                  "Quarterfinals",
                  "AGOQ",
                  "Benchmark",
                  "Skill",
                  "Other",
                ].includes(value)
              ) {
                setSelectedCategories([value as WodCategory]);
              } else {
                // fallback: ignore invalid value
                setSelectedCategories([]);
              }
            }}
          >
            <Select.Trigger
              className={`flex min-w-[120px] items-center justify-between rounded-md border border-border bg-card px-3 text-card-foreground hover:bg-accent ${
                isMobile ? "py-2 text-base" : "mr-2 py-2 text-xs"
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
                  {categoryOrder.map((category) => (
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
        </div>

        {/* Tag chips */}
        <div
          className={`${
            isMobile
              ? "scrollbar-thin scrollbar-thumb-slate-200 flex w-full gap-2 overflow-x-auto pb-1 pt-1"
              : "flex flex-grow flex-wrap gap-1"
          }`}
        >
          {tagOrder.map((tag) => (
            <Box
              key={tag}
              className={`cursor-pointer whitespace-nowrap rounded-full border transition-colors duration-150 ${
                selectedTags.includes(tag)
                  ? "border-blue-300 bg-blue-100 text-blue-700"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              } ${isMobile ? "px-4 py-1 text-sm font-medium" : "px-3 py-1 text-xs font-medium"}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Box>
          ))}
        </div>

        {/* SegmentedControl and Sort Button: On mobile, show in a row; on desktop, just SegmentedControl */}
        {isMobile ? (
          <div className="mt-2 flex w-full flex-row items-center gap-2">
            {/* SegmentedControl for completionFilter: only show if logged in */}
            {isLoggedIn && (
              <SegmentedControl.Root
                size="2"
                value={completionFilter}
                onValueChange={(value) =>
                  setCompletionFilter(value as "all" | "done" | "notDone")
                }
                className="flex-1"
              >
                <SegmentedControl.Item value="all" data-testid="segmented-all">
                  <Tooltip content="Show All Workouts">
                    <span className="text-base">
                      All ({dynamicTotalWodCount})
                    </span>
                  </Tooltip>
                </SegmentedControl.Item>
                <SegmentedControl.Item
                  value="done"
                  data-testid="segmented-done"
                >
                  <Tooltip content="Show Done Workouts">
                    <span className="text-base">
                      Done ({dynamicDoneWodsCount})
                    </span>
                  </Tooltip>
                </SegmentedControl.Item>
                <SegmentedControl.Item
                  value="notDone"
                  data-testid="segmented-todo"
                >
                  <Tooltip content="Show Not Done Workouts">
                    <span className="text-base">
                      Todo ({dynamicNotDoneWodsCount})
                    </span>
                  </Tooltip>
                </SegmentedControl.Item>
              </SegmentedControl.Root>
            )}
            {/* Sort DropdownMenu: always visible */}
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
          <SegmentedControl.Root
            size="1"
            value={completionFilter}
            onValueChange={(value) =>
              setCompletionFilter(value as "all" | "done" | "notDone")
            }
            className="ml-auto"
          >
            <SegmentedControl.Item value="all" data-testid="segmented-all">
              <Tooltip content="Show All Workouts">
                <span>All ({dynamicTotalWodCount})</span>
              </Tooltip>
            </SegmentedControl.Item>
            <SegmentedControl.Item value="done" data-testid="segmented-done">
              <Tooltip content="Show Done Workouts">
                <span>Done ({dynamicDoneWodsCount})</span>
              </Tooltip>
            </SegmentedControl.Item>
            <SegmentedControl.Item value="notDone" data-testid="segmented-todo">
              <Tooltip content="Show Not Done Workouts">
                <span>Todo ({dynamicNotDoneWodsCount})</span>
              </Tooltip>
            </SegmentedControl.Item>
          </SegmentedControl.Root>
        )}
      </div>

      {/* Conditionally render card list or table */}
      {isMobile ? (
        <WodListMobileWrapper
          wods={sortedWods}
          scoresByWodId={scoresByWodId}
          searchTerm={searchTerm}
          onScoreLogged={handleScoreLogged}
        />
      ) : (
        <WodTable
          wods={sortedWods}
          tableHeight={tableHeight}
          sortBy={sortBy}
          sortDirection={sortDirection}
          handleSort={handleSort}
          searchTerm={searchTerm}
          scoresByWodId={scoresByWodId}
          _isLoadingScores={showScoreLoading} // Renamed prop
          onScoreLogged={handleScoreLogged}
        />
      )}
    </Box>
  );
}
