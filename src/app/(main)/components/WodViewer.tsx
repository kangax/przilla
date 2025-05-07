"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "~/trpc/react";
import { useSession } from "~/lib/auth-client";
import { Box, Flex, IconButton, DropdownMenu } from "@radix-ui/themes";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, ListFilter, ArrowUp, ArrowDown } from "lucide-react";
import WodTable from "./WodTable";
import WodListMobile from "./WodListMobile";
import TagSelector from "./TagSelector"; // Import the new component
import CompletionFilterControl from "./CompletionFilterControl"; // Import the new completion filter component
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
  type WodCategory,
  WodSchema,
  WOD_CATEGORIES,
} from "~/types/wodTypes";
import type { Score } from "~/types/wodTypes"; // Ensure Score is available for props

// --- URL State Management ---

interface WodViewerProps {
  initialWods: Wod[];
  initialScoresByWodId?: Record<string, Score[]>; // For pre-loaded scores on favorites page
  source?: "main" | "favorites"; // To differentiate behavior
}

const DEFAULT_COMPLETION_FILTER = "all";
const DEFAULT_SORT_DIRECTIONS: Record<SortByType, "asc" | "desc"> = {
  wodName: "asc",
  date: "desc",
  difficulty: "asc",
  countLikes: "desc",
  results: "desc",
};

export default function WodViewer({
  initialWods,
  initialScoresByWodId,
  source = "main",
}: WodViewerProps) {
  // initialWods prop is now guaranteed to be Wod[] by page.tsx server-side validation
  const validatedInitialWods: Wod[] = initialWods;

  const { data: session, isPending: isSessionLoading } = useSession();
  const isLoggedIn = !!session?.user;
  const isMobile = useMediaQuery("(max-width: 767px)");

  // tRPC utils for query invalidation
  const utils = api.useUtils();

  // Get category and tag orders from the data
  const initialCategoryOrder = useMemo(() => {
    if (!validatedInitialWods) return [];
    const categories = new Set(
      validatedInitialWods.map((wod) => wod.category).filter(Boolean),
    );
    return Array.from(categories).sort();
  }, [validatedInitialWods]);

  const initialTagOrder = useMemo(() => {
    if (!validatedInitialWods) return [];
    const tags = new Set(
      validatedInitialWods.flatMap((wod) => wod.tags || []).filter(Boolean),
    );
    return Array.from(tags).sort();
  }, [validatedInitialWods]);

  // Use custom filter/sort/search hook with actual category and tag orders
  // **Moved this hook call BEFORE the api.wod.getAll.useQuery call**
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
    initialCategoryOrder,
    initialTagOrder,
    isLoggedIn,
    DEFAULT_SORT_DIRECTIONS,
    DEFAULT_COMPLETION_FILTER,
  );

  const isFavoritesSource = source === "favorites";

  // Add logging for initialWods when source is 'favorites'
  useEffect(() => {
    if (isFavoritesSource) {
      console.log(
        "[DEBUG WodViewer] Source is 'favorites'. initialWods changed. Count:",
        initialWods?.length,
        "Timestamp:",
        new Date().toISOString(),
      );
      // console.log("[DEBUG WodViewer] Favorites initialWods content:", JSON.stringify(initialWods?.slice(0, 2))); // Log first 2 items
    }
  }, [initialWods, isFavoritesSource]);

  // **Conditionally call the query hook**
  console.log(
    "[DEBUG WodViewer] About to call api.wod.getAll.useQuery. Current searchTerm:",
    searchTerm,
    "Effective input for query:",
    { searchQuery: searchTerm || undefined },
    "Timestamp:",
    new Date().toISOString(),
  );
  const {
    data: wodsDataFromApiQuery, // Renamed for clarity
    isLoading: isLoadingWodsFromApi, // Renamed for clarity
    error: errorWodsFromApi, // Renamed for clarity
  } = api.wod.getAll.useQuery(
    { searchQuery: searchTerm || undefined },
    {
      enabled: !isFavoritesSource, // Only fetch if not on favorites page
      staleTime: 5 * 60 * 1000,
    },
  );

  // ADD THIS useEffect FOR DIAGNOSTICS
  useEffect(() => {
    if (!isFavoritesSource && wodsDataFromApiQuery) {
      // Only log for main page updates
      console.log(
        `[DEBUG WodViewer Effect] wodsDataFromApiQuery updated. Timestamp: ${new Date().toISOString()}. Length: ${wodsDataFromApiQuery.length}`,
      );
      // Optionally, find a specific WOD that you attempt to favorite/unfavorite
      // and log its 'isFavorited' status from wodsDataFromApiQuery.
      // For example, if you know a WOD ID you're testing with:
      // const testWodId = "your-test-wod-id";
      // const testWod = wodsDataFromApiQuery.find(w => w.id === testWodId);
      // if (testWod) {
      //   console.log(`[DEBUG WodViewer Effect] Test WOD (${testWodId}) isFavorited: ${testWod.isFavorited}`);
      // } else {
      //   // If you want to see the first item's status
      //   if (wodsDataFromApiQuery.length > 0) {
      //       console.log(`[DEBUG WodViewer Effect] First WOD (${wodsDataFromApiQuery[0].id}) isFavorited: ${wodsDataFromApiQuery[0].isFavorited}`);
      //   }
      // }
    }
  }, [wodsDataFromApiQuery, isFavoritesSource]); // Dependency array includes wodsDataFromApiQuery

  // DEBUG: Print all query keys in the React Query cache
  // This will show the actual structure used by TanStack Query
  const queryClient = useQueryClient();
  if (typeof window !== "undefined") {
    const queries = queryClient.getQueryCache().getAll();
    for (const q of queries) {
      if (q.queryHash && q.queryHash.includes("wod.getAll")) {
        // eslint-disable-next-line no-console
        console.log("[DEBUG] TanStack Query Key for wod.getAll:", q.queryKey);
      }
    }
  }

  // Add debugging for API results
  useEffect(() => {
    if (wodsDataFromApiQuery) {
      console.log("[DEBUG] API query data available:", {
        dataLength: wodsDataFromApiQuery?.length,
        searchTerm,
        timestamp: new Date().toISOString(),
      });
    }
    if (errorWodsFromApi) {
      console.error("[DEBUG] API query error:", {
        error: errorWodsFromApi,
        searchTerm,
        timestamp: new Date().toISOString(),
      });
    }
  }, [wodsDataFromApiQuery, errorWodsFromApi, searchTerm]);

  const {
    data: scoresDataFromApi, // Renamed
    isLoading: isLoadingScoresFromApi, // Renamed
    error: errorScoresFromApi, // Renamed
  } = api.score.getAllByUser.useQuery(undefined, {
    enabled: isLoggedIn && !isFavoritesSource, // Only fetch if logged in AND not on favorites page (where scores are pre-loaded)
  });

  // Determine WODs data source
  const wodsSourceForHook = isFavoritesSource
    ? undefined
    : wodsDataFromApiQuery;
  const validatedWodsFromApi = WodSchema.array().safeParse(wodsSourceForHook)
    .success
    ? (WodSchema.array().parse(wodsSourceForHook) as Wod[])
    : undefined;

  // Determine scores data source
  const scoresSourceForHook = isFavoritesSource
    ? initialScoresByWodId
      ? Object.values(initialScoresByWodId).flat() // Convert Record to Score[]
      : []
    : (scoresDataFromApi ?? []);

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
    validatedWodsFromApi, // Use WODs from API if main source, else undefined
    validatedInitialWods, // InitialWods (from props, will be favorites on fav page)
    scoresSourceForHook as ScoreFromQuery[], // Use pre-loaded scores if favorites, else from API
    selectedCategories,
    selectedTags,
    completionFilter,
    sortBy,
    sortDirection,
    searchTerm,
  );

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

  const showScoreLoading =
    isLoggedIn &&
    (isLoadingScoresFromApi || isSessionLoading) &&
    !isFavoritesSource;
  const showWodLoadingSpinner =
    isLoadingWodsFromApi && !validatedWodsFromApi && !isFavoritesSource;

  // Add debugging for the final rendering decision
  useEffect(() => {
    console.log("[DEBUG] Final rendering decision:", {
      wodsLength: wods?.length,
      sortedWodsLength: sortedWods?.length,
      showWodLoadingSpinner,
      hasValidatedInitialWods: validatedInitialWods.length > 0,
      searchTerm,
      timestamp: new Date().toISOString(),
    });
  }, [
    wods,
    sortedWods,
    showWodLoadingSpinner,
    validatedInitialWods,
    searchTerm,
  ]);

  if (
    showWodLoadingSpinner &&
    validatedInitialWods.length === 0 &&
    !isFavoritesSource
  ) {
    return (
      <Flex align="center" justify="center" className="h-[300px] w-full">
        Loading WOD data...
      </Flex>
    );
  }

  if (errorWodsFromApi && !isFavoritesSource) {
    return <Box>Error loading WODs: {errorWodsFromApi.message}</Box>;
  }
  if (isLoggedIn && errorScoresFromApi && !isFavoritesSource) {
    return <Box>Error loading scores: {errorScoresFromApi.message}</Box>;
  }

  // If it's favorites source and initialWods is empty (after fetching), show specific message
  if (
    isFavoritesSource &&
    validatedInitialWods.length === 0 &&
    !isLoadingWodsFromApi
  ) {
    // isLoadingWodsFromApi will be false here
    return <Box>You have no favorited WODs yet.</Box>;
  }

  // If main source, and initialWods (from server) was empty and API fetch also resulted in no valid data
  if (
    !isFavoritesSource &&
    validatedInitialWods.length === 0 &&
    !validatedWodsFromApi &&
    !isLoadingWodsFromApi
  ) {
    return <Box>No valid WOD data available.</Box>;
  }

  // Note: The `wods` variable returned by useWodViewerData should now reflect displayWods
  // We might not need the separate `displayWods` variable here if the hook handles the fallback correctly.
  // Let's check the hook's logic again: `return wodsData ?? initialWods ?? [];` - yes, it handles it.
  // So we can rely on the `wods` returned from useWodViewerData for the final check.

  if (!wods || wods.length === 0) {
    // Final check based on data processed by useWodViewerData
    console.log("[DEBUG] Rendering 'No WODs match the current filters'");
    return <Box>No WODs match the current filters.</Box>; // More specific message
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
                (WOD_CATEGORIES as readonly string[]).includes(value)
              ) {
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

          {/* Use the new TagSelector component */}
          <TagSelector
            tagOrder={tagOrder}
            selectedTags={selectedTags}
            toggleTag={toggleTag}
            isMobile={isMobile}
          />
        </div>

        {/* SegmentedControl and Sort Button: On mobile, show in a row; on desktop, just SegmentedControl */}
        {isMobile ? (
          <div className="mt-2 flex w-full flex-row items-center gap-2">
            {/* Use the new CompletionFilterControl component */}
            <CompletionFilterControl
              completionFilter={completionFilter}
              setCompletionFilter={setCompletionFilter}
              dynamicTotalWodCount={dynamicTotalWodCount}
              dynamicDoneWodsCount={dynamicDoneWodsCount}
              dynamicNotDoneWodsCount={dynamicNotDoneWodsCount}
              isLoggedIn={isLoggedIn}
              isMobile={isMobile}
            />
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
          /* Use the new CompletionFilterControl component */
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
