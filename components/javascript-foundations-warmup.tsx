"use client";

import Link from "next/link";
import { useState } from "react";
import { runCodingSolution } from "@/lib/coding-runner";
import { JAVASCRIPT_FOUNDATION_EXERCISES } from "@/lib/javascript-foundations";

type CheckState =
  | { kind: "idle"; message: string }
  | { kind: "running"; message: string }
  | { kind: "passed"; message: string }
  | { kind: "failed"; message: string; passedChecks: number }
  | { kind: "error"; message: string };

export function JavaScriptFoundationsWarmup() {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const exercise = JAVASCRIPT_FOUNDATION_EXERCISES[exerciseIndex];
  const [code, setCode] = useState(exercise.starterCode);
  const [checkState, setCheckState] = useState<CheckState>({
    kind: "idle",
    message: "Complete the missing logic, then run three private browser checks.",
  });

  async function runChecks() {
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
      setCheckState({
        kind: "passed",
        message: `Passed ${passedChecks} of ${exercise.tests.length} checks.`,
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
    setCode(exercise.starterCode);
    setCheckState({
      kind: "idle",
      message: "Starter restored locally. No learner record was changed.",
    });
  }

  function continueWarmup() {
    const nextExercise = JAVASCRIPT_FOUNDATION_EXERCISES[exerciseIndex + 1];
    if (!nextExercise) return;

    setExerciseIndex((current) => current + 1);
    setCode(nextExercise.starterCode);
    setCheckState({
      kind: "idle",
      message: "Complete the missing logic, then run three private browser checks.",
    });
  }

  const isPassed = checkState.kind === "passed";
  const isFinalExercise =
    exerciseIndex === JAVASCRIPT_FOUNDATION_EXERCISES.length - 1;

  return (
    <section className="foundations-workbench" aria-labelledby="warmup-title">
      <div className="foundations-lesson">
        <div className="foundations-step-row">
          <span>
            Warm-up {exercise.number} of {JAVASCRIPT_FOUNDATION_EXERCISES.length}
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

        <ol className="foundations-path" aria-label="Warm-up concepts">
          {JAVASCRIPT_FOUNDATION_EXERCISES.map((item, index) => (
            <li
              className={
                index === exerciseIndex
                  ? "is-current"
                  : index < exerciseIndex
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
      </div>

      <div className="foundations-editor">
        <div className="foundations-editor-bar">
          <span>foundations.js</span>
          <span>Local practice only</span>
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
              Continue to warm-up {exercise.number + 1}
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
