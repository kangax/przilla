import Fuse from "fuse.js";
import { normalizeMovementName } from "~/utils/movementMapping";
import type { Wod, WodWithMatches } from "~/types/wodTypes";

/**
 * Creates a search pattern for consistent matching across the application.
 * @param searchTerms Array of search terms or a single search term string
 * @param useWordBoundaries Whether to use strict word boundaries (default: false)
 * @returns A regex pattern string that can be used for both filtering and highlighting
 */
export function createSearchPattern(
  searchTerms: string | string[],
  useWordBoundaries = false,
): string {
  // Handle quoted phrase: if input is a single string, starts and ends with quotes
  if (
    typeof searchTerms === "string" &&
    searchTerms.trim().length > 1 &&
    searchTerms.trim().startsWith('"') &&
    searchTerms.trim().endsWith('"')
  ) {
    // Remove quotes and escape regex characters
    const phrase = searchTerms.trim().slice(1, -1);
    const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Optionally add word boundaries for phrase
    return useWordBoundaries ? `\\b${escapedPhrase}\\b` : escapedPhrase;
  }

  // Handle single string input (multi-word, not quoted)
  const terms = Array.isArray(searchTerms)
    ? searchTerms
    : searchTerms.trim().split(/\s+/).filter(Boolean);

  if (terms.length === 0) return "";

  // Escape special regex characters
  const escapedTerms = terms.map((term) =>
    term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );

  // Create pattern with or without word boundaries
  if (useWordBoundaries) {
    return escapedTerms.map((term) => `\\b${term}\\b`).join("|");
  } else {
    return escapedTerms.join("|");
  }
}

/**
 * Checks if a WOD matches all search terms (AND logic).
 * @param wod The WOD to check
 * @param searchTerms Array of search terms (lowercase)
 * @returns True if the WOD matches all search terms
 */
export function wodMatchesAllTerms(wod: Wod, searchTerms: string[]): boolean {
  if (searchTerms.length === 0) return false;

  // Add debugging for the first few WODs to see what's happening
  const isDebugWod =
    wod.wodName === "Fran" ||
    wod.wodName === "Cindy" ||
    wod.wodName === "Murph";

  const wodNameLower = wod.wodName?.toLowerCase() || "";
  const descriptionLower = wod.description?.toLowerCase() || "";
  const tagsLower = (wod.tags || []).map((tag) => tag.toLowerCase());
  const movementsLower = (wod.movements || []).map((m) => m.toLowerCase());

  if (isDebugWod) {
    console.log(
      `[DEBUG] Checking WOD "${wod.wodName}" against terms:`,
      searchTerms,
    );
    console.log(`[DEBUG] WOD fields:`, {
      name: wodNameLower,
      description: descriptionLower.substring(0, 50) + "...",
      tags: tagsLower,
      movements: movementsLower,
    });
  }

  // Check if ALL search terms are present in at least one of the fields
  const matches = searchTerms.every((term) => {
    const nameMatch = wodNameLower.includes(term);
    const descMatch = descriptionLower.includes(term);
    const tagMatch = tagsLower.some((tag) => tag.includes(term));
    const movementMatch = movementsLower.some((m) => m.includes(term));

    const termMatches = nameMatch || descMatch || tagMatch || movementMatch;

    if (isDebugWod) {
      console.log(`[DEBUG] Term "${term}" matches:`, {
        nameMatch,
        descMatch,
        tagMatch,
        movementMatch,
        overall: termMatches,
      });
    }

    return termMatches;
  });

  if (isDebugWod) {
    console.log(`[DEBUG] Final match result for "${wod.wodName}":`, matches);
  }

  return matches;
}

/**
 * Prepares WODs for fuzzy search by normalizing movement names.
 */
function prepareWodsForSearch(wods: Wod[]): Wod[] {
  return wods.map((wod) => ({
    ...wod,
    movements: (wod.movements ?? []).map((m) => normalizeMovementName(m) ?? m),
  }));
}

/**
 * Performs fuzzy search on WODs using fuse.js.
 * @param wods List of WODs to search
 * @param query Search query string
 * @returns Array of WodWithMatches (with match info)
 */
export function fuzzySearchWods(wods: Wod[], query: string): WodWithMatches[] {
  const preppedWods = prepareWodsForSearch(wods);
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  // If query is quoted, treat as exact search
  const isExact = trimmedQuery.startsWith('"') && trimmedQuery.endsWith('"');
  if (isExact) {
    const exactTerm = trimmedQuery
      .substring(1, trimmedQuery.length - 1)
      .toLowerCase();
    if (!exactTerm.trim()) {
      return [];
    }

    // Improved exact search with word boundary awareness
    return preppedWods
      .filter((wod) => {
        const wodNameLower = wod.wodName?.toLowerCase() || "";
        const descriptionLower = wod.description?.toLowerCase() || "";
        const movementsLower = (wod.movements || []).map((m) =>
          m.toLowerCase(),
        );

        // Check for exact match in name, description, or movements
        return (
          wodNameLower.includes(exactTerm) ||
          descriptionLower.includes(exactTerm) ||
          movementsLower.some((m) => m.includes(exactTerm))
        );
      })
      .map((wod) => ({ ...wod, matches: undefined }));
  }

  // Configure Fuse.js with improved settings
  const fuse = new Fuse(preppedWods, {
    keys: ["wodName", "description", "movements"],
    threshold: 0.2, // Lower threshold for stricter matching
    includeScore: false,
    includeMatches: true,
    useExtendedSearch: true,
    // Note: Using only options supported by the current Fuse.js version
    // For multi-word search, we'll implement our own logic
  });

  // For multi-word searches, we need to implement AND logic ourselves
  // since matchAllTokens is not available in this version of Fuse.js
  if (trimmedQuery.includes(" ")) {
    console.log(`[DEBUG] Multi-word search: "${trimmedQuery}"`);

    const searchTerms = trimmedQuery.split(/\s+/).filter(Boolean);
    console.log(`[DEBUG] Search terms:`, searchTerms);

    // Find fuzzy matches for each term separately
    const matchesByTerm = searchTerms.map((term) => {
      console.log(`[DEBUG] Finding matches for term: "${term}"`);

      const fuseSingleTerm = new Fuse(preppedWods, {
        keys: ["wodName", "description", "movements", "tags"],
        threshold: 0.3, // Slightly higher threshold for better fuzzy matching
        includeScore: false,
        includeMatches: true,
      });

      const termResults = fuseSingleTerm.search(term);
      console.log(
        `[DEBUG] Found ${termResults.length} matches for term "${term}"`,
      );

      return termResults.map((result) => result.item);
    });

    // Find WODs that appear in ALL term result sets (intersection)
    const commonWods = matchesByTerm.reduce((common, termResults, index) => {
      if (common.length === 0 && index === 0) {
        return termResults;
      }

      return common.filter((commonWod) =>
        termResults.some((termWod) => termWod.id === commonWod.id),
      );
    }, [] as Wod[]);

    console.log(`[DEBUG] Found ${commonWods.length} WODs matching ALL terms`);

    if (commonWods.length > 0) {
      console.log(
        `[DEBUG] First few common WODs:`,
        commonWods.slice(0, 3).map((wod) => wod.wodName),
      );

      // Return the common WODs with match information
      // We don't have proper match information since we did separate searches,
      // but we can still return the WODs
      return commonWods.map((wod) => ({ ...wod, matches: undefined }));
    }

    console.log(`[DEBUG] No WODs found matching all terms`);
    return [];
  }

  // Fuzzy search
  return fuse.search(trimmedQuery).map((result) => ({
    ...result.item,
    matches: result.matches,
  }));
}

/**
 * Checks if a WOD matches a search term, supporting exact (quoted) and single/multi-word (AND) search.
 * @param wod The WOD to check
 * @param searchTerm The search term string
 * @returns True if the WOD matches the search term
 */
export const checkWodMatch = (wod: Wod, searchTerm: string): boolean => {
  const trimmedTerm = searchTerm.trim();
  if (!trimmedTerm) return false; // Changed from true to false, empty search shouldn't match.

  // Handle quoted exact search
  if (trimmedTerm.startsWith('"') && trimmedTerm.endsWith('"')) {
    const exactTerm = trimmedTerm
      .substring(1, trimmedTerm.length - 1)
      .toLowerCase();
    if (!exactTerm.trim()) return false; // Empty exact term shouldn't match

    const wodNameLower = wod.wodName?.toLowerCase() || "";
    const descriptionLower = wod.description?.toLowerCase() || "";
    const tags = (wod.tags || []).map((tag) => tag.toLowerCase()); // Ensure tags is always an array
    const movementsLower = (wod.movements || []).map((m) => m.toLowerCase());

    return (
      wodNameLower.includes(exactTerm) ||
      descriptionLower.includes(exactTerm) ||
      tags.some((tag) => tag.includes(exactTerm)) ||
      movementsLower.some((m) => m.includes(exactTerm))
    );
  }

  // Handle multi-word search (AND logic) using shared utility function
  const searchTerms = trimmedTerm
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => term.toLowerCase());

  if (searchTerms.length === 0) return false; // No terms to search

  if (searchTerms.length > 1) {
    return wodMatchesAllTerms(wod, searchTerms);
  }

  // Single word search
  const lowerSearchTerm = searchTerms[0];

  if (wod.wodName?.toLowerCase().includes(lowerSearchTerm)) {
    return true;
  }
  if (wod.description?.toLowerCase().includes(lowerSearchTerm)) {
    return true;
  }
  const tags = (wod.tags || []).map((tag) => tag.toLowerCase()); // Ensure tags is always an array
  if (tags.some((tag) => tag.toLowerCase().includes(lowerSearchTerm))) {
    return true;
  }
  const movementsLower = (wod.movements || []).map((m) => m.toLowerCase());
  if (movementsLower.some((m) => m.toLowerCase().includes(lowerSearchTerm))) {
    return true;
  }
  return false;
};
