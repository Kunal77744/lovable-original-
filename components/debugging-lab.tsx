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
import { runCodingSolution } from "@/lib/coding-runner";
import {
  gradeDebuggingDrill,
  JAVASCRIPT_DEBUGGING_DRILLS,
} from "@/lib/debugging-lab";
import {
  getFirstIncompleteExerciseIndex,
  getNextIncompleteExerciseIndex,
  saveJavaScriptLabExercise,
} from "@/lib/javascript-lab-progress";

type LabState =
  | { kind: "idle"; message: string }
  | { kind: "running"; message: string }
  | { kind: "failed"; message: string; passedChecks: number }
  | { kind: "passed"; message: string }
  | { kind: "error"; message: string; source?: string };
const exerciseIds = JAVASCRIPT_DEBUGGING_DRILLS.map(
  (exercise) => exercise.slug,
);

export function DebuggingLab({
  completedExerciseIds = [],
  initialDrafts = {},
  browserRecoveryScope = null,
}: {
  completedExerciseIds?: string[];
  initialDrafts?: Record<string, string>;
  browserRecoveryScope?: string | null;
}) {
  const [drillIndex, setDrillIndex] = useState(() =>
    getFirstIncompleteExerciseIndex(exerciseIds, completedExerciseIds),
  );
  const drill = JAVASCRIPT_DEBUGGING_DRILLS[drillIndex] ?? null;
  const {
    source,
    state: draftState,
    savedSource,
    updateSource: setSource,
    retrySave,
    browserRecovery,
  } = usePrivateJavaScriptLabDraft({
    labSlug: "debugging",
    exerciseId: drill?.slug ?? JAVASCRIPT_DEBUGGING_DRILLS[0].slug,
    starterCode:
      drill?.starterCode ?? JAVASCRIPT_DEBUGGING_DRILLS[0].starterCode,
    initialDrafts,
    browserRecoveryScope,
  });
  const [completedIds, setCompletedIds] = useState(
    () => new Set(completedExerciseIds),
  );
  const [reviewingCompletedLab, setReviewingCompletedLab] = useState(false);
  const [labState, setLabState] = useState<LabState>({
    kind: "idle",
    message: "Read the brief, inspect the code, then run all three checks.",
  });
  const [checkResults, setCheckResults] = useState<GuidedCheckResult[]>([]);
  const completedCount = completedIds.size;
  const isLastDrill = drillIndex === JAVASCRIPT_DEBUGGING_DRILLS.length - 1;
  const handleEditorKeyDown = useGuidedLabExecutionShortcut({
    disabled:
      !drill || labState.kind === "running" || labState.kind === "passed",
    onRun: runChecks,
  });

  function updateSource(nextSource: string) {
    setSource(nextSource);
    setCheckResults([]);
    setLabState({
      kind: "idle",
      message: "Draft changed. Run the three checks when you’re ready.",
    });
  }

  async function runChecks() {
    if (!drill) return;
    setLabState({
      kind: "running",
      message: "Running three checks in an isolated browser worker…",
    });
    setCheckResults([]);
    const result = await runCodingSolution(
      source,
      drill.tests.map((test) => test.input),
    );

    if (result.status !== "finished") {
      setLabState({ kind: "error", message: result.message, source });
      return;
    }

    const nextCheckResults = buildGuidedCheckResults(
      drill.tests,
      result.outputs,
    );
    setCheckResults(nextCheckResults);
    const grade = gradeDebuggingDrill(drill, result.outputs);
    if (!grade.passed) {
      setLabState({
        kind: "failed",
        passedChecks: grade.passedChecks,
        message: `${grade.passedChecks} of ${grade.totalChecks} checks passed. Use the cue, then inspect the code again.`,
      });
      return;
    }

    if (completedIds.has(drill.slug)) {
      setLabState({
        kind: "passed",
        message: `All ${grade.totalChecks} checks passed. Saved completion stayed unchanged.`,
      });
      return;
    }

    const saveResponse = await saveJavaScriptLabExercise(
      "debugging",
      drill.slug,
    );
    if (!saveResponse?.ok) {
      setLabState({
        kind: "error",
        message:
          "The checks passed, but completion could not be saved. Run them again to retry.",
      });
      return;
    }

    setCompletedIds((current) => new Set(current).add(drill.slug));
    setLabState({
      kind: "passed",
      message: `All ${grade.totalChecks} checks passed. You found the defect.`,
    });
  }

  function openNextDrill() {
    const nextIndex = getNextIncompleteExerciseIndex(
      exerciseIds,
      [...completedIds],
      drillIndex,
      reviewingCompletedLab,
    );
    const nextDrill = JAVASCRIPT_DEBUGGING_DRILLS[nextIndex];
    if (!nextDrill) {
      setDrillIndex(JAVASCRIPT_DEBUGGING_DRILLS.length);
      return;
    }
    setDrillIndex(nextIndex);
    setCheckResults([]);
    setLabState({
      kind: "idle",
      message:
        "Read the new brief, inspect the code, then run all three checks.",
    });
  }

  function reviewExercises() {
    const firstDrill = JAVASCRIPT_DEBUGGING_DRILLS[0];
    setReviewingCompletedLab(true);
    setDrillIndex(0);
    setSource(firstDrill.starterCode);
    setCheckResults([]);
    setLabState({
      kind: "idle",
      message: "Review mode. Run the checks without changing saved completion.",
    });
  }

  function restoreStarter() {
    if (!drill) return;
    setSource(drill.starterCode);
    setCheckResults([]);
    setLabState({
      kind: "idle",
      message: "Starter restored locally. No learner record was changed.",
    });
  }

  if (!drill) {
    return (
      <section
        className="debugging-result is-passed"
        aria-labelledby="debugging-complete-title"
      >
        <div>
          <span>
            {reviewingCompletedLab
              ? "Debugging review complete"
              : "Debugging lab complete"}
          </span>
          <strong id="debugging-complete-title">
            All three saved repairs are complete.
          </strong>
        </div>
        <Link href="/practice/sum-two-numbers">Start judged practice</Link>
        <CompletedLabReviewButton
          label={reviewingCompletedLab ? "Review exercises again" : undefined}
          onReview={reviewExercises}
        />
      </section>
    );
  }

  return (
    <section
      className="debugging-workbench"
      aria-labelledby="debugging-workbench-title"
    >
      <header className="debugging-workbench-heading">
        <div>
          <p className="eyebrow">
            Defect {drill.number} of {JAVASCRIPT_DEBUGGING_DRILLS.length}
          </p>
          <h2 id="debugging-workbench-title">{drill.title}</h2>
          <p>{drill.brief}</p>
        </div>
        <div
          className="debugging-progress"
          aria-label={`${completedCount} of ${JAVASCRIPT_DEBUGGING_DRILLS.length} defects repaired`}
        >
          <span>Repaired</span>
          <strong>
            {completedCount}/{JAVASCRIPT_DEBUGGING_DRILLS.length}
          </strong>
          <small>{drill.concept}</small>
        </div>
      </header>

      <div className="debugging-editor">
        <div className="debugging-editor-bar">
          <span>broken-solution.js</span>
          <span>Draft saves privately</span>
        </div>
        <GuidedJavaScriptFileImport
          key={`import-${drill.slug}`}
          destinationName="broken-solution.js"
          disabled={labState.kind === "running"}
          onImport={(nextSource) => updateSource(nextSource)}
        />
        <label htmlFor="debugging-source">
          JavaScript source for {drill.title}
        </label>
        <GuidedCodeEditor
          id="debugging-source"
          aria-describedby={GUIDED_LAB_EXECUTION_HINT_ID}
          value={source}
          onChange={(event) => updateSource(event.target.value)}
          maxLength={PRIVATE_LAB_DRAFT_MAX_LENGTH}
          onKeyDown={handleEditorKeyDown}
          spellCheck={false}
        />
        <PrivateJavaScriptLabDraftStatus
          state={draftState}
          onRetry={retrySave}
          browserRecovery={browserRecovery}
          savedSource={savedSource}
          fileName="broken-solution.js"
        />
      </div>

      <GuidedStarterRestore
        key={`restore-${drill.slug}`}
        disabled={labState.kind === "running"}
        isStarterLoaded={source === drill.starterCode}
        onRestore={restoreStarter}
      />

      <GuidedSourceChangeReview
        currentSource={source}
        starterSource={drill.starterCode}
      />
      <GuidedLabExecutionHint />

      <div className="debugging-action-row">
        <p>Fix the smallest thing that makes the behavior match the brief.</p>
        <button
          type="button"
          onClick={runChecks}
          disabled={labState.kind === "running" || labState.kind === "passed"}
        >
          {labState.kind === "running" ? "Running checks…" : "Run 3 checks"}
        </button>
      </div>

      <div
        className={`debugging-result is-${labState.kind}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div>
          <span>
            {labState.kind === "passed"
              ? "Defect repaired"
              : labState.kind === "failed"
                ? "Keep debugging"
                : labState.kind === "running"
                  ? "Checking"
                  : labState.kind === "error"
                    ? "Runner stopped"
                    : "Ready"}
          </span>
          <strong>{labState.message}</strong>
        </div>

        {labState.kind === "failed" ? (
          <p className="debugging-cue">
            <span>Concept cue</span>
            {drill.recoveryCue}
          </p>
        ) : null}

        {labState.kind === "passed" ? (
          <div className="debugging-takeaway">
            <div>
              <span>What this repair proves</span>
              <p>{drill.takeaway}</p>
            </div>
            {isLastDrill && reviewingCompletedLab ? (
              <button type="button" onClick={openNextDrill}>
                Finish review
              </button>
            ) : isLastDrill ? (
              <Link href="/practice">Return to JavaScript practice</Link>
            ) : (
              <button type="button" onClick={openNextDrill}>
                Open next defect
              </button>
            )}
          </div>
        ) : null}
        {labState.kind === "passed" ? (
          <GuidedPlaygroundTransfer
            labSlug="debugging"
            exerciseId={drill.slug}
            source={source}
          />
        ) : null}
        <GuidedCheckResults results={checkResults} />
        <GuidedRuntimeErrorNavigation
          currentSource={source}
          editorId="debugging-source"
          failedSource={
            labState.kind === "error" ? labState.source : undefined
          }
          message={labState.message}
        />
      </div>
    </section>
  );
}
