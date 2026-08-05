"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TIMED_CODING_CHALLENGE_MINUTES } from "@/lib/timed-coding-challenge";

const STORAGE_KEY = "lovable-original:timed-coding-challenge:v1";
const DURATION_MS = TIMED_CODING_CHALLENGE_MINUTES * 60 * 1_000;

type TimerStatus = "ready" | "running" | "paused" | "expired";

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

function readTimer(): StoredTimer {
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
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

function writeTimer(timer: StoredTimer) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
}

function formatRemainingTime(remainingMs: number) {
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1_000));
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function TimedCodingChallengeTimer() {
  const [timer, setTimer] = useState<StoredTimer>(READY_TIMER);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const hydrationTimeout = window.setTimeout(() => {
      setTimer(readTimer());
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(hydrationTimeout);
  }, []);

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
        writeTimer(expiredTimer);
        return;
      }

      setTimer((current) => ({ ...current, remainingMs }));
    };

    updateRemainingTime();
    const intervalId = window.setInterval(updateRemainingTime, 250);
    return () => window.clearInterval(intervalId);
  }, [hydrated, timer.deadlineMs, timer.status]);

  const startOrResume = useCallback(() => {
    const remainingMs =
      timer.status === "paused" ? timer.remainingMs : DURATION_MS;
    const runningTimer: StoredTimer = {
      status: "running",
      remainingMs,
      deadlineMs: Date.now() + remainingMs,
    };
    setTimer(runningTimer);
    writeTimer(runningTimer);
  }, [timer.remainingMs, timer.status]);

  const pause = useCallback(() => {
    if (timer.status !== "running" || !timer.deadlineMs) return;

    const pausedTimer: StoredTimer = {
      status: "paused",
      remainingMs: Math.max(0, timer.deadlineMs - Date.now()),
      deadlineMs: null,
    };
    setTimer(pausedTimer);
    writeTimer(pausedTimer);
  }, [timer.deadlineMs, timer.status]);

  const reset = useCallback(() => {
    setTimer(READY_TIMER);
    writeTimer(READY_TIMER);
  }, []);

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
          <button className="challenge-timer-reset" type="button" onClick={reset}>
            Reset to 30:00
          </button>
        ) : null}
      </div>

      <p className="challenge-timer-boundary">
        Timer state stays in this browser, not your account. It never changes
        grading, saved code, attempts, or Accepted progress.
      </p>
    </section>
  );
}
