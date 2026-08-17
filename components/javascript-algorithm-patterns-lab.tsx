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
import { GuidedPlaygroundTransfer } from "@/components/guided-playground-transfer";
import { GuidedSourceChangeReview } from "./guided-source-change-review";
import { GuidedJavaScriptFileImport } from "@/components/guided-javascript-file-import";
import { CompletedLabReviewButton } from "@/components/completed-lab-review-button";
import {
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
import { JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES } from "@/lib/javascript-algorithm-patterns";
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
  "Finish the pattern, then run three private browser checks.";

const exerciseIds = JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES.map(
  (exercise) => exercise.slug,
);

export function JavaScriptAlgorithmPatternsLab({
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
  const exercise =
    JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES[exerciseIndex] ?? null;
  const {
    source: code,
    state: draftState,
    savedSource,
    updateSource: setCode,
    restoreStarter: restoreDraftStarter,
    retrySave,
    browserRecovery,
  } = usePrivateJavaScriptLabDraft({
    labSlug: "algorithm-patterns",
    exerciseId:
      exercise?.slug ?? JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES[0].slug,
    starterCode:
      exercise?.starterCode ??
      JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES[0].starterCode,
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
        "algorithm-patterns",
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
    restoreDraftStarter();
    setCheckResults([]);
    setWalkthroughStep(0);
    setCheckState({
      kind: "idle",
      message:
        "Starter restored. It will save as this exercise's private draft.",
    });
  }

  function continueLab() {
    const nextIndex = getNextIncompleteExerciseIndex(
      exerciseIds,
      [...completedIds],
      exerciseIndex,
      reviewingCompletedLab,
    );
    const nextExercise = JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES[nextIndex];

    if (!nextExercise) {
      setExerciseIndex(JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES.length);
      return;
    }

    setExerciseIndex(nextIndex);
    setCheckResults([]);
    setWalkthroughStep(0);
    setCheckState({ kind: "idle", message: readyMessage });
  }

  function reviewExercises() {
    const firstExercise = JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES[0];
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
        aria-labelledby="algorithm-patterns-complete-title"
      >
        <div className="function-lab-complete-mark" aria-hidden="true">
          4/4
        </div>
        <div>
          <p className="eyebrow">
            {reviewingCompletedLab
              ? "Algorithm patterns review complete"
              : "Algorithm patterns complete"}
          </p>
          <h2 id="algorithm-patterns-complete-title">
            Recognize the shape before writing the loop.
          </h2>
          <p>
            You counted with a map, moved two pointers, reused a fixed window,
            and answered a range from cumulative totals.
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
    (completedCount / JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES.length) * 100;

  return (
    <section
      className="function-lab-workbench"
      aria-labelledby="algorithm-patterns-title"
    >
      <header className="function-lab-progress">
        <div>
          <span>
            Pattern {exercise.number} of{" "}
            {JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES.length}
          </span>
          <strong>{exercise.concept}</strong>
        </div>
        <div
          className="function-lab-progress-track"
          role="progressbar"
          aria-label="Algorithm pattern exercises completed"
          aria-valuemin={0}
          aria-valuemax={JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES.length}
          aria-valuenow={completedCount}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="function-lab-grid">
        <aside className="function-lab-lesson">
          <p className="eyebrow">Match the pattern to the constraint</p>
          <h2 id="algorithm-patterns-title">{exercise.title}</h2>
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

          <ol className="function-lab-path" aria-label="Algorithm patterns">
            {JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES.map((item, index) => (
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
          <label htmlFor="algorithm-patterns-code">
            JavaScript algorithm pattern code
          </label>
          <GuidedCodeEditor
            id="algorithm-patterns-code"
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
            maxLength={20_000}
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
                {exercise.number ===
                JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES.length
                  ? "Finish the lab"
                  : `Continue to ${JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES[exerciseIndex + 1].concept}`}
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
                  ? "Pattern proved"
                  : showRecovery
                    ? "Try the pattern again"
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
            {checkState.kind === "passed" ? (
              <GuidedPlaygroundTransfer
                labSlug="algorithm-patterns"
                exerciseId={exercise.slug}
                source={code}
              />
            ) : null}
            <GuidedCheckResults results={checkResults} />
            <GuidedRuntimeErrorNavigation
              currentSource={code}
              editorId="algorithm-patterns-code"
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
            <section
              className="algorithm-pattern-walkthrough"
              aria-labelledby="algorithm-pattern-walkthrough-title"
            >
              <header>
                <div>
                  <span>Pattern walkthrough</span>
                  <strong id="algorithm-pattern-walkthrough-title">
                    Watch {exercise.concept.toLowerCase()} change state
                  </strong>
                </div>
                <span aria-live="polite">
                  Step {walkthroughStep + 1} of{" "}
                  {exercise.walkthrough.steps.length}
                </span>
              </header>

              <p className="algorithm-pattern-walkthrough-input">
                <span>Example input</span>
                <code>{exercise.walkthrough.input}</code>
              </p>

              <div className="algorithm-pattern-walkthrough-stage">
                <div>
                  <span>
                    {exercise.walkthrough.steps[walkthroughStep].stateLabel}
                  </span>
                  <div
                    className="algorithm-pattern-walkthrough-state"
                    aria-label={
                      exercise.walkthrough.steps[walkthroughStep].stateLabel
                    }
                  >
                    {exercise.walkthrough.steps[walkthroughStep].state.map(
                      (item) => (
                        <code key={item}>{item}</code>
                      ),
                    )}
                  </div>
                </div>
                <div>
                  <strong>
                    {exercise.walkthrough.steps[walkthroughStep].title}
                  </strong>
                  <p>{exercise.walkthrough.steps[walkthroughStep].detail}</p>
                  {exercise.walkthrough.steps[walkthroughStep].result ? (
                    <p className="algorithm-pattern-walkthrough-result">
                      {exercise.walkthrough.steps[walkthroughStep].result}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="algorithm-pattern-walkthrough-controls">
                <button
                  disabled={walkthroughStep === 0}
                  onClick={() => setWalkthroughStep((step) => step - 1)}
                  type="button"
                >
                  Previous step
                </button>
                <button
                  disabled={
                    walkthroughStep === exercise.walkthrough.steps.length - 1
                  }
                  onClick={() => setWalkthroughStep((step) => step + 1)}
                  type="button"
                >
                  Next step
                </button>
              </div>
            </section>
          ) : null}

          <p className="function-lab-privacy">
            Your draft and completion save privately to your account. Check
            output stays in this browser.
          </p>
        </div>
      </div>
    </section>
  );
}
