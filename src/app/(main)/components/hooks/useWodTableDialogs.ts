import { useState } from "react";
import type { Wod, Score } from "~/types/wodTypes";
import { api } from "~/trpc/react";
import { useToast } from "~/components/ToastProvider";

interface UseWodTableDialogsParams {
  onDialogActionCompletion?: () => void; // Callback for when a score is logged, edited, or deleted
}

export const useWodTableDialogs = ({
  onDialogActionCompletion,
}: UseWodTableDialogsParams) => {
  const [logScoreDialogState, setLogScoreDialogState] = useState<{
    isOpen: boolean;
    wod: Wod | null;
    scoreToEdit: Score | null; // Renamed from 'score' for clarity
  }>({ isOpen: false, wod: null, scoreToEdit: null });

  const [deleteScoreDialogState, setDeleteScoreDialogState] = useState<{
    isOpen: boolean;
    scoreToDelete: Score | null;
    wodAssociated: Wod | null; // WOD associated with the score being deleted
  }>({ isOpen: false, scoreToDelete: null, wodAssociated: null });

  const { showToast } = useToast();
  const utils = api.useUtils();

  const deleteScoreMutation = api.score.deleteScore.useMutation({
    onSuccess: async () => {
      await utils.score.getAllByUser.invalidate(); // Invalidate all scores for the user
      // Potentially invalidate other queries if needed, e.g., WOD specific scores if applicable
      if (onDialogActionCompletion) {
        onDialogActionCompletion();
      }
      showToast("success", "Score deleted successfully");
      setDeleteScoreDialogState({ isOpen: false, scoreToDelete: null, wodAssociated: null });
    },
    onError: (error) => {
      showToast("error", `Failed to delete score: ${error.message}`);
      // Optionally keep dialog open or provide more specific error handling
    },
  });

  const openLogNewScoreDialog = (wod: Wod) => {
    setLogScoreDialogState({ isOpen: true, wod: wod, scoreToEdit: null });
  };

  const openEditScoreDialog = (score: Score, wod: Wod) => {
    setLogScoreDialogState({ isOpen: true, wod: wod, scoreToEdit: score });
  };

  const handleLogScoreDialogChange = (open: boolean) => {
    if (!open) {
      // Reset state when dialog is closed
      setLogScoreDialogState({ isOpen: false, wod: null, scoreToEdit: null });
    } else {
      // This case should ideally be handled by openLogNewScoreDialog/openEditScoreDialog
      // For safety, ensure it's at least set to open
      setLogScoreDialogState((prev) => ({ ...prev, isOpen: true }));
    }
  };
  
  const handleLogScoreDialogSubmit = () => {
    // This function is called from LogScoreDialog upon successful submission
    if (onDialogActionCompletion) {
        onDialogActionCompletion();
    }
    // The LogScoreDialog itself will handle closing and toast notifications for log/edit
  }

  const requestDeleteScore = (score: Score, wod: Wod) => {
    setDeleteScoreDialogState({ isOpen: true, scoreToDelete: score, wodAssociated: wod });
  };

  const confirmDeleteScore = async () => {
    if (deleteScoreDialogState.scoreToDelete) {
      deleteScoreMutation.mutate({ id: deleteScoreDialogState.scoreToDelete.id });
      // Dialog closure and toast is handled by onSuccess/onError of mutation
    }
  };

  const cancelDeleteScore = () => {
    setDeleteScoreDialogState({ isOpen: false, scoreToDelete: null, wodAssociated: null });
  };

  return {
    // Log/Edit Score Dialog
    logScoreDialogState,
    openLogNewScoreDialog,
    openEditScoreDialog,
    handleLogScoreDialogChange,
    handleLogScoreDialogSubmit, // Pass this to LogScoreDialog

    // Delete Score Dialog
    deleteScoreDialogState,
    requestDeleteScore,
    confirmDeleteScore,
    cancelDeleteScore,
    isDeletingScore: deleteScoreMutation.status === "pending",
  };
};
