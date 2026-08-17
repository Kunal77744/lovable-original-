"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SourceChangeReview } from "@/components/guided-source-change-review";
import { LessonWorkspaceRepairGuide } from "@/components/lesson-workspace-repair-guide";
import { LessonStarterRestore } from "@/components/lesson-starter-restore";
import { SavedWorkspaceDownload } from "@/components/saved-workspace-download";
import { useLessonWorkspaceBrowserDraft } from "@/components/use-lesson-workspace-browser-draft";
import { getAccountHref } from "@/lib/account-destination";
import {
  buildSandboxedPreviewDocument,
  MAX_SEMANTIC_HTML_LENGTH,
  SEMANTIC_HTML_STARTER,
  type SemanticHtmlCheck,
} from "@/lib/semantic-html-workspace";

type SemanticHtmlWorkspaceProps = {
  lessonSlug: string;
  initialHtml: string;
  initialChecks: SemanticHtmlCheck[];
  initiallySaved: boolean;
  isSignedIn?: boolean;
};

type WorkspaceResponse = {
  html: string;
  checks: SemanticHtmlCheck[];
  saved: boolean;
  updatedAt: string | null;
  submission: {
    status: "completed" | "needs-revision";
    passedChecks: number;
    totalChecks: number;
    submittedAt: string;
  } | null;
  error?: string;
};

export function SemanticHtmlWorkspace({
  lessonSlug,
  initialHtml,
  initialChecks,
  initiallySaved,
  isSignedIn = true,
}: SemanticHtmlWorkspaceProps) {
  const [html, setHtml] = useState(initialHtml);
  const [savedHtml, setSavedHtml] = useState<string | null>(
    initiallySaved ? initialHtml : null,
  );
  const htmlRef = useRef(initialHtml);
  const [checks, setChecks] = useState(initialChecks);
  const [hasSubmitted, setHasSubmitted] = useState(initiallySaved);
  const [saveState, setSaveState] = useState<
    "saved" | "unsaved" | "saving" | "error"
  >(initiallySaved ? "saved" : "unsaved");
  const [message, setMessage] = useState(
    initiallySaved
      ? initialChecks.every((check) => check.passed)
        ? "Saved result restored. All five rubric checks pass."
        : "Saved submission restored. Revise the open rubric checks and resubmit."
      : "Starter code is ready. Submit when your article structure is complete.",
  );
  const { recoveredSource, dismissRecoveredDraft, preserveDraft, clearDraft } =
    useLessonWorkspaceBrowserDraft({
      lessonSlug,
      initialSource: initialHtml,
      initiallySaved,
      maxLength: MAX_SEMANTIC_HTML_LENGTH,
    });
  const editorHtml = recoveredSource ?? html;
  const recoveredBrowserDraft = recoveredSource !== null;
  const visibleMessage = recoveredBrowserDraft
    ? isSignedIn
      ? "Browser draft restored after sign-in. It is still unsaved. Submit when you’re ready."
      : "Browser draft restored. Create an account to save it privately."
    : message;
  const previewDocument = useMemo(
    () => buildSandboxedPreviewDocument(editorHtml),
    [editorHtml],
  );
  const passedCount = checks.filter((check) => check.passed).length;
  const firstFailedCheck = hasSubmitted
    ? checks.find((check) => !check.passed)
    : undefined;

  useEffect(() => {
    htmlRef.current = editorHtml;
  }, [editorHtml]);

  async function submitAssignment() {
    if (!isSignedIn) {
      setSaveState("unsaved");
      setMessage(
        "Create a free account to grade and save this assignment. Your draft has not left this browser.",
      );
      return;
    }

    const submittedHtml = htmlRef.current;

    setSaveState("saving");
    setMessage("Submitting and checking your structure…");

    try {
      const response = await fetch(`/api/lessons/${lessonSlug}/workspace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: submittedHtml }),
      });
      const payload = (await response.json()) as WorkspaceResponse;

      if (!response.ok) {
        setSaveState("error");
        setMessage(payload.error ?? "The draft could not be saved. Try again.");
        return;
      }

      setChecks(payload.checks);
      setHasSubmitted(true);
      setSavedHtml(submittedHtml);

      if (htmlRef.current !== submittedHtml) {
        setSaveState("unsaved");
        setMessage(
          "Your submitted result is saved. Newer changes are still unsaved.",
        );
        return;
      }

      setSaveState("saved");
      setHtml(submittedHtml);
      dismissRecoveredDraft();
      clearDraft();
      setMessage(
        payload.submission?.status === "completed"
          ? "Assignment complete. Your HTML and 5/5 result are saved."
          : `Submission saved. ${payload.submission?.passedChecks ?? 0} of ${payload.submission?.totalChecks ?? payload.checks.length} rubric checks pass. Revise and resubmit.`,
      );
    } catch {
      setSaveState("error");
      setMessage(
        "The draft could not be saved. Check your connection and try again.",
      );
    }
  }

  return (
    <section className="lesson-workspace" id="semantic-workspace">
      <header className="workspace-heading">
        <div>
          <p className="quiz-kicker">Assignment · Semantic HTML</p>
          <h2>Build an accessible article page.</h2>
          <p>
            Complete the starter file with the landmarks and headings taught in
            this lesson. Your finished page should explain its structure to
            browsers, assistive technology, and readers without relying on
            visual styling.
          </p>
          <div className="assignment-outcome">
            <span>Expected outcome</span>
            <strong>
              One semantic article that passes all five rubric checks.
            </strong>
          </div>
        </div>
        <div
          className={`workspace-score ${
            saveState === "saved" && passedCount === 5 ? "is-complete" : ""
          }`}
          aria-label={`${passedCount} of 5 checks pass`}
        >
          <span>
            {saveState === "unsaved" && hasSubmitted
              ? "Changes not submitted"
              : hasSubmitted
                ? "Saved result"
                : "Not submitted"}
          </span>
          <strong>{passedCount}/5</strong>
          <small>
            {saveState === "unsaved" && hasSubmitted
              ? "Previous result"
              : hasSubmitted && passedCount === 5
                ? "Assignment complete"
                : hasSubmitted
                  ? "Needs revision"
                  : "rubric checks"}
          </small>
        </div>
      </header>

      <div className="workspace-panels">
        <div className="workspace-editor">
          <div className="workspace-panel-label">
            <span>index.html</span>
            <span>
              {saveState === "saved"
                ? "Submitted"
                : saveState === "saving"
                  ? "Submitting"
                  : isSignedIn
                    ? "Draft"
                    : "Local draft"}
            </span>
          </div>
          <label htmlFor="semantic-html-editor">Semantic HTML</label>
          <textarea
            id="semantic-html-editor"
            value={editorHtml}
            onChange={(event) => {
              htmlRef.current = event.target.value;
              setHtml(htmlRef.current);
              dismissRecoveredDraft();
              preserveDraft(htmlRef.current);
              setSaveState("unsaved");
              setMessage("You have unsaved changes.");
            }}
            maxLength={MAX_SEMANTIC_HTML_LENGTH}
            spellCheck={false}
          />
          {isSignedIn ? (
            <>
              <LessonStarterRestore
                disabled={saveState === "saving"}
                isStarterLoaded={editorHtml === SEMANTIC_HTML_STARTER}
                onRestore={() => {
                  htmlRef.current = SEMANTIC_HTML_STARTER;
                  setHtml(SEMANTIC_HTML_STARTER);
                  dismissRecoveredDraft();
                  preserveDraft(SEMANTIC_HTML_STARTER);
                  setSaveState("unsaved");
                  setMessage(
                    "Lesson starter restored in the editor. Your saved result and checks have not changed.",
                  );
                }}
              />
              <SourceChangeReview
                currentSource={editorHtml}
                savedSource={savedHtml ?? undefined}
                starterSource={SEMANTIC_HTML_STARTER}
              />
            </>
          ) : null}
        </div>

        <div className="workspace-preview">
          <div className="workspace-panel-label">
            <span>Live preview</span>
            <span>Network blocked</span>
          </div>
          <iframe
            sandbox=""
            referrerPolicy="no-referrer"
            srcDoc={previewDocument}
            title="Semantic HTML live preview"
          />
        </div>
      </div>

      <div className="workspace-review">
        <div className="workspace-rubric">
          <div className="workspace-rubric-heading">
            <div>
              <p className="quiz-kicker">Submission rubric</p>
              <h3>Five checks, graded on the server.</h3>
            </div>
            <span>{passedCount}/5 passing</span>
          </div>
          <div className="workspace-checks">
            {checks.map((check) => (
              <div
                className={
                  check.passed ? "workspace-check is-passed" : "workspace-check"
                }
                key={check.id}
              >
                <span aria-hidden="true">{check.passed ? "✓" : "○"}</span>
                <div>
                  <strong>{check.label}</strong>
                  <p>{check.guidance}</p>
                </div>
              </div>
            ))}
          </div>
          {isSignedIn && firstFailedCheck ? (
            <LessonWorkspaceRepairGuide
              checkId={firstFailedCheck.id}
              checkLabel={firstFailedCheck.label}
              editorId="semantic-html-editor"
              editorLabel="index.html"
            />
          ) : null}
        </div>
        <div className="workspace-save">
          <div className="workspace-save-actions">
            <button
              className="lesson-primary-action"
              type="button"
              onClick={submitAssignment}
              disabled={saveState === "saving"}
            >
              {saveState === "saving"
                ? "Submitting…"
                : hasSubmitted
                  ? "Resubmit assignment"
                  : "Submit assignment"}
            </button>
            {isSignedIn && saveState === "saved" ? (
              <SavedWorkspaceDownload
                fileName="semantic-html-article.html"
                label="Download saved .html"
                mimeType="text/html"
                source={html}
              />
            ) : null}
          </div>
          <p
            className={saveState === "error" ? "is-error" : ""}
            aria-live="polite"
          >
            {visibleMessage}
            {!isSignedIn &&
            (recoveredBrowserDraft ||
              message.startsWith("Create a free account")) ? (
              <>
                {" "}
                <Link
                  href={getAccountHref(
                    `/learn/web-development-foundations/${lessonSlug}`,
                  )}
                >
                  Create account
                </Link>
              </>
            ) : null}
          </p>
        </div>
      </div>
    </section>
  );
}
