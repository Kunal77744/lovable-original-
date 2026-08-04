"use client";

import { useState } from "react";
import {
  MAX_PRACTICE_SOLUTION_NOTE_LENGTH,
  type SavedPracticeSolutionNote,
} from "@/lib/practice-solution-note";

type PracticeSolutionNoteProps = {
  problemSlug: string;
  initialNote: SavedPracticeSolutionNote | null;
};

export function PracticeSolutionNote({
  problemSlug,
  initialNote,
}: PracticeSolutionNoteProps) {
  const [content, setContent] = useState(initialNote?.content ?? "");
  const [savedContent, setSavedContent] = useState(initialNote?.content ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isError, setIsError] = useState(false);
  const [message, setMessage] = useState(
    initialNote
      ? "Your solution note is back. Revise it as your understanding improves."
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
    setMessage("Saving your solution note…");

    try {
      const response = await fetch(`/api/practice/${problemSlug}/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const payload = (await response.json()) as {
        error?: string;
        note?: SavedPracticeSolutionNote;
      };

      if (!response.ok || !payload.note) {
        setIsError(true);
        setMessage(payload.error ?? "We couldn’t save your note. Try again.");
        return;
      }

      setContent(payload.note.content);
      setSavedContent(payload.note.content);
      setMessage(
        hasSavedNote
          ? "Changes saved. This note will return with your account."
          : "Solution note saved. It will return with your account.",
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
      className="practice-solution-note"
      aria-labelledby={`solution-note-title-${problemSlug}`}
    >
      <div className="practice-solution-note-heading">
        <div>
          <p className="quiz-kicker">Private solution note</p>
          <h3 id={`solution-note-title-${problemSlug}`}>
            Explain why your solution works.
          </h3>
          <p>
            Record the idea you would reuse on a similar problem, while the
            reasoning is still fresh.
          </p>
        </div>
        <span>{hasSavedNote ? "Saved reflection" : "After Accepted"}</span>
      </div>

      <label
        className="practice-solution-note-field"
        htmlFor={`solution-note-content-${problemSlug}`}
      >
        <span id={`solution-note-label-${problemSlug}`}>
          What would you want to remember next time?
        </span>
        <textarea
          id={`solution-note-content-${problemSlug}`}
          aria-labelledby={`solution-note-label-${problemSlug}`}
          maxLength={MAX_PRACTICE_SOLUTION_NOTE_LENGTH}
          value={content}
          placeholder="For example: Split the input first, convert both values to numbers, then add them."
          onChange={(event) => {
            setContent(event.target.value);
            setIsError(false);
            setMessage(
              event.target.value === savedContent
                ? "Your saved note is unchanged."
                : "You have unsaved changes.",
            );
          }}
        />
        <small>
          Keep passwords and personal information out of your note. {content.length}/
          {MAX_PRACTICE_SOLUTION_NOTE_LENGTH.toLocaleString()}
        </small>
      </label>

      <div className="practice-solution-note-save">
        <button
          type="button"
          disabled={isSaving || (!hasUnsavedChanges && hasSavedNote)}
          onClick={saveNote}
        >
          {isSaving ? "Saving…" : hasSavedNote ? "Update note" : "Save note"}
        </button>
        <p className={isError ? "is-error" : ""} aria-live="polite">
          {message}
        </p>
      </div>
    </section>
  );
}
