"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SourceChangeReview } from "@/components/guided-source-change-review";
import { LessonStarterRestore } from "@/components/lesson-starter-restore";
import { SavedWorkspaceDownload } from "@/components/saved-workspace-download";
import { useLessonWorkspaceBrowserDraft } from "@/components/use-lesson-workspace-browser-draft";
import { getAccountHref } from "@/lib/account-destination";
import {
  buildResponsiveCssPreview,
  MAX_RESPONSIVE_CSS_LENGTH,
  RESPONSIVE_CSS_STARTER,
  type ResponsiveCssCheck,
} from "@/lib/responsive-css-practice";

type ResponsiveCssLayoutWorkspaceProps = {
  lessonSlug: string;
  initialCss: string;
  initialChecks: ResponsiveCssCheck[];
  initiallySaved: boolean;
  isSignedIn?: boolean;
};

type WorkspaceResponse = {
  html: string;
  checks: ResponsiveCssCheck[];
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

export function ResponsiveCssLayoutWorkspace({
  lessonSlug,
  initialCss,
  initialChecks,
  initiallySaved,
  isSignedIn = true,
}: ResponsiveCssLayoutWorkspaceProps) {
  const [css, setCss] = useState(initialCss);
  const latestCss = useRef(initialCss);
  const [checks, setChecks] = useState(initialChecks);
  const [hasSubmitted, setHasSubmitted] = useState(initiallySaved);
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<
    "saved" | "unsaved" | "saving" | "error"
  >(initiallySaved ? "saved" : "unsaved");
  const [message, setMessage] = useState(
    initiallySaved
      ? initialChecks.every((check) => check.passed)
        ? "Saved practice restored. All four responsive-layout checks pass."
        : "Saved practice restored. Revise the open checks and save again."
      : "Starter CSS is ready. Save when the cards adapt cleanly.",
  );
  const { recoveredSource, dismissRecoveredDraft, preserveDraft, clearDraft } =
    useLessonWorkspaceBrowserDraft({
      lessonSlug,
      initialSource: initialCss,
      initiallySaved,
      maxLength: MAX_RESPONSIVE_CSS_LENGTH,
    });
  const editorCss = recoveredSource ?? css;
  const recoveredBrowserDraft = recoveredSource !== null;
  const visibleMessage = recoveredBrowserDraft
    ? isSignedIn
      ? "Browser draft restored after sign-in. It is still unsaved. Check and save when you’re ready."
      : "Browser draft restored. Create an account to save it privately."
    : message;
  const previewDocument = useMemo(
    () => buildResponsiveCssPreview(editorCss),
    [editorCss],
  );
  const passedCount = checks.filter((check) => check.passed).length;

  useEffect(() => {
    latestCss.current = editorCss;
  }, [editorCss]);

  async function savePractice() {
    if (!isSignedIn) {
      setSaveState("unsaved");
      setMessage(
        "Create a free account to check and save this CSS. Your draft has not left this browser.",
      );
      return;
    }

    const submittedCss = latestCss.current;
    setIsSaving(true);
    setSaveState("saving");
    setMessage("Checking the layout and saving your CSS…");

    try {
      const response = await fetch(`/api/lessons/${lessonSlug}/workspace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: submittedCss }),
      });
      const payload = (await response.json()) as WorkspaceResponse;

      if (!response.ok) {
        setSaveState("error");
        setMessage(payload.error ?? "The CSS could not be saved. Try again.");
        return;
      }

      setChecks(payload.checks);
      setHasSubmitted(true);

      if (latestCss.current !== submittedCss) {
        setSaveState("unsaved");
        setMessage(
          "Your submitted result is saved. Newer CSS changes are still unsaved.",
        );
        return;
      }

      setSaveState("saved");
      setCss(submittedCss);
      dismissRecoveredDraft();
      clearDraft();
      setMessage(
        payload.submission?.status === "completed"
          ? "Practice complete. Your CSS and 4/4 result are saved."
          : `CSS saved. ${payload.submission?.passedChecks ?? 0} of ${payload.submission?.totalChecks ?? payload.checks.length} checks pass. Revise and save again.`,
      );
    } catch {
      setSaveState("error");
      setMessage(
        "The CSS could not be saved. Check your connection and try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section
      className="lesson-workspace css-practice-workspace"
      id="responsive-css-practice"
    >
      <header className="workspace-heading">
        <div>
          <p className="quiz-kicker">Saved practice · Responsive CSS Grid</p>
          <h2>Make one resource grid adapt.</h2>
          <p>
            Finish the track rule, add one shared gap, and keep long card
            content inside its column. The preview updates as you type.
          </p>
          <div className="assignment-outcome">
            <span>Expected outcome</span>
            <strong>
              Three resource cards that move from one column to several and pass
              all four layout checks.
            </strong>
          </div>
        </div>
        <div
          className={`workspace-score ${
            saveState === "saved" && passedCount === 4 ? "is-complete" : ""
          }`}
          aria-label={`${passedCount} of 4 checks pass`}
        >
          <span>
            {saveState === "unsaved" && hasSubmitted
              ? "Changes not saved"
              : hasSubmitted
                ? "Saved result"
                : "Not saved"}
          </span>
          <strong>{passedCount}/4</strong>
          <small>
            {saveState === "unsaved" && hasSubmitted
              ? "Previous result"
              : hasSubmitted && passedCount === 4
                ? "Practice complete"
                : hasSubmitted
                  ? "Needs revision"
                  : "practice checks"}
          </small>
        </div>
      </header>

      <div className="workspace-panels">
        <div className="workspace-editor">
          <div className="workspace-panel-label">
            <span>layout.css</span>
            <span>
              {saveState === "saved"
                ? "Saved"
                : saveState === "saving"
                  ? "Saving"
                  : isSignedIn
                    ? "Draft"
                    : "Local draft"}
            </span>
          </div>
          <label htmlFor="responsive-css-editor">Responsive layout CSS</label>
          <textarea
            id="responsive-css-editor"
            value={editorCss}
            onChange={(event) => {
              latestCss.current = event.target.value;
              setCss(latestCss.current);
              dismissRecoveredDraft();
              preserveDraft(latestCss.current);
              setSaveState("unsaved");
              setMessage("You have unsaved changes.");
            }}
            maxLength={MAX_RESPONSIVE_CSS_LENGTH}
            spellCheck={false}
          />
          {isSignedIn ? (
            <>
              <LessonStarterRestore
                disabled={isSaving}
                isStarterLoaded={editorCss === RESPONSIVE_CSS_STARTER}
                onRestore={() => {
                  latestCss.current = RESPONSIVE_CSS_STARTER;
                  setCss(RESPONSIVE_CSS_STARTER);
                  dismissRecoveredDraft();
                  preserveDraft(RESPONSIVE_CSS_STARTER);
                  setSaveState("unsaved");
                  setMessage(
                    "Lesson starter restored in the editor. Your saved result and checks have not changed.",
                  );
                }}
              />
              <SourceChangeReview
                currentSource={editorCss}
                starterSource={RESPONSIVE_CSS_STARTER}
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
            title="Responsive CSS Grid live preview"
          />
        </div>
      </div>

      <div className="workspace-review">
        <div className="workspace-rubric">
          <div className="workspace-rubric-heading">
            <div>
              <p className="quiz-kicker">Practice checks</p>
              <h3>Four layout choices, checked on the server.</h3>
            </div>
            <span>{passedCount}/4 passing</span>
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
              onClick={savePractice}
              disabled={isSaving}
            >
              {isSaving
                ? "Saving…"
                : hasSubmitted
                  ? "Check and save again"
                  : "Check and save CSS"}
            </button>
            {isSignedIn && saveState === "saved" ? (
              <SavedWorkspaceDownload
                fileName="responsive-resource-grid.css"
                label="Download saved .css"
                mimeType="text/css"
                source={css}
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
