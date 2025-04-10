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
import { useSession } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, Flex, Tooltip, SegmentedControl } from "@radix-ui/themes";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, TableIcon } from "lucide-react";
import WodTable from "./WodTable";
import { type Wod, type Score, type SortByType } from "~/types/wodTypes";
import { sortWods, isWodDone, parseTags } from "~/utils/wodUtils";

// --- URL State Management ---
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
    "level",
    "attempts",
    "latestLevel",
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

export default function WodViewer() {
  const { status: sessionStatus } = useSession();
  const isLoggedIn = sessionStatus === "authenticated";

  const {
    data: wodsData,
    isLoading: isLoadingWods,
    error: errorWods,
  } = api.wod.getAll.useQuery();

  const {
    data: scoresData,
    isLoading: isLoadingScores,
    error: errorScores,
  } = api.score.getAllByUser.useQuery(undefined, {
    enabled: isLoggedIn,
  });

  const wods = useMemo(() => {
    return (wodsData ?? []).map((wod) => ({
      ...wod,
      createdAt: wod.createdAt ? new Date(wod.createdAt) : new Date(),
      updatedAt: wod.updatedAt ? new Date(wod.updatedAt) : null,
      tags: parseTags(wod.tags),
      benchmarks:
        typeof wod.benchmarks === "string"
          ? (JSON.parse(wod.benchmarks) as Wod["benchmarks"])
          : wod.benchmarks,
    })) as Wod[];
  }, [wodsData]);

  const scoresByWodId = useMemo(() => {
    if (!scoresData) return {};
    const processedScores = scoresData.map((score) => ({
      ...score,
      scoreDate: new Date(score.scoreDate),
      createdAt: new Date(score.createdAt),
      updatedAt: score.updatedAt ? new Date(score.updatedAt) : null,
    })) as Score[];

    return processedScores.reduce(
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
        const TOTAL_VERTICAL_OFFSET =
          64 + // HEADER_HEIGHT_ESTIMATE
          24 + // PAGE_CONTAINER_PADDING_TOP
          16 + // FILTER_BAR_MARGIN_TOP
          filterBarHeight +
          16 + // FILTER_BAR_MARGIN_BOTTOM
          32; // PAGE_CONTAINER_PADDING_BOTTOM

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

  /* Filtering and sorting logic remains the same */
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

  if (isLoadingWods || (isLoggedIn && isLoadingScores)) {
    return <Box>Loading data...</Box>;
  }

  if (errorWods) {
    return <Box>Error loading WODs: {errorWods.message}</Box>;
  }

  if (isLoggedIn && errorScores) {
    return <Box>Error loading scores: {errorScores.message}</Box>;
  }

  if (!wods) {
    return <Box>No WOD data available.</Box>;
  }

  return (
    <Box>
      {/* Filter Bar */}
      <Flex ref={filterBarRef} className="mb-4 mt-4 items-center" gap="2">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="placeholder:text-muted-foreground w-40 rounded border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />

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
          <Select.Trigger className="mr-2 flex min-w-[150px] items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-xs text-card-foreground hover:bg-accent">
            <Select.Value placeholder="Select category" className="text-xs">
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
                  className="cursor-pointer px-3 py-2 text-xs text-popover-foreground outline-none hover:bg-accent data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground"
                >
                  <Select.ItemText>
                    All ({originalTotalWodCount})
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

        {isLoggedIn && (
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
        )}
      </Flex>

      {/* Render only WodTable */}
      <WodTable
        wods={sortedWods}
        tableHeight={tableHeight}
        sortBy={sortBy}
        sortDirection={sortDirection}
        handleSort={handleSort}
        searchTerm={searchTerm}
        scoresByWodId={scoresByWodId}
      />
    </Box>
  );
}
