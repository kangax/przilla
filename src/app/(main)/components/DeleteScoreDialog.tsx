import React from "react";
import { Dialog, Button, Flex } from "@radix-ui/themes";
import type { Score, Wod } from "~/types/wodTypes";

interface DeleteScoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
  score: Score;
  wod: Wod;
}

export const DeleteScoreDialog: React.FC<DeleteScoreDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  isDeleting,
  score,
  wod,
}) => (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Content>
      <Dialog.Title>Delete Score</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete this score for <b>{wod.wodName}</b>?
        This action cannot be undone.
      </Dialog.Description>
      <Flex gap="3" mt="4" justify="end">
        <Button variant="soft" color="gray" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="solid"
          color="red"
          onClick={onConfirm}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </Flex>
    </Dialog.Content>
  </Dialog.Root>
);
