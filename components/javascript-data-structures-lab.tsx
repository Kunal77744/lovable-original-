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
import { JAVASCRIPT_DATA_STRUCTURE_EXERCISES } from "@/lib/javascript-data-structures";
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
  "Finish the missing logic, then run three private browser checks.";

const exerciseIds = JAVASCRIPT_DATA_STRUCTURE_EXERCISES.map(
  (exercise) => exercise.slug,
);

export function JavaScriptDataStructuresLab({
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
  const exercise = JAVASCRIPT_DATA_STRUCTURE_EXERCISES[exerciseIndex] ?? null;
  const {
    source: code,
    state: draftState,
    savedSource,
    updateSource: setCode,
    restoreStarter: restorePrivateStarter,
    retrySave,
    browserRecovery,
  } = usePrivateJavaScriptLabDraft({
    labSlug: "data-structures",
    exerciseId: exercise?.slug ?? JAVASCRIPT_DATA_STRUCTURE_EXERCISES[0].slug,
    starterCode:
      exercise?.starterCode ??
      JAVASCRIPT_DATA_STRUCTURE_EXERCISES[0].starterCode,
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
        "data-structures",
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
    const nextExercise = JAVASCRIPT_DATA_STRUCTURE_EXERCISES[nextIndex];

    if (!nextExercise) {
      setExerciseIndex(JAVASCRIPT_DATA_STRUCTURE_EXERCISES.length);
      return;
    }

    setExerciseIndex(nextIndex);
    setCheckResults([]);
    setWalkthroughStep(0);
    setCheckState({ kind: "idle", message: readyMessage });
  }

  function reviewExercises() {
    const firstExercise = JAVASCRIPT_DATA_STRUCTURE_EXERCISES[0];
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
        className="data-lab-complete"
        aria-labelledby="data-lab-complete-title"
      >
        <div className="data-lab-complete-mark" aria-hidden="true">
          4/4
        </div>
        <div>
          <p className="eyebrow">
            {reviewingCompletedLab
              ? "Data-structures review complete"
              : "Data-structures lab complete"}
          </p>
          <h2 id="data-lab-complete-title">
            Four structures, four different jobs.
          </h2>
          <p>
            You used arrays for ordered values, strings for characters, objects
            for keyed counts, and sets for uniqueness. Choose the structure that
            matches the question before you write the loop.
          </p>
          <Link className="primary-action" href="/practice/sum-two-numbers">
            Start judged practice <span aria-hidden="true">→</span>
          </Link>
          <Link className="data-lab-return-link" href="/practice">
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
          <label htmlFor="data-lab-code">JavaScript data-structure code</label>
          <GuidedCodeEditor
            id="data-lab-code"
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

          <div className="data-lab-actions">
            {isPassed ? (
              <button
                className="data-lab-run"
                onClick={continueLab}
                type="button"
              >
                {exercise.number === JAVASCRIPT_DATA_STRUCTURE_EXERCISES.length
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
            {checkState.kind === "passed" ? (
              <GuidedPlaygroundTransfer
                labSlug="data-structures"
                exerciseId={exercise.slug}
                source={code}
              />
            ) : null}
            <GuidedCheckResults results={checkResults} />
            <GuidedRuntimeErrorNavigation
              currentSource={code}
              editorId="data-lab-code"
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
              className="data-structure-walkthrough"
              aria-labelledby="data-structure-walkthrough-title"
            >
              <header>
                <div>
                  <span>Structure walkthrough</span>
                  <h3 id="data-structure-walkthrough-title">
                    Watch {exercise.structure.toLowerCase()} change state
                  </h3>
                </div>
                <span>
                  Step {walkthroughStep + 1} of {exercise.walkthrough.steps.length}
                </span>
              </header>

              <p className="data-structure-walkthrough-input">
                <span>Example input</span>
                <code>{exercise.walkthrough.input}</code>
              </p>

              <div
                className="data-structure-walkthrough-stage"
                aria-atomic="true"
                aria-live="polite"
              >
                <div>
                  <dl className="data-structure-walkthrough-decision">
                    <div>
                      <dt>Current item</dt>
                      <dd>
                        <code>
                          {exercise.walkthrough.steps[walkthroughStep].currentItem}
                        </code>
                      </dd>
                    </div>
                    <div>
                      <dt>Decision</dt>
                      <dd>{exercise.walkthrough.steps[walkthroughStep].decision}</dd>
                    </div>
                  </dl>
                  <span>{exercise.walkthrough.stateLabel}</span>
                  <div
                    className="data-structure-walkthrough-state"
                    aria-label={`${exercise.walkthrough.stateLabel}: ${exercise.walkthrough.steps[walkthroughStep].state.join(", ")}`}
                    role="group"
                  >
                    {exercise.walkthrough.steps[walkthroughStep].state.map(
                      (item) => <code key={item}>{item}</code>,
                    )}
                  </div>
                </div>
                <div>
                  <strong>
                    {exercise.walkthrough.steps[walkthroughStep].title}
                  </strong>
                  <p>{exercise.walkthrough.steps[walkthroughStep].detail}</p>
                  {exercise.walkthrough.steps[walkthroughStep].result ? (
                    <p className="data-structure-walkthrough-result">
                      {exercise.walkthrough.steps[walkthroughStep].result}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="data-structure-walkthrough-controls">
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

          <p className="data-lab-privacy">
            Your draft and completion save privately to your account. Check
            output stays in this browser.
          </p>
        </div>
      </div>
    </section>
  );
}
