"use client";

import React, { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Button, IconButton } from "@radix-ui/themes";
import { Plus } from "lucide-react";
import type { Wod, Score } from "~/types/wodTypes";
import LogScoreForm from "./LogScoreForm";

interface LogScorePopoverProps {
  wod: Wod;
  onScoreLogged?: () => void;
  className?: string;
  showText?: boolean;
  initialScore?: Score | null;
  onClose?: () => void;
}

export const LogScorePopover: React.FC<LogScorePopoverProps> = ({
  wod,
  onScoreLogged,
  className,
  showText,
  initialScore,
  onClose,
}) => {
  const [open, setOpen] = useState(false);

  // Open popover for log or edit mode
  const openPopover = () => setOpen(true);

  // Close popover and call onClose if provided
  const closePopover = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  // When LogScoreForm calls onCancel, close the popover
  const handleCancel = () => {
    closePopover();
  };

  // When LogScoreForm logs/updates a score, close the popover and call onScoreLogged
  const handleScoreLogged = () => {
    closePopover();
    if (onScoreLogged) onScoreLogged();
  };

  // If initialScore changes (edit mode), open the popover automatically
  React.useEffect(() => {
    if (initialScore) setOpen(true);
  }, [initialScore]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        {showText ? (
          <Button
            type="button"
            aria-label="Log Score"
            onClick={openPopover}
            variant="ghost"
            color="green"
            size="1"
            className={`flex items-center gap-1 ${className ?? ""}`}
          >
            <Plus size={14} />
            <span className="font-medium">Log score</span>
          </Button>
        ) : (
          <IconButton
            type="button"
            aria-label="Log Score"
            onClick={openPopover}
            variant="ghost"
            color="green"
            size="1"
            className={`flex items-center ${className ?? ""}`}
          >
            <Plus size={14} />
          </IconButton>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-64 rounded-lg border bg-white p-4 shadow-lg dark:bg-neutral-900"
        >
          <LogScoreForm
            wod={wod}
            initialScore={initialScore}
            onScoreLogged={handleScoreLogged}
            onCancel={handleCancel}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default LogScorePopover;
