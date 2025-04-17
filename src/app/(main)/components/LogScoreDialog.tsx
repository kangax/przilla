"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as RadioGroup from "@radix-ui/react-radio-group";
import {
  Button,
  TextField,
  TextArea,
  Switch,
  Text,
  Flex,
  Box,
  IconButton,
} from "@radix-ui/themes";
import { X } from "lucide-react";
import { api } from "../../../trpc/react";
import type { Wod, Score } from "../../../types/wodTypes";

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
  initialScore?: Score | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

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
  finishedWithinTimecap: "yes", // "yes" or "no"
};

function formatTimecap(seconds: number | null | undefined): string {
  if (!seconds || isNaN(seconds)) return "";
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export const LogScoreDialog: React.FC<LogScoreDialogProps> = ({
  wod,
  onScoreLogged,
  initialScore,
  isOpen,
  onOpenChange,
}) => {
  const isEditMode = !!initialScore;
  const [form, setForm] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
  );

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
        finishedWithinTimecap:
          wod.timecap && initialScore.time_seconds != null
            ? initialScore.time_seconds < wod.timecap
              ? "yes"
              : "no"
            : "yes",
      });
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialScore, isEditMode, isOpen, wod.timecap]);

  const logScoreMutation = api.score.logScore.useMutation({
    onSuccess: () => {
      onOpenChange(false);
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
      onOpenChange(false);
      resetForm();
      setError(null);
      if (onScoreLogged) onScoreLogged();
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

  // --- Timecap logic ---
  const hasTimecap = typeof wod.timecap === "number" && wod.timecap > 0;
  const timecapFormatted = hasTimecap ? formatTimecap(wod.timecap) : "";

  // For timecapped WODs, show radio group and adapt UI
  const showTimecapRadio = hasTimecap && showTime;

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

  const handleTimecapRadioChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      finishedWithinTimecap: value,
      // Reset time/reps/rounds fields when switching
      time_minutes: value === "yes" ? prev.time_minutes : "",
      time_seconds: value === "yes" ? prev.time_seconds : "",
      reps: value === "no" ? prev.reps : "",
      rounds_completed: value === "no" ? prev.rounds_completed : "",
      partial_reps: value === "no" ? prev.partial_reps : "",
    }));
    setError(null);
  };

  const resetForm = () => {
    setForm(initialFormState);
    setError(null);
  };

  const handleOpenChange = (newOpenState: boolean) => {
    onOpenChange(newOpenState);
    if (!newOpenState) {
      resetForm();
    }
  };

  // --- Validation ---
  const validate = () => {
    if (showTimecapRadio) {
      if (form.finishedWithinTimecap === "yes") {
        const min = form.time_minutes ? parseInt(form.time_minutes, 10) : 0;
        const sec = form.time_seconds ? parseInt(form.time_seconds, 10) : 0;
        const total = min * 60 + sec;
        if (!form.time_minutes && !form.time_seconds) {
          return "Please enter a time (minutes or seconds).";
        }
        if (wod.timecap && total >= wod.timecap) {
          return `Time must be less than the time cap (${timecapFormatted}). If you reached the cap, log your score as reps/rounds+reps instead.`;
        }
      } else if (form.finishedWithinTimecap === "no") {
        if (
          (!form.reps || parseInt(form.reps, 10) <= 0) &&
          (!form.rounds_completed || parseInt(form.rounds_completed, 10) < 0)
        ) {
          return "Please enter reps or rounds completed.";
        }
      }
    } else {
      if (showAll || showTime) {
        const min = form.time_minutes ? parseInt(form.time_minutes, 10) : 0;
        const sec = form.time_seconds ? parseInt(form.time_seconds, 10) : 0;
        if (
          min === 0 &&
          sec === 0 &&
          !form.time_minutes &&
          !form.time_seconds
        ) {
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
    if (showTimecapRadio) {
      if (form.finishedWithinTimecap === "yes") {
        const min = form.time_minutes ? parseInt(form.time_minutes, 10) : 0;
        const sec = form.time_seconds ? parseInt(form.time_seconds, 10) : 0;
        const totalSeconds =
          (!isNaN(min) ? min : 0) * 60 + (!isNaN(sec) ? sec : 0);
        payload.time_seconds =
          min === 0 && sec === 0 && !form.time_minutes && !form.time_seconds
            ? null
            : totalSeconds;
        payload.reps = null;
        payload.rounds_completed = null;
        payload.partial_reps = null;
      } else if (form.finishedWithinTimecap === "no") {
        payload.time_seconds = wod.timecap ?? null;
        payload.reps = form.reps ? parseInt(form.reps, 10) : null;
        payload.rounds_completed = form.rounds_completed
          ? parseInt(form.rounds_completed, 10)
          : null;
        payload.partial_reps = form.partial_reps
          ? parseInt(form.partial_reps, 10)
          : null;
      }
    } else {
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
    }
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
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal container={portalContainer}>
        <Dialog.Overlay className="data-[state=open]:animate-overlayShow fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-6 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          <Dialog.Title asChild>
            <Text size="4" weight="bold" mb="4" className="block">
              {isEditMode ? "Edit Score" : "Log Score"} for {wod.wodName}
            </Text>
          </Dialog.Title>

          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="3">
              {/* Timecap-specific UI */}
              {showTimecapRadio && (
                <Box>
                  <Text
                    as="label"
                    size="2"
                    mb="2"
                    weight="bold"
                    className="block"
                  >
                    Finished within {timecapFormatted} timecap?
                  </Text>
                  <RadioGroup.Root
                    value={form.finishedWithinTimecap}
                    onValueChange={handleTimecapRadioChange}
                    orientation="vertical"
                    aria-label={`Finished within ${timecapFormatted} timecap?`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    <Flex direction="column" align="start" gap="1">
                      <Flex align="center" gap="2">
                        <RadioGroup.Item
                          value="yes"
                          id="finishedWithinTimecap-yes"
                          disabled={submitting}
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: "2px solid #888",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <RadioGroup.Indicator
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              background: "#22c55e",
                            }}
                          />
                        </RadioGroup.Item>
                        <Text
                          as="label"
                          htmlFor="finishedWithinTimecap-yes"
                          size="2"
                        >
                          Yes, finished within timecap (enter your time)
                        </Text>
                      </Flex>
                    </Flex>
                    <Flex direction="column" align="start" gap="1">
                      <Flex align="center" gap="2">
                        <RadioGroup.Item
                          value="no"
                          id="finishedWithinTimecap-no"
                          disabled={submitting}
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: "2px solid #888",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <RadioGroup.Indicator
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              background: "#f59e42",
                            }}
                          />
                        </RadioGroup.Item>
                        <Text
                          as="label"
                          htmlFor="finishedWithinTimecap-no"
                          size="2"
                        >
                          No, hit the timecap (enter reps or rounds+reps)
                        </Text>
                      </Flex>
                    </Flex>
                  </RadioGroup.Root>
                </Box>
              )}

              {/* Show time input if finished within timecap, or if not a timecapped WOD */}
              {((showTimecapRadio && form.finishedWithinTimecap === "yes") ||
                (!showTimecapRadio && (showAll || showTime))) && (
                <Flex gap="2" align="end">
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
                      size="3"
                      autoComplete="off"
                    />
                  </Box>
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
                      size="3"
                      autoComplete="off"
                    />
                  </Box>
                </Flex>
              )}

              {/* Show reps/rounds if hit the timecap, or for AMRAPs/ShowAll */}
              {((showTimecapRadio && form.finishedWithinTimecap === "no") ||
                (!showTimecapRadio && (showAll || showReps))) && (
                <Flex direction="row" gap="2" align="end">
                  {/* Reps Input */}
                  {((showTimecapRadio && form.finishedWithinTimecap === "no") ||
                    (!showTimecapRadio && (showAll || showReps))) && (
                    <Box style={{ flexGrow: 1 }}>
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
                        size="3"
                        autoComplete="off"
                      />
                    </Box>
                  )}
                  {/* Rounds Input */}
                  {((showTimecapRadio && form.finishedWithinTimecap === "no") ||
                    (!showTimecapRadio && (showAll || showRounds))) && (
                    <Box style={{ flexGrow: 1 }}>
                      <Text
                        as="label"
                        htmlFor="rounds_completed"
                        size="1"
                        mb="1"
                      >
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
                        size="3"
                        autoComplete="off"
                      />
                    </Box>
                  )}
                  {/* Partial Reps Input */}
                  {((showTimecapRadio && form.finishedWithinTimecap === "no") ||
                    (!showTimecapRadio && (showAll || showPartialReps))) && (
                    <Box style={{ flexGrow: 1 }}>
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
                        size="3"
                        autoComplete="off"
                      />
                    </Box>
                  )}
                </Flex>
              )}

              {/* Load Input (only shown if not timecapped and WOD type is Load/ShowAll) */}
              {!showTimecapRadio && (showAll || showLoad) && (
                <Box style={{ flexGrow: 1 }}>
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
                    size="3"
                    autoComplete="off"
                  />
                </Box>
              )}

              {/* Date and Rx Switch */}
              <Flex align="center" gap="3">
                <Box style={{ flexBasis: "140px" }}>
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
                    size="3"
                    autoComplete="off"
                  />
                </Box>
                <Box>
                  <Text
                    as="label"
                    htmlFor={`isRx-${wod.id}`}
                    size="1"
                    mb="1"
                    className="opacity-0"
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
                      size="3"
                    />
                    <Text size="2">Rx</Text>
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
                  size="3"
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
                    size="3"
                  >
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  type="submit"
                  color="green"
                  disabled={submitting}
                  size="3"
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
