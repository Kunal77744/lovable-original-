"use client";

import Link from "next/link";
import { useState } from "react";
import { runDomLabCode } from "@/lib/dom-lab-runner";
import { JAVASCRIPT_DOM_EXERCISES } from "@/lib/javascript-dom-exercises";

type CheckState =
  | { kind: "idle"; message: string }
  | { kind: "running"; message: string }
  | { kind: "passed"; message: string }
  | { kind: "failed"; message: string }
  | { kind: "error"; message: string };

const readyMessage =
  "Finish the missing DOM step, then run three private browser checks.";

export function JavaScriptDomLab() {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const exercise = JAVASCRIPT_DOM_EXERCISES[exerciseIndex] ?? null;
  const [code, setCode] = useState(JAVASCRIPT_DOM_EXERCISES[0].starterCode);
  const [checkState, setCheckState] = useState<CheckState>({
    kind: "idle",
    message: readyMessage,
  });
  const [completedCount, setCompletedCount] = useState(0);

  async function runChecks() {
    if (!exercise) return;

    setCheckState({
      kind: "running",
      message: "Running three checks in an isolated browser worker…",
    });
    const result = await runDomLabCode(code, exercise.slug);

    if (result.status !== "finished") {
      setCheckState({ kind: "error", message: result.message });
      return;
    }

    const passedChecks = result.checks.filter(Boolean).length;
    if (passedChecks === result.checks.length) {
      setCompletedCount(exercise.number);
      setCheckState({
        kind: "passed",
        message: `Passed ${passedChecks} of ${result.checks.length} checks.`,
      });
      return;
    }

    setCheckState({
      kind: "failed",
      message: `${passedChecks} of ${result.checks.length} checks passed.`,
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
    const nextExercise = JAVASCRIPT_DOM_EXERCISES[exerciseIndex + 1];
    if (!nextExercise) {
      setExerciseIndex(JAVASCRIPT_DOM_EXERCISES.length);
      return;
    }

    setExerciseIndex((current) => current + 1);
    setCode(nextExercise.starterCode);
    setCheckState({ kind: "idle", message: readyMessage });
  }

  if (!exercise) {
    return (
      <section className="dom-lab-complete" aria-labelledby="dom-lab-complete-title">
        <div className="dom-lab-complete-mark" aria-hidden="true">
          4/4
        </div>
        <div>
          <p className="eyebrow">DOM lab complete</p>
          <h2 id="dom-lab-complete-title">JavaScript can now change the page.</h2>
          <p>
            You selected an element, changed its text, toggled a class, and
            responded to a click. Those four moves are the foundation of small
            browser interfaces.
          </p>
          <Link className="primary-action" href="/practice/sum-two-numbers">
            Start judged practice <span aria-hidden="true">→</span>
          </Link>
          <Link className="dom-lab-return-link" href="/practice">
            Return to the practice arena
          </Link>
        </div>
      </section>
    );
  }

  const isPassed = checkState.kind === "passed";
  const progress = (completedCount / JAVASCRIPT_DOM_EXERCISES.length) * 100;

  return (
    <section className="dom-lab-workbench" aria-labelledby="dom-lab-title">
      <header className="dom-lab-progress">
        <div>
          <span>
            DOM move {exercise.number} of {JAVASCRIPT_DOM_EXERCISES.length}
          </span>
          <strong>{exercise.concept}</strong>
        </div>
        <div
          className="dom-lab-progress-track"
          role="progressbar"
          aria-label="DOM exercises completed"
          aria-valuemin={0}
          aria-valuemax={JAVASCRIPT_DOM_EXERCISES.length}
          aria-valuenow={completedCount}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="dom-lab-grid">
        <aside className="dom-lab-lesson">
          <p className="eyebrow">Read the page, then change it</p>
          <h2 id="dom-lab-title">{exercise.title}</h2>
          <p className="dom-lab-prompt">{exercise.prompt}</p>

          <div className="dom-lab-preview">
            <span>{exercise.previewLabel}</span>
            <code>{exercise.previewMarkup}</code>
          </div>

          <ol className="dom-lab-path" aria-label="DOM fundamentals">
            {JAVASCRIPT_DOM_EXERCISES.map((item, index) => (
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
        </aside>

        <div className="dom-lab-editor">
          <div className="dom-lab-editor-bar">
            <span>{exercise.slug}.js</span>
            <span>Isolated worker</span>
          </div>
          <label htmlFor="dom-lab-code">JavaScript DOM code</label>
          <textarea
            id="dom-lab-code"
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

          <div className="dom-lab-actions">
            <button
              className="dom-lab-reset"
              disabled={checkState.kind === "running"}
              onClick={restoreStarter}
              type="button"
            >
              Restore starter
            </button>
            {isPassed ? (
              <button className="dom-lab-run" onClick={continueLab} type="button">
                {exercise.number === JAVASCRIPT_DOM_EXERCISES.length
                  ? "Finish the lab"
                  : `Continue to ${JAVASCRIPT_DOM_EXERCISES[exerciseIndex + 1].concept}`}
                <span aria-hidden="true">→</span>
              </button>
            ) : (
              <button
                className="dom-lab-run"
                disabled={checkState.kind === "running"}
                onClick={runChecks}
                type="button"
              >
                {checkState.kind === "running" ? "Running checks…" : "Run 3 checks"}
              </button>
            )}
          </div>

          <div
            className={`dom-lab-result is-${checkState.kind}`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div>
              <span>
                {checkState.kind === "passed"
                  ? "DOM move proved"
                  : checkState.kind === "failed"
                    ? "Try this move again"
                    : checkState.kind === "error"
                      ? "Run stopped"
                      : "Private checks"}
              </span>
              <strong>{checkState.message}</strong>
            </div>
            {checkState.kind === "failed" ? <p>{exercise.recoveryCue}</p> : null}
            {checkState.kind === "passed" ? (
              <p className="dom-lab-takeaway">
                <span>Keep this:</span> {exercise.takeaway}
              </p>
            ) : null}
          </div>

          <p className="dom-lab-privacy">
            Code, checks, answers, and progress stay in this browser tab. No
            attempt, score, or learner record is saved.
          </p>
        </div>
      </div>
    </section>
  );
}
