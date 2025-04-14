import React, { useState, useMemo } from "react"; // Added useMemo
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Wod, Score } from "../../types/wodTypes";
import { formatScore, parseTags } from "../../utils/wodUtils"; // Import formatScore and parseTags
import { HighlightMatch } from "~/utils/uiUtils"; // Import HighlightMatch

type ScoresByWodId = Record<string, Score[]>;

type WodListMobileProps = {
  wods: Wod[];
  scoresByWodId: ScoresByWodId;
  searchTerm: string; // Add searchTerm prop
};

const difficultyStyles: Record<
  string,
  { light: string; dark: string; text: string }
> = {
  Hard: {
    light: "bg-orange-100 border-orange-300",
    dark: "bg-orange-600",
    text: "text-orange-800 dark:text-white",
  },
  Medium: {
    light: "bg-yellow-100 border-yellow-300",
    dark: "bg-yellow-600",
    text: "text-yellow-800 dark:text-white",
  },
  Easy: {
    light: "bg-green-100 border-green-300",
    dark: "bg-green-600",
    text: "text-green-800 dark:text-white",
  },
  "Very Hard": {
    light: "bg-red-100 border-red-300",
    dark: "bg-red-600",
    text: "text-red-800 dark:text-white",
  },
  "Extremely Hard": {
    light: "bg-purple-100 border-purple-300",
    dark: "bg-purple-600",
    text: "text-purple-800 dark:text-white",
  },
};

// Helper function to check if the search term matches WOD content
const checkWodMatch = (wod: Wod, searchTerm: string): boolean => {
  if (!searchTerm.trim()) return false;
  const lowerSearchTerm = searchTerm.toLowerCase();

  // Check WOD Name
  if (wod.wodName?.toLowerCase().includes(lowerSearchTerm)) {
    return true;
  }

  // Check Description
  if (wod.description?.toLowerCase().includes(lowerSearchTerm)) {
    return true;
  }

  // Check Tags (handle potential stringified JSON)
  const tags = parseTags(wod.tags); // Use parseTags utility
  if (tags.some((tag) => tag.toLowerCase().includes(lowerSearchTerm))) {
    return true;
  }

  return false;
};

export function WodListMobile({
  wods,
  scoresByWodId,
  searchTerm,
}: WodListMobileProps) {
  const [expandedWodId, setExpandedWodId] = useState<string | null>(null);

  // Change function parameter type to string
  const toggleExpand = (wodId: string) => {
    setExpandedWodId(expandedWodId === wodId ? null : wodId);
  };

  // Memoize the matched WOD IDs to avoid recalculating on every render
  const matchedWodIds = useMemo(() => {
    if (!searchTerm.trim()) return new Set<string>();
    return new Set(
      wods.filter((wod) => checkWodMatch(wod, searchTerm)).map((wod) => wod.id),
    );
  }, [wods, searchTerm]);

  return (
    <div className="space-y-4 px-2 pb-4">
      {wods.map((wod) => {
        const isManuallyExpanded = expandedWodId === wod.id;
        const isSearchMatch = matchedWodIds.has(wod.id);
        // Expand if manually toggled OR if it's a search match and hasn't been explicitly collapsed
        const isExpanded =
          isManuallyExpanded || (isSearchMatch && expandedWodId !== wod.id);

        const wodScores = scoresByWodId?.[wod.id] || [];
        const tags = parseTags(wod.tags); // Parse tags for consistent handling

        const diff = difficultyStyles[wod.difficulty ?? ""] || {
          // Added nullish coalescing for safety
          light: "bg-slate-100 border-slate-300",
          dark: "bg-slate-700",
          text: "text-slate-800 dark:text-slate-100",
        };
        const darkClasses = diff.dark.includes("bg-")
          ? diff.dark
          : `dark:${diff.dark}`;
        const badgeClasses = `whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${diff.light} ${darkClasses} ${diff.text}`;

        return (
          <div
            key={wod.id}
            className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-md shadow-slate-100 transition-colors dark:border-slate-700 dark:bg-[#23293a] dark:shadow-md"
          >
            {/* Header Section */}
            <div
              className="flex cursor-pointer items-center justify-between"
              onClick={() => toggleExpand(wod.id)}
            >
              <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                <HighlightMatch text={wod.wodName} highlight={searchTerm} />
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {wod.countLikes} likes
                </span>
                {/* Chevron Icon */}
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                )}
              </div>
            </div>

            {/* Tags Section (Always Visible) - Use parsed tags */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={badgeClasses}>{wod.difficulty}</span>
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                >
                  <HighlightMatch text={tag} highlight={searchTerm} />
                </span>
              ))}
            </div>

            {/* Expandable Section */}
            {isExpanded && (
              <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700">
                {/* Description - Apply HighlightMatch */}
                <div className="mb-3">
                  <p className="text-md whitespace-pre-wrap text-slate-600 dark:text-slate-400">
                    <HighlightMatch
                      text={wod.description ?? ""}
                      highlight={searchTerm}
                    />
                  </p>
                </div>

                {/* Separator */}
                <div className="my-3 border-t border-slate-200 dark:border-slate-700"></div>

                {/* Scores */}
                {wodScores.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Your Scores:
                    </h4>
                    <ul className="space-y-2">
                      {wodScores.map((score) => (
                        <li
                          key={score.id}
                          className="flex flex-col rounded-md bg-slate-100 p-2 dark:bg-slate-700" // Changed to flex-col
                        >
                          {/* Top row: Score, Rx, Date */}
                          <div className="flex w-full items-center justify-between">
                            {" "}
                            {/* Added wrapper div */}
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {formatScore(score)}
                              </span>
                              {score.isRx && (
                                <span className="rounded bg-green-200 px-1.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-700 dark:text-green-100">
                                  Rx
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(score.scoreDate).toLocaleDateString(
                                // Use scoreDate here
                                "en-US",
                                {
                                  year: "2-digit",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </span>
                          </div>
                          {/* Notes (conditionally rendered) */}
                          {score.notes && (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {score.notes}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {wodScores.length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No scores recorded yet.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default WodListMobile;
