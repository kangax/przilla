"use client";

import React, { useState, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import * as Checkbox from "@radix-ui/react-checkbox";
import { Button } from "@radix-ui/themes";
import { Plus, Check } from "lucide-react";
import { api } from "~/trpc/react";
import type { Wod, Score } from "~/types/wodTypes";

// Define the payload type for logScore and updateScore mutations
type ScorePayload = {
  wodId: string;
  scoreDate: Date;
  isRx: boolean;
  notes?: string | null;
  time_seconds?: number | null;
  reps?: number | null;
  load?: number | null;
  rounds_completed?: number | null;
  partial_reps?: number | null;
};

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
  const isEditMode = !!initialScore;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    time_minutes: "",
    time_seconds: "",
    reps: "",
    load: "",
    rounds_completed: "",
    partial_reps: "",
    isRx: false,
    notes: "",
    scoreDate: new Date().toISOString().slice(0, 10),
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fill form with initialScore if editing
  useEffect(() => {
    if (isEditMode && initialScore) {
      setForm({
        time_minutes:
          initialScore.time_seconds != null
            ? Math.floor(initialScore.time_seconds / 60).toString()
            : "",
        time_seconds:
          initialScore.time_seconds != null
            ? (initialScore.time_seconds % 60).toString()
            : "",
        reps: initialScore.reps != null ? initialScore.reps.toString() : "",
        load: initialScore.load != null ? initialScore.load.toString() : "",
        rounds_completed:
          initialScore.rounds_completed != null
            ? initialScore.rounds_completed.toString()
            : "",
        partial_reps:
          initialScore.partial_reps != null
            ? initialScore.partial_reps.toString()
            : "",
        isRx: !!initialScore.isRx,
        notes: initialScore.notes || "",
        scoreDate: initialScore.scoreDate
          ? new Date(initialScore.scoreDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
      });
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialScore]);

  const logScoreMutation = api.score.logScore.useMutation({
    onSuccess: () => {
      setOpen(false);
      resetForm();
      setError(null);
      if (onScoreLogged) onScoreLogged();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to log score.");
    },
  });

  const updateScoreMutation = api.score.updateScore.useMutation({
    onSuccess: () => {
      setOpen(false);
      resetForm();
      setError(null);
      if (onScoreLogged) onScoreLogged();
      if (onClose) onClose();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to update score.");
    },
  });

  const tags = (wod.tags || []).map((t) => t.toLowerCase());
  const isForTime = tags.includes("for time");
  const isAmrap = tags.includes("amrap");
  const isLoad = tags.includes("load") || tags.includes("max load");

  const showTime = isForTime;
  const showReps = isAmrap;
  const showLoad = isLoad;
  const showRounds = isAmrap;
  const showPartialReps = isAmrap;
  const showAll =
    !showTime && !showReps && !showLoad && !showRounds && !showPartialReps;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleIsRxChange = (checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      isRx: checked,
    }));
  };

  const resetForm = () => {
    setForm({
      time_minutes: "",
      time_seconds: "",
      reps: "",
      load: "",
      rounds_completed: "",
      partial_reps: "",
      isRx: false,
      notes: "",
      scoreDate: new Date().toISOString().slice(0, 10),
    });
    setError(null);
    if (onClose) onClose();
  };

  // Validation: prevent empty results
  const validate = () => {
    if (showAll || showTime) {
      const min = form.time_minutes ? parseInt(form.time_minutes, 10) : 0;
      const sec = form.time_seconds ? parseInt(form.time_seconds, 10) : 0;
      if (min === 0 && sec === 0) {
        return "Please enter a time (minutes or seconds).";
      }
    }
    if (showAll || showReps) {
      if (!form.reps || parseInt(form.reps, 10) <= 0) {
        return "Please enter a positive number of reps.";
      }
    }
    if (showAll || showLoad) {
      if (!form.load || parseInt(form.load, 10) <= 0) {
        return "Please enter a positive load.";
      }
    }
    if (showAll || showRounds) {
      if (!form.rounds_completed || parseInt(form.rounds_completed, 10) < 0) {
        return "Please enter rounds completed (0 or more).";
      }
    }
    // partial_reps is optional
    return null;
  };

  const buildPayload = (): ScorePayload => {
    const payload: ScorePayload = {
      wodId: wod.id,
      scoreDate: new Date(form.scoreDate),
      isRx: form.isRx,
      notes: form.notes || null,
    };
    if (showAll || showTime) {
      // Convert minutes and seconds to total seconds
      const min = form.time_minutes ? parseInt(form.time_minutes, 10) : 0;
      const sec = form.time_seconds ? parseInt(form.time_seconds, 10) : 0;
      const totalSeconds =
        (!isNaN(min) ? min : 0) * 60 + (!isNaN(sec) ? sec : 0);
      payload.time_seconds =
        min === 0 && sec === 0 && !form.time_minutes && !form.time_seconds
          ? null
          : totalSeconds;
    }
    if (showAll || showReps)
      payload.reps = form.reps ? parseInt(form.reps, 10) : null;
    if (showAll || showLoad)
      payload.load = form.load ? parseInt(form.load, 10) : null;
    if (showAll || showRounds)
      payload.rounds_completed = form.rounds_completed
        ? parseInt(form.rounds_completed, 10)
        : null;
    if (showAll || showPartialReps)
      payload.partial_reps = form.partial_reps
        ? parseInt(form.partial_reps, 10)
        : null;
    return payload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setSubmitting(false);
      return;
    }

    try {
      const payload = buildPayload();

      if (isEditMode && initialScore) {
        await updateScoreMutation.mutateAsync({
          id: initialScore.id,
          ...payload,
        });
      } else {
        await logScoreMutation.mutateAsync(payload);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to submit score.");
      } else {
        setError("Failed to submit score.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Open popover if editing, otherwise controlled by user
  useEffect(() => {
    if (isEditMode && initialScore) {
      setOpen(true);
    }
  }, [isEditMode, initialScore]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`flex items-center gap-1 rounded px-1 py-0.5 text-xs text-green-600 transition hover:bg-green-50/10 hover:underline focus:outline-none ${className ?? ""}`}
          aria-label={isEditMode ? "Edit Score" : "Log Score"}
          onClick={() => setOpen(true)}
        >
          <Plus size={14} className="text-green-600" />
          {showText && (
            <span className="font-medium">
              {isEditMode ? "Edit score" : "Log score"}
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-64 rounded-lg border bg-white p-4 shadow-lg dark:bg-neutral-900"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="mb-1 text-base font-semibold">
              {isEditMode ? "Edit Score" : "Log Score"}
            </div>
            {(showAll || showTime) && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label
                    htmlFor="time_minutes"
                    className="mb-1 block text-xs font-medium"
                  >
                    Minutes
                  </label>
                  <input
                    id="time_minutes"
                    name="time_minutes"
                    type="number"
                    min={0}
                    placeholder="min"
                    value={form.time_minutes}
                    onChange={handleChange}
                    disabled={submitting}
                    className="w-full rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    autoComplete="off"
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="time_seconds"
                    className="mb-1 block text-xs font-medium"
                  >
                    Seconds
                  </label>
                  <input
                    id="time_seconds"
                    name="time_seconds"
                    type="number"
                    min={0}
                    max={59}
                    placeholder="sec"
                    value={form.time_seconds}
                    onChange={handleChange}
                    disabled={submitting}
                    className="w-full rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    autoComplete="off"
                  />
                </div>
              </div>
            )}
            {(showAll || showReps) && (
              <div>
                <label
                  htmlFor="reps"
                  className="mb-1 block text-xs font-medium"
                >
                  Reps
                </label>
                <input
                  id="reps"
                  name="reps"
                  type="number"
                  min={0}
                  placeholder="Reps"
                  value={form.reps}
                  onChange={handleChange}
                  disabled={submitting}
                  className="w-full rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoComplete="off"
                />
              </div>
            )}
            {(showAll || showLoad) && (
              <div>
                <label
                  htmlFor="load"
                  className="mb-1 block text-xs font-medium"
                >
                  Load
                </label>
                <input
                  id="load"
                  name="load"
                  type="number"
                  min={0}
                  placeholder="Load"
                  value={form.load}
                  onChange={handleChange}
                  disabled={submitting}
                  className="w-full rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoComplete="off"
                />
              </div>
            )}
            {(showAll || showRounds) && (
              <div>
                <label
                  htmlFor="rounds_completed"
                  className="mb-1 block text-xs font-medium"
                >
                  Rounds
                </label>
                <input
                  id="rounds_completed"
                  name="rounds_completed"
                  type="number"
                  min={0}
                  placeholder="Rounds"
                  value={form.rounds_completed}
                  onChange={handleChange}
                  disabled={submitting}
                  className="w-full rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoComplete="off"
                />
              </div>
            )}
            {(showAll || showPartialReps) && (
              <div>
                <label
                  htmlFor="partial_reps"
                  className="mb-1 block text-xs font-medium"
                >
                  Partial Reps
                </label>
                <input
                  id="partial_reps"
                  name="partial_reps"
                  type="number"
                  min={0}
                  placeholder="Partial Reps"
                  value={form.partial_reps}
                  onChange={handleChange}
                  disabled={submitting}
                  className="w-full rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoComplete="off"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox.Root
                id={`isRx-${wod.id}`}
                checked={form.isRx}
                onCheckedChange={handleIsRxChange}
                disabled={submitting}
                className="flex h-4 w-4 items-center justify-center rounded border border-input bg-background focus:outline-none data-[state=checked]:border-green-600 data-[state=checked]:bg-green-600"
                aria-label="Rx"
              >
                <Checkbox.Indicator>
                  <Check size={14} className="text-white" />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <label
                htmlFor={`isRx-${wod.id}`}
                className="cursor-pointer select-none text-xs"
              >
                Rx
              </label>
              <input
                name="scoreDate"
                type="date"
                value={form.scoreDate}
                onChange={handleChange}
                disabled={submitting}
                className="input input-sm ml-auto w-[120px] rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="notes" className="mb-1 block text-xs font-medium">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                placeholder="Notes"
                value={form.notes}
                onChange={handleChange}
                disabled={submitting}
                className="w-full resize-none rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={2}
              />
            </div>
            {error && <div className="text-xs text-red-600">{error}</div>}
            <div className="flex gap-2">
              <Button
                type="submit"
                color="green"
                disabled={submitting}
                size="2"
                className="w-full"
              >
                {submitting
                  ? isEditMode
                    ? "Updating..."
                    : "Logging..."
                  : isEditMode
                    ? "Update Score"
                    : "Log Score"}
              </Button>
              {isEditMode && (
                <Button
                  type="button"
                  color="gray"
                  disabled={submitting}
                  size="2"
                  className="w-full"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default LogScorePopover;
