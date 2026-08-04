"use client";

import { useState } from "react";
import {
  type PlaygroundCheckResult,
  runPlaygroundChecks,
  runPlaygroundCode,
} from "@/lib/coding-runner";
import {
  MAX_PLAYGROUND_CHECKS,
  MAX_PLAYGROUND_CODE_LENGTH,
  validatePlaygroundChecks,
} from "@/lib/javascript-playground";

type JavaScriptPlaygroundProps = {
  initialCode: string;
  initialUpdatedAt: string | null;
};

type RunState =
  | { kind: "ready"; output: string[]; message: string }
  | { kind: "running"; output: string[]; message: string }
  | { kind: "finished"; output: string[]; message: string }
  | { kind: "error"; output: string[]; message: string };

type CheckState =
  | { kind: "ready"; checks: PlaygroundCheckResult[]; message: string }
  | { kind: "running"; checks: PlaygroundCheckResult[]; message: string }
  | { kind: "finished"; checks: PlaygroundCheckResult[]; message: string }
  | { kind: "error"; checks: PlaygroundCheckResult[]; message: string };

export function JavaScriptPlayground({
  initialCode,
  initialUpdatedAt,
}: JavaScriptPlaygroundProps) {
  const [code, setCode] = useState(initialCode);
  const [saveState, setSaveState] = useState<
    "saved" | "unsaved" | "saving" | "error"
  >(initialUpdatedAt ? "saved" : "unsaved");
  const [runState, setRunState] = useState<RunState>({
    kind: "ready",
    output: [],
    message: "Run playground.js to see console output here.",
  });
  const [checkSource, setCheckSource] = useState("");
  const [checkState, setCheckState] = useState<CheckState>({
    kind: "ready",
    checks: [],
    message: "Add one expression per line. Each check should return true.",
  });

  async function runCode() {
    setRunState({
      kind: "running",
      output: [],
      message: "Running in an isolated browser worker…",
    });
    const result = await runPlaygroundCode(code);

    if (result.status === "finished") {
      setRunState({
        kind: "finished",
        output: result.output,
        message:
          result.output.length > 0
            ? "Finished without an uncaught error."
            : "Finished. Add console.log() to print a result.",
      });
      return;
    }

    setRunState({
      kind: "error",
      output: result.output,
      message: result.message,
    });
  }

  async function saveFile() {
    setSaveState("saving");

    try {
      const response = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        setSaveState("error");
        return;
      }

      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  async function runChecks() {
    const validation = validatePlaygroundChecks(checkSource);

    if (!validation.valid) {
      setCheckState({ kind: "error", checks: [], message: validation.error });
      return;
    }

    setCheckState({
      kind: "running",
      checks: [],
      message: "Running quick checks in an isolated browser worker…",
    });
    const result = await runPlaygroundChecks(code, validation.checks);

    if (result.status === "finished") {
      const passed = result.checks.filter((check) => check.passed).length;
      setCheckState({
        kind: "finished",
        checks: result.checks,
        message: `${passed} of ${result.checks.length} checks passed.`,
      });
      return;
    }

    setCheckState({
      kind: "error",
      checks: result.checks,
      message: result.message,
    });
  }

  function updateCode(nextCode: string) {
    setCode(nextCode);
    setSaveState("unsaved");
  }

  return (
    <section className="playground-workbench" aria-labelledby="playground-editor-title">
      <header className="playground-filebar">
        <div>
          <span className="playground-file-dot" aria-hidden="true" />
          <strong id="playground-editor-title">playground.js</strong>
        </div>
        <span
          className={
            saveState === "saved"
              ? "playground-save-state is-saved"
              : saveState === "error"
                ? "playground-save-state is-error"
                : "playground-save-state"
          }
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {saveState === "saving"
            ? "Saving…"
            : saveState === "saved"
              ? "Saved to your account"
              : saveState === "error"
                ? "Save failed"
                : "Unsaved changes"}
        </span>
      </header>

      <div className="playground-editor">
        <label htmlFor="playground-code">JavaScript file</label>
        <textarea
          id="playground-code"
          aria-label="JavaScript file"
          value={code}
          onChange={(event) => updateCode(event.target.value)}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
              event.preventDefault();
              void runCode();
            }
          }}
          maxLength={MAX_PLAYGROUND_CODE_LENGTH}
          spellCheck={false}
        />
        <div className="playground-editor-meta">
          <span>
            {code.length.toLocaleString()}/{MAX_PLAYGROUND_CODE_LENGTH.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="playground-actions">
        <button
          className="playground-run"
          type="button"
          onClick={runCode}
          disabled={runState.kind === "running"}
        >
          <span aria-hidden="true">▶</span>
          {runState.kind === "running" ? "Running…" : "Run code"}
        </button>
        <span className="playground-run-hint">
          Keyboard: Ctrl/⌘ + Enter
        </span>
        <button
          className="playground-save"
          type="button"
          onClick={saveFile}
          disabled={saveState === "saving" || code.length === 0}
        >
          {saveState === "saving" ? "Saving file…" : "Save file"}
        </button>
      </div>

      <section className="playground-console" aria-labelledby="playground-console-title">
        <header>
          <div>
            <span className="console-status-dot" aria-hidden="true" />
            <strong id="playground-console-title">Console</strong>
          </div>
          <span>
            {runState.kind === "running"
              ? "Running"
              : runState.kind === "finished"
                ? "Finished"
                : runState.kind === "error"
                  ? "Stopped"
                  : "Ready"}
          </span>
        </header>
        <div
          className={
            runState.kind === "error"
              ? "playground-console-output is-error"
              : "playground-console-output"
          }
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {runState.output.length > 0 ? (
            <ol>
              {runState.output.map((line, index) => (
                <li key={`${line}-${index}`}>
                  <span aria-hidden="true">›</span>
                  <code>{line}</code>
                </li>
              ))}
            </ol>
          ) : null}
          <p>{runState.message}</p>
        </div>
      </section>

      <details className="playground-checks" open>
        <summary>
          <span>
            <strong>Quick checks</strong>
            <small>Test the behavior you expect before you save.</small>
          </span>
          <span>Up to {MAX_PLAYGROUND_CHECKS}</span>
        </summary>
        <div className="playground-checks-body">
          <div className="playground-checks-input">
            <label htmlFor="playground-check-source">Quick check expressions</label>
            <textarea
              id="playground-check-source"
              value={checkSource}
              onChange={(event) => setCheckSource(event.target.value)}
              placeholder={'double(4) === 8\nformatName("ada") === "Ada"'}
              spellCheck={false}
            />
            <p>
              One true-or-false JavaScript expression per line. Checks run
              locally and are not saved.
            </p>
            <button
              className="playground-checks-run"
              type="button"
              onClick={runChecks}
              disabled={checkState.kind === "running"}
            >
              {checkState.kind === "running"
                ? "Running checks…"
                : "Run quick checks"}
            </button>
          </div>
          <div
            className={
              checkState.kind === "error"
                ? "playground-check-results is-error"
                : "playground-check-results"
            }
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <strong>Check results</strong>
            <p>{checkState.message}</p>
            {checkState.checks.length > 0 ? (
              <ol>
                {checkState.checks.map((check, index) => (
                  <li
                    className={check.passed ? "is-passed" : "is-failed"}
                    key={`${check.expression}-${index}`}
                  >
                    <span>{check.passed ? "Passed" : "Needs work"}</span>
                    <code>{check.expression}</code>
                    {check.message ? <small>{check.message}</small> : null}
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        </div>
      </details>
    </section>
  );
}
