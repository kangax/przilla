import React, { useState, useMemo, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash,
  Share2,
} from "lucide-react";
import type { Wod, Score } from "~/types/wodTypes";
import {
  formatScore,
  parseTags,
  getPerformanceBadgeDetails,
} from "~/utils/wodUtils";
import { HighlightMatch } from "~/utils/uiUtils";
import { wodMatchesAllTerms } from "~/utils/wodFuzzySearch";
import LogScoreForm from "./LogScoreForm";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "../../../components/ui/drawer";
import { Dialog, Button, Flex } from "@radix-ui/themes";
import { api } from "../../../trpc/react";
import { useToast } from "~/components/ToastProvider";

type ScoresByWodId = Record<string, Score[]>;

type WodListMobileProps = {
  wods: Wod[];
  scoresByWodId: ScoresByWodId;
  searchTerm: string;
  onScoreLogged?: () => void;
  expandedWodIdFromUrl?: string | null;
};

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

const badgeColorMap: Record<string, string> = {
  purple: "bg-purple-200 text-purple-800 dark:bg-purple-700 dark:text-white",
  green: "bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100",
  yellow: "bg-yellow-200 text-yellow-800 dark:bg-yellow-600 dark:text-white",
  gray: "bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-100",
};

const checkWodMatch = (wod: Wod, searchTerm: string): boolean => {
  const trimmedTerm = searchTerm.trim();
  if (!trimmedTerm) return false;
  
  // Handle quoted exact search
  if (trimmedTerm.startsWith('"') && trimmedTerm.endsWith('"')) {
    const exactTerm = trimmedTerm.substring(1, trimmedTerm.length - 1).toLowerCase();
    if (!exactTerm.trim()) return false;
    
    const wodNameLower = wod.wodName?.toLowerCase() || "";
    const descriptionLower = wod.description?.toLowerCase() || "";
    const tags = parseTags(wod.tags);
    const tagsLower = tags.map(tag => tag.toLowerCase());
    
    return (
      wodNameLower.includes(exactTerm) ||
      descriptionLower.includes(exactTerm) ||
      tagsLower.some(tag => tag.includes(exactTerm)) ||
      (wod.movements || []).some(m => m.toLowerCase().includes(exactTerm))
    );
  }
  
  // Handle multi-word search (AND logic) using shared utility function
  const searchTerms = trimmedTerm.split(/\s+/).filter(Boolean).map(term => term.toLowerCase());
  
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
  const tags = parseTags(wod.tags);
  if (tags.some((tag) => tag.toLowerCase().includes(lowerSearchTerm))) {
    return true;
  }
  if ((wod.movements || []).some(m => m.toLowerCase().includes(lowerSearchTerm))) {
    return true;
  }
  return false;
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

export function WodListMobile({
  wods,
  scoresByWodId,
  searchTerm,
  onScoreLogged,
  expandedWodIdFromUrl,
}: WodListMobileProps) {
  const [expandedWodId, setExpandedWodId] = useState<string | null>(null);
  const didInitExpandedWodId = React.useRef(false);
  const cardRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  // Initialize expandedWodId from URL param if provided, only once
  useEffect(() => {
    if (
      !didInitExpandedWodId.current &&
      expandedWodIdFromUrl &&
      wods.some((w) => w.id === expandedWodIdFromUrl)
    ) {
      setExpandedWodId(expandedWodIdFromUrl);
      didInitExpandedWodId.current = true;
    }
  }, [expandedWodIdFromUrl, wods]);

  // Scroll expanded card into view when expandedWodId changes
  useEffect(() => {
    if (expandedWodId && cardRefs.current[expandedWodId]) {
      cardRefs.current[expandedWodId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [expandedWodId]);

  const [logSheetWodId, setLogSheetWodId] = useState<string | null>(null);
  const [editingScore, setEditingScore] = useState<Score | null>(null);
  const [deletingScore, setDeletingScore] = useState<{
    score: Score;
    wod: Wod;
  } | null>(null);

  const utils = api.useUtils();
  const { showToast } = useToast();
  const deleteScoreMutation = api.score.deleteScore.useMutation({
    onSuccess: async () => {
      await utils.score.getAllByUser.invalidate();
      setDeletingScore(null);

      // Show success toast
      showToast("success", "Score deleted");
    },
    onError: () => {
      setDeletingScore(null);

      // Show error toast
      showToast("error", "Failed to delete score");
    },
  });

  const toggleExpand = (wodId: string) => {
    setExpandedWodId(expandedWodId === wodId ? null : wodId);
  };

  const matchedWodIds = useMemo(() => {
    if (!searchTerm.trim()) return new Set<string>();
    return new Set(
      wods.filter((wod) => checkWodMatch(wod, searchTerm)).map((wod) => wod.id),
    );
  }, [wods, searchTerm]);

  // Find the WOD object for the currently open sheet
  const currentSheetWod =
    logSheetWodId != null ? wods.find((w) => w.id === logSheetWodId) : null;

  // Handler for opening log (new) score
  const handleLogScore = (wodId: string) => {
    setLogSheetWodId(wodId);
    setEditingScore(null);
  };

  // Handler for opening edit score
  const handleEditScore = (wodId: string, score: Score) => {
    setLogSheetWodId(wodId);
    setEditingScore(score);
  };

  // Handler for closing drawer (after log/edit/cancel)
  const handleDrawerClose = () => {
    setLogSheetWodId(null);
    setEditingScore(null);
  };

  // Handler for delete
  const handleDeleteScore = (wod: Wod, score: Score) => {
    setDeletingScore({ wod, score });
  };

  // Confirm delete
  const confirmDeleteScore = async () => {
    if (deletingScore) {
      deleteScoreMutation.mutate({ id: deletingScore.score.id });
    }
  };

  // Cancel delete
  const cancelDeleteScore = () => {
    setDeletingScore(null);
  };

  return (
    <>
      <div className="space-y-4 px-2 pb-4">
        {wods.map((wod) => {
          const isManuallyExpanded = expandedWodId === wod.id;
          const isSearchMatch = matchedWodIds.has(wod.id);
          const isExpanded =
            isManuallyExpanded || (isSearchMatch && expandedWodId !== wod.id);

          const wodScores = scoresByWodId?.[wod.id] || [];
          const tags = parseTags(wod.tags);

          const diff = difficultyStyles[wod.difficulty ?? ""] || {
            light: "bg-green-300 border-green-400",
            dark: "dark:bg-slate-700",
            text: "text-slate-800 dark:text-slate-100",
          };
          const badgeClasses = `whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${diff.light} ${diff.dark} ${diff.text}`;

          return (
            <div
              key={wod.id}
              ref={(el) => {
                cardRefs.current[wod.id] = el;
              }}
              className="flex flex-col rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 shadow-lg ring-1 ring-slate-100 transition-colors dark:border-slate-700 dark:bg-[#23293a] dark:shadow-md dark:ring-0"
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
                      {/* SVG "w" icon for crispness and accessibility */}
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
                          const { displayLevel, color } =
                            getPerformanceBadgeDetails(wod, score);
                          const badgeColor =
                            badgeColorMap[color] || badgeColorMap.gray;
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
                                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${badgeColor}`}
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
                                {/* Edit/Delete Icons */}
                                <div className="ml-2 flex items-center gap-1">
                                  <button
                                    type="button"
                                    aria-label="Edit score"
                                    className="rounded-full p-1 hover:bg-blue-100 dark:hover:bg-blue-900"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditScore(wod.id, score);
                                    }}
                                  >
                                    <Pencil
                                      size={24}
                                      className="text-blue-500"
                                    />
                                  </button>
                                  <button
                                    type="button"
                                    aria-label="Delete score"
                                    className="rounded-full p-1 hover:bg-red-100 dark:hover:bg-red-900"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteScore(wod, score);
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
                    {/* Log Score Button - absolutely positioned in description area */}
                    <button
                      type="button"
                      aria-label="Log Score"
                      className="text-md my-4 flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 font-semibold text-white shadow-md transition hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 active:bg-green-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLogScore(wod.id);
                      }}
                    >
                      <Plus size={20} />
                      <span>Log score</span>
                    </button>
                    {/* Share Button */}
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
                          void navigator.clipboard
                            .writeText(shareUrl)
                            .then(() => {
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
        })}
      </div>
      {/* Bottom Sheet for Log/Edit Score */}
      <Drawer
        open={!!currentSheetWod}
        onOpenChange={(open) => {
          if (!open) handleDrawerClose();
        }}
      >
        <DrawerContent
          container={
            typeof window !== "undefined"
              ? document.getElementById("page-layout-container")
              : undefined
          }
        >
          <DrawerTitle className="flex items-center justify-between p-4">
            {currentSheetWod
              ? editingScore
                ? `Edit Score for ${currentSheetWod.wodName}`
                : `Log Score for ${currentSheetWod.wodName}`
              : "Log Score"}
          </DrawerTitle>
          <div className="px-4 pb-6 pt-2">
            {currentSheetWod && (
              <LogScoreForm
                wod={currentSheetWod}
                initialScore={editingScore}
                onScoreLogged={() => {
                  if (onScoreLogged) onScoreLogged();
                  handleDrawerClose();
                }}
                onCancel={handleDrawerClose}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={!!deletingScore} onOpenChange={cancelDeleteScore}>
        <Dialog.Content>
          <Dialog.Title>Delete Score</Dialog.Title>
          <Dialog.Description>
            Are you sure you want to delete this score? This action cannot be
            undone.
          </Dialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <Button variant="soft" color="gray" onClick={cancelDeleteScore}>
              Cancel
            </Button>
            <Button
              variant="solid"
              color="red"
              onClick={confirmDeleteScore}
              disabled={deleteScoreMutation.status === "pending"}
            >
              {deleteScoreMutation.status === "pending"
                ? "Deleting..."
                : "Delete"}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}

export default WodListMobile;
