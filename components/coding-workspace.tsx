"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PracticeFeedback } from "@/components/practice-feedback";
import { runCodingSolution } from "@/lib/coding-runner";
import {
  captureJavaScriptPracticeCompleted,
  capturePracticeProblemAccepted,
} from "@/lib/product-analytics";
import type { CodingAttempt } from "@/db/coding-practice";
import type { SavedPracticeFeedback } from "@/lib/practice-feedback";

type CodingWorkspaceProps = {
  attempts: CodingAttempt[];
  bestVerdict: string | null;
  initialCode: string;
  initialPracticeFeedback: SavedPracticeFeedback | null;
  isSignedIn: boolean;
  isPracticeFeedbackEligible: boolean;
  problem: {
    slug: string;
    title: string;
    recoveryHint: string;
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
  isFirstAcceptedResult: boolean;
  error?: string;
};

type RunState =
  | { kind: "idle"; message: string }
  | { kind: "running"; message: string }
  | { kind: "sample"; message: string; output: string; passed: boolean }
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
  | { kind: "error"; message: string };

export function CodingWorkspace({
  attempts: initialAttempts,
  bestVerdict: initialBestVerdict,
  initialCode,
  initialPracticeFeedback,
  isSignedIn,
  isPracticeFeedbackEligible,
  problem,
}: CodingWorkspaceProps) {
  const [code, setCode] = useState(initialCode);
  const [attempts, setAttempts] = useState(initialAttempts);
  const [bestVerdict, setBestVerdict] = useState(initialBestVerdict);
  const [showPracticeFeedback, setShowPracticeFeedback] = useState(
    isPracticeFeedbackEligible,
  );
  const [isRestoreConfirmationOpen, setIsRestoreConfirmationOpen] =
    useState(false);
  const [saveState, setSaveState] = useState<
    "saved" | "unsaved" | "saving" | "error"
  >(isSignedIn && initialAttempts.length > 0 ? "saved" : "unsaved");
  const [runState, setRunState] = useState<RunState>({
    kind: "idle",
    message: isSignedIn
      ? initialBestVerdict === "Accepted"
        ? "Accepted solution restored from your account."
        : "Run the example, then submit against all four checks."
      : "You can run the example now. Sign in to submit and save progress.",
  });
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showAcceptedExplanation =
    (runState.kind === "verdict" && runState.verdict === "Accepted") ||
    (runState.kind === "idle" && initialBestVerdict === "Accepted");

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
      setRunState({ kind: "error", message: result.message });
      return;
    }

    const output = result.outputs[0] ?? "";
    const passed = output.trim() === problem.example.expectedOutput.trim();
    setRunState({
      kind: "sample",
      output,
      passed,
      message: passed
        ? "Example passed. Submit when you’re ready for all four checks."
        : "The example output doesn’t match yet.",
    });
  }

  async function submitSolution() {
    if (!isSignedIn) return;

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
      setSaveState("saved");
      setAttempts((current) => [
        {
          id: payload.id,
          verdict: payload.verdict,
          passedTests: payload.passedTests,
          totalTests: payload.totalTests,
          createdAt: payload.createdAt,
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

  return (
    <section className="coding-workspace" aria-labelledby="workspace-title">
      <header className="coding-workspace-heading">
        <div>
          <p className="quiz-kicker">Browser-isolated runner</p>
          <h2 id="workspace-title">Write your solution.</h2>
          <p>
            Define <code>solve(input)</code> and return the exact output. Network
            access is blocked and the runner stops after 1,000 ms.
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
        {runState.kind === "sample" ? (
          <div className="sample-output">
            <span>Your output</span>
            <pre>{runState.output || "(empty)"}</pre>
          </div>
        ) : null}
        {runState.kind === "verdict" && runState.verdict === "Accepted" ? (
          <div className="accepted-continuation">
            <p className="accepted-progress">
              Practice progress · {runState.completedCount}/{runState.totalCount} accepted
            </p>
            <Link
              className="accepted-next-action"
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
        ) : null}
        {runState.kind === "verdict" &&
        runState.verdict === "Wrong Answer" ? (
          <div className="wrong-answer-hint">
            <span>Try this next</span>
            <p>{problem.recoveryHint}</p>
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
        <div className="practice-recovery-cue">
          <span aria-hidden="true" />
          <p>
            {isSignedIn
              ? "Your saved code, attempts, and Accepted progress return after sign-in."
              : "Sign in to save this work. Your code, attempts, and Accepted progress return with your account."}
          </p>
        </div>
      </div>

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
