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
  getPerformanceLevelTooltip,
  getTimecapNoLabel,
} from "../../../utils/wodUtils";
import { useLogScoreForm } from "./LogScoreForm/useLogScoreForm";
import AuthOverlay from "./LogScoreForm/AuthOverlay";
import TimeInputFields from "./LogScoreForm/TimeInputFields";
import RepsInputFields from "./LogScoreForm/RepsInputFields";
import LoadInputFields from "./LogScoreForm/LoadInputFields";
import RoundsInputFields from "./LogScoreForm/RoundsInputFields";

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

export const LogScoreForm: React.FC<LogScoreFormProps> = (props) => {
  const {
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
  } = useLogScoreForm(props);

  const { wod } = props;

  return (
    <Box style={{ position: "relative" }}>
      {!isLoggedIn && !isSessionLoading && (
        <AuthOverlay onSignIn={() => router.push("/login")} />
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
                      {getTimecapNoLabel(scoreType)}
                    </Text>
                  </Flex>
                </Flex>
              </RadioGroup.Root>
            </Box>
          )}
          {/* Show time input if finished within timecap, or if not a timecapped WOD */}
          {((showTimecapRadio && form.finishedWithinTimecap === "yes") ||
            (!showTimecapRadio && (showAll || showTime))) && (
            <TimeInputFields
              time_minutes={form.time_minutes}
              time_seconds={form.time_seconds}
              onChange={handleChange}
              disabled={!isLoggedIn || submitting}
            />
          )}
          {/* Show type-specific input(s) if hit the timecap */}
          {showTimecapRadio && form.finishedWithinTimecap === "no" && (
            <>
              {scoreType === "reps" && (
                <RepsInputFields
                  reps={form.reps}
                  onChange={handleChange}
                  disabled={!isLoggedIn || submitting}
                />
              )}
              {scoreType === "load" && (
                <LoadInputFields
                  load={form.load}
                  onChange={handleChange}
                  disabled={!isLoggedIn || submitting}
                />
              )}
              {scoreType === "rounds" && (
                <RoundsInputFields
                  rounds_completed={form.rounds_completed}
                  partial_reps={form.partial_reps}
                  onChange={handleChange}
                  disabled={!isLoggedIn || submitting}
                />
              )}
              {scoreType === "time" && (
                <TimeInputFields
                  time_minutes={form.time_minutes}
                  time_seconds={form.time_seconds}
                  onChange={handleChange}
                  disabled={!isLoggedIn || submitting}
                />
              )}
              {/* Fallback: show all if type is unknown */}
              {!["reps", "load", "rounds", "time"].includes(scoreType) && (
                <Flex direction="row" gap="2" align="end">
                  <RepsInputFields
                    reps={form.reps}
                    onChange={handleChange}
                    disabled={!isLoggedIn || submitting}
                  />
                  <RoundsInputFields
                    rounds_completed={form.rounds_completed}
                    partial_reps={form.partial_reps}
                    onChange={handleChange}
                    disabled={!isLoggedIn || submitting}
                  />
                  <LoadInputFields
                    load={form.load}
                    onChange={handleChange}
                    disabled={!isLoggedIn || submitting}
                  />
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
            </>
          )}
          {/* Load Input (only shown if not timecapped and WOD type is Load/ShowAll) */}
          {!showTimecapRadio && (showAll || showLoad) && (
            <LoadInputFields
              load={form.load}
              onChange={handleChange}
              disabled={!isLoggedIn || submitting}
            />
          )}
          {/* Rounds + Partial Reps Input (for benchmarks.type='rounds') */}
          {!showTimecapRadio && showRounds && (
            <RoundsInputFields
              rounds_completed={form.rounds_completed}
              partial_reps={form.partial_reps}
              onChange={handleChange}
              disabled={!isLoggedIn || submitting}
            />
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
              onClick={props.onCancel}
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
