"use client";

import React, { useRef, useMemo, useState } from "react";
import Link from "next/link";
import {
  Tooltip,
  Text,
  Flex,
  Badge,
  IconButton,
  Dialog,
  Button,
} from "@radix-ui/themes";
import { Pencil, Trash, Plus } from "lucide-react"; // Added Plus icon
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
  type ColumnDef,
  type SortingFn, // Added SortingFn
  type Row, // Added Row
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Wod, Score, SortByType } from "~/types/wodTypes";
import {
  getPerformanceLevelTooltip,
  formatScore,
  formatShortDate,
  getPerformanceBadgeDetails,
  getPerformanceLevel, // Added getPerformanceLevel
} from "~/utils/wodUtils";
import { LoadingIndicator } from "../../_components/LoadingIndicator";
import { HighlightMatch } from "~/utils/uiUtils";
import { LogScoreDialog } from "./LogScoreDialog"; // Import the new Dialog component
import { api } from "~/trpc/react";

interface WodTableProps {
  wods: Wod[];
  tableHeight: number;
  sortBy: SortByType;
  sortDirection: "asc" | "desc";
  handleSort: (column: SortByType) => void;
  searchTerm: string;
  scoresByWodId: Record<string, Score[]>;
  isLoadingScores: boolean;
  onScoreLogged?: () => void;
}

const safeString = (value: string | undefined | null): string => value || "";

const getDifficultyColor = (difficulty: string | undefined | null): string => {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return "text-green-500";
    case "medium":
      return "text-yellow-500";
    case "hard":
      return "text-orange-500";
    case "very hard":
      return "text-red-500";
    case "extremely hard":
      return "text-purple-500";
    default:
      return "text-foreground";
  }
};

const columnHelper = createColumnHelper<Wod>();

// Numeric mapping for performance levels for sorting (can stay outside)
const performanceLevelValues: Record<string, number> = {
  elite: 4,
  advanced: 3,
  intermediate: 2,
  beginner: 1,
  rx: 0, // Rx but no specific level (e.g., no benchmarks)
  scaled: -1,
  noScore: -2, // WOD has no score logged
};

// Updated createColumns signature
const createColumns = (
  handleSort: (column: SortByType) => void,
  sortBy: SortByType,
  sortDirection: "asc" | "desc",
  searchTerm: string,
  scoresByWodId: Record<string, Score[]>,
  onScoreLogged?: () => void,
  openLogDialog?: (wod: Wod) => void, // New handler prop
  openEditDialog?: (score: Score, wod: Wod) => void, // New handler prop
  handleDeleteScore?: (score: Score, wod: Wod) => void, // Renamed prop
): ColumnDef<Wod, unknown>[] => {
  // --- Define sorting function INSIDE createColumns to access scoresByWodId ---
  const sortByLatestScoreLevel: SortingFn<Wod> = (
    rowA: Row<Wod>,
    rowB: Row<Wod>,
    columnId: string,
  ) => {
    const getLevelValue = (row: Row<Wod>): number => {
      const wod = row.original;
      // Directly use scoresByWodId from the outer scope (createColumns parameters)
      const scores = scoresByWodId?.[wod.id] ?? [];
      if (scores.length === 0) {
        return performanceLevelValues.noScore;
      }
      // Assuming scores are sorted descending by date, latest is scores[0]
      const latestScore = scores[0];
      if (!latestScore.isRx) {
        return performanceLevelValues.scaled;
      }
      const level = getPerformanceLevel(wod, latestScore);
      return level
        ? (performanceLevelValues[level] ?? performanceLevelValues.rx) // Use 'rx' if level exists but not in map
        : performanceLevelValues.rx; // No specific level calculated, but was Rx
    };

    const levelA = getLevelValue(rowA);
    const levelB = getLevelValue(rowB);

    return levelA - levelB;
  };
  // --- End sorting function definition ---

  const getSortIndicator = (columnName: SortByType) => {
    if (sortBy === columnName) {
      return sortDirection === "asc" ? " ▲" : " ▼";
    }
    return "";
  };

  return [
    columnHelper.accessor("wodName", {
      header: () => (
        <span onClick={() => handleSort("wodName")} className="cursor-pointer">
          Workout{getSortIndicator("wodName")}
        </span>
      ),
      cell: (info) => {
        const row = info.row.original;
        return row.wodUrl ? (
          <Link
            href={row.wodUrl}
            target="_blank"
            className="flex max-w-[200px] items-center truncate whitespace-nowrap font-medium text-primary hover:underline"
          >
            <HighlightMatch text={row.wodName} highlight={searchTerm} />
            <span className="ml-1 flex-shrink-0 text-xs opacity-70">↗</span>
          </Link>
        ) : (
          <span className="max-w-[200px] truncate whitespace-nowrap font-medium">
            <HighlightMatch text={row.wodName} highlight={searchTerm} />
          </span>
        );
      },
      size: 200,
    }),
    columnHelper.accessor(
      (row) => ({ category: row.category, tags: row.tags }),
      {
        id: "categoryAndTags",
        header: "Category / Tags",
        cell: (info) => {
          const { category, tags } = info.getValue();
          const safeTags = tags ?? [];
          if (!category && safeTags.length === 0) return null;

          return (
            <Flex direction="column" gap="1" align="start">
              {category && (
                <Badge
                  color="indigo"
                  variant="soft"
                  radius="full"
                  className="w-fit"
                >
                  <HighlightMatch text={category} highlight={searchTerm} />
                </Badge>
              )}
              {safeTags.length > 0 && (
                <Flex gap="1" wrap="wrap" className="mt-1">
                  {safeTags.map((tag) => (
                    <Badge
                      key={tag}
                      color="gray"
                      variant="soft"
                      radius="full"
                      className="flex-shrink-0 text-xs"
                    >
                      <HighlightMatch text={tag} highlight={searchTerm} />
                    </Badge>
                  ))}
                </Flex>
              )}
            </Flex>
          );
        },
        size: 200,
      },
    ),
    columnHelper.accessor("difficulty", {
      header: () => (
        <Tooltip
          className="min-w-[510px] max-w-[510px] bg-slate-500 p-0.5"
          content={
            <div
              className="rounded-sm bg-gray-800 p-4 text-gray-100 shadow-md"
              style={{ boxShadow: "none", border: "none" }}
            >
              <Flex direction="column" gap="2">
                <Text size="2" weight="bold" className="text-gray-100">
                  Difficulty Levels
                </Text>
                <Flex align="center" gap="2">
                  <Text color="green" weight="bold" style={{ minWidth: 100 }}>
                    Easy
                  </Text>
                  <Text className="text-gray-100">
                    Bodyweight only, low volume, no complex skills
                    <br />
                    <Text className="italic text-gray-100">
                      (e.g. &quot;500m row&quot;)
                    </Text>
                  </Text>
                </Flex>
                <Flex align="center" gap="2">
                  <Text color="yellow" weight="bold" style={{ minWidth: 100 }}>
                    Medium
                  </Text>
                  <Text className="text-gray-100">
                    Moderate volume, light-moderate loads, basic skills
                    <br />
                    <Text className="italic text-gray-100">
                      (e.g. &quot;Angie&quot;)
                    </Text>
                  </Text>
                </Flex>
                <Flex align="center" gap="2">
                  <Text color="orange" weight="bold" style={{ minWidth: 100 }}>
                    Hard
                  </Text>
                  <Text className="text-gray-100">
                    High volume OR moderate skill/heavy load
                    <br />
                    <Text className="italic text-gray-100">
                      (e.g. &quot;Isabel&quot;)
                    </Text>
                  </Text>
                </Flex>
                <Flex align="center" gap="2">
                  <Text color="red" weight="bold" style={{ minWidth: 100 }}>
                    Very Hard
                  </Text>
                  <Text className="text-gray-100">
                    Heavy loads + high skill + high volume
                    <br />
                    <Text className="italic text-gray-100">
                      (e.g. &quot;Eva&quot;)
                    </Text>
                  </Text>
                </Flex>
                <Flex align="center" gap="2">
                  <Text color="purple" weight="bold" style={{ minWidth: 100 }}>
                    Extremely Hard
                  </Text>
                  <Text className="text-gray-100">
                    Maximal loads, multiple high-skill elements, or extreme
                    volume
                    <br />
                    <Text className="italic text-gray-100">
                      (e.g. &quot;Awful Annie&quot;)
                    </Text>
                  </Text>
                </Flex>
              </Flex>
            </div>
          }
        >
          <span
            onClick={() => handleSort("difficulty")}
            className="cursor-pointer whitespace-nowrap underline decoration-dotted underline-offset-4"
            tabIndex={0}
            aria-label="Difficulty (show info)"
          >
            Difficulty{getSortIndicator("difficulty")}
          </span>
        </Tooltip>
      ),
      cell: (info) => {
        const row = info.row.original;
        if (!row.difficulty) return <Text>-</Text>;
        return (
          <Tooltip
            content={
              <span style={{ whiteSpace: "pre-wrap" }}>
                {safeString(row.difficultyExplanation)}
              </span>
            }
          >
            <Text
              className={`whitespace-nowrap font-medium ${getDifficultyColor(row.difficulty)}`}
            >
              {row.difficulty}
            </Text>
          </Tooltip>
        );
      },
      size: 100,
    }),
    columnHelper.accessor("countLikes", {
      header: () => (
        <span
          onClick={() => handleSort("countLikes")}
          className="cursor-pointer whitespace-nowrap"
        >
          Likes{getSortIndicator("countLikes")}
        </span>
      ),
      cell: (info) => {
        const row = info.row.original;
        return (
          <span className="whitespace-nowrap">{row.countLikes ?? "-"} </span>
        );
      },
      size: 70,
    }),
    columnHelper.accessor("description", {
      header: "Description",
      cell: (info) => {
        const row = info.row.original;
        if (!row.description) return null;
        return (
          <span className="whitespace-pre-wrap break-words">
            <HighlightMatch text={row.description} highlight={searchTerm} />
          </span>
        );
      },
      size: 364,
    }),
    columnHelper.accessor(
      (row) => ({ wod: row, scores: scoresByWodId[row.id] }), // Accessor remains the same
      {
        id: "results",
        header: () => (
          // Header becomes a function for click handler
          <span
            onClick={() => handleSort("results")} // Use handleSort with 'results'
            className="cursor-pointer whitespace-nowrap"
          >
            Your scores{getSortIndicator("results")} {/* Add sort indicator */}
          </span>
        ),
        cell: (info) => {
          // Cell rendering logic remains the same
          const { wod, scores } = info.getValue();

          return (
            <div className="flex min-h-[36px] flex-col items-start gap-2">
              {/* Scores list (if any) */}
              {scores && scores.length > 0 && (
                <Flex direction="column" gap="2" align="start" className="my-2">
                  {scores.map((score) => {
                    const { displayLevel, color } = getPerformanceBadgeDetails(
                      wod,
                      score,
                    );
                    const suffix = score.isRx ? "Rx" : "Scaled";
                    const formattedScore = formatScore(score, suffix);
                    const formattedDate = formatShortDate(score.scoreDate);

                    const tooltipContent = (
                      <span style={{ whiteSpace: "pre-wrap" }}>
                        {`Logged: ${formattedDate}
Notes: ${score.notes ? safeString(score.notes) : "-"}

Your level: ${displayLevel}

${getPerformanceLevelTooltip(wod)}`}
                      </span>
                    );

                    const scoreBadge = (
                      <Tooltip content={tooltipContent}>
                        <Badge
                          color={
                            color as
                              | "red"
                              | "blue"
                              | "green"
                              | "yellow"
                              | "purple"
                              | "gray"
                              | "indigo"
                          }
                          variant="soft"
                          radius="full"
                          size="2"
                          className="cursor-help"
                        >
                          {formattedScore}
                        </Badge>
                      </Tooltip>
                    );

                    return (
                      <Flex
                        key={score.id}
                        align="center"
                        gap="1"
                        wrap="nowrap"
                        className="group/score relative"
                      >
                        <div>{scoreBadge}</div>
                        {/* Edit and Delete Icons: only visible on hover */}
                        <div className="ml-1 flex space-x-1 opacity-0 transition-opacity group-hover/score:opacity-100">
                          <Tooltip content="Edit score">
                            <IconButton
                              size="1"
                              variant="ghost"
                              color="gray"
                              aria-label="Edit score"
                              onClick={
                                () =>
                                  openEditDialog && openEditDialog(score, wod) // Use new handler
                              }
                            >
                              <Pencil size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip content="Delete score">
                            <IconButton
                              size="1"
                              variant="ghost"
                              color="red"
                              aria-label="Delete score"
                              onClick={
                                () =>
                                  handleDeleteScore &&
                                  handleDeleteScore(score, wod) // Use new handler
                              }
                            >
                              <Trash size={16} />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </Flex>
                    );
                  })}
                </Flex>
              )}
              {/* Log Score button always visible */}
              <Button
                type="button"
                aria-label="Log Score"
                onClick={() => openLogDialog && openLogDialog(wod)} // Use new handler
                variant="ghost"
                color="green"
                size="1"
                className="flex items-center gap-1"
              >
                <Plus size={14} />
                <span className="font-medium">Log score</span>
              </Button>
            </div>
          );
        },
        size: 250,
        enableSorting: true, // Enable sorting for this column
        sortingFn: sortByLatestScoreLevel, // Assign the custom sorting function
      },
    ),
  ];
};

const WodTable: React.FC<WodTableProps> = ({
  wods,
  tableHeight,
  sortBy,
  sortDirection,
  handleSort,
  searchTerm,
  scoresByWodId,
  isLoadingScores,
  onScoreLogged,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // State for Log/Edit Dialog
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    wod: Wod | null;
    score: Score | null;
  }>({ isOpen: false, wod: null, score: null });

  // State for Delete Confirmation Dialog
  const [deletingScore, setDeletingScore] = useState<{
    score: Score;
    wod: Wod;
  } | null>(null);

  const utils = api.useUtils();
  const deleteScoreMutation = api.score.deleteScore.useMutation({
    onSuccess: async () => {
      await utils.score.getAllByUser.invalidate();
      if (onScoreLogged) onScoreLogged(); // Refresh scores after delete
    },
  });

  // Handlers for Dialogs
  const openLogDialog = (wod: Wod) => {
    setDialogState({ isOpen: true, wod: wod, score: null });
  };

  const openEditDialog = (score: Score, wod: Wod) => {
    setDialogState({ isOpen: true, wod: wod, score: score });
  };

  const handleDialogChange = (open: boolean) => {
    setDialogState((prev) => ({ ...prev, isOpen: open }));
  };

  const handleDeleteScore = (score: Score, wod: Wod) => {
    setDeletingScore({ score, wod });
  };

  const confirmDeleteScore = async () => {
    if (deletingScore) {
      deleteScoreMutation.mutate({ id: deletingScore.score.id });
      setDeletingScore(null);
    }
  };

  const cancelDeleteScore = () => {
    setDeletingScore(null);
  };

  const columns = useMemo(
    () =>
      createColumns(
        handleSort,
        sortBy,
        sortDirection,
        searchTerm,
        scoresByWodId,
        onScoreLogged, // Pass this down for refresh after log/edit
        openLogDialog, // Pass dialog opener
        openEditDialog, // Pass dialog opener
        handleDeleteScore, // Pass delete handler
      ),
    [
      handleSort,
      sortBy,
      sortDirection,
      searchTerm,
      scoresByWodId,
      onScoreLogged,
      // Dependencies for handlers are implicitly covered by WodTable scope
    ],
  );

  const table = useReactTable({
    data: wods,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true, // Keep manual sorting as the main sort logic is outside TanStack Table
    // No need for meta here, scoresByWodId is accessed via closure in sortingFn
  });

  const { rows } = table.getRowModel();

  // Disable virtualization in test environment for reliable test rendering
  const isTestEnv =
    typeof process !== "undefined" && process.env.NODE_ENV === "test";

  // Always call useVirtualizer, but set count to 0 in test env
  const rowVirtualizer = useVirtualizer({
    count: isTestEnv ? 0 : isLoadingScores ? 0 : rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 49,
    overscan: 5,
    measureElement: (element) => (element as HTMLElement).offsetHeight,
  });

  let renderedRows: React.ReactNode;
  if (isTestEnv) {
    renderedRows = rows.map((row) => (
      <div
        key={row.id}
        className="group flex w-full border-b border-table-border bg-table-row hover:bg-table-rowAlt"
        style={{
          width: table.getTotalSize(),
        }}
        data-index={row.index}
        role="row"
      >
        {row.getVisibleCells().map((cell) => (
          <div
            key={cell.id}
            className="flex flex-shrink-0 flex-grow-0 items-center border-r border-table-border px-3 py-2 text-sm last:border-r-0"
            style={{ width: `${cell.column.getSize()}px` }}
            role="cell"
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </div>
        ))}
      </div>
    ));
  } else {
    const virtualRows = rowVirtualizer.getVirtualItems();
    renderedRows = virtualRows.map((virtualRow) => {
      const row = rows[virtualRow.index];
      return (
        <div
          key={row.id}
          className="group absolute left-0 top-0 flex w-full border-b border-table-border bg-table-row hover:bg-table-rowAlt"
          style={{
            transform: `translateY(${virtualRow.start}px)`,
            width: table.getTotalSize(),
          }}
          ref={rowVirtualizer.measureElement}
          data-index={virtualRow.index}
          role="row"
        >
          {row.getVisibleCells().map((cell) => (
            <div
              key={cell.id}
              className="flex flex-shrink-0 flex-grow-0 items-center border-r border-table-border px-3 py-2 text-sm last:border-r-0"
              style={{ width: `${cell.column.getSize()}px` }}
              role="cell"
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          ))}
        </div>
      );
    });
  }

  const headerGroups = table.getHeaderGroups();

  const headerHeightEstimate = 40;
  const bodyHeight = tableHeight - headerHeightEstimate;

  return (
    <div
      ref={parentRef}
      className="w-full overflow-auto rounded-md border border-table-border"
      style={{ height: `${tableHeight}px` }}
    >
      {/* Sticky Header */}
      <div
        className="sticky top-0 z-10 bg-table-header"
        style={{ width: table.getTotalSize() }}
      >
        {headerGroups.map((headerGroup) => (
          <div key={headerGroup.id} className="flex" role="row">
            {headerGroup.headers.map((header) => (
              <div
                key={header.id}
                className="flex-shrink-0 flex-grow-0 border-b border-r border-table-border px-3 py-2 text-sm font-medium text-foreground last:border-r-0"
                style={{ width: `${header.getSize()}px` }}
                role="columnheader"
                aria-sort={
                  isValidSortBy(header.column.id) && header.column.id === sortBy
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Body Container - Handles Loading/No Results/Rows */}
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`, // Use virtualizer total size
          width: "100%",
          position: "relative",
        }}
      >
        {isLoadingScores ? (
          <Flex
            align="center"
            justify="center"
            className="absolute inset-0"
            style={{ height: `${bodyHeight}px` }}
          >
            <LoadingIndicator message="Loading scores..." />
          </Flex>
        ) : rows.length === 0 ? (
          <Flex
            align="center"
            justify="center"
            className="text-muted-foreground absolute inset-0"
            style={{ height: `${bodyHeight}px` }}
          >
            {/* No results found. */}
          </Flex>
        ) : (
          renderedRows
        )}
      </div>

      {/* Log/Edit Score Dialog */}
      {dialogState.isOpen && dialogState.wod && (
        <LogScoreDialog
          isOpen={dialogState.isOpen}
          onOpenChange={handleDialogChange}
          wod={dialogState.wod}
          initialScore={dialogState.score}
          onScoreLogged={() => {
            // Ensure scores are refreshed after dialog action
            if (onScoreLogged) onScoreLogged();
          }}
        />
      )}

      {/* Delete confirmation dialog */}
      {deletingScore && (
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
      )}
    </div>
  );
};

const isValidSortBy = (sortBy: string | null): sortBy is SortByType => {
  const validSortKeys: SortByType[] = [
    "wodName",
    "date",
    "difficulty",
    "countLikes",
    "results", // Add 'results' to valid keys
  ];
  return validSortKeys.includes(sortBy as SortByType);
};

const MemoizedWodTable = React.memo(WodTable);
MemoizedWodTable.displayName = "WodTable";

export default MemoizedWodTable;
