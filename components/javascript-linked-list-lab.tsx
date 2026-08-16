"use client";

import Link from "next/link";
import { useState } from "react";
import {
  GUIDED_LAB_EXECUTION_HINT_ID,
  GuidedLabExecutionHint,
  useGuidedLabExecutionShortcut,
} from "@/components/guided-lab-execution-shortcut";
import { GuidedCodeEditor } from "@/components/guided-code-editor";
import { GuidedRuntimeErrorNavigation } from "@/components/guided-runtime-error-navigation";
import { GuidedSourceChangeReview } from "./guided-source-change-review";
import { GuidedJavaScriptFileImport } from "@/components/guided-javascript-file-import";
import { CompletedLabReviewButton } from "@/components/completed-lab-review-button";
import {
  PRIVATE_LAB_DRAFT_MAX_LENGTH,
  PrivateJavaScriptLabDraftStatus,
  usePrivateJavaScriptLabDraft,
} from "@/components/private-javascript-lab-draft";
import {
  buildGuidedCheckResults,
  GuidedCheckResults,
  type GuidedCheckResult,
} from "./guided-check-results";
import { GuidedStarterRestore } from "@/components/guided-starter-restore";
import { GuidedJavaScriptCustomRun } from "@/components/guided-javascript-custom-run";
import { runCodingSolution } from "@/lib/coding-runner";
import {
  JAVASCRIPT_LINKED_LIST_EXERCISES,
  type JavaScriptLinkedListExercise,
} from "@/lib/javascript-linked-lists";
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
  | { kind: "error"; message: string; source?: string };

const readyMessage =
  "Finish the linked-list step, then run three private browser checks.";

const exerciseIds = JAVASCRIPT_LINKED_LIST_EXERCISES.map(
  (exercise) => exercise.slug,
);

function PointerWalkthrough({
  exercise,
  stepIndex,
  onStepChange,
}: {
  exercise: JavaScriptLinkedListExercise;
  stepIndex: number;
  onStepChange: (nextStep: number) => void;
}) {
  const walkthrough = exercise.pointerWalkthrough;
  const step = walkthrough.steps[stepIndex];
  const displayTarget = (target: string | null) =>
    target === null
      ? "null"
      : (step.nodes.find((node) => node.id === target)?.value ?? target);
  const nodeState = step.nodes
    .map((node) => `${node.value}.next is ${displayTarget(node.next)}`)
    .join(", ");
  const pointerState = step.pointers
    .map(
      (pointer) => `${pointer.name} points to ${displayTarget(pointer.target)}`,
    )
    .join(", ");

  return (
    <section
      className="linked-list-walkthrough"
      aria-labelledby={`${exercise.slug}-walkthrough-title`}
    >
      <header>
        <div>
          <span>Saved pointer walkthrough</span>
          <h3 id={`${exercise.slug}-walkthrough-title`}>{walkthrough.title}</h3>
        </div>
        <strong>
          Step {stepIndex + 1} of {walkthrough.steps.length}
        </strong>
      </header>

      <div className="linked-list-walkthrough-grid">
        <div
          className="linked-list-pointer-canvas"
          role="img"
          aria-label={`Nodes: ${nodeState}. References: ${pointerState}.`}
        >
          <div className="linked-list-node-row" aria-hidden="true">
            {step.nodes.map((node) => (
              <div
                className={`linked-list-node${
                  node.state ? ` is-${node.state}` : ""
                }`}
                key={node.id}
              >
                <strong>{node.value}</strong>
                <span>
                  next <b>→ {displayTarget(node.next)}</b>
                </span>
              </div>
            ))}
          </div>

          <div className="linked-list-pointer-row" aria-hidden="true">
            {step.pointers.map((pointer) => (
              <span key={pointer.name}>
                {pointer.name} <b>→ {displayTarget(pointer.target)}</b>
              </span>
            ))}
          </div>
        </div>

        <div className="linked-list-pointer-copy" aria-live="polite">
          <span>Reference move {stepIndex + 1}</span>
          <h4>{step.action}</h4>
          <p>{step.explanation}</p>
          <ul>
            {step.facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </div>
      </div>

      <div
        className="linked-list-walkthrough-controls"
        role="group"
        aria-label="Pointer walkthrough controls"
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

export function JavaScriptLinkedListLab({
  completedExerciseIds = [],
  initialDrafts = {},
  browserRecoveryScope = null,
}: {
  completedExerciseIds?: string[];
  initialDrafts?: Record<string, string>;
  browserRecoveryScope?: string | null;
}) {
  const [exerciseIndex, setExerciseIndex] = useState(() =>
    getFirstIncompleteExerciseIndex(exerciseIds, completedExerciseIds),
  );
  const exercise = JAVASCRIPT_LINKED_LIST_EXERCISES[exerciseIndex] ?? null;
  const {
    source: code,
    state: draftState,
    savedSource,
    updateSource: setCode,
    restoreStarter: restorePrivateStarter,
    retrySave,
    browserRecovery,
  } = usePrivateJavaScriptLabDraft({
    labSlug: "linked-lists",
    exerciseId: exercise?.slug ?? JAVASCRIPT_LINKED_LIST_EXERCISES[0].slug,
    starterCode:
      exercise?.starterCode ?? JAVASCRIPT_LINKED_LIST_EXERCISES[0].starterCode,
    initialDrafts,
    browserRecoveryScope,
  });
  const [checkState, setCheckState] = useState<CheckState>({
    kind: "idle",
    message: readyMessage,
  });
  const [checkResults, setCheckResults] = useState<GuidedCheckResult[]>([]);
  const [completedIds, setCompletedIds] = useState(
    () => new Set(completedExerciseIds),
  );
  const [reviewingCompletedLab, setReviewingCompletedLab] = useState(false);
  const [walkthroughStep, setWalkthroughStep] = useState(0);
  const completedCount = completedIds.size;
  const handleEditorKeyDown = useGuidedLabExecutionShortcut({
    disabled:
      !exercise ||
      checkState.kind === "running" ||
      checkState.kind === "passed",
    onRun: runChecks,
  });

  async function runChecks() {
    if (!exercise) return;

    setCheckState({
      kind: "running",
      message: "Running three checks in the isolated browser worker…",
    });
    setCheckResults([]);
    const result = await runCodingSolution(
      code,
      exercise.tests.map((test) => test.input),
    );

    if (result.status !== "finished") {
      setCheckState({ kind: "error", message: result.message, source: code });
      return;
    }

    const nextCheckResults = buildGuidedCheckResults(
      exercise.tests,
      result.outputs,
    );
    const passedChecks = nextCheckResults.filter((check) => check.passed).length;
    setCheckResults(nextCheckResults);

    if (passedChecks === exercise.tests.length) {
      if (completedIds.has(exercise.slug)) {
        setWalkthroughStep(0);
        setCheckState({
          kind: "passed",
          message: `Passed ${passedChecks} of ${exercise.tests.length} checks. Saved completion stayed unchanged.`,
        });
        return;
      }
      const saveResponse = await saveJavaScriptLabExercise(
        "linked-lists",
        exercise.slug,
      );
      if (!saveResponse?.ok) {
        setCheckState({
          kind: "error",
          message:
            "The checks passed, but completion could not be saved. Run them again to retry.",
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
    restorePrivateStarter();
    setCheckResults([]);
    setWalkthroughStep(0);
    setCheckState({
      kind: "idle",
      message:
        "Starter restored. This version will save as your private draft.",
    });
  }

  function continueLab() {
    const nextIndex = getNextIncompleteExerciseIndex(
      exerciseIds,
      [...completedIds],
      exerciseIndex,
      reviewingCompletedLab,
    );
    const nextExercise = JAVASCRIPT_LINKED_LIST_EXERCISES[nextIndex];

    if (!nextExercise) {
      setExerciseIndex(JAVASCRIPT_LINKED_LIST_EXERCISES.length);
      return;
    }

    setExerciseIndex(nextIndex);
    setCheckResults([]);
    setWalkthroughStep(0);
    setCheckState({ kind: "idle", message: readyMessage });
  }

  function reviewExercises() {
    const firstExercise = JAVASCRIPT_LINKED_LIST_EXERCISES[0];
    setReviewingCompletedLab(true);
    setExerciseIndex(0);
    setCode(firstExercise.starterCode);
    setCheckResults([]);
    setWalkthroughStep(0);
    setCheckState({
      kind: "idle",
      message: "Review mode. Run the checks without changing saved completion.",
    });
  }

  if (!exercise) {
    return (
      <section
        className="function-lab-complete"
        aria-labelledby="linked-list-lab-complete-title"
      >
        <div className="function-lab-complete-mark" aria-hidden="true">
          4/4
        </div>
        <div>
          <p className="eyebrow">
            {reviewingCompletedLab
              ? "Linked-list fundamentals review complete"
              : "Linked-list fundamentals complete"}
          </p>
          <h2 id="linked-list-lab-complete-title">
            Follow the references before changing them.
          </h2>
          <p>
            You connected nodes, traversed every value, reversed the links, and
            chose a structure from the operation it needs to support.
          </p>
          <Link className="primary-action" href="/practice/sum-two-numbers">
            Start judged practice <span aria-hidden="true">→</span>
          </Link>
          <Link className="function-lab-return-link" href="/practice">
            Return to the practice arena
          </Link>
          <CompletedLabReviewButton
            label={reviewingCompletedLab ? "Review exercises again" : undefined}
            onReview={reviewExercises}
          />
        </div>
      </section>
    );
  }

  const isPassed = checkState.kind === "passed";
  const showRecovery =
    checkState.kind === "failed" || checkState.kind === "error";
  const progress =
    (completedCount / JAVASCRIPT_LINKED_LIST_EXERCISES.length) * 100;

  return (
    <section
      className="function-lab-workbench"
      aria-labelledby="linked-list-lab-title"
    >
      <header className="function-lab-progress">
        <div>
          <span>
            Linked-list idea {exercise.number} of{" "}
            {JAVASCRIPT_LINKED_LIST_EXERCISES.length}
          </span>
          <strong>{exercise.concept}</strong>
        </div>
        <div
          className="function-lab-progress-track"
          role="progressbar"
          aria-label="Linked-list exercises completed"
          aria-valuemin={0}
          aria-valuemax={JAVASCRIPT_LINKED_LIST_EXERCISES.length}
          aria-valuenow={completedCount}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="function-lab-grid">
        <aside className="function-lab-lesson">
          <p className="eyebrow">Trace the reference before changing it</p>
          <h2 id="linked-list-lab-title">{exercise.title}</h2>
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

          <ol className="function-lab-path" aria-label="Linked-list concepts">
            {JAVASCRIPT_LINKED_LIST_EXERCISES.map((item, index) => (
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
            <span>Draft saves privately</span>
          </div>
          <GuidedJavaScriptFileImport
            key={`import-${exercise.slug}`}
            destinationName={`${exercise.slug}.js`}
            disabled={checkState.kind === "running"}
            onImport={(nextCode) => {
              setCode(nextCode);
              setCheckResults([]);
              setWalkthroughStep(0);
              setCheckState({
                kind: "idle",
                message: "Imported code is local. Run the three checks when it is ready.",
              });
            }}
          />
          <label htmlFor="linked-list-lab-code">
            JavaScript linked-list code
          </label>
          <GuidedCodeEditor
            id="linked-list-lab-code"
            aria-describedby={GUIDED_LAB_EXECUTION_HINT_ID}
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setCheckResults([]);
              setWalkthroughStep(0);
              setCheckState({
                kind: "idle",
                message: "Code changed. Run the three checks when it is ready.",
              });
            }}
            maxLength={PRIVATE_LAB_DRAFT_MAX_LENGTH}
            onKeyDown={handleEditorKeyDown}
            spellCheck={false}
          />
          <PrivateJavaScriptLabDraftStatus
            state={draftState}
            onRetry={retrySave}
            browserRecovery={browserRecovery}
            savedSource={savedSource}
            fileName={`${exercise.slug}.js`}
          />

          <GuidedStarterRestore
            key={`restore-${exercise.slug}`}
            disabled={checkState.kind === "running"}
            isStarterLoaded={code === exercise.starterCode}
            onRestore={restoreStarter}
          />

          <GuidedSourceChangeReview
            currentSource={code}
            starterSource={exercise.starterCode}
          />
          <GuidedLabExecutionHint />

          <div className="function-lab-actions">
            {isPassed ? (
              <button
                className="function-lab-run"
                onClick={continueLab}
                type="button"
              >
                {exercise.number === JAVASCRIPT_LINKED_LIST_EXERCISES.length
                  ? "Finish the lab"
                  : `Continue to ${JAVASCRIPT_LINKED_LIST_EXERCISES[exerciseIndex + 1].concept}`}
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
                  ? "Links proved"
                  : showRecovery
                    ? "Trace the links again"
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
            <GuidedCheckResults results={checkResults} />
            <GuidedRuntimeErrorNavigation
              currentSource={code}
              editorId="linked-list-lab-code"
              failedSource={
                checkState.kind === "error" ? checkState.source : undefined
              }
              message={checkState.message}
            />
          </div>

          <GuidedJavaScriptCustomRun
            key={exercise.slug}
            code={code}
            inputDescription={exercise.inputFormat}
            sampleInput={exercise.example.input}
          />

          {checkState.kind === "passed" ? (
            <PointerWalkthrough
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
