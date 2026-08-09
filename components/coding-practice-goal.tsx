"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  CODING_PRACTICE_GOAL_OPTIONS,
  type CodingPracticeGoalTarget,
  type WeeklyCodingPracticeGoal,
} from "@/lib/coding-practice-goal";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

export function CodingPracticeGoal({
  goal,
}: {
  goal: WeeklyCodingPracticeGoal;
}) {
  const [selectedTarget, setSelectedTarget] =
    useState<CodingPracticeGoalTarget>(goal.targetActiveDays ?? 3);
  const latestSelectedTarget = useRef<CodingPracticeGoalTarget>(
    goal.targetActiveDays ?? 3,
  );
  const [savedTarget, setSavedTarget] =
    useState<CodingPracticeGoalTarget | null>(goal.targetActiveDays);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const activeTarget = savedTarget ?? selectedTarget;
  const remainingDays = Math.max(activeTarget - goal.currentActiveDays, 0);
  const complete = remainingDays === 0;
  const progress = Math.min(
    100,
    Math.round((goal.currentActiveDays / activeTarget) * 100),
  );

  async function saveGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || selectedTarget === savedTarget) return;

    const submittedTarget = latestSelectedTarget.current;
    setSaving(true);
    setStatus("Saving your weekly target…");

    try {
      const response = await fetch("/api/practice/goal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetActiveDays: submittedTarget }),
      });
      const body = (await response.json().catch(() => null)) as {
        targetActiveDays?: unknown;
        error?: string;
      } | null;

      if (!response.ok || body?.targetActiveDays !== submittedTarget) {
        throw new Error(body?.error ?? "Weekly target could not be saved");
      }

      setSavedTarget(submittedTarget);

      if (latestSelectedTarget.current !== submittedTarget) {
        setStatus(
          `Your earlier ${submittedTarget}-day target is saved. Your newer ${latestSelectedTarget.current}-day choice is still unsaved.`,
        );
        return;
      }

      setStatus(
        `Saved privately: ${submittedTarget} active ${submittedTarget === 1 ? "day" : "days"} each week.`,
      );
    } catch {
      setStatus("Your target was not saved. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      className="coding-practice-goal"
      aria-labelledby="coding-practice-goal-title"
    >
      <div className="coding-practice-goal-progress">
        <p className="eyebrow">
          This week · {formatDate(goal.weekStart)}–{formatDate(goal.weekEnd)}
        </p>
        <h2 id="coding-practice-goal-title">
          {complete
            ? "Weekly target reached."
            : `${remainingDays} ${remainingDays === 1 ? "practice day" : "practice days"} to go.`}
        </h2>
        <p>
          {goal.currentActiveDays} of {activeTarget} active days recorded from
          saved judged attempts. More submissions on the same day still count
          once.
        </p>
        <div
          className="coding-practice-goal-meter"
          role="progressbar"
          aria-label="Weekly active-day progress"
          aria-valuemin={0}
          aria-valuemax={activeTarget}
          aria-valuenow={Math.min(goal.currentActiveDays, activeTarget)}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <form onSubmit={saveGoal}>
        <fieldset>
          <legend>Choose a weekly rhythm</legend>
          <div className="coding-practice-goal-options">
            {CODING_PRACTICE_GOAL_OPTIONS.map((option) => (
              <label key={option}>
                <input
                  aria-label={`${option} ${option === 1 ? "day" : "days"}`}
                  type="radio"
                  name="weekly-practice-target"
                  value={option}
                  checked={selectedTarget === option}
                  onChange={() => {
                    latestSelectedTarget.current = option;
                    setSelectedTarget(option);
                    setStatus("");
                  }}
                />
                <strong>{option}</strong>
                <span>{option === 1 ? "day" : "days"}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="submit"
          disabled={saving || selectedTarget === savedTarget}
        >
          {saving ? "Saving…" : savedTarget ? "Update target" : "Save target"}
        </button>
        <p
          className="coding-practice-goal-status"
          role="status"
          aria-live="polite"
        >
          {status ||
            (savedTarget
              ? "Saved privately to your account."
              : "Your target is not saved yet.")}
        </p>
      </form>
    </section>
  );
}
