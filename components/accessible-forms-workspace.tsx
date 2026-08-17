"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SavedWorkspaceDownload } from "@/components/saved-workspace-download";
import { useLessonWorkspaceBrowserDraft } from "@/components/use-lesson-workspace-browser-draft";
import {
  buildAccessibleFormsPreview,
  MAX_ACCESSIBLE_FORMS_LENGTH,
  type AccessibleFormsCheck,
} from "@/lib/accessible-forms-practice";
import { getAccountHref } from "@/lib/account-destination";

type AccessibleFormsWorkspaceProps = {
  lessonSlug: string;
  initialHtml: string;
  initialChecks: AccessibleFormsCheck[];
  initiallySaved: boolean;
  isSignedIn?: boolean;
};

type WorkspaceResponse = {
  html: string;
  checks: AccessibleFormsCheck[];
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

export function AccessibleFormsWorkspace({
  lessonSlug,
  initialHtml,
  initialChecks,
  initiallySaved,
  isSignedIn = true,
}: AccessibleFormsWorkspaceProps) {
  const [html, setHtml] = useState(initialHtml);
  const htmlRef = useRef(initialHtml);
  const [checks, setChecks] = useState(initialChecks);
  const [hasSubmitted, setHasSubmitted] = useState(initiallySaved);
  const [saveState, setSaveState] = useState<
    "saved" | "unsaved" | "saving" | "error"
  >(initiallySaved ? "saved" : "unsaved");
  const [message, setMessage] = useState(
    initiallySaved
      ? initialChecks.every((check) => check.passed)
        ? "Saved result restored. All five form checks pass."
        : "Saved submission restored. Revise the open form checks and resubmit."
      : "Starter code is ready. Submit when the form is understandable without guessing.",
  );
  const {
    recoveredSource,
    dismissRecoveredDraft,
    preserveDraft,
    clearDraft,
  } = useLessonWorkspaceBrowserDraft({
    lessonSlug,
    initialSource: initialHtml,
    initiallySaved,
    maxLength: MAX_ACCESSIBLE_FORMS_LENGTH,
  });
  const editorHtml = recoveredSource ?? html;
  const recoveredBrowserDraft = recoveredSource !== null;
  const visibleMessage = recoveredBrowserDraft
    ? isSignedIn
      ? "Browser draft restored after sign-in. It is still unsaved. Submit when you’re ready."
      : "Browser draft restored. Create an account to save it privately."
    : message;
  const previewDocument = useMemo(
    () => buildAccessibleFormsPreview(editorHtml),
    [editorHtml],
  );
  const passedCount = checks.filter((check) => check.passed).length;

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
    setMessage("Submitting and checking your form…");

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
          : `Submission saved. ${payload.submission?.passedChecks ?? 0} of ${payload.submission?.totalChecks ?? payload.checks.length} form checks pass. Revise and resubmit.`,
      );
    } catch {
      setSaveState("error");
      setMessage(
        "The draft could not be saved. Check your connection and try again.",
      );
    }
  }

  return (
    <section className="lesson-workspace" id="accessible-forms-workspace">
      <header className="workspace-heading">
        <div>
          <p className="quiz-kicker">Assignment · Accessible forms</p>
          <h2>Build a workshop interest form.</h2>
          <p>
            Complete the starter with a dependable label, connected help text,
            one named choice group, and an explicit submit action. The result
            should make sense to keyboard and screen-reader users before any
            custom validation is added.
          </p>
          <div className="assignment-outcome">
            <span>Expected outcome</span>
            <strong>One form that passes all five accessibility checks.</strong>
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
                  : "form checks"}
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
          <label htmlFor="accessible-forms-editor">Accessible form HTML</label>
          <textarea
            id="accessible-forms-editor"
            value={editorHtml}
            onChange={(event) => {
              htmlRef.current = event.target.value;
              setHtml(htmlRef.current);
              dismissRecoveredDraft();
              preserveDraft(htmlRef.current);
              setSaveState("unsaved");
              setMessage("You have unsaved changes.");
            }}
            maxLength={MAX_ACCESSIBLE_FORMS_LENGTH}
            spellCheck={false}
          />
        </div>

        <div className="workspace-preview">
          <div className="workspace-panel-label">
            <span>Live preview</span>
            <span>Submission blocked</span>
          </div>
          <iframe
            sandbox=""
            referrerPolicy="no-referrer"
            srcDoc={previewDocument}
            title="Accessible form live preview"
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
                fileName="accessible-workshop-form.html"
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
