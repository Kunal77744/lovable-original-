"use client";

import Link from "next/link";
import { useState } from "react";
import { runCodingSolution } from "@/lib/coding-runner";
import {
  gradeDebuggingDrill,
  JAVASCRIPT_DEBUGGING_DRILLS,
} from "@/lib/debugging-lab";

type LabState =
  | { kind: "idle"; message: string }
  | { kind: "running"; message: string }
  | { kind: "failed"; message: string; passedChecks: number }
  | { kind: "passed"; message: string }
  | { kind: "error"; message: string };

export function DebuggingLab() {
  const [drillIndex, setDrillIndex] = useState(0);
  const drill = JAVASCRIPT_DEBUGGING_DRILLS[drillIndex];
  const [source, setSource] = useState(drill.starterCode);
  const [completedCount, setCompletedCount] = useState(0);
  const [labState, setLabState] = useState<LabState>({
    kind: "idle",
    message: "Read the brief, inspect the code, then run all three checks.",
  });
  const isLastDrill = drillIndex === JAVASCRIPT_DEBUGGING_DRILLS.length - 1;

  function updateSource(nextSource: string) {
    setSource(nextSource);
    setLabState({
      kind: "idle",
      message: "Your edit is local. Run the three checks when you’re ready.",
    });
  }

  async function runChecks() {
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

    setCompletedCount((current) => Math.max(current, drillIndex + 1));
    setLabState({
      kind: "passed",
      message: `All ${grade.totalChecks} checks passed. You found the defect.`,
    });
  }

  function openNextDrill() {
    const nextIndex = drillIndex + 1;
    const nextDrill = JAVASCRIPT_DEBUGGING_DRILLS[nextIndex];
    setDrillIndex(nextIndex);
    setSource(nextDrill.starterCode);
    setLabState({
      kind: "idle",
      message: "Read the new brief, inspect the code, then run all three checks.",
    });
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
