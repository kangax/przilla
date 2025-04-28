"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { api } from "~/trpc/react";
import { useSession } from "~/lib/auth-client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  }, [typeof window !== "undefined" && window.location.search]);

  return (
    <WodListMobile {...props} expandedWodIdFromUrl={expandedWodIdFromUrl} />
  );
}
import {
  type Wod,
  type Score,
  type SortByType,
  type WodFromQuery,
  type ScoreFromQuery,
  type Benchmarks,
} from "~/types/wodTypes";
import { sortWods, isWodDone, parseTags } from "~/utils/wodUtils";

// --- URL State Management ---

interface WodViewerProps {
  initialWods: WodFromQuery[];
}

const DEFAULT_COMPLETION_FILTER = "all";
const ALLOWED_COMPLETION_STATUSES: ReadonlyArray<"all" | "done" | "notDone"> = [
  "all",
  "done",
  "notDone",
];

const isValidCompletionStatus = (
  status: string | null,
): status is "all" | "done" | "notDone" => {
  return ALLOWED_COMPLETION_STATUSES.includes(
    status as "all" | "done" | "notDone",
  );
};

const isValidSortBy = (sortBy: string | null): sortBy is SortByType => {
  const validSortKeys: SortByType[] = [
    "wodName",
    "date",
    "difficulty",
    "countLikes",
    "results",
  ];
  return validSortKeys.includes(sortBy as SortByType);
};

const isValidSortDirection = (dir: string | null): dir is "asc" | "desc" => {
  return dir === "asc" || dir === "desc";
};

const DEFAULT_SORT_DIRECTIONS: Record<SortByType, "asc" | "desc"> = {
  wodName: "asc",
  date: "desc",
  difficulty: "asc",
  countLikes: "desc",
  results: "desc",
};

export default function WodViewer({ initialWods }: WodViewerProps) {
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

  const wods = useMemo(() => {
    const dataToProcess =
      (wodsData as WodFromQuery[] | undefined) ?? initialWods ?? [];
    return dataToProcess.map((wod: WodFromQuery) => ({
      id: wod.id,
      wodUrl: wod.wodUrl,
      wodName: wod.wodName,
      description: wod.description,
      category: wod.category,
      difficulty: wod.difficulty,
      difficultyExplanation: wod.difficultyExplanation,
      countLikes: wod.countLikes,
      /**
       * Time cap for the workout, in seconds (nullable, from DB)
       */
      timecap: wod.timecap ?? null,
      createdAt:
        wod.createdAt instanceof Date
          ? wod.createdAt
          : new Date(wod.createdAt ?? Date.now()),
      updatedAt:
        wod.updatedAt instanceof Date
          ? wod.updatedAt
          : wod.updatedAt
            ? new Date(wod.updatedAt)
            : null,
      tags: parseTags(wod.tags),
      benchmarks:
        typeof wod.benchmarks === "string"
          ? (JSON.parse(wod.benchmarks) as Benchmarks | null)
          : wod.benchmarks,
    })) as Wod[];
  }, [wodsData, initialWods]);

  const scoresByWodId = useMemo(() => {
    if (!scoresData) return {};
    const processedScores = (scoresData as ScoreFromQuery[] | undefined)?.map(
      (score: ScoreFromQuery) => ({
        id: score.id,
        userId: score.userId,
        wodId: score.wodId,
        time_seconds: score.time_seconds,
        reps: score.reps,
        load: score.load,
        rounds_completed: score.rounds_completed,
        partial_reps: score.partial_reps,
        isRx: score.isRx,
        notes: score.notes,
        scoreDate:
          score.scoreDate instanceof Date
            ? score.scoreDate
            : new Date(score.scoreDate),
        createdAt:
          score.createdAt instanceof Date
            ? score.createdAt
            : new Date(score.createdAt),
        updatedAt:
          score.updatedAt instanceof Date
            ? score.updatedAt
            : score.updatedAt
              ? new Date(score.updatedAt)
              : null,
      }),
    ) as Score[];

    return (processedScores ?? []).reduce(
      (acc, score) => {
        if (!acc[score.wodId]) {
          acc[score.wodId] = [];
        }
        acc[score.wodId].push(score);
        acc[score.wodId].sort(
          (a, b) => b.scoreDate.getTime() - a.scoreDate.getTime(),
        );
        return acc;
      },
      {} as Record<string, Score[]>,
    );
  }, [scoresData]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filterBarRef = useRef<HTMLDivElement>(null);
  const [tableHeight, setTableHeight] = useState<number>(600);

  const categoryOrder = useMemo(() => {
    if (!wods) return [];
    const categories = new Set(wods.map((wod) => wod.category).filter(Boolean));
    return Array.from(categories).sort();
  }, [wods]);

  const tagOrder = useMemo(() => {
    if (!wods) return [];
    const tags = new Set(wods.flatMap((wod) => wod.tags).filter(Boolean));
    return Array.from(tags).sort();
  }, [wods]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const urlCategory = searchParams.get("category");
    return urlCategory ? [urlCategory] : [];
  });

  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    const urlTags = searchParams.get("tags");
    return urlTags ? urlTags.split(",") : [];
  });

  const [completionFilter, setCompletionFilter] = useState<
    "all" | "done" | "notDone"
  >(() => {
    const urlCompletion = searchParams.get("completion");
    return isValidCompletionStatus(urlCompletion)
      ? urlCompletion
      : DEFAULT_COMPLETION_FILTER;
  });

  const [sortBy, setSortBy] = useState<SortByType>(() => {
    const urlSortBy = searchParams.get("sortBy");
    return isValidSortBy(urlSortBy) ? urlSortBy : "date";
  });

  // If not logged in and sortBy is "results", reset to "date"
  useEffect(() => {
    if (!isLoggedIn && sortBy === "results") {
      setSortBy("date");
    }
  }, [isLoggedIn, sortBy]);

  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(() => {
    const urlSortDir = searchParams.get("sortDir");
    if (isValidSortDirection(urlSortDir)) {
      return urlSortDir;
    }
    return DEFAULT_SORT_DIRECTIONS[sortBy];
  });

  const [searchTerm, setSearchTerm] = useState<string>(() => {
    return searchParams.get("search") ?? "";
  });

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

  useEffect(() => {
    // Start with all current params, so we preserve unknown ones (like expandedWodId)
    const params = new URLSearchParams(searchParams.toString());

    // Overwrite with known filter/sort params
    const validCategoryForUrl =
      selectedCategories.length > 0 &&
      categoryOrder.includes(selectedCategories[0])
        ? selectedCategories[0]
        : null;

    if (validCategoryForUrl) {
      params.set("category", validCategoryForUrl);
    } else {
      params.delete("category");
    }

    const validTagsForUrl = selectedTags.filter((tag) =>
      tagOrder.includes(tag),
    );
    if (validTagsForUrl.length > 0) {
      params.set("tags", selectedTags.join(","));
    } else {
      params.delete("tags");
    }

    if (completionFilter !== DEFAULT_COMPLETION_FILTER) {
      params.set("completion", completionFilter);
    } else {
      params.delete("completion");
    }

    if (sortBy !== "date") {
      params.set("sortBy", sortBy);
    } else {
      params.delete("sortBy");
    }

    const defaultSortDir = DEFAULT_SORT_DIRECTIONS[sortBy];
    if (sortDirection !== defaultSortDir) {
      params.set("sortDir", sortDirection);
    } else {
      params.delete("sortDir");
    }

    if (searchTerm) {
      params.set("search", searchTerm);
    } else {
      params.delete("search");
    }

    const currentSearch = searchParams.toString();
    const newSearch = params.toString();

    if (newSearch !== currentSearch) {
      router.replace(`${pathname}?${newSearch}`, { scroll: false });
    }
  }, [
    selectedCategories,
    categoryOrder,
    selectedTags,
    tagOrder,
    completionFilter,
    sortBy,
    sortDirection,
    searchTerm,
    pathname,
    router,
    searchParams,
    isLoggedIn,
  ]);

  const categoryCounts = useMemo(() => {
    return wods.reduce(
      (acc, wod) => {
        if (wod.category) {
          acc[wod.category] = (acc[wod.category] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [wods]);

  const originalTotalWodCount = useMemo(() => wods.length, [wods]);

  const validSelectedCategories = useMemo(() => {
    return selectedCategories.length > 0 &&
      categoryOrder.includes(selectedCategories[0])
      ? selectedCategories
      : [];
  }, [selectedCategories, categoryOrder]);

  const validSelectedTags = useMemo(() => {
    return selectedTags.filter((tag) => tagOrder.includes(tag));
  }, [selectedTags, tagOrder]);

  const searchedWods = useMemo(() => {
    if (!searchTerm) return wods;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return wods.filter(
      (wod) =>
        wod.wodName?.toLowerCase().includes(lowerCaseSearchTerm) ||
        wod.description?.toLowerCase().includes(lowerCaseSearchTerm) ||
        wod.category?.toLowerCase().includes(lowerCaseSearchTerm) ||
        wod.tags.some((tag) => tag.toLowerCase().includes(lowerCaseSearchTerm)),
    );
  }, [wods, searchTerm]);

  const categoryTagFilteredWods = useMemo(() => {
    return searchedWods.filter((wod) => {
      const categoryMatch =
        validSelectedCategories.length === 0 ||
        (wod.category && validSelectedCategories.includes(wod.category));
      const tagMatch =
        validSelectedTags.length === 0 ||
        wod.tags.some((tag) => validSelectedTags.includes(tag));
      return categoryMatch && tagMatch;
    });
  }, [searchedWods, validSelectedCategories, validSelectedTags]);

  const {
    dynamicTotalWodCount,
    dynamicDoneWodsCount,
    dynamicNotDoneWodsCount,
  } = useMemo(() => {
    const total = categoryTagFilteredWods.length;
    const done = categoryTagFilteredWods.filter((wod) =>
      isWodDone(wod, scoresByWodId[wod.id]),
    ).length;
    return {
      dynamicTotalWodCount: total,
      dynamicDoneWodsCount: done,
      dynamicNotDoneWodsCount: total - done,
    };
  }, [categoryTagFilteredWods, scoresByWodId]);

  const finalFilteredWods = useMemo(() => {
    if (completionFilter === "done") {
      return categoryTagFilteredWods.filter((wod) =>
        isWodDone(wod, scoresByWodId[wod.id]),
      );
    } else if (completionFilter === "notDone") {
      return categoryTagFilteredWods.filter(
        (wod) => !isWodDone(wod, scoresByWodId[wod.id]),
      );
    }
    return categoryTagFilteredWods;
  }, [categoryTagFilteredWods, completionFilter, scoresByWodId]);

  const sortedWods = useMemo(() => {
    return sortWods(finalFilteredWods, sortBy, sortDirection, scoresByWodId);
  }, [finalFilteredWods, sortBy, sortDirection, scoresByWodId]);

  const handleSort = useCallback(
    (column: SortByType) => {
      if (column === sortBy) {
        setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(column);
        setSortDirection(DEFAULT_SORT_DIRECTIONS[column]);
      }
    },
    [sortBy],
  );

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

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
              } else {
                setSelectedCategories([value]);
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
          isLoadingScores={showScoreLoading}
          onScoreLogged={handleScoreLogged}
        />
      )}
    </Box>
  );
}
