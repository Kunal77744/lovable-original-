"use client";

import Link from "next/link";
import { useState } from "react";
import { GuidedJavaScriptFileImport } from "@/components/guided-javascript-file-import";
import { runCodingSolution } from "@/lib/coding-runner";
import {
  gradeDebuggingDrill,
  JAVASCRIPT_DEBUGGING_DRILLS,
} from "@/lib/debugging-lab";
import { getFirstIncompleteExerciseIndex, getNextIncompleteExerciseIndex, saveJavaScriptLabExercise } from "@/lib/javascript-lab-progress";

type LabState =
  | { kind: "idle"; message: string }
  | { kind: "running"; message: string }
  | { kind: "failed"; message: string; passedChecks: number }
  | { kind: "passed"; message: string }
  | { kind: "error"; message: string };
const exerciseIds = JAVASCRIPT_DEBUGGING_DRILLS.map((exercise) => exercise.slug);

export function DebuggingLab({ completedExerciseIds = [] }: { completedExerciseIds?: string[] }) {
  const [drillIndex, setDrillIndex] = useState(() => getFirstIncompleteExerciseIndex(exerciseIds, completedExerciseIds));
  const drill = JAVASCRIPT_DEBUGGING_DRILLS[drillIndex] ?? null;
  const [source, setSource] = useState(drill?.starterCode ?? "");
  const [completedIds, setCompletedIds] = useState(() => new Set(completedExerciseIds));
  const [labState, setLabState] = useState<LabState>({
    kind: "idle",
    message: "Read the brief, inspect the code, then run all three checks.",
  });
  const completedCount = completedIds.size;
  const isLastDrill = completedCount === JAVASCRIPT_DEBUGGING_DRILLS.length;

  function updateSource(nextSource: string) {
    setSource(nextSource);
    setLabState({
      kind: "idle",
      message: "Your edit is local. Run the three checks when you’re ready.",
    });
  }

  async function runChecks() {
    if (!drill) return;
    setLabState({
      kind: "running",
      message: "Running three checks in an isolated browser worker…",
    });
    const result = await runCodingSolution(
      source,
      drill.tests.map((test) => test.input),
    );

    if (result.status !== "finished") {
      setLabState({ kind: "error", message: result.message });
      return;
    }

    const grade = gradeDebuggingDrill(drill, result.outputs);
    if (!grade.passed) {
      setLabState({
        kind: "failed",
        passedChecks: grade.passedChecks,
        message: `${grade.passedChecks} of ${grade.totalChecks} checks passed. Use the cue, then inspect the code again.`,
      });
      return;
    }

    const saveResponse = await saveJavaScriptLabExercise("debugging", drill.slug);
    if (!saveResponse?.ok) {
      setLabState({
        kind: "error",
        message: "The checks passed, but completion could not be saved. Run them again to retry.",
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
    const nextIndex = getNextIncompleteExerciseIndex(exerciseIds, [...completedIds], drillIndex);
    const nextDrill = JAVASCRIPT_DEBUGGING_DRILLS[nextIndex];
    setDrillIndex(nextIndex);
    setSource(nextDrill.starterCode);
    setLabState({
      kind: "idle",
      message: "Read the new brief, inspect the code, then run all three checks.",
    });
  }

  if (!drill) {
    return (
      <section className="debugging-result is-passed" aria-labelledby="debugging-complete-title">
        <div><span>Debugging lab complete</span><strong id="debugging-complete-title">All three saved repairs are complete.</strong></div>
        <Link href="/practice/sum-two-numbers">Start judged practice</Link>
      </section>
    );
  }

  return (
    <section className="debugging-workbench" aria-labelledby="debugging-workbench-title">
      <header className="debugging-workbench-heading">
        <div>
          <p className="eyebrow">Defect {drill.number} of {JAVASCRIPT_DEBUGGING_DRILLS.length}</p>
          <h2 id="debugging-workbench-title">{drill.title}</h2>
          <p>{drill.brief}</p>
        </div>
        <div className="debugging-progress" aria-label={`${completedCount} of ${JAVASCRIPT_DEBUGGING_DRILLS.length} defects repaired`}>
          <span>Repaired</span>
          <strong>{completedCount}/{JAVASCRIPT_DEBUGGING_DRILLS.length}</strong>
          <small>{drill.concept}</small>
        </div>
      </header>

      <div className="debugging-editor">
        <div className="debugging-editor-bar">
          <span>broken-solution.js</span>
          <span>Browser only</span>
        </div>
        <GuidedJavaScriptFileImport
          key={drill.slug}
          destinationName="broken-solution.js"
          disabled={labState.kind === "running"}
          onImport={(nextSource) => updateSource(nextSource)}
        />
        <label htmlFor="debugging-source">JavaScript source for {drill.title}</label>
        <textarea
          id="debugging-source"
          value={source}
          onChange={(event) => updateSource(event.target.value)}
          spellCheck={false}
        />
      </div>

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
            {isLastDrill ? (
              <Link href="/practice">Return to JavaScript practice</Link>
            ) : (
              <button type="button" onClick={openNextDrill}>
                Open next defect
              </button>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
