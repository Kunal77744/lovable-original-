"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProjectFeedback } from "@/components/project-feedback";
import { SemanticHtmlRepairDrill } from "@/components/semantic-html-repair-drill";
import {
  getEmptyGuidedProjectChecks,
  type GuidedProjectRecord,
} from "@/lib/guided-project";
import { captureProjectCompleted } from "@/lib/product-analytics";
import type { SavedProjectFeedback } from "@/lib/project-feedback";
import { buildSandboxedPreviewDocument } from "@/lib/semantic-html-workspace";

type GuidedProjectWorkspaceProps = {
  projectSlug: string;
  initialProject: GuidedProjectRecord;
  initialFeedback: SavedProjectFeedback | null;
  practiceContinuation: {
    href: string;
    label: string;
  };
};

export function GuidedProjectWorkspace({
  projectSlug,
  initialProject,
  initialFeedback,
  practiceContinuation,
}: GuidedProjectWorkspaceProps) {
  const [html, setHtml] = useState(initialProject.html);
  const [project, setProject] = useState(initialProject);
  const [requestState, setRequestState] = useState<
    "idle" | "saving" | "submitting" | "error"
  >("idle");
  const [message, setMessage] = useState(
    initialProject.hasUnreviewedChanges
      ? "Your draft is saved. Submit again for an updated review."
      : initialProject.submission?.status === "completed"
        ? "Project complete. Your saved 6/6 review is ready."
        : initialProject.submission
          ? `Last review: ${initialProject.submission.passedChecks} of 6 checks pass. Revise the open checks and submit again.`
          : initialProject.saved
            ? "Your saved draft is ready. Submit it when the structure is complete."
            : "Starter HTML is ready. Save at any point or submit for review.",
  );
  const previewDocument = useMemo(
    () => buildSandboxedPreviewDocument(html),
    [html],
  );
  const checks = project.submission?.checks ?? getEmptyGuidedProjectChecks();
  const passedCount = project.submission?.passedChecks ?? 0;
  const isWorking =
    requestState === "saving" || requestState === "submitting";
  const hasUnsavedChanges = html !== project.html;
  const hasUnreviewedChanges =
    project.hasUnreviewedChanges ||
    Boolean(project.submission && html !== project.html);
  const isComplete =
    project.submission?.status === "completed" && !hasUnreviewedChanges;
  const firstFailedCheck = checks.find((check) => !check.passed);

  async function persist(action: "save" | "submit") {
    setRequestState(action === "save" ? "saving" : "submitting");
    setMessage(
      action === "save"
        ? "Saving your project draft…"
        : "Reviewing six semantic structure checks…",
    );

    try {
      const response = await fetch(`/api/projects/${projectSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, html }),
      });
      const payload = (await response.json()) as GuidedProjectRecord & {
        error?: string;
        firstCompletedReview?: boolean;
      };

      if (!response.ok) {
        setRequestState("error");
        setMessage(
          payload.error ?? "The project could not be saved. Try again.",
        );
        return;
      }

      setProject(payload);
      setRequestState("idle");

      if (action === "save") {
        setMessage("Saved privately to your account.");
        return;
      }

      if (
        payload.firstCompletedReview === true &&
        payload.submission?.status === "completed" &&
        payload.submission.passedChecks === payload.submission.totalChecks
      ) {
        captureProjectCompleted({
          projectSlug,
          passedCheckCount: payload.submission.passedChecks,
        });
      }

      setMessage(
        payload.submission?.status === "completed"
          ? "Project complete. Your HTML and 6/6 review are saved."
          : `Review saved. ${payload.submission?.passedChecks ?? 0} of 6 checks pass. Revise the open checks and submit again.`,
      );
    } catch {
      setRequestState("error");
      setMessage(
        "The project could not be saved. Check your connection and try again.",
      );
    }
  }

  return (
    <section className="project-workspace" aria-labelledby="project-workspace-title">
      <header className="project-workspace-heading">
        <div>
          <p className="quiz-kicker">Project workspace</p>
          <h2 id="project-workspace-title">Build, review, revise.</h2>
          <p>
            Work in one private HTML file. The preview updates as you type;
            review runs only when you submit.
          </p>
        </div>
        <div
          className={`project-score ${isComplete ? "is-complete" : ""}`}
          aria-label={`${passedCount} of 6 review checks pass`}
        >
          <span>
            {hasUnreviewedChanges
              ? "Changes since review"
              : project.submission
                ? "Last review"
                : project.saved
                  ? "Draft saved"
                  : "Not reviewed"}
          </span>
          <strong>{passedCount}/6</strong>
          <small>
            {isComplete
              ? "Project complete"
              : project.submission
                ? "Needs revision"
                : "review checks"}
          </small>
        </div>
      </header>

      <div className="project-panels">
        <div className="project-editor">
          <div className="workspace-panel-label">
            <span>field-guide.html</span>
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
          <label htmlFor="guided-project-editor">Semantic HTML project</label>
          <textarea
            id="guided-project-editor"
            value={html}
            onChange={(event) => {
              setHtml(event.target.value);
              setRequestState("idle");
              setMessage("You have unsaved changes.");
            }}
            spellCheck={false}
          />
        </div>

        <div className="project-preview">
          <div className="workspace-panel-label">
            <span>Live preview</span>
            <span>Network blocked</span>
          </div>
          <iframe
            sandbox=""
            referrerPolicy="no-referrer"
            srcDoc={previewDocument}
            title="Guided project live preview"
          />
        </div>
      </div>

      <div className="project-review">
        <div className="project-rubric">
          <div className="project-rubric-heading">
            <div>
              <p className="quiz-kicker">Bounded project review</p>
              <h3>Six checks, each with one clear revision.</h3>
            </div>
            <span>{passedCount}/6 passing</span>
          </div>
          <div className="project-checks">
            {checks.map((check) => (
              <article
                className={
                  check.passed ? "project-check is-passed" : "project-check"
                }
                key={check.id}
              >
                <span aria-hidden="true">{check.passed ? "✓" : "○"}</span>
                <div>
                  <strong>{check.label}</strong>
                  <p>{check.guidance}</p>
                </div>
              </article>
            ))}
          </div>
          {project.submission && firstFailedCheck && !isComplete ? (
            <SemanticHtmlRepairDrill
              editorId="guided-project-editor"
              failedCheck={firstFailedCheck}
              key={firstFailedCheck.id}
            />
          ) : null}
        </div>

        <aside className="project-actions" aria-label="Save and review project">
          <div>
            <p className="quiz-kicker">Your next move</p>
            <h3>
              {isComplete
                ? "Keep building from a saved result."
                : project.submission
                  ? "Revise one open check at a time."
                  : "Save freely, submit when ready."}
            </h3>
          </div>
          <button
            className="project-save-draft"
            type="button"
            onClick={() => persist("save")}
            disabled={isWorking || !hasUnsavedChanges}
          >
            {requestState === "saving" ? "Saving…" : "Save draft"}
          </button>
          <button
            className="lesson-primary-action"
            type="button"
            onClick={() => persist("submit")}
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
            <Link href={practiceContinuation.href}>
              {practiceContinuation.label}
              <span aria-hidden="true">→</span>
            </Link>
          ) : null}
        </aside>
      </div>
      {isComplete ? (
        <ProjectFeedback
          projectSlug={projectSlug}
          initialFeedback={initialFeedback}
        />
      ) : null}
    </section>
  );
}
