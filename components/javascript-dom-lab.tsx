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
  GuidedCheckResults,
  type GuidedCheckResult,
} from "./guided-check-results";
import { GuidedStarterRestore } from "@/components/guided-starter-restore";
import { runDomLabCode } from "@/lib/dom-lab-runner";
import { JAVASCRIPT_DOM_EXERCISES } from "@/lib/javascript-dom-exercises";
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
  "Finish the missing DOM step, then run three private browser checks.";

const exerciseIds = JAVASCRIPT_DOM_EXERCISES.map((exercise) => exercise.slug);

export function JavaScriptDomLab({
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
  const exercise = JAVASCRIPT_DOM_EXERCISES[exerciseIndex] ?? null;
  const {
    source: code,
    state: draftState,
    savedSource,
    updateSource: setCode,
    restoreStarter: restorePrivateStarter,
    retrySave,
    browserRecovery,
  } = usePrivateJavaScriptLabDraft({
    labSlug: "dom",
    exerciseId: exercise?.slug ?? JAVASCRIPT_DOM_EXERCISES[0].slug,
    starterCode:
      exercise?.starterCode ?? JAVASCRIPT_DOM_EXERCISES[0].starterCode,
    initialDrafts,
    browserRecoveryScope,
  });
  const [checkState, setCheckState] = useState<CheckState>({
    kind: "idle",
    message: readyMessage,
  });
  const [completedIds, setCompletedIds] = useState(
    () => new Set(completedExerciseIds),
  );
  const [reviewingCompletedLab, setReviewingCompletedLab] = useState(false);
  const [checkResults, setCheckResults] = useState<GuidedCheckResult[]>([]);
  const [walkthroughStepIndex, setWalkthroughStepIndex] = useState(0);
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
      message: "Running three checks in an isolated browser worker…",
    });
    setCheckResults([]);
    const result = await runDomLabCode(code, exercise.slug);

    if (result.status !== "finished") {
      setCheckState({ kind: "error", message: result.message, source: code });
      return;
    }

    const nextCheckResults = result.checks.map((passed, index) => ({
      label: `Scenario ${String(index + 1).padStart(2, "0")}`,
      passed,
    }));
    setCheckResults(nextCheckResults);
    const passedChecks = result.checks.filter(Boolean).length;
    if (passedChecks === result.checks.length) {
      if (completedIds.has(exercise.slug)) {
        setWalkthroughStepIndex(0);
        setCheckState({
          kind: "passed",
          message: `Passed ${passedChecks} of ${result.checks.length} checks. Saved completion stayed unchanged.`,
        });
        return;
      }

      const saveResponse = await saveJavaScriptLabExercise(
        "dom",
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
      setWalkthroughStepIndex(0);
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
    restorePrivateStarter();
    setCheckResults([]);
    setWalkthroughStepIndex(0);
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
    const nextExercise = JAVASCRIPT_DOM_EXERCISES[nextIndex];
    if (!nextExercise) {
      setExerciseIndex(JAVASCRIPT_DOM_EXERCISES.length);
      return;
    }

    setExerciseIndex(nextIndex);
    setCheckResults([]);
    setWalkthroughStepIndex(0);
    setCheckState({ kind: "idle", message: readyMessage });
  }

  function reviewExercises() {
    const firstExercise = JAVASCRIPT_DOM_EXERCISES[0];
    setReviewingCompletedLab(true);
    setExerciseIndex(0);
    setCode(firstExercise.starterCode);
    setCheckResults([]);
    setWalkthroughStepIndex(0);
    setCheckState({
      kind: "idle",
      message: "Review mode. Run the checks without changing saved completion.",
    });
  }

  if (!exercise) {
    return (
      <section
        className="dom-lab-complete"
        aria-labelledby="dom-lab-complete-title"
      >
        <div className="dom-lab-complete-mark" aria-hidden="true">
          4/4
        </div>
        <div>
          <p className="eyebrow">
            {reviewingCompletedLab ? "DOM review complete" : "DOM lab complete"}
          </p>
          <h2 id="dom-lab-complete-title">
            JavaScript can now change the page.
          </h2>
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
          <CompletedLabReviewButton
            label={reviewingCompletedLab ? "Review exercises again" : undefined}
            onReview={reviewExercises}
          />
        </div>
      </section>
    );
  }

  const isPassed = checkState.kind === "passed";
  const progress = (completedCount / JAVASCRIPT_DOM_EXERCISES.length) * 100;
  const walkthroughStep = exercise.walkthrough.steps[walkthroughStepIndex];

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
            <span>Draft saves privately</span>
          </div>
          <GuidedJavaScriptFileImport
            key={`import-${exercise.slug}`}
            destinationName={`${exercise.slug}.js`}
            disabled={checkState.kind === "running"}
            onImport={(nextCode) => {
              setCode(nextCode);
              setCheckResults([]);
              setWalkthroughStepIndex(0);
              setCheckState({
                kind: "idle",
                message: "Imported code is local. Run the three checks when it is ready.",
              });
            }}
          />
          <label htmlFor="dom-lab-code">JavaScript DOM code</label>
          <GuidedCodeEditor
            id="dom-lab-code"
            aria-describedby={GUIDED_LAB_EXECUTION_HINT_ID}
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setCheckResults([]);
              setWalkthroughStepIndex(0);
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

          <div className="dom-lab-actions">
            {isPassed ? (
              <button
                className="dom-lab-run"
                onClick={continueLab}
                type="button"
              >
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
                {checkState.kind === "running"
                  ? "Running checks…"
                  : "Run 3 checks"}
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
            {checkState.kind === "failed" ? (
              <p>{exercise.recoveryCue}</p>
            ) : null}
            {checkState.kind === "passed" ? (
              <>
                <p className="dom-lab-takeaway">
                  <span>Keep this:</span> {exercise.takeaway}
                </p>
                <section
                  className="dom-lab-walkthrough"
                  aria-labelledby={`${exercise.slug}-walkthrough-title`}
                >
                  <header>
                    <div>
                      <span>DOM replay</span>
                      <h3 id={`${exercise.slug}-walkthrough-title`}>
                        {exercise.walkthrough.title}
                      </h3>
                    </div>
                    <strong>
                      Step {walkthroughStepIndex + 1} of {exercise.walkthrough.steps.length}
                    </strong>
                  </header>

                  <div className="dom-lab-walkthrough-stage" aria-live="polite">
                    <div className="dom-lab-walkthrough-browser">
                      <div aria-hidden="true">
                        <i />
                        <i />
                        <i />
                        <span>lesson.local</span>
                      </div>
                      <code>{walkthroughStep.pageMarkup}</code>
                      <strong>{walkthroughStep.browserState}</strong>
                    </div>
                    <div className="dom-lab-walkthrough-copy">
                      <span>{walkthroughStep.label}</span>
                      <code>{walkthroughStep.command}</code>
                      <p>{walkthroughStep.explanation}</p>
                    </div>
                  </div>

                  <div className="dom-lab-walkthrough-controls">
                    <button
                      disabled={walkthroughStepIndex === 0}
                      onClick={() => setWalkthroughStepIndex((current) => current - 1)}
                      type="button"
                    >
                      Previous state
                    </button>
                    <div aria-hidden="true">
                      {exercise.walkthrough.steps.map((step, index) => (
                        <span
                          className={index === walkthroughStepIndex ? "is-current" : undefined}
                          key={step.label}
                        />
                      ))}
                    </div>
                    <button
                      disabled={walkthroughStepIndex === exercise.walkthrough.steps.length - 1}
                      onClick={() => setWalkthroughStepIndex((current) => current + 1)}
                      type="button"
                    >
                      Next DOM state
                    </button>
                  </div>
                </section>
              </>
            ) : null}
            <GuidedCheckResults results={checkResults} />
            <GuidedRuntimeErrorNavigation
              currentSource={code}
              editorId="dom-lab-code"
              failedSource={
                checkState.kind === "error" ? checkState.source : undefined
              }
              message={checkState.message}
            />
          </div>

          <p className="dom-lab-privacy">
            Your draft and completion save privately to your account. Check
            output stays in this browser.
          </p>
        </div>
      </div>
    </section>
  );
}
