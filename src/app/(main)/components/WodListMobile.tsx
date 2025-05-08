import React, { useState, useMemo, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash,
  Share2,
  Star, // Added Star icon
} from "lucide-react";
import { useSearchParams } from "next/navigation"; // Added useSearchParams
import type { Wod, Score } from "~/types/wodTypes";
import { useSession } from "~/lib/auth-client";
// useQueryClient is not directly used, can be removed if not needed by other parts.
// It's used by useFavoriteWod hook, so it's fine if it's imported but not directly here.
import { parseTags } from "~/utils/wodUtils"; // formatScore, getPerformanceBadgeDetails, HighlightMatch moved to WodMobileCard
import { checkWodMatch } from "~/utils/wodFuzzySearch"; // Import checkWodMatch
import LogScoreForm from "./LogScoreForm";
import { WodMobileCard } from "./WodMobileCard"; // Import the new component
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "../../../components/ui/drawer";
import { Dialog, Button, Flex } from "@radix-ui/themes";
import { useFavoriteWod } from "./hooks/useFavoriteWod"; // Import the new hook
import { useWodListInteractions } from "./hooks/useWodListInteractions"; // Import the new hook

type ScoresByWodId = Record<string, Score[]>;

type WodListMobileProps = {
  wods: Wod[];
  scoresByWodId: ScoresByWodId;
  searchTerm: string;
  onScoreLogged?: () => void;
  // removed expandedWodIdFromUrl
};

// Comments about moved/removed code can be deleted now.

export function WodListMobile({
  wods,
  scoresByWodId,
  searchTerm,
  onScoreLogged,
}: WodListMobileProps) {
  const searchParams = useSearchParams();
  const [expandedWodId, setExpandedWodId] = useState<string | null>(null);
  const didInitExpandedWodId = React.useRef(false);
  const cardRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const { data: session } = useSession();
  const isUserLoggedIn = !!session?.user;

  const {
    editingScore,
    deletingScore,
    currentSheetWod,
    handleLogScore,
    handleEditScore,
    handleDrawerClose,
    handleScoreFormSuccess,
    handleDeleteScore,
    confirmDeleteScore,
    cancelDeleteScore,
    deleteScoreMutationStatus,
  } = useWodListInteractions({ wods, onScoreLogged });

  // Initialize expandedWodId from URL param if provided, only once
  useEffect(() => {
    if (!didInitExpandedWodId.current) {
      const wodIdFromUrl = searchParams.get("expandedWodId");
      if (wodIdFromUrl && wods.some((w) => w.id === wodIdFromUrl)) {
        setExpandedWodId(wodIdFromUrl);
      }
      didInitExpandedWodId.current = true; // Mark as initialized even if not found, to prevent re-running
    }
  }, [searchParams, wods]); // Depend on searchParams

  // Scroll expanded card into view when expandedWodId changes
  useEffect(() => {
    if (expandedWodId && cardRefs.current[expandedWodId]) {
      cardRefs.current[expandedWodId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [expandedWodId]);

  // Use the new hook for favorite logic
  const { handleToggleFavorite } = useFavoriteWod({ searchTerm });

  const toggleExpand = (wodId: string) => {
    setExpandedWodId(expandedWodId === wodId ? null : wodId);
  };

  const matchedWodIds = useMemo(() => {
    if (!searchTerm.trim()) return new Set<string>();
    return new Set(
      wods.filter((wod) => checkWodMatch(wod, searchTerm)).map((wod) => wod.id),
    );
  }, [wods, searchTerm]);

  return (
    <>
      <div className="space-y-4 px-2 pb-4">
        {wods.map((wod) => {
          const isManuallyExpanded = expandedWodId === wod.id;
          const isSearchMatch = matchedWodIds.has(wod.id);
          const isExpanded =
            isManuallyExpanded || (isSearchMatch && expandedWodId !== wod.id);
          const wodScores = scoresByWodId?.[wod.id] || [];

          return (
            <WodMobileCard
              key={wod.id}
              wod={wod}
              wodScores={wodScores}
              searchTerm={searchTerm}
              isExpanded={isExpanded}
              isUserLoggedIn={isUserLoggedIn}
              onToggleExpand={toggleExpand}
              onLogScore={handleLogScore}
              onEditScore={handleEditScore}
              onDeleteScore={handleDeleteScore}
              onToggleFavorite={handleToggleFavorite}
              cardRef={(el) => {
                cardRefs.current[wod.id] = el;
              }}
            />
          );
        })}
      </div>
      {/* Bottom Sheet for Log/Edit Score */}
      <Drawer
        open={!!currentSheetWod}
        onOpenChange={(open) => {
          if (!open) handleDrawerClose(); // Use hook's handler
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
              ? editingScore // Use hook's state
                ? `Edit Score for ${currentSheetWod.wodName}`
                : `Log Score for ${currentSheetWod.wodName}`
              : "Log Score"}
          </DrawerTitle>
          <div className="px-4 pb-6 pt-2">
            {currentSheetWod && (
              <LogScoreForm
                wod={currentSheetWod}
                initialScore={editingScore} // Use hook's state
                onScoreLogged={handleScoreFormSuccess} // Use new success handler from hook
                onCancel={handleDrawerClose} // Use hook's handler
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
              disabled={deleteScoreMutationStatus === "pending"} // Use status from hook
            >
              {deleteScoreMutationStatus === "pending" // Use status from hook
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
