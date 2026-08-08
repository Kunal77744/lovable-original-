"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  buildHtmlCssCapstonePreview,
  getEmptyHtmlCssCapstoneChecks,
  type HtmlCssCapstoneRecord,
} from "@/lib/html-css-capstone";
import { captureProjectCompleted } from "@/lib/product-analytics";

type RequestState = "idle" | "saving" | "submitting" | "error";

export function HtmlCssCapstoneWorkspace({
  projectSlug,
  initialProject,
}: {
  projectSlug: string;
  initialProject: HtmlCssCapstoneRecord;
}) {
  const [html, setHtml] = useState(initialProject.html);
  const [css, setCss] = useState(initialProject.css);
  const htmlRef = useRef(initialProject.html);
  const cssRef = useRef(initialProject.css);
  const [project, setProject] = useState(initialProject);
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [message, setMessage] = useState(
    initialProject.hasUnreviewedChanges
      ? "Your draft is saved. Submit again to review the latest HTML and CSS."
      : initialProject.submission?.status === "completed"
        ? "Project complete. Both files and the 6/6 review are saved."
        : initialProject.submission
          ? `Last review: ${initialProject.submission.passedChecks} of 6 outcomes pass.`
          : initialProject.saved
            ? "Your private draft is ready. Preview it, then submit when both files are complete."
            : "Two starter files are ready. Build the library one outcome at a time.",
  );
  const checks = project.submission?.checks ?? getEmptyHtmlCssCapstoneChecks();
  const passedCount = project.submission?.passedChecks ?? 0;
  const hasUnsavedChanges = html !== project.html || css !== project.css;
  const hasUnreviewedChanges =
    project.hasUnreviewedChanges || Boolean(project.submission && hasUnsavedChanges);
  const isComplete =
    project.submission?.status === "completed" && !hasUnreviewedChanges;
  const isWorking = requestState === "saving" || requestState === "submitting";
  const firstFailedCheck = checks.find((check) => !check.passed);

  function updateHtml(value: string) {
    htmlRef.current = value;
    setHtml(value);
    if (requestState === "error") setRequestState("idle");
    setMessage("You have unsaved changes.");
  }

  function updateCss(value: string) {
    cssRef.current = value;
    setCss(value);
    if (requestState === "error") setRequestState("idle");
    setMessage("You have unsaved changes.");
  }

  async function sendProject(action: "save" | "submit") {
    const submittedHtml = htmlRef.current;
    const submittedCss = cssRef.current;
    setRequestState(action === "save" ? "saving" : "submitting");
    setMessage(
      action === "save"
        ? "Saving both private project files…"
        : "Reviewing six HTML and CSS outcomes…",
    );

    try {
      const response = await fetch(`/api/projects/${projectSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, html: submittedHtml, css: submittedCss }),
      });
      const payload = (await response.json()) as HtmlCssCapstoneRecord & {
        error?: string;
        firstCompletedReview?: boolean;
      };

      if (!response.ok) {
        setRequestState("error");
        setMessage(payload.error ?? "The project could not be saved. Try again.");
        return;
      }

      setProject(payload);
      setRequestState("idle");

      if (payload.firstCompletedReview && payload.submission?.status === "completed") {
        captureProjectCompleted({
          projectSlug,
          passedCheckCount: payload.submission.passedChecks,
        });
      }

      if (htmlRef.current !== submittedHtml || cssRef.current !== submittedCss) {
        setMessage(
          action === "save"
            ? "Your saved draft is safe. Newer edits are still unsaved."
            : "Your submitted review is saved. Newer edits are still unsaved and unreviewed.",
        );
        return;
      }

      setMessage(
        action === "save"
          ? "Saved both files privately to your account."
          : payload.submission?.status === "completed"
            ? "Project complete. Both files and the 6/6 review are saved."
            : `Review saved. ${payload.submission?.passedChecks ?? 0} of 6 outcomes pass. Start with the first open outcome.`,
      );
    } catch {
      setRequestState("error");
      setMessage("The project could not be saved. Check your connection and try again.");
    }
  }

  return (
    <section className="html-css-capstone-workspace js-capstone-workspace" aria-labelledby="html-css-workspace-title">
      <header className="html-css-capstone-heading js-capstone-workspace-heading">
        <div>
          <p className="eyebrow">Project workspace</p>
          <h2 id="html-css-workspace-title">Make structure and styling agree.</h2>
          <p>
            Write semantic HTML, style the shared class hooks, and watch the
            sandboxed preview update without network access.
          </p>
        </div>
        <div className={`html-css-capstone-score js-capstone-score ${isComplete ? "is-complete" : ""}`}>
          <span>{hasUnreviewedChanges ? "Changes since review" : "Last review"}</span>
          <strong>{passedCount}/6</strong>
          <small>{isComplete ? "Project complete" : "outcomes passing"}</small>
        </div>
      </header>

      <div className="html-css-capstone-workbench js-capstone-workbench">
        <div className="html-css-capstone-editors">
          <div className="html-css-capstone-editor js-capstone-editor">
            <div className="workspace-panel-label">
              <span>index.html</span>
              <span>{hasUnsavedChanges ? "Unsaved" : project.saved ? "Saved" : "Starter"}</span>
            </div>
            <label htmlFor="html-css-capstone-html">Semantic HTML</label>
            <textarea
              id="html-css-capstone-html"
              value={html}
              onChange={(event) => updateHtml(event.target.value)}
              spellCheck={false}
            />
          </div>
          <div className="html-css-capstone-editor js-capstone-editor">
            <div className="workspace-panel-label">
              <span>styles.css</span>
              <span>{hasUnsavedChanges ? "Unsaved" : project.saved ? "Saved" : "Starter"}</span>
            </div>
            <label htmlFor="html-css-capstone-css">Component CSS</label>
            <textarea
              id="html-css-capstone-css"
              value={css}
              onChange={(event) => updateCss(event.target.value)}
              spellCheck={false}
            />
          </div>
        </div>

        <aside className="html-css-capstone-preview" aria-label="Sandboxed project preview">
          <div className="workspace-panel-label">
            <span>Live preview</span>
            <span>Network blocked</span>
          </div>
          <iframe
            title="Learning resource library preview"
            sandbox=""
            srcDoc={buildHtmlCssCapstonePreview(html, css)}
          />
        </aside>
      </div>

      <div className="html-css-capstone-review-layout js-capstone-review-layout">
        <section className="html-css-capstone-review js-capstone-review" aria-labelledby="html-css-review-title">
          <div className="html-css-capstone-review-heading js-capstone-review-heading">
            <div>
              <p className="eyebrow">Deterministic project review</p>
              <h3 id="html-css-review-title">Six outcomes across two files.</h3>
            </div>
            <span>{passedCount}/6 passing</span>
          </div>
          <div className="html-css-capstone-checks js-capstone-checks">
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
            <aside className="html-css-capstone-recovery js-capstone-recovery">
              <span>First outcome to repair</span>
              <strong>{firstFailedCheck.label}</strong>
              <p>{firstFailedCheck.guidance}</p>
            </aside>
          ) : null}
        </section>

        <aside className="html-css-capstone-actions js-capstone-actions" aria-label="Save and review project">
          <div>
            <p className="eyebrow">Your next move</p>
            <h3>
              {isComplete
                ? "Keep this as one finished front-end result."
                : project.submission
                  ? "Repair the first open outcome."
                  : "Shape the preview, then prove both files."}
            </h3>
          </div>
          <button
            className="html-css-capstone-save js-capstone-save"
            type="button"
            onClick={() => sendProject("save")}
            disabled={isWorking || !hasUnsavedChanges}
          >
            {requestState === "saving" ? "Saving…" : "Save draft"}
          </button>
          <button
            className="lesson-primary-action"
            type="button"
            onClick={() => sendProject("submit")}
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
          {isComplete ? (
            <div className="html-css-capstone-teaching js-capstone-teaching">
              <span>What this proves</span>
              <strong>Structure and styling form one reusable contract.</strong>
              <p>
                The HTML names the parts. The CSS controls their layout and box
                behavior without depending on their order.
              </p>
              <Link
                className="js-capstone-debrief-link"
                href="/projects/html-css-resource-library/debrief"
              >
                Open project debrief <span aria-hidden="true">→</span>
              </Link>
              <Link className="js-capstone-record-link" href="/profile">
                Return to private progress <span aria-hidden="true">→</span>
              </Link>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
