import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type SortByType, type WodCategory } from "~/types/wodTypes";

/**
 * Custom hook to manage WOD viewer filter, sort, and search state,
 * including URL synchronization.
 */
export function useWodViewerFilters(
  categoryOrder: string[],
  tagOrder: string[],
  isLoggedIn: boolean,
  DEFAULT_SORT_DIRECTIONS: Record<SortByType, "asc" | "desc">,
  DEFAULT_COMPLETION_FILTER: "all" | "done" | "notDone",
) {
  // --- URL State Management ---
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Validation helpers
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

  // State
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

  // URL sync effect
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    const validCategoryForUrl =
      selectedCategories.length > 0 &&
      categoryOrder.includes(selectedCategories[0] as WodCategory)
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
    DEFAULT_COMPLETION_FILTER,
    DEFAULT_SORT_DIRECTIONS,
  ]);

  // Derived values
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
