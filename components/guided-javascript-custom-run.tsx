"use client";

import { useState } from "react";
import { runCodingSolution } from "@/lib/coding-runner";

type CustomRunState =
  | { kind: "idle" }
  | { input: string; kind: "running"; source: string }
  | { input: string; kind: "finished"; output: string; source: string }
  | { input: string; kind: "error"; message: string; source: string };

type GuidedJavaScriptCustomRunProps = {
  code: string;
  inputDescription: string;
  sampleInput: string;
};

export function GuidedJavaScriptCustomRun({
  code,
  inputDescription,
  sampleInput,
}: GuidedJavaScriptCustomRunProps) {
  const [customInput, setCustomInput] = useState(sampleInput);
  const [runState, setRunState] = useState<CustomRunState>({ kind: "idle" });

  const resultIsCurrent =
    (runState.kind === "finished" || runState.kind === "error") &&
    runState.source === code &&
    runState.input === customInput;

  async function runCustomInput() {
    const input = customInput;
    const source = code;
    setRunState({ input, kind: "running", source });

    const result = await runCodingSolution(source, [input]);

    if (result.status !== "finished") {
      setRunState({ input, kind: "error", message: result.message, source });
      return;
    }

    setRunState({
      input,
      kind: "finished",
      output: result.outputs[0] ?? "",
      source,
    });
  }

  return (
    <details className="guided-custom-run">
      <summary>Try your own input</summary>
      <div className="guided-custom-run-body">
        <div>
          <label htmlFor="guided-custom-input">Your input</label>
          <span>{inputDescription}</span>
        </div>
        <textarea
          id="guided-custom-input"
          maxLength={2_000}
          onChange={(event) => setCustomInput(event.target.value)}
          rows={3}
          spellCheck={false}
          value={customInput}
        />
        <div className="guided-custom-run-actions">
          <p>
            This practice run stays in your browser and does not mark the
            exercise complete.
          </p>
          <button
            disabled={
              runState.kind === "running" || customInput.trim().length === 0
            }
            onClick={runCustomInput}
            type="button"
          >
            {runState.kind === "running" ? "Running input…" : "Run this input"}
          </button>
        </div>
        <div
          className="guided-custom-run-result"
          role="status"
          aria-live="polite"
        >
          {resultIsCurrent && runState.kind === "finished" ? (
            <>
              <span>Returned output</span>
              <pre>{runState.output || "No output returned."}</pre>
            </>
          ) : null}
          {resultIsCurrent && runState.kind === "error" ? (
            <>
              <span>Run stopped</span>
              <p>{runState.message}</p>
            </>
          ) : null}
          {!resultIsCurrent && runState.kind !== "running" ? (
            <p>Run your current solution with the input above.</p>
          ) : null}
          {runState.kind === "running" ? (
            <p>Running in the isolated browser worker…</p>
          ) : null}
        </div>
      </div>
    </details>
  );
}
