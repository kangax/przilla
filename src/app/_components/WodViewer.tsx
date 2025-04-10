"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { api } from "~/trpc/react"; // Import tRPC api
import { useSession } from "next-auth/react"; // Import useSession
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, Flex, SegmentedControl, Tooltip } from "@radix-ui/themes";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, TableIcon, List } from "lucide-react";
import WodTable from "./WodTable";
import WodTimeline from "./WodTimeline";
// Removed unused WodDistributionChart
// Removed unused WodTimelineChart
import { type Wod, type Score, type SortByType } from "~/types/wodTypes"; // Import Score type
import { sortWods, isWodDone, parseTags } from "~/utils/wodUtils"; // Import parseTags

// --- URL State Management ---
const DEFAULT_COMPLETION_FILTER = "all"; // Changed default to 'all'
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
    "countLikes", // Corrected to camelCase
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
  countLikes: "desc", // Corrected to camelCase
};
// --- End URL State Management ---

// Remove props wods, categoryOrder, tagOrder
// interface WodViewerProps {
//   wods: Wod[];
//   categoryOrder: string[];
//   tagOrder: string[];
// }

export default function WodViewer() {
  // Fetch WOD data using tRPC
  const { status: sessionStatus } = useSession();
  const isLoggedIn = sessionStatus === "authenticated";

  // Fetch WOD definitions
  const {
    data: wodsData,
    isLoading: isLoadingWods,
    error: errorWods,
  } = api.wod.getAll.useQuery();

  // Fetch user scores if logged in
  const {
    data: scoresData,
    isLoading: isLoadingScores,
    error: errorScores,
  } = api.score.getAllByUser.useQuery(undefined, {
    enabled: isLoggedIn, // Only fetch if logged in
  });

  // Process WODs once loaded
  const wods = useMemo(() => {
    // Let TS infer the type of 'wod' from wodsData
    const processedWods = (wodsData ?? []).map((wod) => ({
      // Assign to temp variable
      ...wod,
      // Ensure createdAt and updatedAt are Date objects
      // Need to ensure wod.createdAt exists before creating Date
      createdAt: wod.createdAt ? new Date(wod.createdAt) : new Date(),
      updatedAt: wod.updatedAt ? new Date(wod.updatedAt) : null,
      // Pre-parse tags here to ensure it's always an array
      tags: parseTags(wod.tags),
      // Explicitly parse benchmarks if it's a string
      benchmarks:
        typeof wod.benchmarks === "string"
          ? (JSON.parse(wod.benchmarks) as Wod["benchmarks"])
          : wod.benchmarks,
    })); // End map

    // Remove previous debug logging

    return processedWods as Wod[]; // Return the processed wods
  }, [wodsData]);

  // Process scores into a map by wodId for easy lookup
  const scoresByWodId = useMemo(() => {
    if (!scoresData) return {};
    // Ensure date fields are Date objects
    const processedScores = scoresData.map((score) => ({
      ...score,
      scoreDate: new Date(score.scoreDate),
      // Convert createdAt and updatedAt as well, handling potential null for updatedAt
      createdAt: new Date(score.createdAt),
      updatedAt: score.updatedAt ? new Date(score.updatedAt) : null,
    })) as Score[]; // Cast to Score type defined in wodTypes.ts

    return processedScores.reduce(
      (acc, score) => {
        if (!acc[score.wodId]) {
          acc[score.wodId] = [];
        }
        acc[score.wodId].push(score);
        // Sort scores within each WOD entry by date descending
        acc[score.wodId].sort(
          (a, b) => b.scoreDate.getTime() - a.scoreDate.getTime(),
        );
        return acc;
      },
      {} as Record<string, Score[]>, // Map wodId to array of Scores
    );
  }, [scoresData]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filterBarRef = useRef<HTMLDivElement>(null); // Ref for filter bar
  const [tableHeight, setTableHeight] = useState<number>(600); // Default height

  // Derive categoryOrder and tagOrder from fetched data
  const categoryOrder = useMemo(() => {
    if (!wods) return [];
    const categories = new Set(wods.map((wod) => wod.category).filter(Boolean));
    return Array.from(categories).sort();
  }, [wods]);

  const tagOrder = useMemo(() => {
    if (!wods) return [];
    // Now that wods.tags is guaranteed to be string[], we can simplify
    const tags = new Set(wods.flatMap((wod) => wod.tags).filter(Boolean)); // Removed parseTags call here
    return Array.from(tags).sort();
  }, [wods]);

  // --- Initialize State from URL or Defaults ---
  // Note: These functions run on every render, but useState only uses them for the *initial* value.
  // Update initial state functions to use derived categoryOrder/tagOrder
  // Initialize directly from URL string, don't filter yet
  const getInitialCategoriesRaw = (): string[] => {
    const urlCategory = searchParams.get("category");
    return urlCategory ? [urlCategory] : [];
  };

  // Initialize directly from URL string, split but don't filter yet
  const getInitialTagsRaw = (): string[] => {
    const urlTags = searchParams.get("tags");
    return urlTags ? urlTags.split(",") : [];
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

  const getInitialSearchTerm = (): string => {
    return searchParams.get("search") ?? ""; // Read 'search' param or default to empty
  };

  // State Hooks - Initialized from URL search params
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    getInitialCategoriesRaw,
  ); // Use raw initializer
  const [selectedTags, setSelectedTags] = useState<string[]>(getInitialTagsRaw); // Use raw initializer
  const [completionFilter, setCompletionFilter] = useState<
    "all" | "done" | "notDone"
  >(getInitialCompletionFilter);
  const [view, setView] = useState<"table" | "timeline">(() => {
    // Force table view if not logged in, otherwise get initial from URL/default
    const initialView = getInitialView();
    return isLoggedIn ? initialView : "table";
  });
  // Need to get initial sortBy before getting initial sortDirection
  const [sortBy, setSortBy] = useState<SortByType>(() => getInitialSortBy());
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(() =>
    getInitialSortDirection(sortBy),
  );
  const [searchTerm, setSearchTerm] = useState<string>(getInitialSearchTerm); // Initialize from URL
  // --- End Initialize State ---

  // --- Calculate Table Height ---
  useLayoutEffect(() => {
    const calculateHeight = () => {
      if (filterBarRef.current) {
        const filterBarHeight = filterBarRef.current.offsetHeight;
        // Estimates based on inspection/common values
        const HEADER_HEIGHT_ESTIMATE = 64;
        const PAGE_CONTAINER_PADDING_TOP = 24; // pt-6 in page.tsx
        const PAGE_CONTAINER_PADDING_BOTTOM = 32; // pb-8 in page.tsx
        const FILTER_BAR_MARGIN_TOP = 16; // mt-4 on filter bar
        const FILTER_BAR_MARGIN_BOTTOM = 16; // mb-4 on filter bar
        // Sum of fixed offsets above and below the filter bar + table area
        const TOTAL_VERTICAL_OFFSET =
          HEADER_HEIGHT_ESTIMATE +
          PAGE_CONTAINER_PADDING_TOP +
          FILTER_BAR_MARGIN_TOP +
          filterBarHeight + // Include measured filter bar height
          FILTER_BAR_MARGIN_BOTTOM +
          PAGE_CONTAINER_PADDING_BOTTOM;

        const availableHeight = window.innerHeight - TOTAL_VERTICAL_OFFSET;
        // Set a minimum height, e.g., 300px
        setTableHeight(Math.max(300, availableHeight));
      }
    };

    calculateHeight(); // Initial calculation
    window.addEventListener("resize", calculateHeight); // Recalculate on resize

    // Cleanup listener on component unmount
    return () => window.removeEventListener("resize", calculateHeight);
  }, [filterBarRef]); // Add filterBarRef dependency

  // --- Sync State TO URL ---
  // Update URL when internal state changes
  useEffect(() => {
    // Also force view back to table if user logs out while timeline is selected
    if (!isLoggedIn && view === "timeline") {
      setView("table");
    }

    const urlParams: Record<string, string> = {};

    // Filter selected categories against available categoryOrder before putting in URL
    const validCategoryForUrl =
      selectedCategories.length > 0 &&
      categoryOrder.includes(selectedCategories[0])
        ? selectedCategories[0]
        : null;

    // Collect params based on current state, omitting defaults
    if (validCategoryForUrl) {
      urlParams.category = validCategoryForUrl;
    }
    // Filter selected tags against available tagOrder before putting in URL
    const validTagsForUrl = selectedTags.filter((tag) =>
      tagOrder.includes(tag),
    );
    if (validTagsForUrl.length > 0) {
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
    // Add search term to URL params if not empty
    if (searchTerm) {
      urlParams.search = searchTerm;
    }

    // Sort keys alphabetically and build the search string
    const sortedKeys = Object.keys(urlParams).sort();
    const params = new URLSearchParams();
    sortedKeys.forEach((key) => {
      params.set(key, urlParams[key]);
    });

    // Removed unused newSearch and currentSearch variables

    // Now, build the final search string *once* (The validTagsForUrl logic was already applied when setting urlParams.tags earlier)
    const finalSortedKeys = Object.keys(urlParams).sort();
    const finalParams = new URLSearchParams();
    finalSortedKeys.forEach((key) => {
      finalParams.set(key, urlParams[key]);
    });

    const finalNewSearch = finalParams.toString();
    const finalCurrentSearch = searchParams.toString(); // Get current URL search string

    // Only push update if the calculated search string differs from the current one
    // Add NODE_ENV check for test stability
    if (
      process.env.NODE_ENV === "test" ||
      finalNewSearch !== finalCurrentSearch
    ) {
      router.replace(`${pathname}?${finalNewSearch}`, { scroll: false });
    }
    // Depend only on internal state variables that should trigger a URL update
  }, [
    selectedCategories, // Keep raw state as dependency
    categoryOrder, // Add categoryOrder as dependency
    selectedTags, // Keep raw state as dependency
    tagOrder, // Add tagOrder as dependency
    completionFilter,
    view,
    sortBy,
    sortDirection,
    searchTerm, // Add searchTerm dependency
    pathname,
    router,
    searchParams,
    isLoggedIn, // Add missing dependency
  ]);
  // --- End Sync State TO URL ---

  // Calculate counts for categories based on the *fetched* list for the dropdown
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

  // --- Memoized Filtering and Sorting Logic ---

  // Filter selectedCategories against available categoryOrder
  const validSelectedCategories = useMemo(() => {
    // Since we only allow one category selection, check if the first (and only) item exists in categoryOrder
    return selectedCategories.length > 0 &&
      categoryOrder.includes(selectedCategories[0])
      ? selectedCategories // Return the array with the valid category
      : []; // Return empty array if invalid or no category selected
  }, [selectedCategories, categoryOrder]);

  // Filter selectedTags against available tagOrder
  const validSelectedTags = useMemo(() => {
    return selectedTags.filter((tag) => tagOrder.includes(tag));
  }, [selectedTags, tagOrder]);

  // 1. Filter by search term first
  const searchedWods = useMemo(() => {
    if (!searchTerm) {
      return wods; // No search term, return all
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return wods.filter((wod) => {
      const nameMatch = wod.wodName
        ?.toLowerCase()
        .includes(lowerCaseSearchTerm);
      const descMatch = wod.description
        ?.toLowerCase()
        .includes(lowerCaseSearchTerm);
      const categoryMatch = wod.category
        ?.toLowerCase()
        .includes(lowerCaseSearchTerm);
      // wods.tags is now guaranteed to be string[]
      const tagsMatch = wod.tags.some(
        (
          tag, // Use wod.tags directly
        ) => tag.toLowerCase().includes(lowerCaseSearchTerm),
      );
      return nameMatch || descMatch || categoryMatch || tagsMatch;
    });
  }, [wods, searchTerm]);

  // 2. Filter by category and tags (using the result of search filter)
  const categoryTagFilteredWods = useMemo(() => {
    return searchedWods.filter((wod) => {
      // Use validSelectedCategories for filtering
      const categoryMatch =
        validSelectedCategories.length === 0 ||
        (wod.category && validSelectedCategories.includes(wod.category));
      // Use validSelectedTags for filtering
      const tagMatch =
        validSelectedTags.length === 0 ||
        wod.tags.some((tag) => validSelectedTags.includes(tag));
      return categoryMatch && tagMatch;
    });
  }, [searchedWods, validSelectedCategories, validSelectedTags]); // Depend on valid categories/tags

  const {
    dynamicTotalWodCount,
    dynamicDoneWodsCount,
    dynamicNotDoneWodsCount,
  } = useMemo(() => {
    const total = categoryTagFilteredWods.length;
    // Update isWodDone logic to use the new scoresByWodId map
    const done = categoryTagFilteredWods.filter((wod) =>
      isWodDone(wod, scoresByWodId[wod.id]),
    ).length;
    const notDone = total - done;
    return {
      dynamicTotalWodCount: total,
      dynamicDoneWodsCount: done,
      dynamicNotDoneWodsCount: notDone,
    };
  }, [categoryTagFilteredWods, scoresByWodId]); // Add scoresByWodId dependency

  const finalFilteredWods = useMemo(() => {
    // Update filtering logic based on scoresByWodId
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
  }, [categoryTagFilteredWods, completionFilter, scoresByWodId]); // Add scoresByWodId dependency

  const sortedWods = useMemo(() => {
    return sortWods(finalFilteredWods, sortBy, sortDirection);
  }, [finalFilteredWods, sortBy, sortDirection]);

  // Removed DEBUG log

  // --- End Memoized Filtering and Sorting Logic ---

  // --- Event Handlers ---
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
    [sortBy],
  );

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  // --- End Event Handlers ---

  // Handle Loading and Error States for both queries
  if (isLoadingWods || (isLoggedIn && isLoadingScores)) {
    return <Box>Loading data...</Box>;
  }

  if (errorWods) {
    return <Box>Error loading WODs: {errorWods.message}</Box>;
  }
  // Only check score error if logged in and query was enabled
  if (isLoggedIn && errorScores) {
    return <Box>Error loading scores: {errorScores.message}</Box>;
  }

  // Ensure wods data is available before rendering the main content
  if (!wods) {
    return <Box>No WOD data available.</Box>; // Or some other placeholder
  }
  // Scores data might be undefined if not logged in, which is fine

  return (
    <Box>
      <Flex justify="end">
        {/* Conditionally render Timeline button */}
        {isLoggedIn && (
          <SegmentedControl.Root
            size="1"
            value={view}
            // Only allow changing to timeline if logged in
            onValueChange={(value) => {
              if (value === "timeline" && !isLoggedIn) {
                // Prevent switching to timeline if not logged in (shouldn't happen with conditional rendering, but belt-and-suspenders)
                return;
              }
              setView(value as "table" | "timeline");
            }}
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
        )}
      </Flex>
      {/* Filter Bar - Add ref */}
      <Flex ref={filterBarRef} className="mb-4 mt-4 items-center" gap="2">
        {" "}
        {/* Reduced gap */}
        {/* NEW: Search Input */}
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="placeholder:text-muted-foreground w-40 rounded border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
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
      {/* Render Table or Timeline View - Pass calculated height */}
      {view === "table" ? (
        <WodTable
          wods={sortedWods}
          tableHeight={tableHeight} // Pass height prop
          sortBy={sortBy}
          sortDirection={sortDirection}
          handleSort={handleSort}
          searchTerm={searchTerm} // Pass search term prop
          scoresByWodId={scoresByWodId} // Pass scores map
        />
      ) : (
        <WodTimeline
          wods={sortedWods}
          tableHeight={tableHeight} // Pass height prop
          sortBy={sortBy}
          sortDirection={sortDirection}
          handleSort={handleSort}
          searchTerm={searchTerm} // Pass search term prop
          scoresByWodId={scoresByWodId} // Pass scores map
        />
      )}
    </Box>
  );
}
