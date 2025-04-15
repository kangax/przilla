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
import { Box, Flex, Tooltip, SegmentedControl } from "@radix-ui/themes";
import * as Select from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import WodTable from "./WodTable";
import WodListMobile from "./WodListMobile";
import { useMediaQuery } from "../../utils/useMediaQuery";
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
  initialWods: Wod[];
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
    const urlParams: Record<string, string> = {};

    const validCategoryForUrl =
      selectedCategories.length > 0 &&
      categoryOrder.includes(selectedCategories[0])
        ? selectedCategories[0]
        : null;

    if (validCategoryForUrl) {
      urlParams.category = validCategoryForUrl;
    }

    const validTagsForUrl = selectedTags.filter((tag) =>
      tagOrder.includes(tag),
    );
    if (validTagsForUrl.length > 0) {
      urlParams.tags = selectedTags.join(",");
    }

    if (completionFilter !== DEFAULT_COMPLETION_FILTER) {
      urlParams.completion = completionFilter;
    }

    if (sortBy !== "date") {
      urlParams.sortBy = sortBy;
    }

    const defaultSortDir = DEFAULT_SORT_DIRECTIONS[sortBy];
    if (sortDirection !== defaultSortDir) {
      urlParams.sortDir = sortDirection;
    }

    if (searchTerm) {
      urlParams.search = searchTerm;
    }

    const sortedKeys = Object.keys(urlParams).sort();
    const params = new URLSearchParams();
    sortedKeys.forEach((key) => {
      params.set(key, urlParams[key]);
    });

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
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`placeholder:text-muted-foreground rounded border border-input bg-background px-3 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
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

        {isLoggedIn && (
          <SegmentedControl.Root
            size={isMobile ? "2" : "1"}
            value={completionFilter}
            onValueChange={(value) =>
              setCompletionFilter(value as "all" | "done" | "notDone")
            }
            className={`${isMobile ? "mt-2 w-full" : "ml-auto"}`}
          >
            <SegmentedControl.Item value="all">
              <Tooltip content="Show All Workouts">
                <span className={isMobile ? "text-base" : ""}>
                  All ({dynamicTotalWodCount})
                </span>
              </Tooltip>
            </SegmentedControl.Item>
            <SegmentedControl.Item value="done">
              <Tooltip content="Show Done Workouts">
                <span className={isMobile ? "text-base" : ""}>
                  Done ({dynamicDoneWodsCount})
                </span>
              </Tooltip>
            </SegmentedControl.Item>
            <SegmentedControl.Item value="notDone">
              <Tooltip content="Show Not Done Workouts">
                <span className={isMobile ? "text-base" : ""}>
                  Todo ({dynamicNotDoneWodsCount})
                </span>
              </Tooltip>
            </SegmentedControl.Item>
          </SegmentedControl.Root>
        )}
      </div>

      {/* Conditionally render card list or table */}
      {isMobile ? (
        <WodListMobile
          wods={sortedWods}
          scoresByWodId={scoresByWodId}
          searchTerm={searchTerm}
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
