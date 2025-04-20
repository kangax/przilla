"use client";

import React, { useState, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import {
  Button,
  TextField,
  TextArea,
  Checkbox,
  Text,
  Flex,
  Box,
  IconButton,
} from "@radix-ui/themes";
import { Plus } from "lucide-react";
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

// Define initial state outside component for reuse
const initialFormState = {
  time_minutes: "",
  time_seconds: "",
  reps: "",
  load: "",
  rounds_completed: "",
  partial_reps: "",
  isRx: false,
  notes: "",
  scoreDate: new Date().toISOString().slice(0, 10),
};

export const LogScorePopover: React.FC<LogScorePopoverProps> = ({
  wod,
  onScoreLogged,
  className,
  showText,
  initialScore,
  onClose,
}) => {
  // isEditMode is determined ONLY by the presence of initialScore prop
  const isEditMode = !!initialScore;
  const [open, setOpen] = useState(false);
  // Initialize state using the constant
  const [form, setForm] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fill form with initialScore if editing AND the popover should open for editing
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
      // Open the popover programmatically when in edit mode
      setOpen(true);
    }
    // Dependency array ensures this runs when initialScore changes (entering edit mode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialScore]); // isEditMode is derived, not needed here

  const logScoreMutation = api.score.logScore.useMutation({
    onSuccess: () => {
      setOpen(false);
      resetForm(); // Reset form on success
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
      resetForm(); // Reset form on success
      setError(null);
      if (onScoreLogged) onScoreLogged();
      if (onClose) onClose(); // Call onClose specific to edit mode
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
    const { name, value } = e.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleIsRxChange = (checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      isRx: checked,
    }));
  };

  // Resets form to initial state
  const resetForm = () => {
    setForm(initialFormState);
    setError(null);
    // Don't call onClose here, it's specific to edit mode cancellation/success
  };

  // Handler for the "+ Log Score" button click
  const openInLogMode = () => {
    resetForm(); // Ensure form is reset
    setOpen(true); // Open the popover
  };

  // Handle popover open state changes (e.g., clicking outside)
  const handleOpenChange = (newOpenState: boolean) => {
    setOpen(newOpenState);
    if (!newOpenState) {
      // If closing, reset form and call onClose if in edit mode
      resetForm();
      if (isEditMode && onClose) {
        onClose();
      }
    }
  };

  // Validation: prevent empty results
  const validate = () => {
    if (showAll || showTime) {
      const min = form.time_minutes ? parseInt(form.time_minutes, 10) : 0;
      const sec = form.time_seconds ? parseInt(form.time_seconds, 10) : 0;
      if (min === 0 && sec === 0 && !form.time_minutes && !form.time_seconds) {
        // Check if both are empty strings too
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

      // Use the isEditMode flag derived from initialScore prop presence
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

  // No need for the separate useEffect to open in edit mode,
  // the main useEffect handling initialScore already does setOpen(true)

  return (
    // Use handleOpenChange to manage closing behavior
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        {/* Trigger button ALWAYS shows "Log score" and uses openInLogMode */}
        {showText ? (
          <Button
            type="button"
            aria-label="Log Score" // Always "Log Score"
            onClick={openInLogMode} // Use specific handler for log mode
            variant="ghost"
            color="green"
            size="1"
            className={`flex items-center gap-1 ${className ?? ""}`}
          >
            <Plus size={14} />
            <span className="font-medium">
              Log score {/* Always "Log score" */}
            </span>
          </Button>
        ) : (
          <IconButton
            type="button"
            aria-label="Log Score" // Always "Log Score"
            onClick={openInLogMode} // Use specific handler for log mode
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
          className="z-50 w-64 rounded-lg border bg-white p-4 shadow-lg dark:bg-neutral-900" // Keep existing popover content styling
        >
          <Box asChild>
            {/* Form content depends on isEditMode for title/submit button text */}
            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap="3">
                <Text size="3" weight="bold" mb="1">
                  {/* Title changes based on mode */}
                  {isEditMode ? "Edit Score" : "Log Score"}
                </Text>

                {/* Input fields remain the same */}
                {(showAll || showTime) && (
                  <Flex gap="2">
                    <Box flexGrow="1">
                      <Text as="label" htmlFor="time_minutes" size="1" mb="1">
                        Minutes
                      </Text>
                      <TextField.Root
                        variant="classic" // Use classic variant
                        id="time_minutes"
                        name="time_minutes"
                        type="number"
                        min={0}
                        placeholder="min"
                        value={form.time_minutes}
                        onChange={handleChange}
                        disabled={submitting}
                        size="1"
                        autoComplete="off"
                      />
                    </Box>
                    <Box flexGrow="1">
                      <Text as="label" htmlFor="time_seconds" size="1" mb="1">
                        Seconds
                      </Text>
                      <TextField.Root
                        variant="classic" // Use classic variant
                        id="time_seconds"
                        name="time_seconds"
                        type="number"
                        min={0}
                        max={59}
                        placeholder="sec"
                        value={form.time_seconds}
                        onChange={handleChange}
                        disabled={submitting}
                        size="1"
                        autoComplete="off"
                      />
                    </Box>
                  </Flex>
                )}

                {(showAll || showReps) && (
                  <Box>
                    <Text as="label" htmlFor="reps" size="1" mb="1">
                      Reps
                    </Text>
                    <TextField.Root
                      variant="classic" // Use classic variant
                      id="reps"
                      name="reps"
                      type="number"
                      min={0}
                      placeholder="Reps"
                      value={form.reps}
                      onChange={handleChange}
                      disabled={submitting}
                      size="1"
                      autoComplete="off"
                    />
                  </Box>
                )}

                {(showAll || showLoad) && (
                  <Box>
                    <Text as="label" htmlFor="load" size="1" mb="1">
                      Load
                    </Text>
                    <TextField.Root
                      variant="classic" // Use classic variant
                      id="load"
                      name="load"
                      type="number"
                      min={0}
                      placeholder="Load"
                      value={form.load}
                      onChange={handleChange}
                      disabled={submitting}
                      size="1"
                      autoComplete="off"
                    />
                  </Box>
                )}

                {(showAll || showRounds) && (
                  <Box>
                    <Text as="label" htmlFor="rounds_completed" size="1" mb="1">
                      Rounds
                    </Text>
                    <TextField.Root
                      variant="classic" // Use classic variant
                      id="rounds_completed"
                      name="rounds_completed"
                      type="number"
                      min={0}
                      placeholder="Rounds"
                      value={form.rounds_completed}
                      onChange={handleChange}
                      disabled={submitting}
                      size="1"
                      autoComplete="off"
                    />
                  </Box>
                )}

                {(showAll || showPartialReps) && (
                  <Box>
                    <Text as="label" htmlFor="partial_reps" size="1" mb="1">
                      Partial Reps
                    </Text>
                    <TextField.Root
                      variant="classic" // Use classic variant
                      id="partial_reps"
                      name="partial_reps"
                      type="number"
                      min={0}
                      placeholder="Partial Reps"
                      value={form.partial_reps}
                      onChange={handleChange}
                      disabled={submitting}
                      size="1"
                      autoComplete="off"
                    />
                  </Box>
                )}

                <Flex align="center" justify="between" gap="2">
                  <Text as="label" size="1">
                    <Flex gap="2" align="center">
                      <Checkbox
                        id={`isRx-${wod.id}`}
                        checked={form.isRx}
                        onCheckedChange={handleIsRxChange}
                        disabled={submitting}
                        color="green"
                        size="1"
                      />{" "}
                      Rx
                    </Flex>
                  </Text>
                  <TextField.Root
                    variant="classic" // Use classic variant
                    name="scoreDate"
                    type="date"
                    value={form.scoreDate}
                    onChange={handleChange}
                    disabled={submitting}
                    size="1"
                    style={{ width: "120px" }}
                    autoComplete="off"
                  />
                </Flex>

                <Box>
                  <Text as="label" htmlFor="notes" size="1" mb="1">
                    Notes
                  </Text>
                  <TextArea
                    variant="classic" // Use classic variant
                    id="notes"
                    name="notes"
                    placeholder="Notes"
                    value={form.notes}
                    onChange={handleChange}
                    disabled={submitting}
                    size="1"
                    rows={2}
                    style={{ resize: "none" }}
                  />
                </Box>

                {error && (
                  <Text size="1" color="red">
                    {error}
                  </Text>
                )}

                <Flex direction="column" gap="1">
                  <Button
                    type="submit"
                    color="green"
                    disabled={submitting}
                    size="2"
                    className="w-full"
                  >
                    {/* Submit button text changes based on mode */}
                    {submitting
                      ? isEditMode
                        ? "Updating..."
                        : "Logging..."
                      : isEditMode
                        ? "Update Score"
                        : "Log Score"}
                  </Button>
                  {/* Cancel button only shown in edit mode */}
                  {isEditMode && (
                    <Button
                      type="button"
                      variant="soft" // Use soft variant for cancel
                      color="gray"
                      disabled={submitting}
                      size="2"
                      className="w-full"
                      onClick={() => {
                        // Close popover using the handler
                        handleOpenChange(false);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </Flex>
              </Flex>
            </form>
          </Box>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default LogScorePopover;
