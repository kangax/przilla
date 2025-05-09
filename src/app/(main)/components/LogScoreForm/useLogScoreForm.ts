import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "../../../../trpc/react";
import { useSession } from "../../../../lib/auth-client";
import { useToast } from "../../../../components/ToastProvider";
import type { Wod, Score } from "../../../../types/wodTypes";
import { formatTimecap, getTimecapNoLabel } from "../../../../utils/wodUtils";

export interface UseLogScoreFormProps {
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

export function useLogScoreForm({
  wod,
  onScoreLogged,
  initialScore,
  onCancel,
}: UseLogScoreFormProps) {
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

  // Mutations
  const logScoreMutation = api.score.logScore.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["score", "getAllByUser"],
      });
      resetForm();
      setError(null);
      if (onScoreLogged) onScoreLogged();
      onCancel();
      showToast("success", 'Score added. Find it in your "Done" tab.');
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to log score.");
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
      showToast("success", "Score updated");
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to update score.");
      showToast("error", "Failed to update score");
    },
  });

  // Derived booleans
  const scoreType = wod.benchmarks?.type;
  const showTime = scoreType === "time";
  const showReps = scoreType === "reps";
  const showLoad = scoreType === "load";
  const showRounds = scoreType === "rounds";
  const showAll = !showTime && !showReps && !showLoad && !showRounds;
  const showPartialReps = scoreType === "rounds";

  const hasTimecap = typeof wod.timecap === "number" && wod.timecap > 0;
  const timecapFormatted = hasTimecap ? formatTimecap(wod.timecap) : "";
  const showTimecapRadio = hasTimecap;

  // Handlers
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
        switch (scoreType) {
          case "reps":
            if (!form.reps || parseInt(form.reps, 10) <= 0) {
              return "Please enter reps completed.";
            }
            break;
          case "rounds":
            if (
              !form.rounds_completed ||
              parseInt(form.rounds_completed, 10) < 0
            ) {
              return "Please enter rounds completed (0 or more).";
            }
            break;
          case "load":
            if (!form.load || parseInt(form.load, 10) <= 0) {
              return "Please enter a positive load.";
            }
            break;
          case "time":
            {
              const min = form.time_minutes
                ? parseInt(form.time_minutes, 10)
                : 0;
              const sec = form.time_seconds
                ? parseInt(form.time_seconds, 10)
                : 0;
              if (
                min === 0 &&
                sec === 0 &&
                !form.time_minutes &&
                !form.time_seconds
              ) {
                return "Please enter a time (minutes or seconds).";
              }
            }
            break;
          default:
            if (
              (!form.reps || parseInt(form.reps, 10) <= 0) &&
              (!form.rounds_completed ||
                parseInt(form.rounds_completed, 10) < 0) &&
              (!form.load || parseInt(form.load, 10) <= 0)
            ) {
              return "Please enter a score (reps, rounds, or load).";
            }
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
        switch (scoreType) {
          case "reps":
            payload.reps = form.reps ? parseInt(form.reps, 10) : null;
            break;
          case "rounds":
            payload.rounds_completed = form.rounds_completed
              ? parseInt(form.rounds_completed, 10)
              : null;
            payload.partial_reps = form.partial_reps
              ? parseInt(form.partial_reps, 10)
              : null;
            break;
          case "load":
            payload.load = form.load ? parseInt(form.load, 10) : null;
            break;
          case "time":
            {
              const min = form.time_minutes
                ? parseInt(form.time_minutes, 10)
                : 0;
              const sec = form.time_seconds
                ? parseInt(form.time_seconds, 10)
                : 0;
              const totalSeconds =
                (!isNaN(min) ? min : 0) * 60 + (!isNaN(sec) ? sec : 0);
              payload.time_seconds =
                min === 0 &&
                sec === 0 &&
                !form.time_minutes &&
                !form.time_seconds
                  ? null
                  : totalSeconds;
            }
            break;
          default:
            if (form.reps) payload.reps = parseInt(form.reps, 10);
            if (form.rounds_completed)
              payload.rounds_completed = parseInt(form.rounds_completed, 10);
            if (form.partial_reps)
              payload.partial_reps = parseInt(form.partial_reps, 10);
            if (form.load) payload.load = parseInt(form.load, 10);
            const min = form.time_minutes ? parseInt(form.time_minutes, 10) : 0;
            const sec = form.time_seconds ? parseInt(form.time_seconds, 10) : 0;
            if (min > 0 || sec > 0) {
              payload.time_seconds = min * 60 + sec;
            }
        }
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

  return {
    form,
    setForm,
    submitting,
    setSubmitting,
    error,
    setError,
    handleChange,
    handleIsRxChange,
    handleTimecapRadioChange,
    resetForm,
    validate,
    buildPayload,
    handleSubmit,
    isEditMode,
    isLoggedIn,
    isSessionLoading,
    scoreType,
    showTime,
    showReps,
    showLoad,
    showRounds,
    showAll,
    showPartialReps,
    hasTimecap,
    timecapFormatted,
    showTimecapRadio,
    router,
  };
}
