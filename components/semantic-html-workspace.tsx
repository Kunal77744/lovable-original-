"use client";

import { useMemo, useState } from "react";
import {
  buildSandboxedPreviewDocument,
  type SemanticHtmlCheck,
} from "@/lib/semantic-html-workspace";

type SemanticHtmlWorkspaceProps = {
  lessonSlug: string;
  initialHtml: string;
  initialChecks: SemanticHtmlCheck[];
  initiallySaved: boolean;
};

type WorkspaceResponse = {
  html: string;
  checks: SemanticHtmlCheck[];
  saved: boolean;
  updatedAt: string | null;
  error?: string;
};

export function SemanticHtmlWorkspace({
  lessonSlug,
  initialHtml,
  initialChecks,
  initiallySaved,
}: SemanticHtmlWorkspaceProps) {
  const [html, setHtml] = useState(initialHtml);
  const [checks, setChecks] = useState(initialChecks);
  const [saveState, setSaveState] = useState<
    "saved" | "unsaved" | "saving" | "error"
  >(initiallySaved ? "saved" : "unsaved");
  const [message, setMessage] = useState(
    initiallySaved
      ? "Your last saved draft is restored."
      : "Starter code is ready. Save when you want to keep your work.",
  );
  const previewDocument = useMemo(
    () => buildSandboxedPreviewDocument(html),
    [html],
  );
  const passedCount = checks.filter((check) => check.passed).length;

  async function saveWorkspace() {
    setSaveState("saving");
    setMessage("Saving and checking your structure…");

    try {
      const response = await fetch(`/api/lessons/${lessonSlug}/workspace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      });
      const payload = (await response.json()) as WorkspaceResponse;

      if (!response.ok) {
        setSaveState("error");
        setMessage(payload.error ?? "The draft could not be saved. Try again.");
        return;
      }

      setChecks(payload.checks);
      setSaveState("saved");
      const newPassedCount = payload.checks.filter((check) => check.passed).length;
      setMessage(
        newPassedCount === payload.checks.length
          ? "Saved to your account. All five structure checks pass."
          : `Saved to your account. ${newPassedCount} of ${payload.checks.length} structure checks pass.`,
      );
    } catch {
      setSaveState("error");
      setMessage("The draft could not be saved. Check your connection and try again.");
    }
  }

  return (
    <section className="lesson-workspace" id="semantic-workspace">
      <header className="workspace-heading">
        <div>
          <p className="quiz-kicker">Build inside the lesson</p>
          <h2>Turn the outline into a real page.</h2>
          <p>
            Write the semantic structure on the left. The preview updates as you
            type, and your saved draft comes back after reload or sign-in.
          </p>
        </div>
        <div className="workspace-score" aria-label={`${passedCount} of 5 checks pass`}>
          <strong>{passedCount}/5</strong>
          <span>checks pass</span>
        </div>
      </header>

      <div className="workspace-panels">
        <div className="workspace-editor">
          <div className="workspace-panel-label">
            <span>index.html</span>
            <span>{saveState === "saved" ? "Saved" : "Draft"}</span>
          </div>
          <label htmlFor="semantic-html-editor">Semantic HTML</label>
          <textarea
            id="semantic-html-editor"
            value={html}
            onChange={(event) => {
              setHtml(event.target.value);
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
            title="Semantic HTML live preview"
          />
        </div>
      </div>

      <div className="workspace-review">
        <div className="workspace-checks">
          {checks.map((check) => (
            <div
              className={check.passed ? "workspace-check is-passed" : "workspace-check"}
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
        <div className="workspace-save">
          <button
            className="lesson-primary-action"
            type="button"
            onClick={saveWorkspace}
            disabled={saveState === "saving"}
          >
            {saveState === "saving" ? "Saving…" : "Save & check"}
          </button>
          <p className={saveState === "error" ? "is-error" : ""} aria-live="polite">
            {message}
          </p>
        </div>
      </div>
    </section>
  );
}
