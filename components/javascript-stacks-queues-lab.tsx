"use client";

import Link from "next/link";
import { useState } from "react";
import { runCodingSolution } from "@/lib/coding-runner";
import {
  JAVASCRIPT_STACKS_QUEUES_EXERCISES,
  type JavaScriptStacksQueuesExercise,
} from "@/lib/javascript-stacks-queues";
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
  "Finish the stack or queue step, then run three private browser checks.";

const exerciseIds = JAVASCRIPT_STACKS_QUEUES_EXERCISES.map(
  (exercise) => exercise.slug,
);

function OperationWalkthrough({
  exercise,
  stepIndex,
  onStepChange,
}: {
  exercise: JavaScriptStacksQueuesExercise;
  stepIndex: number;
  onStepChange: (nextStep: number) => void;
}) {
  const walkthrough = exercise.operationWalkthrough;
  const step = walkthrough.steps[stepIndex];
  const visibleItems =
    walkthrough.structure === "stack" ? [...step.items].reverse() : step.items;
  const structureState =
    visibleItems.length === 0
      ? "empty"
      : visibleItems
          .map((item, index) => {
            if (walkthrough.structure === "stack") {
              return `${item}${index === 0 ? " at top" : ""}`;
            }

            return `${item}${index === 0 ? " at front" : index === visibleItems.length - 1 ? " at back" : ""}`;
          })
          .join(", ");

  return (
    <section
      className="stack-queue-walkthrough"
      aria-labelledby={`${exercise.slug}-walkthrough-title`}
    >
      <header>
        <div>
          <span>Saved result walkthrough</span>
          <h3 id={`${exercise.slug}-walkthrough-title`}>{walkthrough.title}</h3>
        </div>
        <strong>
          Step {stepIndex + 1} of {walkthrough.steps.length}
        </strong>
      </header>

      <div className="stack-queue-walkthrough-grid">
        <div
          className={`stack-queue-structure is-${walkthrough.structure}`}
          role="img"
          aria-label={`${walkthrough.itemOrder}: ${structureState}.`}
        >
          <span className="stack-queue-order-label">
            {walkthrough.structure === "stack" ? "Top" : "Front"}
          </span>
          <ol>
            {visibleItems.length > 0 ? (
              visibleItems.map((item, index) => (
                <li
                  className={index === 0 ? "is-next" : undefined}
                  key={`${item}-${index}`}
                >
                  {item}
                </li>
              ))
            ) : (
              <li className="is-empty">Empty</li>
            )}
          </ol>
          {walkthrough.structure === "queue" ? (
            <span className="stack-queue-order-label">Back</span>
          ) : null}
        </div>

        <div className="stack-queue-operation-copy" aria-live="polite">
          <span>Operation {stepIndex + 1}</span>
          <code>{step.operation}</code>
          <p>{step.explanation}</p>
          {step.removedItem ? (
            <p className="stack-queue-removed">
              Removed <strong>{step.removedItem}</strong>
            </p>
          ) : null}
        </div>
      </div>

      <div
        className="stack-queue-walkthrough-controls"
        role="group"
        aria-label="Operation walkthrough controls"
      >
        <button
          disabled={stepIndex === 0}
          onClick={() => onStepChange(stepIndex - 1)}
          type="button"
        >
          <span aria-hidden="true">←</span> Previous step
        </button>
        <button
          disabled={stepIndex === walkthrough.steps.length - 1}
          onClick={() => onStepChange(stepIndex + 1)}
          type="button"
        >
          Next step <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}

export function JavaScriptStacksQueuesLab({
  completedExerciseIds = [],
}: {
  completedExerciseIds?: string[];
}) {
  const [exerciseIndex, setExerciseIndex] = useState(() =>
    getFirstIncompleteExerciseIndex(exerciseIds, completedExerciseIds),
  );
  const exercise = JAVASCRIPT_STACKS_QUEUES_EXERCISES[exerciseIndex] ?? null;
  const [code, setCode] = useState(
    exercise?.starterCode ?? JAVASCRIPT_STACKS_QUEUES_EXERCISES[0].starterCode,
  );
  const [checkState, setCheckState] = useState<CheckState>({
    kind: "idle",
    message: readyMessage,
  });
  const [completedIds, setCompletedIds] = useState(
    () => new Set(completedExerciseIds),
  );
  const [walkthroughStep, setWalkthroughStep] = useState(0);
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
      const saveResponse = await saveJavaScriptLabExercise("stacks-queues", exercise.slug);
      if (!saveResponse?.ok) {
        setCheckState({
          kind: "error",
          message: "The checks passed, but completion could not be saved. Run them again to retry.",
        });
        return;
      }

      setCompletedIds((current) => new Set(current).add(exercise.slug));
      setWalkthroughStep(0);
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
    const nextExercise = JAVASCRIPT_STACKS_QUEUES_EXERCISES[nextIndex];

    if (!nextExercise) {
      setExerciseIndex(JAVASCRIPT_STACKS_QUEUES_EXERCISES.length);
      return;
    }

    setExerciseIndex(nextIndex);
    setCode(nextExercise.starterCode);
    setWalkthroughStep(0);
    setCheckState({ kind: "idle", message: readyMessage });
  }

  if (!exercise) {
    return (
      <section
        className="function-lab-complete"
        aria-labelledby="stacks-queues-lab-complete-title"
      >
        <div className="function-lab-complete-mark" aria-hidden="true">
          4/4
        </div>
        <div>
          <p className="eyebrow">Stacks and queues complete</p>
          <h2 id="stacks-queues-lab-complete-title">
            Choose the removal order before the code.
          </h2>
          <p>
            You removed the newest stack item, matched nested delimiters,
            served the oldest queue item, and chose a structure from its order.
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
    (completedCount / JAVASCRIPT_STACKS_QUEUES_EXERCISES.length) * 100;

  return (
    <section
      className="function-lab-workbench"
      aria-labelledby="stacks-queues-lab-title"
    >
      <header className="function-lab-progress">
        <div>
          <span>
            Stack and queue idea {exercise.number} of{" "}
            {JAVASCRIPT_STACKS_QUEUES_EXERCISES.length}
          </span>
          <strong>{exercise.concept}</strong>
        </div>
        <div
          className="function-lab-progress-track"
          role="progressbar"
          aria-label="Stacks and queues exercises completed"
          aria-valuemin={0}
          aria-valuemax={JAVASCRIPT_STACKS_QUEUES_EXERCISES.length}
          aria-valuenow={completedCount}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="function-lab-grid">
        <aside className="function-lab-lesson">
          <p className="eyebrow">Match the structure to the order</p>
          <h2 id="stacks-queues-lab-title">{exercise.title}</h2>
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

          <ol className="function-lab-path" aria-label="Stacks and queues concepts">
            {JAVASCRIPT_STACKS_QUEUES_EXERCISES.map((item, index) => (
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
          <label htmlFor="stacks-queues-lab-code">
            JavaScript stacks and queues code
          </label>
          <textarea
            id="stacks-queues-lab-code"
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
                {exercise.number === JAVASCRIPT_STACKS_QUEUES_EXERCISES.length
                  ? "Finish the lab"
                  : `Continue to ${JAVASCRIPT_STACKS_QUEUES_EXERCISES[exerciseIndex + 1].concept}`}
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
                  ? "Order proved"
                  : showRecovery
                    ? "Try the structure again"
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

          {checkState.kind === "passed" ? (
            <OperationWalkthrough
              exercise={exercise}
              stepIndex={walkthroughStep}
              onStepChange={setWalkthroughStep}
            />
          ) : null}

          <p className="function-lab-privacy">
            Code and check output stay in this browser. Completed exercises save
            privately to your account as practice, not judged mastery.
          </p>
        </div>
      </div>
    </section>
  );
}
