"use client";

import Link from "next/link";
import { useState } from "react";
import { runCodingSolution } from "@/lib/coding-runner";
import {
  JAVASCRIPT_FOUNDATION_EXERCISES,
  JAVASCRIPT_FOUNDATIONS_UNIT_STEPS,
} from "@/lib/javascript-foundations";
import {
  getFirstIncompleteExerciseIndex,
  getNextIncompleteExerciseIndex,
  saveJavaScriptLabExercise,
} from "@/lib/javascript-lab-progress";

type CheckState =
  | { kind: "idle"; message: string }
  | { kind: "running"; message: string }
  | { kind: "passed"; message: string }
  | { kind: "failed"; message: string; passedChecks: number }
  | { kind: "error"; message: string };

type JavaScriptFoundationsWarmupProps = {
  completedExerciseIds?: string[];
};

const exerciseIds = JAVASCRIPT_FOUNDATION_EXERCISES.map(
  (exercise) => exercise.slug,
);

export function JavaScriptFoundationsWarmup({
  completedExerciseIds = [],
}: JavaScriptFoundationsWarmupProps) {
  const [completedIds, setCompletedIds] = useState(completedExerciseIds);
  const [exerciseIndex, setExerciseIndex] = useState(() =>
    getFirstIncompleteExerciseIndex(exerciseIds, completedExerciseIds),
  );
  const exercise = JAVASCRIPT_FOUNDATION_EXERCISES[exerciseIndex] ?? null;
  const [code, setCode] = useState(
    exercise?.starterCode ?? JAVASCRIPT_FOUNDATION_EXERCISES[0].starterCode,
  );
  const [checkState, setCheckState] = useState<CheckState>({
    kind: "idle",
    message: "Complete the missing logic, then run three private browser checks.",
  });

  async function runChecks() {
    if (!exercise) return;
    setCheckState({
      kind: "running",
      message: "Running three checks in the isolated browser worker…",
    });
    const result = await runCodingSolution(
      code,
      exercise.tests.map((test) => test.input),
    );

    if (result.status !== "finished") {
      setCheckState({ kind: "error", message: result.message });
      return;
    }

    const passedChecks = exercise.tests.reduce((count, test, index) => {
      const actual = result.outputs[index] ?? "";
      return actual.trim() === test.expectedOutput.trim() ? count + 1 : count;
    }, 0);

    if (passedChecks === exercise.tests.length) {
      const response = await saveJavaScriptLabExercise(
        "foundations",
        exercise.slug,
      );
      if (!response?.ok) {
        setCheckState({
          kind: "error",
          message:
            "The checks passed, but completion could not be saved. Run them again to retry.",
        });
        return;
      }
      setCompletedIds((current) =>
        current.includes(exercise.slug) ? current : [...current, exercise.slug],
      );
      setCheckState({
        kind: "passed",
        message: `Passed ${passedChecks} of ${exercise.tests.length} checks. Exercise progress saved.`,
      });
      return;
    }

    setCheckState({
      kind: "failed",
      passedChecks,
      message: `${passedChecks} of ${exercise.tests.length} checks passed.`,
    });
  }

  function resetExercise() {
    if (!exercise) return;
    setCode(exercise.starterCode);
    setCheckState({
      kind: "idle",
      message: "Starter restored locally. No learner record was changed.",
    });
  }

  function continueWarmup() {
    if (!exercise) return;
    const nextCompletedIds = completedIds.includes(exercise.slug)
      ? completedIds
      : [...completedIds, exercise.slug];
    const nextIndex = getNextIncompleteExerciseIndex(
      exerciseIds,
      nextCompletedIds,
      exerciseIndex,
    );
    const nextExercise = JAVASCRIPT_FOUNDATION_EXERCISES[nextIndex];
    if (!nextExercise) {
      setExerciseIndex(JAVASCRIPT_FOUNDATION_EXERCISES.length);
      return;
    }

    setExerciseIndex(nextIndex);
    setCode(nextExercise.starterCode);
    setCheckState({
      kind: "idle",
      message: "Complete the missing logic, then run three private browser checks.",
    });
  }

  if (!exercise) {
    return (
      <section
        className="foundations-complete"
        aria-label="Foundations warm-up complete"
      >
        <p className="eyebrow">Foundations complete · saved to your account</p>
        <h2>Four steps ready for judged practice.</h2>
        <p>
          Your judge, parsing, branching, and loop steps will remain complete
          after sign-in.
        </p>
        <Link className="foundations-run" href="/practice/sum-two-numbers">
          Start problem 01 <span aria-hidden="true">→</span>
        </Link>
      </section>
    );
  }

  const isPassed = checkState.kind === "passed";
  const isFinalExercise =
    exerciseIndex === JAVASCRIPT_FOUNDATION_EXERCISES.length - 1;

  return (
    <section className="foundations-workbench" aria-labelledby="warmup-title">
      <div className="foundations-lesson">
        <div className="foundations-step-row">
          <span>
            Unit step {exercise.number + 1} of{" "}
            {JAVASCRIPT_FOUNDATIONS_UNIT_STEPS.length}
          </span>
          <strong>{exercise.concept}</strong>
        </div>
        <h2 id="warmup-title">{exercise.title}</h2>
        <p className="foundations-prompt">{exercise.prompt}</p>

        <dl className="foundations-contract">
          <div>
            <dt>Input</dt>
            <dd>{exercise.inputFormat}</dd>
          </div>
          <div>
            <dt>Return</dt>
            <dd>{exercise.outputFormat}</dd>
          </div>
        </dl>

        <div className="foundations-example">
          <span>Example</span>
          <div>
            <code>{exercise.example.input}</code>
            <span aria-hidden="true">→</span>
            <code>{exercise.example.output}</code>
          </div>
        </div>

        <ol className="foundations-path" aria-label="Foundations unit steps">
          {JAVASCRIPT_FOUNDATIONS_UNIT_STEPS.map((item, index) => (
            <li
              className={
                index === exerciseIndex + 1
                  ? "is-current"
                  : completedIds.includes(item.id)
                    ? "is-complete"
                    : undefined
              }
              key={item.id}
              aria-current={index === exerciseIndex + 1 ? "step" : undefined}
            >
              <span>{String(item.number).padStart(2, "0")}</span>
              <strong>{item.concept}</strong>
            </li>
          ))}
        </ol>
      </div>

      <div className="foundations-editor">
        <div className="foundations-editor-bar">
          <span>foundations.js</span>
            <span>Completion saves privately</span>
        </div>
        <label htmlFor="foundations-code">JavaScript warm-up code</label>
        <textarea
          id="foundations-code"
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setCheckState({
              kind: "idle",
              message:
                "Code changed. Run the three checks when the missing logic is ready.",
            });
          }}
          spellCheck={false}
        />

        <div className="foundations-actions">
          <button
            type="button"
            className="foundations-reset"
            onClick={resetExercise}
            disabled={checkState.kind === "running"}
          >
            Restore starter
          </button>
          {!isPassed ? (
            <button
              type="button"
              className="foundations-run"
              onClick={runChecks}
              disabled={checkState.kind === "running"}
            >
              {checkState.kind === "running" ? "Running checks…" : "Run 3 checks"}
            </button>
          ) : isFinalExercise ? (
            <Link className="foundations-run" href="/practice/sum-two-numbers">
              Start problem 01 <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <button
              type="button"
              className="foundations-run"
              onClick={continueWarmup}
            >
              Continue to step {exercise.number + 2}
            </button>
          )}
        </div>

        <div
          className={`foundations-result is-${checkState.kind}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div>
            <span>
              {checkState.kind === "passed"
                ? "Concept proved"
                : checkState.kind === "failed"
                  ? "Try the idea again"
                  : checkState.kind === "error"
                    ? "Run stopped"
                    : "Private checks"}
            </span>
            <strong>{checkState.message}</strong>
          </div>
          {checkState.kind === "failed" ? (
            <p>{exercise.recoveryCue}</p>
          ) : null}
          {checkState.kind === "passed" ? (
            <p>
              <span>Keep this:</span> {exercise.takeaway}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
