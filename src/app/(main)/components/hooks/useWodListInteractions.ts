import { useState } from "react";
import type { Wod, Score } from "~/types/wodTypes";
import { api } from "~/trpc/react";
import { useToast } from "~/components/ToastProvider";

type UseWodListInteractionsProps = {
  wods: Wod[];
  onScoreLogged?: () => void; // Callback for after score is logged/edited via LogScoreForm
};

export function useWodListInteractions({
  wods,
  onScoreLogged,
}: UseWodListInteractionsProps) {
  const [logSheetWodId, setLogSheetWodId] = useState<string | null>(null);
  const [editingScore, setEditingScore] = useState<Score | null>(null);
  const [deletingScore, setDeletingScore] = useState<{
    score: Score;
    wod: Wod;
  } | null>(null);

  const { showToast } = useToast();
  const utils = api.useUtils();

  const deleteScoreMutation = api.score.deleteScore.useMutation({
    onSuccess: async () => {
      await utils.score.getAllByUser.invalidate();
      // Potentially invalidate other queries if needed, e.g., WOD specific scores if such a query exists
      setDeletingScore(null);
      showToast("success", "Score deleted");
      // Note: onScoreLogged is typically for add/edit, but if delete affects overall view, consider similar callback
    },
    onError: (error) => {
      setDeletingScore(null);
      showToast("error", `Failed to delete score: ${error.message}`);
    },
  });

  const currentSheetWod =
    logSheetWodId != null ? wods.find((w) => w.id === logSheetWodId) : null;

  const handleLogScore = (wodId: string) => {
    setLogSheetWodId(wodId);
    setEditingScore(null);
  };

  const handleEditScore = (wodId: string, score: Score) => {
    setLogSheetWodId(wodId);
    setEditingScore(score);
  };

  const handleDrawerClose = () => {
    setLogSheetWodId(null);
    setEditingScore(null);
    // If onScoreLogged was triggered from LogScoreForm, it's handled there.
    // If drawer is closed manually, onScoreLogged might not be relevant unless form was submitted.
  };

  // This is the callback for LogScoreForm's own onScoreLogged
  const handleScoreFormSuccess = () => {
    if (onScoreLogged) {
      onScoreLogged(); // Call the parent's onScoreLogged if provided
    }
    handleDrawerClose(); // Close drawer after success
  };

  const handleDeleteScore = (wod: Wod, score: Score) => {
    setDeletingScore({ wod, score });
  };

  const confirmDeleteScore = async () => {
    if (deletingScore) {
      deleteScoreMutation.mutate({ id: deletingScore.score.id });
    }
  };

  const cancelDeleteScore = () => {
    setDeletingScore(null);
  };

  return {
    logSheetWodId,
    editingScore,
    deletingScore,
    currentSheetWod,
    handleLogScore,
    handleEditScore,
    handleDrawerClose,
    handleScoreFormSuccess, // New handler for LogScoreForm
    handleDeleteScore,
    confirmDeleteScore,
    cancelDeleteScore,
    deleteScoreMutationStatus: deleteScoreMutation.status,
  };
}
