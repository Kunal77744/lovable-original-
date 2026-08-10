"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TIMED_CODING_CHALLENGE_MAX_ELAPSED_SECONDS,
  TIMED_CODING_CHALLENGE_MINUTES,
} from "@/lib/timed-coding-challenge";

const LEGACY_STORAGE_KEY = "lovable-original:timed-coding-challenge:v1";
const DURATION_MS = TIMED_CODING_CHALLENGE_MINUTES * 60 * 1_000;

type TimerStatus = "ready" | "running" | "paused" | "expired";
type ResultSaveStatus = "idle" | "saving" | "saved" | "error";

type StoredTimer = {
  status: TimerStatus;
  remainingMs: number;
  deadlineMs: number | null;
};

const READY_TIMER: StoredTimer = {
  status: "ready",
  remainingMs: DURATION_MS,
  deadlineMs: null,
};

function isTimerStatus(value: unknown): value is TimerStatus {
  return (
    value === "ready" ||
    value === "running" ||
    value === "paused" ||
    value === "expired"
  );
}

function getStorageKey(challengeSetId: string) {
  return challengeSetId === "core-path"
    ? LEGACY_STORAGE_KEY
    : `lovable-original:timed-coding-challenge:v2:${challengeSetId}`;
}

function readTimer(storageKey: string): StoredTimer {
  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) return READY_TIMER;

    const stored = JSON.parse(rawValue) as Partial<StoredTimer>;
    if (!isTimerStatus(stored.status) || typeof stored.remainingMs !== "number") {
      return READY_TIMER;
    }

    if (stored.status === "running" && typeof stored.deadlineMs === "number") {
      const remainingMs = Math.max(0, stored.deadlineMs - Date.now());
      return remainingMs === 0
        ? { status: "expired", remainingMs: 0, deadlineMs: null }
        : { status: "running", remainingMs, deadlineMs: stored.deadlineMs };
    }

    return {
      status: stored.status,
      remainingMs: Math.max(0, Math.min(DURATION_MS, stored.remainingMs)),
      deadlineMs: null,
    };
  } catch {
    return READY_TIMER;
  }
}

function writeTimer(storageKey: string, timer: StoredTimer) {
  window.localStorage.setItem(storageKey, JSON.stringify(timer));
}

function formatRemainingTime(remainingMs: number) {
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1_000));
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

type TimedCodingChallengeTimerProps = {
  challengeSetId?: string;
};

export function TimedCodingChallengeTimer({
  challengeSetId = "core-path",
}: TimedCodingChallengeTimerProps) {
  const router = useRouter();
  const storageKey = getStorageKey(challengeSetId);
  const [timer, setTimer] = useState<StoredTimer>(READY_TIMER);
  const [hydrated, setHydrated] = useState(false);
  const [resultSaveStatus, setResultSaveStatus] =
    useState<ResultSaveStatus>("idle");

  useEffect(() => {
    const hydrationTimeout = window.setTimeout(() => {
      setTimer(readTimer(storageKey));
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(hydrationTimeout);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated || timer.status !== "running" || !timer.deadlineMs) return;

    const updateRemainingTime = () => {
      const remainingMs = Math.max(0, timer.deadlineMs! - Date.now());

      if (remainingMs === 0) {
        const expiredTimer: StoredTimer = {
          status: "expired",
          remainingMs: 0,
          deadlineMs: null,
        };
        setTimer(expiredTimer);
        writeTimer(storageKey, expiredTimer);
        return;
      }

      setTimer((current) => ({ ...current, remainingMs }));
    };

    updateRemainingTime();
    const intervalId = window.setInterval(updateRemainingTime, 250);
    return () => window.clearInterval(intervalId);
  }, [hydrated, storageKey, timer.deadlineMs, timer.status]);

  const startOrResume = useCallback(() => {
    const remainingMs =
      timer.status === "paused" ? timer.remainingMs : DURATION_MS;
    const runningTimer: StoredTimer = {
      status: "running",
      remainingMs,
      deadlineMs: Date.now() + remainingMs,
    };
    setTimer(runningTimer);
    writeTimer(storageKey, runningTimer);
    setResultSaveStatus("idle");
  }, [storageKey, timer.remainingMs, timer.status]);

  const pause = useCallback(() => {
    if (timer.status !== "running" || !timer.deadlineMs) return;

    const pausedTimer: StoredTimer = {
      status: "paused",
      remainingMs: Math.max(0, timer.deadlineMs - Date.now()),
      deadlineMs: null,
    };
    setTimer(pausedTimer);
    writeTimer(storageKey, pausedTimer);
  }, [storageKey, timer.deadlineMs, timer.status]);

  const reset = useCallback(() => {
    setTimer(READY_TIMER);
    writeTimer(storageKey, READY_TIMER);
    setResultSaveStatus("idle");
  }, [storageKey]);

  const finishAndSave = useCallback(async () => {
    if (
      timer.status === "ready" ||
      resultSaveStatus === "saving" ||
      !hydrated
    ) {
      return;
    }

    const remainingMs =
      timer.status === "running" && timer.deadlineMs
        ? Math.max(0, timer.deadlineMs - Date.now())
        : timer.remainingMs;
    const pausedTimer: StoredTimer = {
      status: remainingMs === 0 ? "expired" : "paused",
      remainingMs,
      deadlineMs: null,
    };
    const elapsedSeconds = Math.max(
      0,
      Math.min(
        TIMED_CODING_CHALLENGE_MAX_ELAPSED_SECONDS,
        Math.round((DURATION_MS - remainingMs) / 1_000),
      ),
    );

    setTimer(pausedTimer);
    writeTimer(storageKey, pausedTimer);
    setResultSaveStatus("saving");

    try {
      const response = await fetch("/api/practice/challenge/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeSetId, elapsedSeconds }),
      });

      if (!response.ok) throw new Error("Result save failed");

      setTimer(READY_TIMER);
      writeTimer(storageKey, READY_TIMER);
      setResultSaveStatus("saved");
      router.refresh();
    } catch {
      setResultSaveStatus("error");
    }
  }, [
    challengeSetId,
    hydrated,
    resultSaveStatus,
    router,
    storageKey,
    timer,
  ]);

  const timerLabel = useMemo(() => {
    if (timer.status === "running") return "Timer running";
    if (timer.status === "paused") return "Timer paused";
    if (timer.status === "expired") return "Time is up";
    return "Timer ready";
  }, [timer.status]);

  return (
    <section className="challenge-timer" aria-labelledby="challenge-timer-title">
      <div className="challenge-timer-heading">
        <div>
          <p className="eyebrow">Browser timer</p>
          <h2 id="challenge-timer-title">{timerLabel}</h2>
        </div>
        <span
          className="challenge-timer-value"
          role="timer"
          aria-label={`${formatRemainingTime(timer.remainingMs)} remaining`}
        >
          {formatRemainingTime(timer.remainingMs)}
        </span>
      </div>

      <p className="challenge-timer-status" role="status" aria-live="polite">
        {timer.status === "running"
          ? "Keep moving. Reloading this browser will restore the same deadline."
          : timer.status === "paused"
            ? "Paused here. Your problem access and saved work are unchanged."
            : timer.status === "expired"
              ? "The practice window ended, but every problem stays open."
              : "Start when you are ready. The countdown does not begin on page load."}
      </p>

      <div className="challenge-timer-actions">
        {timer.status === "running" ? (
          <button type="button" onClick={pause}>
            Pause timer
          </button>
        ) : (
          <button type="button" disabled={!hydrated} onClick={startOrResume}>
            {timer.status === "paused"
              ? "Resume timer"
              : timer.status === "expired"
                ? "Start a new 30 minutes"
                : "Start 30-minute timer"}
          </button>
        )}
        {timer.status !== "ready" ? (
          <>
            <button
              className="challenge-timer-finish"
              type="button"
              disabled={resultSaveStatus === "saving"}
              onClick={finishAndSave}
            >
              {resultSaveStatus === "saving"
                ? "Saving result…"
                : resultSaveStatus === "error"
                  ? "Retry result save"
                  : "Finish and save result"}
            </button>
            <button
              className="challenge-timer-reset"
              type="button"
              disabled={resultSaveStatus === "saving"}
              onClick={reset}
            >
              Reset to 30:00
            </button>
          </>
        ) : null}
      </div>

      <p
        className="challenge-result-save-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {resultSaveStatus === "saving"
          ? "Saving this timed result privately…"
          : resultSaveStatus === "saved"
            ? "Timed result saved privately to your account."
            : resultSaveStatus === "error"
              ? "Couldn’t save this result. Your timer is paused; try again."
              : "Finish when you choose. Nothing is saved until then."}
      </p>

      <p className="challenge-timer-boundary">
        The active timer stays in this browser. Finishing saves only this set,
        elapsed time, and its current Accepted count. It never changes grading,
        code, attempts, or Accepted progress.
      </p>
    </section>
  );
}
