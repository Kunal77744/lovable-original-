"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PracticeFeedback } from "@/components/practice-feedback";
import { PracticeSolutionNote } from "@/components/practice-solution-note";
import { runCodingSolution } from "@/lib/coding-runner";
import {
  MAX_CODING_TEST_CASES,
  type CodingTestCase,
  validateCodingTestCases,
} from "@/lib/coding-test-cases";
import { normalizeCodingOutput } from "@/lib/coding-problems";
import { getCodingSolutionReview } from "@/lib/coding-solution-review";
import {
  captureJavaScriptPracticeCompleted,
  capturePracticeProblemAccepted,
} from "@/lib/product-analytics";
import type { CodingProblemAttempt } from "@/db/coding-practice";
import type { SavedPracticeFeedback } from "@/lib/practice-feedback";
import type { SavedPracticeSolutionNote } from "@/lib/practice-solution-note";

type CodingWorkspaceProps = {
  attempts: CodingProblemAttempt[];
  bestVerdict: string | null;
  initialCode: string;
  initialAcceptedCode?: string | null;
  initialCustomTestCases?: CodingTestCase[];
  initialPracticeFeedback: SavedPracticeFeedback | null;
  initialSolutionNote?: SavedPracticeSolutionNote | null;
  isSignedIn: boolean;
  isPracticeFeedbackEligible: boolean;
  isReviewSession?: boolean;
  loadedSubmission?: {
    createdAt: string;
    verdict: string;
    passedTests: number;
    totalTests: number;
  } | null;
  problem: {
    slug: string;
    title: string;
    recoveryHint: string;
    recoveryHints: [string, string];
    acceptedExplanation: {
      concept: string;
      whyItWorks: string;
      commonMistake: string;
    };
    starterCode: string;
    tests: { input: string }[];
    example: {
      input: string;
      expectedOutput: string;
    };
  };
};

type SubmissionResponse = {
  id: string;
  verdict: "Accepted" | "Wrong Answer";
  bestVerdict: "Accepted" | "Wrong Answer";
  passedTests: number;
  totalTests: number;
  completedCount: number;
  totalCount: number;
  nextProblemSlug: string | null;
  createdAt: string;
  hasSource: boolean;
  isFirstAcceptedResult: boolean;
  error?: string;
};

type RunState =
  | { kind: "idle"; message: string }
  | { kind: "running"; message: string }
  | {
      kind: "sample";
      message: string;
      output: string;
      debugOutput: string[];
      passed: boolean;
    }
  | { kind: "custom"; message: string; output: string }
  | {
      kind: "test-suite";
      message: string;
      results: {
        input: string;
        output: string;
        expectedOutput: string | null;
        passed: boolean | null;
      }[];
      debugOutput: string[];
    }
  | {
      kind: "verdict";
      message: string;
      verdict: "Accepted" | "Wrong Answer";
      passedTests: number;
      totalTests: number;
      completedCount: number;
      totalCount: number;
      nextProblemSlug: string | null;
    }
  | { kind: "timeout"; message: string }
  | { kind: "error"; message: string; debugOutput?: string[] };

export function CodingWorkspace({
  attempts: initialAttempts,
  bestVerdict: initialBestVerdict,
  initialCode,
  initialAcceptedCode = null,
  initialCustomTestCases = [],
  initialPracticeFeedback,
  initialSolutionNote = null,
  isSignedIn,
  isPracticeFeedbackEligible,
  isReviewSession = false,
  loadedSubmission = null,
  problem,
}: CodingWorkspaceProps) {
  const [code, setCode] = useState(initialCode);
  const [acceptedCode, setAcceptedCode] = useState(initialAcceptedCode);
  const [attempts, setAttempts] = useState(initialAttempts);
  const [bestVerdict, setBestVerdict] = useState(initialBestVerdict);
  const [showPracticeFeedback, setShowPracticeFeedback] = useState(
    isPracticeFeedbackEligible,
  );
  const [isRestoreConfirmationOpen, setIsRestoreConfirmationOpen] =
    useState(false);
  const [customInput, setCustomInput] = useState(problem.example.input);
  const [customTestCases, setCustomTestCases] = useState(
    initialCustomTestCases,
  );
  const [testCaseSaveState, setTestCaseSaveState] = useState<
    "saved" | "unsaved" | "saving" | "error"
  >("saved");
  const [testCaseMessage, setTestCaseMessage] = useState(
    initialCustomTestCases.length > 0
      ? `${initialCustomTestCases.length} private test ${initialCustomTestCases.length === 1 ? "case" : "cases"} restored.`
      : "Save up to six inputs privately for your next session.",
  );
  const [saveState, setSaveState] = useState<
    "saved" | "unsaved" | "saving" | "error"
  >(
    loadedSubmission
      ? "unsaved"
      : isSignedIn && initialAttempts.length > 0
        ? "saved"
        : "unsaved",
  );
  const [runState, setRunState] = useState<RunState>({
    kind: "idle",
    message: loadedSubmission
      ? "A past submission is loaded as an unsaved copy. Loading it did not change your saved work."
      : isSignedIn
        ? initialBestVerdict === "Accepted"
          ? "Accepted solution restored from your account."
          : "Run the example, then submit against all four checks."
        : "You can run the example now. Sign in to submit and save progress.",
  });
  const [revealedRecoveryHintCount, setRevealedRecoveryHintCount] =
    useState(0);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showAcceptedExplanation =
    (runState.kind === "verdict" && runState.verdict === "Accepted") ||
    (runState.kind === "idle" && initialBestVerdict === "Accepted");
  const acceptedReview =
    isSignedIn && acceptedCode
      ? getCodingSolutionReview(problem.slug, acceptedCode)
      : null;

  useEffect(() => {
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, []);

  async function saveDraft(nextCode: string) {
    if (!isSignedIn) return;

    setSaveState("saving");
    try {
      const response = await fetch(`/api/practice/${problem.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "draft", code: nextCode }),
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

  function updateCode(nextCode: string) {
    setCode(nextCode);
    setSaveState("unsaved");

    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      void saveDraft(nextCode);
    }, 700);
  }

  function restoreStarter() {
    if (draftTimer.current) {
      clearTimeout(draftTimer.current);
      draftTimer.current = null;
    }

    setCode(problem.starterCode);
    setSaveState("unsaved");
    setIsRestoreConfirmationOpen(false);
    setRunState({
      kind: "idle",
      message:
        "Clean starter restored in the editor. Your saved code and attempts have not changed.",
    });
  }

  async function runExample() {
    setRunState({ kind: "running", message: "Running the example in your browser…" });
    const result = await runCodingSolution(code, [problem.example.input]);

    if (result.status === "timeout") {
      setRunState({ kind: "timeout", message: result.message });
      return;
    }

    if (result.status !== "finished") {
      setRunState({
        kind: "error",
        message: result.message,
        debugOutput: result.debugOutput,
      });
      return;
    }

    const output = result.outputs[0] ?? "";
    const passed = output.trim() === problem.example.expectedOutput.trim();
    setRunState({
      kind: "sample",
      output,
      debugOutput: result.debugOutput,
      passed,
      message: passed
        ? "Example passed. Submit when you’re ready for all four checks."
        : "The example output doesn’t match yet.",
    });
  }

  async function runCustomInput() {
    setRunState({
      kind: "running",
      message: "Running your custom input in the browser…",
    });
    const result = await runCodingSolution(code, [customInput]);

    if (result.status === "timeout") {
      setRunState({ kind: "timeout", message: result.message });
      return;
    }

    if (result.status !== "finished") {
      setRunState({ kind: "error", message: result.message });
      return;
    }

    setRunState({
      kind: "custom",
      output: result.outputs[0] ?? "",
      message: "Custom input finished. Review the output before you submit.",
    });
  }

  async function runPrivateTestSuite() {
    if (customTestCases.length === 0) return;

    setRunState({
      kind: "running",
      message: `Running ${customTestCases.length} private test ${customTestCases.length === 1 ? "case" : "cases"} in your browser…`,
    });
    const result = await runCodingSolution(
      code,
      customTestCases.map((testCase) => testCase.input),
    );

    if (result.status === "timeout") {
      setRunState({ kind: "timeout", message: result.message });
      return;
    }

    if (result.status !== "finished") {
      setRunState({
        kind: "error",
        message: result.message,
        debugOutput: result.debugOutput,
      });
      return;
    }

    const results = customTestCases.map((testCase, index) => {
      const output = result.outputs[index] ?? "";
      return {
        ...testCase,
        output,
        passed:
          testCase.expectedOutput === null
            ? null
            : normalizeCodingOutput(output) ===
              normalizeCodingOutput(testCase.expectedOutput),
      };
    });
    const checkedResults = results.filter((testCase) => testCase.passed !== null);
    const passedResults = checkedResults.filter((testCase) => testCase.passed);
    const uncheckedCount = results.length - checkedResults.length;

    setRunState({
      kind: "test-suite",
      results,
      debugOutput: result.debugOutput,
      message:
        checkedResults.length === 0
          ? `${customTestCases.length} private test ${customTestCases.length === 1 ? "case" : "cases"} finished locally. Add expected outputs to check them automatically.`
          : `${passedResults.length} of ${checkedResults.length} expected ${checkedResults.length === 1 ? "output" : "outputs"} matched.${uncheckedCount > 0 ? ` ${uncheckedCount} ${uncheckedCount === 1 ? "case ran" : "cases ran"} without an expectation.` : ""}`,
    });
  }

  async function persistCustomTestCases(nextCases: CodingTestCase[]) {
    if (!isSignedIn) return false;

    const validation = validateCodingTestCases(nextCases);

    if (!validation.valid) {
      setTestCaseSaveState("error");
      setTestCaseMessage(validation.error);
      return false;
    }

    setTestCaseSaveState("saving");
    setTestCaseMessage("Saving private test cases…");

    try {
      const response = await fetch(
        `/api/practice/${problem.slug}/test-cases`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cases: validation.cases }),
        },
      );
      const payload = (await response.json()) as {
        testCases?: { cases: CodingTestCase[] };
        error?: string;
      };

      if (!response.ok || !payload.testCases) {
        setTestCaseSaveState("error");
        setTestCaseMessage(
          payload.error ?? "Your test cases could not be saved. Try again.",
        );
        return false;
      }

      setCustomTestCases(payload.testCases.cases);
      setTestCaseSaveState("saved");
      setTestCaseMessage(
        payload.testCases.cases.length === 0
          ? "All private test cases removed."
          : `${payload.testCases.cases.length} private test ${payload.testCases.cases.length === 1 ? "case" : "cases"} saved.`,
      );
      return true;
    } catch {
      setTestCaseSaveState("error");
      setTestCaseMessage(
        "Your test cases could not be saved. Check your connection and try again.",
      );
      return false;
    }
  }

  async function saveCurrentCustomInput() {
    if (customTestCases.some((testCase) => testCase.input === customInput)) {
      setTestCaseSaveState("error");
      setTestCaseMessage("That exact input is already saved.");
      return;
    }

    await persistCustomTestCases([
      ...customTestCases,
      { input: customInput, expectedOutput: null },
    ]);
  }

  function updateCustomTestCase(index: number, input: string) {
    setCustomTestCases((current) =>
      current.map((testCase, savedIndex) =>
        savedIndex === index ? { ...testCase, input } : testCase,
      ),
    );
    setTestCaseSaveState("unsaved");
    setTestCaseMessage("Test case changes are not saved yet.");
  }

  function updateExpectedOutput(index: number, expectedOutput: string | null) {
    setCustomTestCases((current) =>
      current.map((testCase, savedIndex) =>
        savedIndex === index ? { ...testCase, expectedOutput } : testCase,
      ),
    );
    setTestCaseSaveState("unsaved");
    setTestCaseMessage("Test case changes are not saved yet.");
  }

  async function removeCustomTestCase(index: number) {
    await persistCustomTestCases(
      customTestCases.filter((_, savedIndex) => savedIndex !== index),
    );
  }

  async function submitSolution() {
    if (!isSignedIn) return;

    setRevealedRecoveryHintCount(0);
    setRunState({
      kind: "running",
      message: "Running four deterministic checks in your browser…",
    });
    const result = await runCodingSolution(
      code,
      problem.tests.map((test) => test.input),
    );

    if (result.status === "timeout") {
      setRunState({ kind: "timeout", message: result.message });
      return;
    }

    if (result.status !== "finished") {
      setRunState({ kind: "error", message: result.message });
      return;
    }

    try {
      const response = await fetch(`/api/practice/${problem.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "submit",
          code,
          outputs: result.outputs,
        }),
      });
      const payload = (await response.json()) as SubmissionResponse;

      if (!response.ok) {
        setRunState({
          kind: "error",
          message: payload.error ?? "The result could not be saved. Try again.",
        });
        return;
      }

      setBestVerdict(payload.bestVerdict);
      if (payload.verdict === "Accepted") setAcceptedCode(code);
      setSaveState("saved");
      setAttempts((current) => [
        {
          id: payload.id,
          verdict: payload.verdict,
          passedTests: payload.passedTests,
          totalTests: payload.totalTests,
          createdAt: payload.createdAt,
          hasSource: payload.hasSource,
        },
        ...current,
      ].slice(0, 8));
      setRunState({
        kind: "verdict",
        verdict: payload.verdict,
        passedTests: payload.passedTests,
        totalTests: payload.totalTests,
        completedCount: payload.completedCount,
        totalCount: payload.totalCount,
        nextProblemSlug: payload.nextProblemSlug,
        message:
          payload.verdict === "Accepted"
            ? `${problem.title} is complete. Your code and result are saved.`
            : `${payload.passedTests} of ${payload.totalTests} checks passed. Your attempt is saved.`,
      });

      if (
        payload.verdict === "Accepted" &&
        payload.isFirstAcceptedResult
      ) {
        capturePracticeProblemAccepted({
          problemSlug: problem.slug,
          passedCheckCount: payload.passedTests,
        });
      }

      if (
        payload.verdict === "Accepted" &&
        payload.isFirstAcceptedResult &&
        payload.completedCount === payload.totalCount
      ) {
        captureJavaScriptPracticeCompleted({
          pathSlug: "beginner-javascript",
          completionState: "completed",
        });
      }

      if (
        payload.verdict === "Accepted" &&
        payload.isFirstAcceptedResult &&
        payload.completedCount === 1
      ) {
        setShowPracticeFeedback(true);
      }
    } catch {
      setRunState({
        kind: "error",
        message: "The result could not be saved. Check your connection and try again.",
      });
    }
  }

  const visibleDebugOutput =
    runState.kind === "sample" ||
    runState.kind === "test-suite" ||
    runState.kind === "error"
      ? (runState.debugOutput ?? [])
      : [];

  return (
    <section className="coding-workspace" aria-labelledby="workspace-title">
      <header className="coding-workspace-heading">
        <div>
          <p className="quiz-kicker">Browser-isolated runner</p>
          <h2 id="workspace-title">Write your solution.</h2>
          <p>
            Define <code>solve(input)</code> and return the exact output. Network
            access is blocked and the runner stops after 1,000 ms. Run the
            example to inspect local <code>console.log</code> output.
          </p>
        </div>
        <div className={bestVerdict === "Accepted" ? "best-verdict is-accepted" : "best-verdict"}>
          <span>Best verdict</span>
          <strong>{bestVerdict ?? "Not submitted"}</strong>
        </div>
      </header>

      <div className="code-editor">
        <div className="code-editor-bar">
          <span>solution.js</span>
          <span>
            {isSignedIn
              ? saveState === "saving"
                ? "Saving…"
                : saveState === "saved"
                  ? "Saved"
                  : saveState === "error"
                    ? "Save failed"
                    : "Unsaved"
              : "Local only"}
          </span>
        </div>
        {loadedSubmission ? (
          <div className="loaded-submission-cue" role="status">
            <div>
              <span>Past submission loaded</span>
              <strong>
                {loadedSubmission.verdict} · {loadedSubmission.passedTests}/
                {loadedSubmission.totalTests} checks
              </strong>
              <small>
                Submitted{" "}
                {new Intl.DateTimeFormat("en", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  timeZone: "UTC",
                }).format(new Date(loadedSubmission.createdAt))}
              </small>
            </div>
            <p>
              This is an unsaved editor copy. Run it safely, or edit and submit
              when ready. Your saved code and learning record were not changed
              by loading it.
            </p>
            <Link href={`/practice/${problem.slug}`}>Restore saved editor</Link>
          </div>
        ) : null}
        <label htmlFor="coding-solution">JavaScript solution</label>
        <textarea
          id="coding-solution"
          aria-label="JavaScript solution"
          value={code}
          onChange={(event) => updateCode(event.target.value)}
          spellCheck={false}
        />
        {isSignedIn ? (
          <div className="starter-restore">
            {isRestoreConfirmationOpen ? (
              <div
                className="starter-restore-confirmation"
                role="group"
                aria-labelledby="starter-restore-title"
              >
                <div>
                  <strong id="starter-restore-title">Restore the clean starter?</strong>
                  <p>
                    This replaces only the editor. Your saved code and attempts stay
                    unchanged until you edit or submit again.
                  </p>
                </div>
                <div>
                  <button
                    className="starter-restore-cancel"
                    type="button"
                    onClick={() => setIsRestoreConfirmationOpen(false)}
                  >
                    Keep my code
                  </button>
                  <button
                    className="starter-restore-confirm"
                    type="button"
                    onClick={restoreStarter}
                  >
                    Restore starter
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="starter-restore-trigger"
                type="button"
                onClick={() => {
                  setIsRestoreConfirmationOpen(true);
                }}
                disabled={code === problem.starterCode}
              >
                {code === problem.starterCode
                  ? "Clean starter loaded"
                  : "Restore clean starter"}
              </button>
            )}
          </div>
        ) : null}
      </div>

      <div className="coding-actions">
        <span
          className="coding-keyboard-hint"
          id="run-example-keyboard-hint"
        >
          Keyboard: Tab to Run, then Enter
        </span>
        <button
          className="secondary-code-action"
          type="button"
          onClick={runExample}
          disabled={runState.kind === "running"}
          aria-describedby="run-example-keyboard-hint"
        >
          Run example
        </button>
        {isSignedIn ? (
          <button
            className="submit-code-action"
            type="button"
            onClick={submitSolution}
            disabled={runState.kind === "running"}
          >
            {runState.kind === "running" ? "Running checks…" : "Submit solution"}
          </button>
        ) : (
          <Link
            className="submit-code-action"
            href="/account?mode=signin"
          >
            Sign in to submit
          </Link>
        )}
      </div>

      <details className="custom-test-runner">
        <summary>
          <span>Try your own input</span>
          <small>Runs locally without adding a saved attempt</small>
        </summary>
        <div className="custom-test-fields">
          <label htmlFor="custom-test-input">Custom input</label>
          <textarea
            id="custom-test-input"
            value={customInput}
            onChange={(event) => setCustomInput(event.target.value)}
            spellCheck={false}
          />
          <div className="custom-test-actions">
            <button
              className="custom-test-action"
              type="button"
              onClick={runCustomInput}
              disabled={runState.kind === "running"}
            >
              {runState.kind === "running" ? "Running…" : "Run custom input"}
            </button>
            {isSignedIn ? (
              <button
                className="custom-test-save-action"
                type="button"
                onClick={() => void saveCurrentCustomInput()}
                disabled={
                  testCaseSaveState === "saving" ||
                  customInput.trim().length === 0 ||
                  customTestCases.length >= MAX_CODING_TEST_CASES
                }
              >
                {testCaseSaveState === "saving" ? "Saving…" : "Save test case"}
              </button>
            ) : null}
          </div>
        </div>
        {isSignedIn ? (
          <div className="private-test-cases">
            <div className="private-test-cases-heading">
              <div>
                <h3>Private test cases</h3>
                <p>Inputs save only to your account. Local runs never add attempts.</p>
              </div>
              <span>
                {customTestCases.length}/{MAX_CODING_TEST_CASES}
              </span>
            </div>
            {customTestCases.length > 0 ? (
              <>
                <button
                  className="private-test-suite-run"
                  type="button"
                  onClick={runPrivateTestSuite}
                  disabled={runState.kind === "running"}
                >
                  {runState.kind === "running"
                    ? "Running test suite…"
                    : `Run all ${customTestCases.length} ${customTestCases.length === 1 ? "case" : "cases"}`}
                </button>
                <div className="private-test-case-list">
                  {customTestCases.map((testCase, index) => (
                    <div className="private-test-case" key={index}>
                      <div className="private-test-case-input">
                        <label htmlFor={`saved-test-case-${index}`}>
                          Test case {index + 1} input
                        </label>
                        <textarea
                          id={`saved-test-case-${index}`}
                          value={testCase.input}
                          onChange={(event) =>
                            updateCustomTestCase(index, event.target.value)
                          }
                          spellCheck={false}
                        />
                      </div>
                      <div className="private-test-case-expectation">
                        <label>
                          <input
                            type="checkbox"
                            checked={testCase.expectedOutput !== null}
                            onChange={(event) =>
                              updateExpectedOutput(
                                index,
                                event.target.checked ? "" : null,
                              )
                            }
                          />
                          Check expected output
                        </label>
                        {testCase.expectedOutput !== null ? (
                          <>
                            <label htmlFor={`saved-test-output-${index}`}>
                              Expected output
                            </label>
                            <textarea
                              id={`saved-test-output-${index}`}
                              value={testCase.expectedOutput}
                              onChange={(event) =>
                                updateExpectedOutput(index, event.target.value)
                              }
                              placeholder="Empty is a valid expected output"
                              spellCheck={false}
                            />
                          </>
                        ) : (
                          <p>Run this input without an automatic check.</p>
                        )}
                      </div>
                      <div className="private-test-case-actions">
                        <button
                          type="button"
                          onClick={() => setCustomInput(testCase.input)}
                        >
                          Use input
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeCustomTestCase(index)}
                          disabled={testCaseSaveState === "saving"}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="private-test-cases-empty">
                No saved cases yet. Try an input above, then save it here.
              </p>
            )}
            {testCaseSaveState === "unsaved" ? (
              <button
                className="private-test-cases-save"
                type="button"
                onClick={() => void persistCustomTestCases(customTestCases)}
              >
                Save changes
              </button>
            ) : null}
            <p
              className={`private-test-cases-status is-${testCaseSaveState}`}
              aria-live="polite"
            >
              {testCaseMessage}
            </p>
          </div>
        ) : null}
      </details>

      <div
        className={`coding-result is-${runState.kind}${
          runState.kind === "verdict"
            ? runState.verdict === "Accepted"
              ? " is-accepted"
              : " is-wrong"
            : runState.kind === "sample" && runState.passed
              ? " is-accepted"
              : runState.kind === "idle" &&
                  initialBestVerdict === "Accepted"
                ? " is-accepted"
              : ""
        }`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div>
          <span>
            {runState.kind === "verdict"
              ? runState.verdict
              : runState.kind === "sample"
                ? runState.passed
                  ? "Example passed"
                  : "Example differs"
                : runState.kind === "custom"
                  ? "Custom run"
                  : runState.kind === "test-suite"
                    ? "Private test suite"
                    : runState.kind === "error"
                      ? "Runner stopped"
                      : runState.kind === "timeout"
                        ? "Time limit exceeded"
                        : runState.kind === "running"
                          ? "Judging"
                          : initialBestVerdict === "Accepted"
                            ? "Accepted"
                            : "Ready"}
          </span>
          {runState.kind === "verdict" ? (
            <strong>
              {runState.passedTests}/{runState.totalTests} checks
            </strong>
          ) : null}
        </div>
        <p>{runState.message}</p>
        {runState.kind === "sample" || runState.kind === "custom" ? (
          <div className="sample-output">
            <span>Your output</span>
            <pre>{runState.output || "(empty)"}</pre>
          </div>
        ) : null}
        {runState.kind === "test-suite" ? (
          <ol
            className="private-test-suite-results"
            aria-label="Private test suite outputs"
          >
            {runState.results.map((result, index) => (
              <li key={`${index}-${result.input}`}>
                <span>Case {index + 1}</span>
                <div>
                  <p>Input</p>
                  <pre>{result.input}</pre>
                </div>
                <div>
                  <p>Output</p>
                  <pre>{result.output || "(empty)"}</pre>
                </div>
                <div className={`private-test-suite-check is-${result.passed === null ? "unchecked" : result.passed ? "matched" : "mismatch"}`}>
                  <p>Expected</p>
                  <pre>
                    {result.expectedOutput === null
                      ? "Not checked"
                      : result.expectedOutput || "(empty)"}
                  </pre>
                  <span>
                    {result.passed === null
                      ? "No expectation"
                      : result.passed
                        ? "Matched"
                        : "Mismatch"}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        ) : null}
        {visibleDebugOutput.length > 0 ? (
          <div className="debug-output">
            <span>Debug console · local only</span>
            <pre>{visibleDebugOutput.join("\n")}</pre>
          </div>
        ) : null}
        {runState.kind === "verdict" && runState.verdict === "Accepted" ? (
          <div
            className={`accepted-continuation${
              isReviewSession ? " is-review-session" : ""
            }`}
          >
            <p className="accepted-progress">
              Practice progress · {runState.completedCount}/{runState.totalCount} accepted
            </p>
            <div className="accepted-actions">
              {isReviewSession ? (
                <Link
                  className="accepted-next-action"
                  href="/practice/review"
                >
                  Return to refreshed review
                </Link>
              ) : null}
              <Link
                className={
                  isReviewSession
                    ? "accepted-secondary-action"
                    : "accepted-next-action"
                }
                href={
                  runState.nextProblemSlug
                    ? `/practice/${runState.nextProblemSlug}`
                    : "/practice"
                }
              >
                {runState.nextProblemSlug
                  ? "Continue to next unfinished step"
                  : "View completed path"}
              </Link>
            </div>
          </div>
        ) : null}
        {runState.kind === "verdict" &&
        runState.verdict === "Wrong Answer" ? (
          <div className="wrong-answer-hint">
            <span>Try this next</span>
            <p>{problem.recoveryHint}</p>
            {revealedRecoveryHintCount > 0 ? (
              <ol
                className="recovery-hint-ladder"
                aria-label="Additional recovery hints"
              >
                {problem.recoveryHints
                  .slice(0, revealedRecoveryHintCount)
                  .map((hint, index) => (
                    <li key={hint}>
                      <span>Hint {index + 2}</span>
                      <p>{hint}</p>
                    </li>
                  ))}
              </ol>
            ) : null}
            {revealedRecoveryHintCount < problem.recoveryHints.length ? (
              <button
                className="recovery-hint-reveal"
                type="button"
                onClick={() =>
                  setRevealedRecoveryHintCount((count) =>
                    Math.min(count + 1, problem.recoveryHints.length),
                  )
                }
              >
                {revealedRecoveryHintCount === 0
                  ? "Show another hint"
                  : "Show final hint"}
              </button>
            ) : (
              <p className="recovery-hint-complete">
                All hints shown. Return to your code and try one change at a
                time.
              </p>
            )}
          </div>
        ) : null}
        {showAcceptedExplanation ? (
          <section
            className="accepted-explanation"
            aria-labelledby={`accepted-explanation-${problem.slug}`}
          >
            <div>
              <span>Concept unlocked</span>
              <h3 id={`accepted-explanation-${problem.slug}`}>
                {problem.acceptedExplanation.concept}
              </h3>
            </div>
            <p>{problem.acceptedExplanation.whyItWorks}</p>
            <div className="accepted-mistake">
              <span>Common mistake</span>
              <p>{problem.acceptedExplanation.commonMistake}</p>
            </div>
          </section>
        ) : null}
        {acceptedReview ? (
          <section
            className="accepted-code-review"
            aria-labelledby={`accepted-code-review-${problem.slug}`}
          >
            <header>
              <div>
                <span>Private code review</span>
                <h3 id={`accepted-code-review-${problem.slug}`}>
                  What your Accepted source already shows
                </h3>
              </div>
              <span className="accepted-code-review-badge">Only you</span>
            </header>
            <ol>
              {acceptedReview.points.map((point, index) => (
                <li className={`is-${point.kind}`} key={point.label}>
                  <span aria-hidden="true">{index + 1}</span>
                  <div>
                    <strong>{point.label}</strong>
                    <p>{point.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="accepted-code-review-note">
              Built from your most recent Accepted source. No new attempt or
              learner record was created.
            </p>
          </section>
        ) : null}
        <div className="practice-recovery-cue">
          <span aria-hidden="true" />
          <p>
            {isSignedIn
              ? "Your saved code, attempts, and Accepted progress return after sign-in."
              : "Sign in to save this work. Your code, attempts, and Accepted progress return with your account."}
          </p>
        </div>
      </div>

      {isSignedIn ? (
        <PracticeSolutionNote
          problemSlug={problem.slug}
          initialNote={initialSolutionNote}
          isAccepted={bestVerdict === "Accepted"}
        />
      ) : null}

      {showPracticeFeedback ? (
        <PracticeFeedback
          problemSlug={problem.slug}
          initialFeedback={initialPracticeFeedback}
        />
      ) : null}

      <section className="attempt-history" aria-labelledby="attempt-history-title">
        <div>
          <p className="quiz-kicker">Saved attempts</p>
          <h3 id="attempt-history-title">Verdict history</h3>
        </div>
        {attempts.length > 0 ? (
          <ol>
            {attempts.map((attempt, index) => (
              <li key={attempt.id}>
                <span>#{attempts.length - index}</span>
                <strong
                  className={
                    attempt.verdict === "Accepted"
                      ? "attempt-accepted"
                      : "attempt-wrong"
                  }
                >
                  {attempt.verdict}
                </strong>
                <span>
                  {attempt.passedTests}/{attempt.totalTests} checks
                </span>
                <time dateTime={attempt.createdAt}>
                  {new Intl.DateTimeFormat("en", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(attempt.createdAt))}
                </time>
                {attempt.hasSource ? (
                  <Link
                    className="attempt-source-link"
                    href={`/submissions/${attempt.id}`}
                    aria-label={`Review source for attempt ${attempts.length - index}`}
                  >
                    Review source <span aria-hidden="true">→</span>
                  </Link>
                ) : (
                  <span className="attempt-source-state">Result only</span>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="attempt-history-empty">
            No saved submissions yet. Your first verdict will appear here.
          </p>
        )}
      </section>
    </section>
  );
}
