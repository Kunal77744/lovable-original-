"use client";

import Link from "next/link";
import { useState } from "react";
import {
  MAX_LESSON_NOTE_LENGTH,
  type SavedLessonNote,
} from "@/lib/lesson-notes";

type LessonNotesProps = {
  lessonSlug: string;
  initialNote: SavedLessonNote | null;
  isSignedIn?: boolean;
};

export function LessonNotes({
  lessonSlug,
  initialNote,
  isSignedIn = true,
}: LessonNotesProps) {
  const [content, setContent] = useState(initialNote?.content ?? "");
  const [savedContent, setSavedContent] = useState(initialNote?.content ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(
    initialNote
      ? "Your saved note is back. Revise it whenever your understanding changes."
      : "Only your account can return to this note.",
  );
  const [isError, setIsError] = useState(false);
  const hasSavedNote = savedContent.length > 0;
  const hasUnsavedChanges = content !== savedContent;

  async function saveNote() {
    if (content.trim().length === 0) {
      setIsError(true);
      setMessage("Write a note before saving.");
      return;
    }

    if (!isSignedIn) {
      setIsError(false);
      setMessage(
        "Create a free account to save this note. Your draft has not left this browser.",
      );
      return;
    }

    setIsSaving(true);
    setIsError(false);
    setMessage("Saving your note…");

    try {
      const response = await fetch(`/api/lessons/${lessonSlug}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const payload = (await response.json()) as {
        error?: string;
        note?: SavedLessonNote;
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
      className="lesson-notes"
      id="lesson-notes"
      aria-labelledby="lesson-notes-title"
    >
      <div className="lesson-notes-heading">
        <div>
          <p className="quiz-kicker">Private lesson notes</p>
          <h2 id="lesson-notes-title">Put the idea in your own words.</h2>
          <p>
            Capture the explanation, question, or example you want to remember
            before you start the assignment.
          </p>
        </div>
        <span>{hasSavedNote ? "Saved note" : "Your space"}</span>
      </div>

      <label className="lesson-notes-field">
        <span id="lesson-note-label">What do you want to remember?</span>
        <textarea
          id="lesson-note-content"
          name="lessonNote"
          aria-labelledby="lesson-note-label"
          maxLength={MAX_LESSON_NOTE_LENGTH}
          value={content}
          placeholder="For example: A semantic element explains what a region does, not how it looks."
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
          Keep passwords and personal information out of your notes.{" "}
          <span>{content.length.toLocaleString()}</span>/
          {MAX_LESSON_NOTE_LENGTH.toLocaleString()}
        </small>
      </label>

      <div className="lesson-notes-save">
        <button
          type="button"
          disabled={isSaving || (!hasUnsavedChanges && hasSavedNote)}
          onClick={saveNote}
        >
          {isSaving ? "Saving…" : hasSavedNote ? "Update note" : "Save note"}
        </button>
        <p className={isError ? "is-error" : ""} aria-live="polite">
          {message}
          {!isSignedIn && message.startsWith("Create a free account") ? (
            <>
              {" "}
              <Link href="/account">Create account</Link>
            </>
          ) : null}
        </p>
      </div>
    </section>
  );
}
