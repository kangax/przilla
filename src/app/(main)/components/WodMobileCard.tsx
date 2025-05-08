import React from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash,
  Share2,
  Star,
} from "lucide-react";
import type { Wod, Score } from "~/types/wodTypes";
import {
  formatScore,
  parseTags,
  getPerformanceBadgeDetails,
} from "~/utils/wodUtils";
import { HighlightMatch } from "~/utils/uiUtils";
import { Flex } from "@radix-ui/themes";

const difficultyStyles: Record<
  string,
  { light: string; dark: string; text: string }
> = {
  Hard: {
    light: "bg-red-300 border-red-400",
    dark: "dark:bg-red-700",
    text: "text-red-800 dark:text-white",
  },
  Medium: {
    light: "bg-yellow-200 border-yellow-300",
    dark: "dark:bg-yellow-600",
    text: "text-yellow-800 dark:text-white",
  },
  Easy: {
    light: "bg-green-300 border-green-400",
    dark: "dark:bg-green-700",
    text: "text-green-900 dark:text-white",
  },
  "Very Hard": {
    light: "bg-red-200 border-red-300",
    dark: "dark:bg-red-600",
    text: "text-red-800 dark:text-white",
  },
  "Extremely Hard": {
    light: "bg-purple-200 border-purple-300",
    dark: "dark:bg-purple-600",
    text: "text-purple-800 dark:text-white",
  },
};

function getWodBlurb(wod: Wod): string | null {
  if (
    wod.difficultyExplanation &&
    wod.difficultyExplanation.trim().length > 0
  ) {
    return wod.difficultyExplanation;
  }
  if (wod.description && wod.description.trim().length > 0) {
    // Use first sentence or up to 100 chars
    const desc = wod.description.trim();
    const firstSentence = desc.split(/(?<=[.!?])\s/)[0];
    if (firstSentence.length >= 20 && firstSentence.length <= 100) {
      return firstSentence;
    }
    return desc.slice(0, 100) + (desc.length > 100 ? "..." : "");
  }
  return null;
}

type WodMobileCardProps = {
  wod: Wod;
  wodScores: Score[];
  searchTerm: string;
  isExpanded: boolean;
  isUserLoggedIn: boolean;
  onToggleExpand: (wodId: string) => void;
  onLogScore: (wodId: string) => void;
  onEditScore: (wodId: string, score: Score) => void;
  onDeleteScore: (wod: Wod, score: Score) => void;
  onToggleFavorite: (wodId: string, currentIsFavorite: boolean) => void;
  cardRef: (el: HTMLDivElement | null) => void;
};

export function WodMobileCard({
  wod,
  wodScores,
  searchTerm,
  isExpanded,
  isUserLoggedIn,
  onToggleExpand,
  onLogScore,
  onEditScore,
  onDeleteScore,
  onToggleFavorite,
  cardRef,
}: WodMobileCardProps) {
  const tags = parseTags(wod.tags);
  const diff = difficultyStyles[wod.difficulty ?? ""] || {
    light: "bg-green-300 border-green-400", // Default to green or a neutral slate
    dark: "dark:bg-slate-700",
    text: "text-slate-800 dark:text-slate-100",
  };
  const badgeClasses = `whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${diff.light} ${diff.dark} ${diff.text}`;

  return (
    <div
      ref={cardRef}
      className="flex flex-col rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 shadow-lg ring-1 ring-slate-100 transition-colors dark:border-slate-700 dark:bg-[#23293a] dark:shadow-md dark:ring-0"
    >
      {/* Header Section */}
      <div
        className="flex cursor-pointer items-center justify-between"
        onClick={() => onToggleExpand(wod.id)}
      >
        <Flex align="center" gap="2" className="flex-grow">
          <Star
            size={20}
            className={`flex-shrink-0 ${
              isUserLoggedIn
                ? "cursor-pointer hover:text-yellow-400"
                : "cursor-not-allowed opacity-50"
            } ${wod.isFavorited ? "fill-yellow-400 text-yellow-500" : "text-gray-400"}`}
            onClick={(e) => {
              if (isUserLoggedIn) {
                e.stopPropagation(); // Prevent card toggle
                onToggleFavorite(wod.id, !!wod.isFavorited);
              }
            }}
            aria-label={wod.isFavorited ? "Unfavorite WOD" : "Favorite WOD"}
          />
          <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">
            <HighlightMatch text={wod.wodName} highlight={searchTerm} />
          </span>
        </Flex>
        <div className="flex flex-shrink-0 items-center gap-2">
          {wod.wodUrl && (
            <a
              href={wod.wodUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View on Wodwell"
              className="mr-1 flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
              tabIndex={0}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
              >
                <text
                  x="8"
                  y="11.5"
                  textAnchor="middle"
                  fontFamily="Geist, Arial, sans-serif"
                  fontWeight="bold"
                  fontSize="14"
                  fill="white"
                  aria-hidden="true"
                >
                  w
                </text>
              </svg>
            </a>
          )}
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {wod.countLikes} likes
          </span>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          )}
        </div>
      </div>
      {/* Blurb Section (collapsed only) */}
      {!isExpanded &&
        (() => {
          const blurb = getWodBlurb(wod);
          return blurb ? (
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {blurb}
            </div>
          ) : null;
        })()}

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
        <div className="relative mt-4 border-t border-slate-200 pt-3 dark:border-slate-700">
          {/* Description - Apply HighlightMatch */}
          <div className="relative mb-3">
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
                {wodScores.map((score) => {
                  const { displayLevel, colorClass } =
                    getPerformanceBadgeDetails(wod, score);
                  const suffix = score.isRx ? "Rx" : "Scaled";
                  return (
                    <li
                      key={score.id}
                      className="flex flex-col rounded-md bg-slate-100 p-2 dark:bg-slate-700"
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {formatScore(score, suffix)}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs font-medium ${colorClass}`}
                          >
                            {displayLevel}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(score.scoreDate).toLocaleDateString(
                            "en-US",
                            {
                              year: "2-digit",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </span>
                        <div className="ml-2 flex items-center gap-1">
                          <button
                            type="button"
                            aria-label="Edit score"
                            className="rounded-full p-1 hover:bg-blue-100 dark:hover:bg-blue-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditScore(wod.id, score);
                            }}
                          >
                            <Pencil size={24} className="text-blue-500" />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete score"
                            className="rounded-full p-1 hover:bg-red-100 dark:hover:bg-red-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteScore(wod, score);
                            }}
                          >
                            <Trash size={24} className="text-red-500" />
                          </button>
                        </div>
                      </div>
                      {score.notes && (
                        <p className="mt-1 w-3/4 text-xs text-slate-500 dark:text-slate-400">
                          {score.notes}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <div className="flex">
            <button
              type="button"
              aria-label="Log Score"
              className="text-md my-4 flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 font-semibold text-white shadow-md transition hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 active:bg-green-700"
              onClick={(e) => {
                e.stopPropagation();
                onLogScore(wod.id);
              }}
            >
              <Plus size={20} />
              <span>Log score</span>
            </button>
            <button
              type="button"
              aria-label="Share WOD"
              className="text-md my-4 ml-4 flex items-center gap-1 rounded-full bg-blue-500 px-3 py-1 font-semibold text-white shadow-md transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 active:bg-blue-700"
              onClick={(e) => {
                e.stopPropagation();
                const url = new URL(window.location.href);
                url.searchParams.set("expandedWodId", wod.id);
                const shareUrl = url.toString();

                if (navigator.share) {
                  navigator
                    .share({
                      title: `Check out this WOD: ${wod.wodName}`,
                      url: shareUrl,
                    })
                    .catch(() => {
                      // Ignore errors from user canceling share
                    });
                } else {
                  void navigator.clipboard.writeText(shareUrl).then(() => {
                    alert("Link copied to clipboard!");
                  });
                }
              }}
            >
              <Share2 size={20} />
              <span>Share</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WodMobileCard;
