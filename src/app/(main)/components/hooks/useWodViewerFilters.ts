import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type SortByType, type WodCategory } from "~/types/wodTypes";

// Default category to use when no category is specified in the URL
const DEFAULT_CATEGORY = "Girl";

/**
 * Custom hook to manage WOD viewer filter, sort, and search state with URL synchronization.
 */
export function useWodViewerFilters(
  categoryOrder: string[],
  tagOrder: string[],
  isLoggedIn: boolean,
  DEFAULT_SORT_DIRECTIONS: Record<SortByType, "asc" | "desc">,
  DEFAULT_COMPLETION_FILTER: "all" | "done" | "notDone",
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Validation helpers for URL parameters
  const ALLOWED_COMPLETION_STATUSES: ReadonlyArray<"all" | "done" | "notDone"> =
    ["all", "done", "notDone"];

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

  // Refs to prevent update cycles between URL and state
  const isUpdatingFromUrl = useRef(false);
  const isUpdatingFromState = useRef(false);

  // Filter state
  // If no category is specified in the URL, default to "Girl" (DEFAULT_CATEGORY) if available.
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const urlCategory = searchParams.get("category");
    if (urlCategory === "All" || !urlCategory) {
      // If DEFAULT_CATEGORY is present, use it as default; else show all
      return categoryOrder.includes(DEFAULT_CATEGORY) ? [DEFAULT_CATEGORY] : [];
    }
    return [urlCategory];
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

  // Effect to update state from URL parameters
  const searchParamsString = searchParams.toString();
  useEffect(() => {
    // Skip if we're currently updating the URL from state to avoid race conditions
    if (isUpdatingFromState.current) {
      return;
    }

    // Set flag to indicate we're updating from URL
    isUpdatingFromUrl.current = true;

    try {
      // Update category from URL
      const urlCategory = searchParams.get("category");
      if (urlCategory === "All") {
        setSelectedCategories([]);
      } else if (urlCategory) {
        setSelectedCategories([urlCategory]);
      }
      // If urlCategory is null (param missing), do not update selectedCategories—preserve default

      // Update tags from URL
      const urlTags = searchParams.get("tags");
      setSelectedTags(urlTags ? urlTags.split(",") : []);

      // Update completion filter from URL
      const urlCompletion = searchParams.get("completion");
      setCompletionFilter(
        isValidCompletionStatus(urlCompletion)
          ? urlCompletion
          : DEFAULT_COMPLETION_FILTER,
      );

      // Update sort by from URL
      const urlSortBy = searchParams.get("sortBy");
      setSortBy(isValidSortBy(urlSortBy) ? urlSortBy : "date");

      // Update sort direction from URL
      const urlSortDir = searchParams.get("sortDir");
      setSortDirection(
        isValidSortDirection(urlSortDir)
          ? urlSortDir
          : DEFAULT_SORT_DIRECTIONS[
              isValidSortBy(urlSortBy) ? urlSortBy : "date"
            ],
      );

      // Update search term from URL
      const urlSearch = searchParams.get("search") ?? "";
      setSearchTerm(urlSearch);
    } finally {
      // Reset flag after updates are complete
      isUpdatingFromUrl.current = false;
    }
  }, [searchParamsString, DEFAULT_COMPLETION_FILTER, DEFAULT_SORT_DIRECTIONS]);

  // Effect to update URL from state
  useEffect(() => {
    // Skip if we're currently updating from URL to avoid race conditions
    if (isUpdatingFromUrl.current) {
      return;
    }

    // Set flag to indicate we're updating from state
    isUpdatingFromState.current = true;

    // Use a timeout to debounce URL updates (100ms is reasonable)
    const timeoutId = setTimeout(() => {
      try {
        const params = new URLSearchParams();
        let validCategoryForUrl: string | null = null;
        if (
          selectedCategories.length > 0 &&
          categoryOrder.includes(selectedCategories[0] as WodCategory)
        ) {
          validCategoryForUrl = selectedCategories[0];
        } else if (selectedCategories.length === 0) {
          validCategoryForUrl = "All";
        }

        if (validCategoryForUrl) {
          params.set("category", validCategoryForUrl);
        }

        const validTagsForUrl = selectedTags.filter((tag) =>
          tagOrder.includes(tag),
        );
        if (validTagsForUrl.length > 0) {
          params.set("tags", validTagsForUrl.join(","));
        } // else: don't add it

        if (completionFilter !== DEFAULT_COMPLETION_FILTER) {
          params.set("completion", completionFilter);
        } // else: don't add it

        if (sortBy !== "date") {
          params.set("sortBy", sortBy);
        } // else: don't add it

        const defaultSortDir = DEFAULT_SORT_DIRECTIONS[sortBy];
        if (sortDirection !== defaultSortDir) {
          params.set("sortDir", sortDirection);
        } // else: don't add it

        if (searchTerm) {
          params.set("search", searchTerm);
        } // else: don't add it

        // Get the final constructed search string
        const newSearch = params.toString();
        const newUrl = `${pathname}?${newSearch}`;

        // Update URL without triggering a re-render
        window.history.replaceState({}, "", newUrl);
      } finally {
        // Reset flag after updates are complete
        isUpdatingFromState.current = false;
      }
    }, 100); // 100ms debounce

    // Cleanup timeout on unmount or when dependencies change
    return () => clearTimeout(timeoutId);
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
    isLoggedIn,
    DEFAULT_COMPLETION_FILTER,
    DEFAULT_SORT_DIRECTIONS,
  ]);

  // Derived values for external use
  const validSelectedCategories =
    selectedCategories.length > 0 &&
    categoryOrder.includes(selectedCategories[0] as WodCategory)
      ? selectedCategories
      : [];

  const validSelectedTags = selectedTags.filter((tag) =>
    tagOrder.includes(tag),
  );

  return {
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
    validSelectedCategories,
    validSelectedTags,
  };
}
