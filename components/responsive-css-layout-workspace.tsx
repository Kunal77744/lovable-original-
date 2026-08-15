"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  buildResponsiveCssPreview,
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

const previewWidths = [
  { id: "phone", label: "Phone", width: "360px" },
  { id: "tablet", label: "Tablet", width: "560px" },
  { id: "wide", label: "Wide", width: "100%" },
] as const;

type PreviewWidthId = (typeof previewWidths)[number]["id"];

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
  const [previewWidth, setPreviewWidth] =
    useState<PreviewWidthId>("wide");
  const previewDocument = useMemo(() => buildResponsiveCssPreview(css), [css]);
  const passedCount = checks.filter((check) => check.passed).length;
  const activePreviewWidth = previewWidths.find(
    (option) => option.id === previewWidth,
  )!;

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
      className="lesson-workspace css-practice-workspace responsive-css-layout-workspace"
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
            value={css}
            onChange={(event) => {
              latestCss.current = event.target.value;
              setCss(latestCss.current);
              setSaveState("unsaved");
              setMessage("You have unsaved changes.");
            }}
            spellCheck={false}
          />
        </div>

        <div className="workspace-preview">
          <div className="workspace-panel-label">
            <span>Live preview</span>
            <span>Network blocked</span>
          </div>
          <div className="responsive-preview-stage">
            <div className="responsive-preview-toolbar">
              <p>
                <span>Preview width</span>
                <strong>{activePreviewWidth.label}</strong>
              </p>
              <div
                className="responsive-preview-options"
                role="group"
                aria-label="Choose preview width"
              >
                {previewWidths.map((option) => (
                  <button
                    aria-pressed={previewWidth === option.id}
                    key={option.id}
                    onClick={() => setPreviewWidth(option.id)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="responsive-preview-canvas">
              <iframe
                data-preview-width={previewWidth}
                sandbox=""
                referrerPolicy="no-referrer"
                srcDoc={previewDocument}
                style={{ width: activePreviewWidth.width }}
                title="Responsive CSS Grid live preview"
              />
            </div>
          </div>
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
          <p
            className={saveState === "error" ? "is-error" : ""}
            aria-live="polite"
          >
            {message}
            {!isSignedIn && message.startsWith("Create a free account") ? (
              <>
                {" "}
                <Link href="/account">Create account</Link>
              </>
            ) : null}
          </p>
        </div>
      </div>
    </section>
  );
}
