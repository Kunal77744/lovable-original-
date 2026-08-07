"use client";

import Link from "next/link";
import { useState } from "react";
import { runCodingSolution } from "@/lib/coding-runner";
import { JAVASCRIPT_RECURSION_EXERCISES } from "@/lib/javascript-recursion";
import {
  getFirstIncompleteExerciseIndex,
  getNextIncompleteExerciseIndex,
  saveJavaScriptLabExercise,
} from "@/lib/javascript-lab-progress";

type CheckState =
  | { kind: "idle"; message: string }
  | { kind: "running"; message: string }
  | { kind: "passed"; message: string }
  | { kind: "failed"; message: string }
  | { kind: "error"; message: string };

const readyMessage =
  "Finish the recursive step, then run three private browser checks.";

const exerciseIds = JAVASCRIPT_RECURSION_EXERCISES.map(
  (exercise) => exercise.slug,
);

export function JavaScriptRecursionLab({
  completedExerciseIds = [],
}: {
  completedExerciseIds?: string[];
}) {
  const [exerciseIndex, setExerciseIndex] = useState(() =>
    getFirstIncompleteExerciseIndex(exerciseIds, completedExerciseIds),
  );
  const exercise = JAVASCRIPT_RECURSION_EXERCISES[exerciseIndex] ?? null;
  const [code, setCode] = useState(
    exercise?.starterCode ?? JAVASCRIPT_RECURSION_EXERCISES[0].starterCode,
  );
  const [checkState, setCheckState] = useState<CheckState>({
    kind: "idle",
    message: readyMessage,
  });
  const [completedIds, setCompletedIds] = useState(
    () => new Set(completedExerciseIds),
  );
  const completedCount = completedIds.size;

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
      const saveResponse = await saveJavaScriptLabExercise("recursion", exercise.slug);
      if (!saveResponse?.ok) {
        setCheckState({
          kind: "error",
          message: "The checks passed, but completion could not be saved. Run them again to retry.",
        });
        return;
      }

      setCompletedIds((current) => new Set(current).add(exercise.slug));
      setCheckState({
        kind: "passed",
        message: `Passed ${passedChecks} of ${exercise.tests.length} checks.`,
      });
      return;
    }

    setCheckState({
      kind: "failed",
      message: `${passedChecks} of ${exercise.tests.length} checks passed.`,
    });
  }

  function restoreStarter() {
    if (!exercise) return;
    setCode(exercise.starterCode);
    setCheckState({
      kind: "idle",
      message: "Starter restored locally. No learner record was changed.",
    });
  }

  function continueLab() {
    const nextIndex = getNextIncompleteExerciseIndex(
      exerciseIds,
      [...completedIds],
      exerciseIndex,
    );
    const nextExercise = JAVASCRIPT_RECURSION_EXERCISES[nextIndex];

    if (!nextExercise) {
      setExerciseIndex(JAVASCRIPT_RECURSION_EXERCISES.length);
      return;
    }

    setExerciseIndex(nextIndex);
    setCode(nextExercise.starterCode);
    setCheckState({ kind: "idle", message: readyMessage });
  }

  if (!exercise) {
    return (
      <section
        className="function-lab-complete"
        aria-labelledby="recursion-lab-complete-title"
      >
        <div className="function-lab-complete-mark" aria-hidden="true">
          4/4
        </div>
        <div>
          <p className="eyebrow">Recursion fundamentals complete</p>
          <h2 id="recursion-lab-complete-title">
            Every recursive call now has a way home.
          </h2>
          <p>
            You stopped at a base case, reduced each input, traced the call
            stack, and repaired a recursive step that could not terminate.
          </p>
          <Link className="primary-action" href="/practice/sum-two-numbers">
            Start judged practice <span aria-hidden="true">→</span>
          </Link>
          <Link className="function-lab-return-link" href="/practice">
            Return to the practice arena
          </Link>
        </div>
      </section>
    );
  }

  const isPassed = checkState.kind === "passed";
  const showRecovery =
    checkState.kind === "failed" || checkState.kind === "error";
  const progress =
    (completedCount / JAVASCRIPT_RECURSION_EXERCISES.length) * 100;

  return (
    <section
      className="function-lab-workbench"
      aria-labelledby="recursion-lab-title"
    >
      <header className="function-lab-progress">
        <div>
          <span>
            Recursion idea {exercise.number} of{" "}
            {JAVASCRIPT_RECURSION_EXERCISES.length}
          </span>
          <strong>{exercise.concept}</strong>
        </div>
        <div
          className="function-lab-progress-track"
          role="progressbar"
          aria-label="Recursion exercises completed"
          aria-valuemin={0}
          aria-valuemax={JAVASCRIPT_RECURSION_EXERCISES.length}
          aria-valuenow={completedCount}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="function-lab-grid">
        <aside className="function-lab-lesson">
          <p className="eyebrow">Solve one smaller version</p>
          <h2 id="recursion-lab-title">{exercise.title}</h2>
          <p className="function-lab-prompt">{exercise.prompt}</p>

          <dl className="function-lab-contract">
            <div>
              <dt>Input</dt>
              <dd>{exercise.inputFormat}</dd>
            </div>
            <div>
              <dt>Return</dt>
              <dd>{exercise.outputFormat}</dd>
            </div>
          </dl>

          <div className="function-lab-example">
            <span>Example</span>
            <div>
              <code>{exercise.example.input}</code>
              <span aria-hidden="true">→</span>
              <code>{exercise.example.output}</code>
            </div>
          </div>

          <ol className="function-lab-path" aria-label="Recursion concepts">
            {JAVASCRIPT_RECURSION_EXERCISES.map((item, index) => (
              <li
                className={
                  index === exerciseIndex
                    ? "is-current"
                    : completedIds.has(item.slug)
                      ? "is-complete"
                      : undefined
                }
                key={item.slug}
                aria-current={index === exerciseIndex ? "step" : undefined}
              >
                <span>{String(item.number).padStart(2, "0")}</span>
                <strong>{item.concept}</strong>
              </li>
            ))}
          </ol>
        </aside>

        <div className="function-lab-editor">
          <div className="function-lab-editor-bar">
            <span>{exercise.slug}.js</span>
            <span>Browser-only</span>
          </div>
          <label htmlFor="recursion-lab-code">JavaScript recursion code</label>
          <textarea
            id="recursion-lab-code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setCheckState({
                kind: "idle",
                message: "Code changed. Run the three checks when it is ready.",
              });
            }}
            spellCheck={false}
          />

          <div className="function-lab-actions">
            <button
              className="function-lab-reset"
              disabled={checkState.kind === "running"}
              onClick={restoreStarter}
              type="button"
            >
              Restore starter
            </button>
            {isPassed ? (
              <button
                className="function-lab-run"
                onClick={continueLab}
                type="button"
              >
                {exercise.number === JAVASCRIPT_RECURSION_EXERCISES.length
                  ? "Finish the lab"
                  : `Continue to ${JAVASCRIPT_RECURSION_EXERCISES[exerciseIndex + 1].concept}`}
                <span aria-hidden="true">→</span>
              </button>
            ) : (
              <button
                className="function-lab-run"
                disabled={checkState.kind === "running"}
                onClick={runChecks}
                type="button"
              >
                {checkState.kind === "running"
                  ? "Running checks…"
                  : "Run 3 checks"}
              </button>
            )}
          </div>

          <div
            className={`function-lab-result is-${checkState.kind}`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div>
              <span>
                {checkState.kind === "passed"
                  ? "Recursion proved"
                  : showRecovery
                    ? "Try the recursion again"
                    : "Private checks"}
              </span>
              <strong>{checkState.message}</strong>
            </div>
            {showRecovery ? <p>{exercise.recoveryCue}</p> : null}
            {checkState.kind === "passed" ? (
              <p className="function-lab-takeaway">
                <span>Keep this:</span> {exercise.takeaway}
              </p>
            ) : null}
          </div>

          <p className="function-lab-privacy">
            Code and check output stay in this browser. Completed exercises save
            privately to your account as practice, not judged mastery.
          </p>
        </div>
      </div>
    </section>
  );
}
