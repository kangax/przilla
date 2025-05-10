"use client";

import { useState, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import { api } from "~/trpc/react";
import { useSession } from "~/lib/auth-client";
import { Box, Flex } from "@radix-ui/themes";
// Removed Select, IconButton, DropdownMenu, ChevronDown, ListFilter, ArrowUp, ArrowDown, TagSelector, CompletionFilterControl
import WodTable from "./WodTable";
import WodListMobile from "./WodListMobile";
import { FilterBar } from "./FilterBar"; // Import the new FilterBar component
import { useMediaQuery } from "~/utils/useMediaQuery";
import { useWodViewerFilters } from "./hooks/useWodViewerFilters";
import { useWodViewerData } from "./hooks/useWodViewerData";

import {
  type Wod,
  type SortByType,
  type ScoreFromQuery,
  WodSchema,
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

  // **Conditionally call the query hook**
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

  // Always render the FilterBar at the top
  return (
    <Box>
      <FilterBar
        filterBarRef={filterBarRef}
        isMobile={isMobile}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        categoryCounts={categoryCounts}
        originalTotalWodCount={originalTotalWodCount}
        tagOrder={tagOrder}
        selectedTags={selectedTags}
        toggleTag={toggleTag}
        completionFilter={completionFilter}
        setCompletionFilter={setCompletionFilter}
        dynamicTotalWodCount={dynamicTotalWodCount}
        dynamicDoneWodsCount={dynamicDoneWodsCount}
        dynamicNotDoneWodsCount={dynamicNotDoneWodsCount}
        isLoggedIn={isLoggedIn}
        sortBy={sortBy}
        sortDirection={sortDirection}
        handleSort={handleSort}
      />

      {/* If no WODs, show empty state message below the filter bar */}
      {!wods || wods.length === 0 ? (
        <Box mt="4">No WODs match the current filters.</Box>
      ) : // Conditionally render card list or table
      isMobile ? (
        <WodListMobile
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
          _isLoadingScores={showScoreLoading}
          onScoreLogged={handleScoreLogged}
        />
      )}
    </Box>
  );
}
