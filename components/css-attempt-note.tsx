"use client";

import { useRef, useState } from "react";
import {
  MAX_CSS_ATTEMPT_NOTE_LENGTH,
  type SavedCssAttemptNote,
} from "@/lib/css-attempt-notes";

type CssAttemptNoteProps = {
  challengeSlug: string;
  initialNote: SavedCssAttemptNote | null;
};

export function CssAttemptNote({
  challengeSlug,
  initialNote,
}: CssAttemptNoteProps) {
  const [content, setContent] = useState(initialNote?.content ?? "");
  const latestContent = useRef(initialNote?.content ?? "");
  const [savedContent, setSavedContent] = useState(initialNote?.content ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isError, setIsError] = useState(false);
  const [message, setMessage] = useState(
    initialNote
      ? "Your saved note is back. Update it after your next attempt."
      : "Only your account can return to this note.",
  );
  const hasSavedNote = savedContent.length > 0;
  const hasUnsavedChanges = content !== savedContent;

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
      const response = await fetch(
        `/api/practice/css/${challengeSlug}/note`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: submittedContent }),
        },
      );
      const payload = (await response.json()) as {
        error?: string;
        note?: SavedCssAttemptNote;
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

  return (
    <section
      className="css-attempt-note"
      aria-labelledby="css-attempt-note-title"
    >
      <div className="css-attempt-note-intro">
        <div>
          <p className="quiz-kicker">Private attempt note</p>
          <h2 id="css-attempt-note-title">Make the next change deliberate.</h2>
        </div>
        <span>{hasSavedNote ? "Saved note" : "Your space"}</span>
        <p>
          Record what failed and the next change you want to test. This note is
          separate from your submitted CSS.
        </p>
      </div>

      <div className="css-attempt-note-editor">
        <label htmlFor="css-attempt-note-content">
          What broke, and what will you try next?
        </label>
        <textarea
          id="css-attempt-note-content"
          name="cssAttemptNote"
          maxLength={MAX_CSS_ATTEMPT_NOTE_LENGTH}
          value={content}
          placeholder="The nested link still inherits the wrong color. Next I’ll target the link inside the card."
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
        <div className="css-attempt-note-meta">
          <small>
            Keep passwords and personal information out. {content.length}/
            {MAX_CSS_ATTEMPT_NOTE_LENGTH.toLocaleString()}
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
          className={isError ? "css-attempt-note-status is-error" : "css-attempt-note-status"}
          aria-live="polite"
        >
          {message}
        </p>
      </div>
    </section>
  );
}
