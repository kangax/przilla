"use client";

import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Text, IconButton } from "@radix-ui/themes";
import { X } from "lucide-react";
import type { Wod, Score } from "../../../types/wodTypes";
import LogScoreForm from "./LogScoreForm";

interface LogScoreDialogProps {
  wod: Wod;
  onScoreLogged?: () => void;
  initialScore?: Score | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LogScoreDialog: React.FC<LogScoreDialogProps> = ({
  wod,
  onScoreLogged,
  initialScore,
  isOpen,
  onOpenChange,
}) => {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
  );

  useEffect(() => {
    const container = document.getElementById("page-layout-container");
    setPortalContainer(container);
  }, []);

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal container={portalContainer}>
        <Dialog.Overlay className="data-[state=open]:animate-overlayShow fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-6 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          <Dialog.Title asChild>
            <Text size="4" weight="bold" mb="4" className="block">
              {initialScore ? "Edit Score" : "Log Score"} for {wod.wodName}
            </Text>
          </Dialog.Title>
          <Dialog.Description asChild>
            <Text
              size="2"
              mb="4"
              className="block text-slate-600 dark:text-slate-400"
            >
              {initialScore
                ? "Update the details of your recorded score."
                : "Enter the details of your score for this WOD."}
            </Text>
          </Dialog.Description>
          <LogScoreForm
            wod={wod}
            onScoreLogged={onScoreLogged}
            initialScore={initialScore}
            onCancel={() => onOpenChange(false)}
          />
          <Dialog.Close asChild>
            <IconButton
              variant="ghost"
              color="gray"
              aria-label="Close"
              className="absolute right-3 top-3"
            >
              <X size={18} />
            </IconButton>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default LogScoreDialog;
