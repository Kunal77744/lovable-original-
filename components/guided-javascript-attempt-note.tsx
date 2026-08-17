"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  MAX_GUIDED_JAVASCRIPT_ATTEMPT_NOTE_LENGTH,
  type SavedGuidedJavaScriptAttemptNote,
} from "@/lib/guided-javascript-attempt-notes";

type GuidedJavaScriptAttemptNoteProps = {
  labSlug: string;
  exerciseId: string;
  showEmpty: boolean;
};

export function GuidedJavaScriptAttemptNote({
  labSlug,
  exerciseId,
  showEmpty,
}: GuidedJavaScriptAttemptNoteProps) {
  const fieldId = useId();
  const [content, setContent] = useState("");
  const latestContent = useRef("");
  const [savedContent, setSavedContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isError, setIsError] = useState(false);
  const [message, setMessage] = useState(
    "Only your account can return to this note.",
  );
  const hasSavedNote = savedContent.length > 0;
  const hasUnsavedChanges = content !== savedContent;
  const endpoint = `/api/practice/labs/${encodeURIComponent(labSlug)}/${encodeURIComponent(exerciseId)}/note`;

  useEffect(() => {
    const controller = new AbortController();

    async function restoreNote() {
      setIsLoading(true);
      setLoadFailed(false);

      try {
        const response = await fetch(endpoint, { signal: controller.signal });
        const payload = (await response.json()) as {
          error?: string;
          note?: SavedGuidedJavaScriptAttemptNote | null;
        };

        if (!response.ok) {
          setLoadFailed(true);
          setIsError(true);
          setMessage(payload.error ?? "We couldn’t load your note. Try again.");
          return;
        }

        const restoredContent = payload.note?.content ?? "";
        latestContent.current = restoredContent;
        setContent(restoredContent);
        setSavedContent(restoredContent);
        setIsError(false);
        setMessage(
          payload.note
            ? "Your saved note is back. Update it after your next attempt."
            : "Only your account can return to this note.",
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadFailed(true);
        setIsError(true);
        setMessage("We couldn’t load your note. Check your connection and try again.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void restoreNote();
    return () => controller.abort();
  }, [endpoint, loadAttempt]);

  async function saveNote() {
    if (content.trim().length === 0) {
      setIsError(true);
      setMessage("Write a note before saving.");
      return;
    }

    setIsSaving(true);
    setIsError(false);
    setMessage("Saving your note…");
    const submittedContent = content;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: submittedContent }),
      });
      const payload = (await response.json()) as {
        error?: string;
        note?: SavedGuidedJavaScriptAttemptNote;
      };

      if (!response.ok || !payload.note) {
        setIsError(true);
        setMessage(payload.error ?? "We couldn’t save your note. Try again.");
        return;
      }

      setSavedContent(payload.note.content);
      if (latestContent.current !== submittedContent) {
        setMessage(
          "Your earlier note was saved. Your newer changes are still unsaved.",
        );
        return;
      }

      latestContent.current = payload.note.content;
      setContent(payload.note.content);
      setMessage(
        hasSavedNote
          ? "Changes saved. This note will return with your account."
          : "Note saved. It will return with your account.",
      );
    } catch {
      setIsError(true);
      setMessage("We couldn’t save your note. Check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || (!showEmpty && !hasSavedNote)) return null;

  if (loadFailed) {
    return (
      <section className="guided-attempt-note is-load-error" aria-live="polite">
        <div>
          <strong>Your private attempt note didn’t load.</strong>
          <p>{message}</p>
        </div>
        <button type="button" onClick={() => setLoadAttempt((value) => value + 1)}>
          Try again
        </button>
      </section>
    );
  }

  return (
    <section className="guided-attempt-note" aria-labelledby={`${fieldId}-title`}>
      <header>
        <div>
          <span>Private attempt note</span>
          <h3 id={`${fieldId}-title`}>Plan the next repair.</h3>
        </div>
        <span>{hasSavedNote ? "Saved note" : "Your space"}</span>
      </header>
      <p>
        Record what failed and the next change you want to test. This note stays
        separate from your code and check results.
      </p>

      <label htmlFor={fieldId}>What broke, and what will you try next?</label>
      <textarea
        id={fieldId}
        name="guidedJavaScriptAttemptNote"
        maxLength={MAX_GUIDED_JAVASCRIPT_ATTEMPT_NOTE_LENGTH}
        value={content}
        placeholder="The result is undefined for the second input. Next I’ll inspect the branch that should return a value."
        onChange={(event) => {
          latestContent.current = event.target.value;
          setContent(event.target.value);
          setIsError(false);
          setMessage(
            event.target.value === savedContent
              ? "Your saved note is unchanged."
              : "You have unsaved changes.",
          );
        }}
      />
      <div className="guided-attempt-note-meta">
        <small>
          Keep passwords and personal information out. {content.length}/
          {MAX_GUIDED_JAVASCRIPT_ATTEMPT_NOTE_LENGTH.toLocaleString()}
        </small>
        <button
          type="button"
          disabled={isSaving || (!hasUnsavedChanges && hasSavedNote)}
          onClick={saveNote}
        >
          {isSaving ? "Saving…" : hasSavedNote ? "Update note" : "Save note"}
        </button>
      </div>
      <p
        className={
          isError
            ? "guided-attempt-note-status is-error"
            : "guided-attempt-note-status"
        }
        aria-live="polite"
      >
        {message}
      </p>
    </section>
  );
}
