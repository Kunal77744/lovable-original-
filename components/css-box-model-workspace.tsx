"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  buildCssBoxModelPreview,
  explainCssBoxModel,
  type CssPracticeCheck,
} from "@/lib/css-box-model-practice";

type CssBoxModelWorkspaceProps = {
  lessonSlug: string;
  initialCss: string;
  initialChecks: CssPracticeCheck[];
  initiallySaved: boolean;
  isSignedIn?: boolean;
};

type WorkspaceResponse = {
  html: string;
  checks: CssPracticeCheck[];
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

export function CssBoxModelWorkspace({
  lessonSlug,
  initialCss,
  initialChecks,
  initiallySaved,
  isSignedIn = true,
}: CssBoxModelWorkspaceProps) {
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
        ? "Saved practice restored. All four CSS checks pass."
        : "Saved practice restored. Revise the open checks and save again."
      : "Starter CSS is ready. Save when the card feels predictable.",
  );
  const previewDocument = useMemo(() => buildCssBoxModelPreview(css), [css]);
  const boxModel = useMemo(() => explainCssBoxModel(css), [css]);
  const passedCount = checks.filter((check) => check.passed).length;
  const hasExactWidth = boxModel.renderedWidthPx !== null;
  const addedWidth =
    boxModel.paddingInlinePx !== null && boxModel.borderInlinePx !== null
      ? boxModel.paddingInlinePx + boxModel.borderInlinePx
      : null;
  const widthStatus = !hasExactWidth
    ? "Use px for an exact width total."
    : boxModel.boxSizing === "border-box"
      ? `Padding and border stay inside ${boxModel.renderedWidthPx}px.`
      : addedWidth !== null && addedWidth > 0
        ? `The card is ${addedWidth}px wider than its declared width.`
        : "No horizontal padding or border is added outside this width.";

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
    setMessage("Checking the selectors and saving your CSS…");

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
      setMessage("The CSS could not be saved. Check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="lesson-workspace css-practice-workspace" id="css-practice">
      <header className="workspace-heading">
        <div>
          <p className="quiz-kicker">Saved practice · CSS box model</p>
          <h2>Make one card hold its shape.</h2>
          <p>
            Finish the two selectors, keep padding inside the declared width,
            and give the card a visible edge. The preview updates as you type.
          </p>
          <div className="assignment-outcome">
            <span>Expected outcome</span>
            <strong>
              One 280px learning card that passes all four selector and box-model
              checks.
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
            <span>card.css</span>
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
          <label htmlFor="css-box-model-editor">Card CSS</label>
          <textarea
            id="css-box-model-editor"
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
          <iframe
            sandbox=""
            referrerPolicy="no-referrer"
            srcDoc={previewDocument}
            title="CSS box model live preview"
          />
        </div>
      </div>

      <section
        className="css-box-model-inspector"
        aria-labelledby="css-box-model-inspector-title"
      >
        <header className="css-box-model-inspector-heading">
          <div>
            <p className="quiz-kicker">Live box model</p>
            <h3 id="css-box-model-inspector-title">
              See where the card&apos;s width goes.
            </h3>
            <p>
              This browser-only view reads your <code>.learning-card</code> rule as
              you type. It does not change your code or saved result.
            </p>
          </div>
          <output
            className={
              boxModel.boxSizing === "border-box"
                ? "css-box-model-total is-contained"
                : "css-box-model-total"
            }
            aria-live="polite"
          >
            <span>Rendered width</span>
            <strong>
              {boxModel.renderedWidthPx === null
                ? "Not exact"
                : `${boxModel.renderedWidthPx}px`}
            </strong>
            <small>{boxModel.boxSizing}</small>
          </output>
        </header>

        <div className="css-box-model-inspector-body">
          <div
            className="css-box-model-live-diagram"
            aria-label={`The card uses ${boxModel.borderInline} horizontal border, ${boxModel.paddingInline} horizontal padding, and ${boxModel.contentWidthPx === null ? "an unknown" : `${boxModel.contentWidthPx}px`} content width.`}
          >
            <div className="css-box-model-live-border">
              <span>
                Border
                <strong>
                  {boxModel.borderInlinePx === null
                    ? boxModel.borderInline
                    : `${boxModel.borderInlinePx}px total`}
                </strong>
              </span>
              <div className="css-box-model-live-padding">
                <span>
                  Padding
                  <strong>
                    {boxModel.paddingInlinePx === null
                      ? boxModel.paddingInline
                      : `${boxModel.paddingInlinePx}px total`}
                  </strong>
                </span>
                <div className="css-box-model-live-content">
                  <span>Content</span>
                  <strong>
                    {boxModel.contentWidthPx === null
                      ? "Not exact"
                      : `${boxModel.contentWidthPx}px`}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="css-box-model-math">
            <p className="quiz-kicker">Width check</p>
            {hasExactWidth &&
            boxModel.widthPx !== null &&
            boxModel.paddingInlinePx !== null &&
            boxModel.borderInlinePx !== null ? (
              boxModel.boxSizing === "border-box" ? (
                <p className="css-box-model-equation">
                  <strong>{boxModel.widthPx}px total</strong>
                  <span>=</span>
                  <span>{boxModel.contentWidthPx}px content</span>
                  <span>+</span>
                  <span>{boxModel.paddingInlinePx}px padding</span>
                  <span>+</span>
                  <span>{boxModel.borderInlinePx}px border</span>
                </p>
              ) : (
                <p className="css-box-model-equation">
                  <span>{boxModel.widthPx}px content</span>
                  <span>+</span>
                  <span>{boxModel.paddingInlinePx}px padding</span>
                  <span>+</span>
                  <span>{boxModel.borderInlinePx}px border</span>
                  <span>=</span>
                  <strong>{boxModel.renderedWidthPx}px total</strong>
                </p>
              )
            ) : (
              <p className="css-box-model-equation">
                <span>{boxModel.width} width</span>
                <span>+</span>
                <span>{boxModel.paddingInline} padding</span>
                <span>+</span>
                <span>{boxModel.borderInline} border</span>
              </p>
            )}
            <p className="css-box-model-explanation">{widthStatus}</p>
          </div>
        </div>
      </section>

      <div className="workspace-review">
        <div className="workspace-rubric">
          <div className="workspace-rubric-heading">
            <div>
              <p className="quiz-kicker">Practice checks</p>
              <h3>Four choices, checked on the server.</h3>
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
          <p className={saveState === "error" ? "is-error" : ""} aria-live="polite">
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
