"use client";

import React, { useState, useEffect } from "react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { useSession } from "../../../lib/auth-client";
import { useRouter } from "next/navigation";
import {
  Button,
  TextField,
  TextArea,
  Switch,
  Text,
  Flex,
  Box,
} from "@radix-ui/themes";
import { api } from "../../../trpc/react";
import { useQueryClient } from "@tanstack/react-query";
import type { Wod, Score } from "../../../types/wodTypes"; // Added BenchmarkLevel
import {
  getPerformanceLevelTooltip, // Import the modified function
} from "../../../utils/wodUtils"; // Import helpers
import { useToast } from "../../../components/ToastProvider";

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

interface LogScoreFormProps {
  wod: Wod;
  onScoreLogged?: () => void;
  initialScore?: Score | null;
  onCancel: () => void;
}

const initialFormState = {
  time_minutes: "",
  time_seconds: "",
  reps: "",
  load: "",
  rounds_completed: "",
  partial_reps: "",
  isRx: true,
  notes: "",
  scoreDate: new Date().toISOString().slice(0, 10),
  finishedWithinTimecap: "yes" as "yes" | "no",
};

function formatTimecap(seconds: number | null | undefined): string {
  if (!seconds || isNaN(seconds)) return "";
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export const LogScoreForm: React.FC<LogScoreFormProps> = ({
  wod,
  onScoreLogged,
  initialScore,
  onCancel,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const isEditMode = !!initialScore;
  const [form, setForm] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: sessionData, isPending: isSessionLoading } = useSession();
  const router = useRouter();
  const isLoggedIn = !!sessionData?.user;

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
          wod.timecap != null
            ? initialScore.time_seconds != null
              ? "yes"
              : "no"
            : "yes",
      });
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialScore, isEditMode, wod.timecap]);

  // Invalidate user scores query after log or update to ensure UI updates
  const logScoreMutation = api.score.logScore.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["score", "getAllByUser"],
      });
      resetForm();
      setError(null);
      if (onScoreLogged) onScoreLogged();
      onCancel();

      // Show success toast
      showToast("success", 'Score added. Find it in your "Done" tab.');
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to log score.");

      // Show error toast
      showToast("error", "Failed to add score");
    },
  });

  const updateScoreMutation = api.score.updateScore.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["score", "getAllByUser"],
      });
      resetForm();
      setError(null);
      if (onScoreLogged) onScoreLogged();
      onCancel();

      // Show success toast
      showToast("success", "Score updated");
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to update score.");

      // Show error toast
      showToast("error", "Failed to update score");
    },
  });

  const scoreType = wod.benchmarks?.type;
  const showTime = scoreType === "time";
  const showReps = scoreType === "reps";
  const showLoad = scoreType === "load";
  const showRounds = scoreType === "rounds";
  const showAll = !showTime && !showReps && !showLoad && !showRounds;
  const showPartialReps = scoreType === "rounds";

  const hasTimecap = typeof wod.timecap === "number" && wod.timecap > 0;
  const timecapFormatted = hasTimecap ? formatTimecap(wod.timecap) : "";
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
      finishedWithinTimecap: value as "yes" | "no",
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
    <Box style={{ position: "relative" }}>
      {!isLoggedIn && !isSessionLoading && (
        <Box
          className="absolute inset-0 z-10 flex items-center justify-center rounded-lg" // Removed bg-background/80
        >
          <Button size="3" onClick={() => router.push("/login")}>
            Sign in to log your score
          </Button>
        </Box>
      )}
      <form
        onSubmit={handleSubmit}
        className={`transition-opacity duration-300 ease-in-out ${!isLoggedIn && !isSessionLoading ? "opacity-30" : "opacity-100"}`}
      >
        <Flex direction="column" gap="3">
          {showTimecapRadio && (
            <Box>
              <Text as="label" size="2" mb="2" weight="bold" className="block">
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
                      disabled={!isLoggedIn || submitting}
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
                      disabled={!isLoggedIn || submitting}
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
                  disabled={!isLoggedIn || submitting}
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
                  disabled={!isLoggedIn || submitting}
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
                    disabled={!isLoggedIn || submitting}
                    size="3"
                    autoComplete="off"
                  />
                </Box>
              )}
              {/* Rounds Input */}
              {((showTimecapRadio && form.finishedWithinTimecap === "no") ||
                (!showTimecapRadio && (showAll || showRounds))) && (
                <Box style={{ flexGrow: 1 }}>
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
                    disabled={!isLoggedIn || submitting}
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
                    disabled={!isLoggedIn || submitting}
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
                disabled={!isLoggedIn || submitting}
                size="3"
                autoComplete="off"
              />
            </Box>
          )}
          {/* Rounds + Partial Reps Input (for benchmarks.type='rounds') */}
          {!showTimecapRadio && showRounds && (
            <Flex direction="row" gap="2" align="end">
              <Box style={{ flexGrow: 1 }}>
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
                  disabled={!isLoggedIn || submitting}
                  size="3"
                  autoComplete="off"
                />
              </Box>
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
                  disabled={!isLoggedIn || submitting}
                  size="3"
                  autoComplete="off"
                />
              </Box>
            </Flex>
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
                disabled={!isLoggedIn || submitting}
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
                  disabled={!isLoggedIn || submitting}
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
              disabled={!isLoggedIn || submitting}
              size="3"
              rows={2} // Reduced height
              style={{ resize: "none" }}
            />
          </Box>
          {/* Performance Levels Section */}
          {wod.benchmarks?.levels && wod.benchmarks?.type && (
            <Box
              mt="3" // Added margin top to separate from notes
              className="rounded-md border border-dotted border-gray-200 bg-gray-50 p-3 dark:border-neutral-700 dark:bg-neutral-800" // Card-like styling with dotted border and background
            >
              <Flex direction="column" gap="1">
                {getPerformanceLevelTooltip(wod).map((levelDetail) => (
                  <Flex key={levelDetail.levelName} justify="between" gap="2">
                    <Text size="2" className={levelDetail.colorClass}>
                      {levelDetail.levelName}:
                    </Text>
                    <Text size="2" weight="medium">
                      {levelDetail.formattedRange}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            </Box>
          )}
          {error && (
            <Text size="1" color="red" mt="3">
              {error}
            </Text>
          )}
          <Flex direction="row" gap="3" justify="end" mt="4">
            <Button
              type="button"
              variant="soft"
              color="gray"
              disabled={!isLoggedIn || submitting}
              size="3"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="green"
              disabled={!isLoggedIn || submitting}
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
    </Box>
  );
};

export default LogScoreForm;
