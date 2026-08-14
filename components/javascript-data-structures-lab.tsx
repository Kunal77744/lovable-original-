"use client";

import Link from "next/link";
import { useState } from "react";
import { GuidedJavaScriptFileImport } from "@/components/guided-javascript-file-import";
import { runCodingSolution } from "@/lib/coding-runner";
import { JAVASCRIPT_DATA_STRUCTURE_EXERCISES } from "@/lib/javascript-data-structures";
import { getFirstIncompleteExerciseIndex, getNextIncompleteExerciseIndex, saveJavaScriptLabExercise } from "@/lib/javascript-lab-progress";

type CheckState =
  | { kind: "idle"; message: string }
  | { kind: "running"; message: string }
  | { kind: "passed"; message: string }
  | { kind: "failed"; message: string }
  | { kind: "error"; message: string };

const readyMessage =
  "Finish the missing logic, then run three private browser checks.";

const exerciseIds = JAVASCRIPT_DATA_STRUCTURE_EXERCISES.map((exercise) => exercise.slug);

export function JavaScriptDataStructuresLab({ completedExerciseIds = [] }: { completedExerciseIds?: string[] }) {
  const [exerciseIndex, setExerciseIndex] = useState(() => getFirstIncompleteExerciseIndex(exerciseIds, completedExerciseIds));
  const exercise = JAVASCRIPT_DATA_STRUCTURE_EXERCISES[exerciseIndex] ?? null;
  const [code, setCode] = useState(
    exercise?.starterCode ?? JAVASCRIPT_DATA_STRUCTURE_EXERCISES[0].starterCode,
  );
  const [checkState, setCheckState] = useState<CheckState>({
    kind: "idle",
    message: readyMessage,
  });
  const [completedIds, setCompletedIds] = useState(() => new Set(completedExerciseIds));
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
      const saveResponse = await saveJavaScriptLabExercise("data-structures", exercise.slug);
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
    const nextExercise = JAVASCRIPT_DATA_STRUCTURE_EXERCISES[nextIndex];

    if (!nextExercise) {
      setExerciseIndex(JAVASCRIPT_DATA_STRUCTURE_EXERCISES.length);
      return;
    }

    setExerciseIndex(nextIndex);
    setCode(nextExercise.starterCode);
    setCheckState({ kind: "idle", message: readyMessage });
  }

  if (!exercise) {
    return (
      <section
        className="data-lab-complete"
        aria-labelledby="data-lab-complete-title"
      >
        <div className="data-lab-complete-mark" aria-hidden="true">
          4/4
        </div>
        <div>
          <p className="eyebrow">Data-structures lab complete</p>
          <h2 id="data-lab-complete-title">
            Four structures, four different jobs.
          </h2>
          <p>
            You used arrays for ordered values, strings for characters, objects
            for keyed counts, and sets for uniqueness. Choose the structure
            that matches the question before you write the loop.
          </p>
          <Link className="primary-action" href="/practice/sum-two-numbers">
            Start judged practice <span aria-hidden="true">→</span>
          </Link>
          <Link className="data-lab-return-link" href="/practice">
            Return to the practice arena
          </Link>
        </div>
      </section>
    );
  }

  const isPassed = checkState.kind === "passed";
  const progress =
    (completedCount / JAVASCRIPT_DATA_STRUCTURE_EXERCISES.length) * 100;

  return (
    <section className="data-lab-workbench" aria-labelledby="data-lab-title">
      <header className="data-lab-progress">
        <div>
          <span>
            Structure {exercise.number} of{" "}
            {JAVASCRIPT_DATA_STRUCTURE_EXERCISES.length}
          </span>
          <strong>{exercise.structure}</strong>
        </div>
        <div
          className="data-lab-progress-track"
          role="progressbar"
          aria-label="Data-structure exercises completed"
          aria-valuemin={0}
          aria-valuemax={JAVASCRIPT_DATA_STRUCTURE_EXERCISES.length}
          aria-valuenow={completedCount}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="data-lab-grid">
        <aside className="data-lab-lesson">
          <p className="eyebrow">Use the right container</p>
          <h2 id="data-lab-title">{exercise.title}</h2>
          <p className="data-lab-prompt">{exercise.prompt}</p>

          <dl className="data-lab-contract">
            <div>
              <dt>Input</dt>
              <dd>{exercise.inputFormat}</dd>
            </div>
            <div>
              <dt>Return</dt>
              <dd>{exercise.outputFormat}</dd>
            </div>
          </dl>

          <div className="data-lab-example">
            <span>Example</span>
            <div>
              <code>{exercise.example.input}</code>
              <span aria-hidden="true">→</span>
              <code>{exercise.example.output}</code>
            </div>
          </div>

          <ol className="data-lab-path" aria-label="Data structures">
            {JAVASCRIPT_DATA_STRUCTURE_EXERCISES.map((item, index) => (
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
                <strong>{item.structure}</strong>
              </li>
            ))}
          </ol>
        </aside>

        <div className="data-lab-editor">
          <div className="data-lab-editor-bar">
            <span>{exercise.slug}.js</span>
            <span>Browser-only</span>
          </div>
          <GuidedJavaScriptFileImport
            key={exercise.slug}
            destinationName={`${exercise.slug}.js`}
            disabled={checkState.kind === "running"}
            onImport={(nextCode) => {
              setCode(nextCode);
              setCheckState({
                kind: "idle",
                message: "Imported code is local. Run the three checks when it is ready.",
              });
            }}
          />
          <label htmlFor="data-lab-code">JavaScript data-structure code</label>
          <textarea
            id="data-lab-code"
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

          <div className="data-lab-actions">
            <button
              className="data-lab-reset"
              disabled={checkState.kind === "running"}
              onClick={restoreStarter}
              type="button"
            >
              Restore starter
            </button>
            {isPassed ? (
              <button
                className="data-lab-run"
                onClick={continueLab}
                type="button"
              >
                {exercise.number ===
                JAVASCRIPT_DATA_STRUCTURE_EXERCISES.length
                  ? "Finish the lab"
                  : `Continue to ${
                      JAVASCRIPT_DATA_STRUCTURE_EXERCISES[exerciseIndex + 1]
                        .structure
                    }`}
                <span aria-hidden="true">→</span>
              </button>
            ) : (
              <button
                className="data-lab-run"
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
            className={`data-lab-result is-${checkState.kind}`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div>
              <span>
                {checkState.kind === "passed"
                  ? "Structure proved"
                  : checkState.kind === "failed"
                    ? "Try the structure again"
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
              <p className="data-lab-takeaway">
                <span>Keep this:</span> {exercise.takeaway}
              </p>
            ) : null}
          </div>

          <p className="data-lab-privacy">
            Code, checks, answers, and progress stay in this browser tab. No
            code stays in this browser; completed exercises save privately.
          </p>
        </div>
      </div>
    </section>
  );
}
