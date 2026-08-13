"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SavedWorkspaceDownload } from "@/components/saved-workspace-download";
import { runCodingSolution } from "@/lib/coding-runner";
import {
  getEmptyJavaScriptCapstoneChecks,
  getJavaScriptCapstoneInputs,
  JAVASCRIPT_CAPSTONE_SAMPLE,
  type JavaScriptCapstoneRecord,
} from "@/lib/javascript-capstone";
import { captureProjectCompleted } from "@/lib/product-analytics";

type RequestState = "idle" | "running" | "saving" | "submitting" | "error";

type JavaScriptCapstoneWorkspaceProps = {
  projectSlug: string;
  initialProject: JavaScriptCapstoneRecord;
};

export function JavaScriptCapstoneWorkspace({
  projectSlug,
  initialProject,
}: JavaScriptCapstoneWorkspaceProps) {
  const [code, setCode] = useState(initialProject.code);
  const codeRef = useRef(initialProject.code);
  const [project, setProject] = useState(initialProject);
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [sampleOutput, setSampleOutput] = useState<string | null>(null);
  const [samplePassed, setSamplePassed] = useState<boolean | null>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftSaveInFlight = useRef(false);
  const queuedDraft = useRef<string | null>(null);
  const submittingRef = useRef(false);
  const [message, setMessage] = useState(
    initialProject.hasUnreviewedChanges
      ? "Your draft is saved. Submit again to review the latest code."
      : initialProject.submission?.status === "completed"
        ? "Project complete. Your code and 6/6 review are saved."
        : initialProject.submission
          ? `Last review: ${initialProject.submission.passedChecks} of 6 checks pass.`
          : initialProject.saved
            ? "Your private draft is ready. Run the example, then submit when the report is complete."
            : "Starter code is ready. Your private draft saves as you type.",
  );
  const checks =
    project.submission?.checks ?? getEmptyJavaScriptCapstoneChecks();
  const passedCount = project.submission?.passedChecks ?? 0;
  const hasUnsavedChanges = code !== project.code;
  const hasUnreviewedChanges =
    project.hasUnreviewedChanges ||
    Boolean(project.submission && code !== project.code);
  const isComplete =
    project.submission?.status === "completed" && !hasUnreviewedChanges;
  const isWorking = requestState !== "idle" && requestState !== "error";
  const firstFailedCheck = checks.find((check) => !check.passed);

  useEffect(() => {
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, []);

  function updateCode(nextCode: string) {
    codeRef.current = nextCode;
    setCode(nextCode);
    setRequestState((current) => (current === "error" ? "idle" : current));
    setMessage("Draft changed. Saving privately…");

    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      draftTimer.current = null;
      void saveDraft(nextCode);
    }, 700);
  }

  async function runSample() {
    setRequestState("running");
    setMessage("Running the sample inside the network-blocked browser worker…");
    const result = await runCodingSolution(codeRef.current, [JAVASCRIPT_CAPSTONE_SAMPLE.input]);

    if (result.status !== "finished") {
      setRequestState("error");
      setSampleOutput(null);
      setSamplePassed(false);
      setMessage(
        result.status === "timeout"
          ? "The sample timed out. Check that every loop reaches a stopping condition."
          : result.message,
      );
      return;
    }

    const output = result.outputs[0] ?? "";
    const passed = output.trim() === JAVASCRIPT_CAPSTONE_SAMPLE.expectedOutput;
    setSampleOutput(output);
    setSamplePassed(passed);
    setRequestState("idle");
    setMessage(
      passed
        ? "Sample matched. Submit when you are ready for all six review checks."
        : "The sample ran, but the report does not match the required format yet.",
    );
  }

  async function saveDraft(submittedCode: string) {
    if (draftSaveInFlight.current || submittingRef.current) {
      queuedDraft.current = submittedCode;
      return;
    }

    draftSaveInFlight.current = true;
    setRequestState("saving");
    setMessage("Saving your private JavaScript project…");

    try {
      const response = await fetch(`/api/projects/${projectSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", code: submittedCode }),
      });
      const payload = (await response.json()) as JavaScriptCapstoneRecord & {
        error?: string;
      };

      if (!response.ok) {
        setRequestState("error");
        setMessage(payload.error ?? "The draft could not be saved. Try again.");
        return;
      }

      setProject(payload);
      setRequestState("idle");
      setMessage(
        codeRef.current === submittedCode
          ? "Saved privately to your account."
          : "Your saved draft is safe. Newer code is still unsaved.",
      );
    } catch {
      setRequestState("error");
      setMessage("The draft could not be saved. Check your connection and try again.");
    } finally {
      draftSaveInFlight.current = false;
      const nextDraft = queuedDraft.current;
      queuedDraft.current = null;

      if (nextDraft !== null && nextDraft !== submittedCode) {
        void saveDraft(nextDraft);
      }
    }
  }

  function saveDraftNow() {
    if (draftTimer.current) {
      clearTimeout(draftTimer.current);
      draftTimer.current = null;
    }
    void saveDraft(codeRef.current);
  }

  function finishSubmission(submittedCode: string) {
    submittingRef.current = false;
    const nextDraft = queuedDraft.current;
    queuedDraft.current = null;

    if (nextDraft !== null && nextDraft !== submittedCode) {
      void saveDraft(nextDraft);
    }
  }

  async function submitForReview() {
    if (draftSaveInFlight.current) return;

    if (draftTimer.current) {
      clearTimeout(draftTimer.current);
      draftTimer.current = null;
    }

    const submittedCode = codeRef.current;
    submittingRef.current = true;
    setRequestState("submitting");
    setMessage("Running six project outcomes in your browser…");
    const result = await runCodingSolution(
      submittedCode,
      getJavaScriptCapstoneInputs(),
    );

    if (result.status !== "finished") {
      setRequestState("error");
      setMessage(
        result.status === "timeout"
          ? "Review timed out. Check that every loop reaches a stopping condition."
          : result.message,
      );
      finishSubmission(submittedCode);
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          code: submittedCode,
          outputs: result.outputs,
        }),
      });
      const payload = (await response.json()) as JavaScriptCapstoneRecord & {
        error?: string;
        firstCompletedReview?: boolean;
      };

      if (!response.ok) {
        setRequestState("error");
        setMessage(payload.error ?? "The review could not be saved. Try again.");
        return;
      }

      setProject(payload);
      setRequestState("idle");

      if (
        payload.firstCompletedReview &&
        payload.submission?.status === "completed"
      ) {
        captureProjectCompleted({
          projectSlug,
          passedCheckCount: payload.submission.passedChecks,
        });
      }

      if (codeRef.current !== submittedCode) {
        setMessage(
          "Your submitted review is saved. Newer code is still unsaved and unreviewed.",
        );
        return;
      }

      setMessage(
        payload.submission?.status === "completed"
          ? "Project complete. Your code and 6/6 review are saved."
          : `Review saved. ${payload.submission?.passedChecks ?? 0} of 6 outcomes pass. Start with the first open outcome.`,
      );
    } catch {
      setRequestState("error");
      setMessage("The review could not be saved. Check your connection and try again.");
    } finally {
      finishSubmission(submittedCode);
    }
  }

  return (
    <section
      className="js-capstone-workspace"
      aria-labelledby="js-capstone-workspace-title"
    >
      <header className="js-capstone-workspace-heading">
        <div>
          <p className="eyebrow">Project workspace</p>
          <h2 id="js-capstone-workspace-title">Build one complete data report.</h2>
          <p>
            Write one solve(input) function. The browser worker blocks network
            access, stops long-running code after one second, and saves your
            private draft as you type.
          </p>
        </div>
        <div
          className={`js-capstone-score ${isComplete ? "is-complete" : ""}`}
          aria-label={`${passedCount} of 6 project outcomes pass`}
        >
          <span>{hasUnreviewedChanges ? "Changes since review" : "Last review"}</span>
          <strong>{passedCount}/6</strong>
          <small>{isComplete ? "Project complete" : "project outcomes"}</small>
        </div>
      </header>

      <div className="js-capstone-workbench">
        <div className="js-capstone-editor">
          <div className="workspace-panel-label">
            <span>expense-report.js</span>
            <span>
              {requestState === "saving"
                ? "Saving"
                : requestState === "submitting"
                  ? "Reviewing"
                  : hasUnsavedChanges
                    ? "Unsaved"
                    : project.saved
                      ? "Saved"
                      : "Starter"}
            </span>
          </div>
          <label htmlFor="js-capstone-editor">JavaScript project</label>
          <textarea
            id="js-capstone-editor"
            value={code}
            onChange={(event) => updateCode(event.target.value)}
            spellCheck={false}
          />
        </div>

        <aside className="js-capstone-contract" aria-label="Project input and output contract">
          <div>
            <p className="eyebrow">Input contract</p>
            <h3>One expense per line</h3>
            <code>category | description | amount</code>
          </div>
          <div className="js-capstone-sample">
            <span>Sample input</span>
            <pre>{JAVASCRIPT_CAPSTONE_SAMPLE.input}</pre>
          </div>
          <div className="js-capstone-sample">
            <span>Expected report</span>
            <pre>{JAVASCRIPT_CAPSTONE_SAMPLE.expectedOutput}</pre>
          </div>
          <button
            type="button"
            onClick={runSample}
            disabled={isWorking}
          >
            {requestState === "running" ? "Running sample…" : "Run sample"}
          </button>
          {sampleOutput !== null ? (
            <div className={samplePassed ? "js-capstone-output is-passed" : "js-capstone-output"}>
              <span>{samplePassed ? "Matched" : "Your output"}</span>
              <pre>{sampleOutput || "(empty output)"}</pre>
            </div>
          ) : null}
        </aside>
      </div>

      <div className="js-capstone-review-layout">
        <section className="js-capstone-review" aria-labelledby="js-capstone-review-title">
          <div className="js-capstone-review-heading">
            <div>
              <p className="eyebrow">Deterministic project review</p>
              <h3 id="js-capstone-review-title">Six outcomes, one integrated result.</h3>
            </div>
            <span>{passedCount}/6 passing</span>
          </div>
          <div className="js-capstone-checks">
            {checks.map((check) => (
              <article className={check.passed ? "is-passed" : ""} key={check.id}>
                <span aria-hidden="true">{check.passed ? "✓" : "○"}</span>
                <div>
                  <strong>{check.label}</strong>
                  <p>{check.guidance}</p>
                </div>
              </article>
            ))}
          </div>
          {project.submission && firstFailedCheck && !isComplete ? (
            <aside className="js-capstone-recovery">
              <span>First outcome to repair</span>
              <strong>{firstFailedCheck.label}</strong>
              <p>{firstFailedCheck.guidance}</p>
            </aside>
          ) : null}
        </section>

        <aside className="js-capstone-actions" aria-label="Save and review project">
          <div>
            <p className="eyebrow">Your next move</p>
            <h3>
              {isComplete
                ? "Keep the result as a portfolio-ready proof."
                : project.submission
                  ? "Repair the first open outcome."
                  : "Run the sample, then prove all six outcomes."}
            </h3>
          </div>
          <button
            className="js-capstone-save"
            type="button"
            onClick={saveDraftNow}
            disabled={isWorking || !hasUnsavedChanges}
          >
            {requestState === "saving" ? "Saving…" : "Save now"}
          </button>
          <button
            className="lesson-primary-action"
            type="button"
            onClick={submitForReview}
            disabled={isWorking}
          >
            {requestState === "submitting"
              ? "Reviewing…"
              : project.submission
                ? "Submit updated project"
                : "Submit for review"}
          </button>
          <p
            className={requestState === "error" ? "is-error" : ""}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {message}
          </p>
          {project.saved && !hasUnsavedChanges ? (
            <div
              className="project-source-downloads"
              aria-label="Download saved project files"
            >
              <span>Saved project file</span>
              <p>Take the exact saved JavaScript with you.</p>
              <SavedWorkspaceDownload
                fileName="expense-report.js"
                label="Download expense-report.js"
                mimeType="text/javascript"
                source={code}
              />
            </div>
          ) : null}
          {isComplete ? (
            <div className="js-capstone-teaching">
              <span>What this proves</span>
              <strong>Separate parsing, transforming, and formatting.</strong>
              <p>
                That structure makes a data program easier to test, debug, and
                extend without changing every step at once.
              </p>
              <Link
                className="js-capstone-debrief-link"
                href="/projects/javascript-expense-report/debrief"
              >
                Open project debrief <span aria-hidden="true">→</span>
              </Link>
              <Link className="js-capstone-record-link" href="/practice/progress">
                Return to your JavaScript record <span aria-hidden="true">→</span>
              </Link>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
