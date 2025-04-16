"use client";

import React, { useState, useEffect, useRef } from "react"; // Added useRef
import * as Dialog from "@radix-ui/react-dialog";
import {
  Button,
  TextField,
  TextArea,
  Switch, // Import Switch
  Text,
  Flex,
  Box,
  IconButton,
} from "@radix-ui/themes";
import { X } from "lucide-react";
import { api } from "../../../trpc/react"; // Corrected path
import type { Wod, Score } from "../../../types/wodTypes"; // Corrected path

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

interface LogScoreDialogProps {
  wod: Wod;
  onScoreLogged?: () => void;
  initialScore?: Score | null; // Score to edit, null for logging new
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // Trigger is now handled externally by the parent component
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

export const LogScoreDialog: React.FC<LogScoreDialogProps> = ({
  wod,
  onScoreLogged,
  initialScore,
  isOpen,
  onOpenChange,
}) => {
  // isEditMode is determined ONLY by the presence of initialScore prop
  const isEditMode = !!initialScore;
  // Initialize state using the constant
  const [form, setForm] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
  );

  // Find the portal container element on mount
  useEffect(() => {
    const container = document.getElementById("page-layout-container");
    setPortalContainer(container);
  }, []);

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
    } else {
      // Reset form if switching from edit to log mode while dialog is technically open
      // or if opening in log mode initially
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialScore, isEditMode, isOpen]); // Depend on isOpen to reset when opened in log mode

  const logScoreMutation = api.score.logScore.useMutation({
    onSuccess: () => {
      onOpenChange(false); // Close dialog on success
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
      onOpenChange(false); // Close dialog on success
      resetForm(); // Reset form on success
      setError(null);
      if (onScoreLogged) onScoreLogged();
      // No need for onClose callback, parent controls open state
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
  };

  // Handle dialog open state changes (e.g., clicking outside, pressing Esc)
  const handleOpenChange = (newOpenState: boolean) => {
    onOpenChange(newOpenState); // Notify parent
    if (!newOpenState) {
      // If closing, always reset form
      resetForm();
    }
  };

  // Validation: prevent empty results
  const validate = () => {
    if (showAll || showTime) {
      const min = form.time_minutes ? parseInt(form.time_minutes, 10) : 0;
      const sec = form.time_seconds ? parseInt(form.time_seconds, 10) : 0;
      if (min === 0 && sec === 0 && !form.time_minutes && !form.time_seconds) {
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

  return (
    // Use handleOpenChange to manage closing behavior and reset form
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      {/* Trigger is now handled externally by the parent component */}
      {/* <Dialog.Trigger asChild> ... </Dialog.Trigger> */}
      <Dialog.Portal container={portalContainer}>
        {" "}
        {/* Use the container prop */}
        <Dialog.Overlay className="data-[state=open]:animate-overlayShow fixed inset-0 z-40 bg-black/50" />
        {/* Removed explicit bg-white and dark:bg-neutral-900 to allow Radix Theme to control background */}
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border p-6 shadow-lg dark:border-neutral-700">
          <Dialog.Title asChild>
            <Text size="4" weight="bold" mb="4" className="block">
              {isEditMode ? "Edit Score" : "Log Score"} for {wod.wodName}
            </Text>
          </Dialog.Title>

          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="3">
              {/* Input fields remain the same */}
              {(showAll || showTime) && (
                <Flex gap="2" align="end">
                  {" "}
                  {/* Align items to end for label alignment */}
                  {/* Apply fixed width to the Box */}
                  <Box style={{ width: "165px" }}>
                    <Text as="label" htmlFor="time_minutes" size="1" mb="1">
                      Minutes
                    </Text>
                    <TextField.Root
                      variant="classic"
                      id="time_minutes"
                      name="time_minutes"
                      type="number"
                      min={0}
                      placeholder="min"
                      value={form.time_minutes}
                      onChange={handleChange}
                      disabled={submitting}
                      size="3" // Updated size
                      autoComplete="off"
                    />
                  </Box>
                  {/* Apply fixed width to the Box */}
                  <Box style={{ width: "165px" }}>
                    <Text as="label" htmlFor="time_seconds" size="1" mb="1">
                      Seconds
                    </Text>
                    <TextField.Root
                      variant="classic"
                      id="time_seconds"
                      name="time_seconds"
                      type="number"
                      min={0}
                      max={59}
                      placeholder="sec"
                      value={form.time_seconds}
                      onChange={handleChange}
                      disabled={submitting}
                      size="3" // Updated size
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
                    variant="classic"
                    id="reps"
                    name="reps"
                    type="number"
                    min={0}
                    placeholder="Reps"
                    value={form.reps}
                    onChange={handleChange}
                    disabled={submitting}
                    size="3" // Updated size
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
                    variant="classic"
                    id="load"
                    name="load"
                    type="number"
                    min={0}
                    placeholder="Load"
                    value={form.load}
                    onChange={handleChange}
                    disabled={submitting}
                    size="3" // Updated size
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
                    variant="classic"
                    id="rounds_completed"
                    name="rounds_completed"
                    type="number"
                    min={0}
                    placeholder="Rounds"
                    value={form.rounds_completed}
                    onChange={handleChange}
                    disabled={submitting}
                    size="3" // Updated size
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
                    variant="classic"
                    id="partial_reps"
                    name="partial_reps"
                    type="number"
                    min={0}
                    placeholder="Partial Reps"
                    value={form.partial_reps}
                    onChange={handleChange}
                    disabled={submitting}
                    size="3" // Updated size
                    autoComplete="off"
                  />
                </Box>
              )}

              {/* Rearranged Date and Rx - Align center, remove justify */}
              <Flex align="center" gap="3">
                {/* Date Input with Label on the left */}
                <Box style={{ flexBasis: "140px" }}>
                  {" "}
                  {/* Give date a basis width */}
                  <Text as="label" htmlFor="scoreDate" size="1" mb="1">
                    Date
                  </Text>
                  <TextField.Root
                    variant="classic"
                    id="scoreDate"
                    name="scoreDate"
                    type="date"
                    value={form.scoreDate}
                    onChange={handleChange}
                    disabled={submitting}
                    size="3" // Updated size
                    autoComplete="off"
                  />
                </Box>

                {/* Rx Switch with Label on the right */}
                {/* Wrap Switch in a Box and add a visually hidden label */}
                <Box>
                  <Text
                    as="label"
                    htmlFor={`isRx-${wod.id}`}
                    size="1"
                    mb="1"
                    className="opacity-0" // Use opacity-0 to hide but retain space
                  >
                    Rx
                  </Text>
                  <Flex gap="2" align="center">
                    <Switch
                      id={`isRx-${wod.id}`}
                      checked={form.isRx}
                      onCheckedChange={handleIsRxChange}
                      disabled={submitting}
                      color="green"
                      size="3" // Updated size
                    />
                    <Text size="2">Rx</Text> {/* Keep visible Rx text */}
                  </Flex>
                </Box>
              </Flex>

              <Box>
                <Text as="label" htmlFor="notes" size="1" mb="1">
                  Notes
                </Text>
                <TextArea
                  variant="classic"
                  id="notes"
                  name="notes"
                  placeholder="Notes"
                  value={form.notes}
                  onChange={handleChange}
                  disabled={submitting}
                  size="3" // Updated size
                  rows={4}
                  style={{ resize: "none" }}
                />
              </Box>

              {error && (
                <Text size="1" color="red">
                  {error}
                </Text>
              )}

              <Flex direction="row" gap="3" justify="end" mt="4">
                <Dialog.Close asChild>
                  <Button
                    type="button"
                    variant="soft"
                    color="gray"
                    disabled={submitting}
                    size="3" // Updated size
                  >
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  type="submit"
                  color="green"
                  disabled={submitting}
                  size="3" // Updated size
                >
                  {submitting
                    ? isEditMode
                      ? "Updating..."
                      : "Logging..."
                    : isEditMode
                      ? "Update Score"
                      : "Log Score"}
                </Button>
              </Flex>
            </Flex>
          </form>

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
