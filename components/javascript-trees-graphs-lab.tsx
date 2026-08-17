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
  getFirstIncompleteExerciseIndex,
  getNextIncompleteExerciseIndex,
  saveJavaScriptLabExercise,
} from "@/lib/javascript-lab-progress";
import { JAVASCRIPT_TREES_GRAPHS_EXERCISES } from "@/lib/javascript-trees-graphs";
import type { JavaScriptTreesGraphsExercise } from "@/lib/javascript-trees-graphs";

type CheckState =
  | { kind: "idle"; message: string }
  | { kind: "running"; message: string }
  | { kind: "passed"; message: string }
  | { kind: "failed"; message: string }
  | { kind: "error"; message: string; source?: string };

const readyMessage =
  "Finish the traversal step, then run three private browser checks.";

const exerciseIds = JAVASCRIPT_TREES_GRAPHS_EXERCISES.map(
  (exercise) => exercise.slug,
);

export function TreesGraphsWalkthrough({
  exercise,
}: {
  exercise: JavaScriptTreesGraphsExercise;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = exercise.walkthrough.steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === exercise.walkthrough.steps.length - 1;
  const walkthroughTitleId = `${exercise.slug}-walkthrough-title`;

  return (
    <section
      className="trees-graphs-walkthrough"
      aria-labelledby={walkthroughTitleId}
    >
      <div className="trees-graphs-walkthrough-heading">
        <div>
          <span>Saved-example explorer</span>
          <h3 id={walkthroughTitleId}>{exercise.walkthrough.title}</h3>
        </div>
        <strong>
          {String(stepIndex + 1).padStart(2, "0")} /{" "}
          {String(exercise.walkthrough.steps.length).padStart(2, "0")}
        </strong>
      </div>
      <p className="trees-graphs-walkthrough-intro">
        {exercise.walkthrough.intro}
      </p>

      <div
        className="trees-graphs-walkthrough-stage"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="trees-graphs-walkthrough-focus">
          <span>{step.focusLabel}</span>
          <strong>{step.focusValue}</strong>
        </div>
        <div className="trees-graphs-walkthrough-copy">
          <span>Step {stepIndex + 1}</span>
          <h4>{step.title}</h4>
          <p>{step.description}</p>
        </div>
      </div>

      <div className="trees-graphs-walkthrough-state">
        <div>
          <span>{step.visitedLabel}</span>
          <ol aria-label={step.visitedLabel}>
            {step.visited.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
        <div>
          <span>{step.frontierLabel}</span>
          {step.frontier.length > 0 ? (
            <ol aria-label={step.frontierLabel}>
              {step.frontier.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          ) : (
            <strong className="trees-graphs-walkthrough-empty">None</strong>
          )}
        </div>
      </div>

      <div className="trees-graphs-walkthrough-controls">
        <button
          disabled={isFirst}
          onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
          type="button"
        >
          <span aria-hidden="true">←</span> Previous
        </button>
        <button
          disabled={isLast}
          onClick={() =>
            setStepIndex((current) =>
              Math.min(exercise.walkthrough.steps.length - 1, current + 1),
            )
          }
          type="button"
        >
          Next step <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}

export function JavaScriptTreesGraphsLab({
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
  const exercise = JAVASCRIPT_TREES_GRAPHS_EXERCISES[exerciseIndex] ?? null;
  const {
    source: code,
    state: draftState,
    savedSource,
    updateSource: setCode,
    restoreStarter: restorePrivateStarter,
    retrySave,
    browserRecovery,
  } = usePrivateJavaScriptLabDraft({
    labSlug: "trees-graphs",
    exerciseId: exercise?.slug ?? JAVASCRIPT_TREES_GRAPHS_EXERCISES[0].slug,
    starterCode:
      exercise?.starterCode ?? JAVASCRIPT_TREES_GRAPHS_EXERCISES[0].starterCode,
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
        setCheckState({
          kind: "passed",
          message: `Passed ${passedChecks} of ${exercise.tests.length} checks. Saved completion stayed unchanged.`,
        });
        return;
      }
      const saveResponse = await saveJavaScriptLabExercise(
        "trees-graphs",
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
    const nextExercise = JAVASCRIPT_TREES_GRAPHS_EXERCISES[nextIndex];

    if (!nextExercise) {
      setExerciseIndex(JAVASCRIPT_TREES_GRAPHS_EXERCISES.length);
      return;
    }

    setExerciseIndex(nextIndex);
    setCheckResults([]);
    setCheckState({ kind: "idle", message: readyMessage });
  }

  function reviewExercises() {
    const firstExercise = JAVASCRIPT_TREES_GRAPHS_EXERCISES[0];
    setReviewingCompletedLab(true);
    setExerciseIndex(0);
    setCode(firstExercise.starterCode);
    setCheckResults([]);
    setCheckState({
      kind: "idle",
      message: "Review mode. Run the checks without changing saved completion.",
    });
  }

  if (!exercise) {
    return (
      <section
        className="function-lab-complete"
        aria-labelledby="trees-graphs-lab-complete-title"
      >
        <div className="function-lab-complete-mark" aria-hidden="true">
          4/4
        </div>
        <div>
          <p className="eyebrow">
            {reviewingCompletedLab
              ? "Trees and graphs review complete"
              : "Trees and graphs complete"}
          </p>
          <h2 id="trees-graphs-lab-complete-title">
            Choose the visit order before you write the loop.
          </h2>
          <p>
            You traversed trees depth first and breadth first, searched a graph
            without getting trapped in a cycle, and matched order to the goal.
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
    (completedCount / JAVASCRIPT_TREES_GRAPHS_EXERCISES.length) * 100;

  return (
    <section
      className="function-lab-workbench"
      aria-labelledby="trees-graphs-lab-title"
    >
      <header className="function-lab-progress">
        <div>
          <span>
            Traversal idea {exercise.number} of{" "}
            {JAVASCRIPT_TREES_GRAPHS_EXERCISES.length}
          </span>
          <strong>{exercise.concept}</strong>
        </div>
        <div
          className="function-lab-progress-track"
          role="progressbar"
          aria-label="Trees and graphs exercises completed"
          aria-valuemin={0}
          aria-valuemax={JAVASCRIPT_TREES_GRAPHS_EXERCISES.length}
          aria-valuenow={completedCount}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="function-lab-grid">
        <aside className="function-lab-lesson">
          <p className="eyebrow">Pick the visit order before coding</p>
          <h2 id="trees-graphs-lab-title">{exercise.title}</h2>
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

          <ol
            className="function-lab-path"
            aria-label="Trees and graphs concepts"
          >
            {JAVASCRIPT_TREES_GRAPHS_EXERCISES.map((item, index) => (
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
              setCheckState({
                kind: "idle",
                message: "Imported code is local. Run the three checks when it is ready.",
              });
            }}
          />
          <label htmlFor="trees-graphs-lab-code">
            JavaScript trees and graphs code
          </label>
          <GuidedCodeEditor
            id="trees-graphs-lab-code"
            aria-describedby={GUIDED_LAB_EXECUTION_HINT_ID}
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setCheckResults([]);
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
                {exercise.number === JAVASCRIPT_TREES_GRAPHS_EXERCISES.length
                  ? "Finish the lab"
                  : `Continue to ${JAVASCRIPT_TREES_GRAPHS_EXERCISES[exerciseIndex + 1].concept}`}
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
                  ? "Traversal proved"
                  : showRecovery
                    ? "Choose the next visit again"
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
            <GuidedCheckResults
              results={checkResults}
              attemptNote={{
                labSlug: "trees-graphs",
                exerciseId: exercise.slug,
                showEmpty:
                  checkState.kind === "failed" || checkState.kind === "error",
              }}
            />
            <GuidedRuntimeErrorNavigation
              currentSource={code}
              editorId="trees-graphs-lab-code"
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

          {isPassed ? (
            <TreesGraphsWalkthrough key={exercise.slug} exercise={exercise} />
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
