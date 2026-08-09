"use client";

import { useRef, useState } from "react";
import {
  MAX_PRACTICE_JOURNAL_FIELD_LENGTH,
  MAX_PRACTICE_SOLUTION_NOTE_LENGTH,
  parsePracticeJournal,
  serializePracticeJournal,
  type PracticeJournal,
  type SavedPracticeSolutionNote,
} from "@/lib/practice-solution-note";

type PracticeSolutionNoteProps = {
  problemSlug: string;
  initialNote: SavedPracticeSolutionNote | null;
  isAccepted: boolean;
};

const PLAN_FIELDS = [
  {
    key: "inputShape" as const,
    number: "01",
    label: "Input shape",
    prompt: "What does solve(input) receive?",
    placeholder: "For example: Two integers separated by one space.",
  },
  {
    key: "edgeCase" as const,
    number: "02",
    label: "Edge case",
    prompt: "Which input could break your first idea?",
    placeholder: "For example: Negative values or extra whitespace.",
  },
  {
    key: "steps" as const,
    number: "03",
    label: "Ordered approach",
    prompt: "What will your function do, in order?",
    placeholder: "For example: Split, convert both values, add, then return.",
  },
];

const EMPTY_JOURNAL_CONTENT = serializePracticeJournal(parsePracticeJournal(""));

export function PracticeSolutionNote({
  problemSlug,
  initialNote,
  isAccepted,
}: PracticeSolutionNoteProps) {
  const initialJournal = parsePracticeJournal(initialNote?.content ?? "");
  const [journal, setJournal] = useState(initialJournal);
  const latestJournal = useRef(initialJournal);
  const [savedJournal, setSavedJournal] = useState(initialJournal);
  const [isSaving, setIsSaving] = useState(false);
  const [isError, setIsError] = useState(false);
  const [message, setMessage] = useState(
    initialNote
      ? "Your private journal is back with this account."
      : isAccepted
        ? "Add what worked while the reasoning is still fresh."
        : "Save a plan now, then compare it with the solution that passes.",
  );
  const serializedJournal = serializePracticeJournal(journal);
  const serializedSavedJournal = serializePracticeJournal(savedJournal);
  const hasSavedJournal =
    initialNote !== null || serializedSavedJournal !== EMPTY_JOURNAL_CONTENT;
  const hasUnsavedChanges = serializedJournal !== serializedSavedJournal;
  const hasCompletePlan = PLAN_FIELDS.every(
    ({ key }) => journal[key].trim().length > 0,
  );

  function updateField(field: keyof PracticeJournal, value: string) {
    const nextJournal = { ...journal, [field]: value };
    latestJournal.current = nextJournal;
    setJournal(nextJournal);
    setIsError(false);
    setMessage(
      serializePracticeJournal(nextJournal) === serializedSavedJournal
        ? "Your saved journal is unchanged."
        : "You have unsaved journal changes.",
    );
  }

  async function saveJournal() {
    const submittedJournal = latestJournal.current;
    const submittedContent = serializePracticeJournal(submittedJournal);
    const submittedPlanIsComplete = PLAN_FIELDS.every(
      ({ key }) => submittedJournal[key].trim().length > 0,
    );

    if (!isAccepted && !submittedPlanIsComplete) {
      setIsError(true);
      setMessage("Name the input shape, one edge case, and your ordered approach.");
      return;
    }

    if (
      isAccepted &&
      !submittedPlanIsComplete &&
      submittedJournal.reflection.trim().length === 0
    ) {
      setIsError(true);
      setMessage("Complete the plan or add your post-Accepted reflection.");
      return;
    }

    if (submittedContent.length > MAX_PRACTICE_SOLUTION_NOTE_LENGTH) {
      setIsError(true);
      setMessage("Shorten your journal before saving.");
      return;
    }

    setIsSaving(true);
    setIsError(false);
    setMessage("Saving your private journal…");

    try {
      const response = await fetch(`/api/practice/${problemSlug}/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: submittedContent }),
      });
      const payload = (await response.json()) as {
        error?: string;
        note?: SavedPracticeSolutionNote;
      };

      if (!response.ok || !payload.note) {
        setIsError(true);
        setMessage(payload.error ?? "We couldn’t save your journal. Try again.");
        return;
      }

      const saved = parsePracticeJournal(payload.note.content);
      setSavedJournal(saved);

      if (serializePracticeJournal(latestJournal.current) !== submittedContent) {
        setMessage(
          "Your earlier journal is saved. Newer writing is still unsaved.",
        );
        return;
      }

      latestJournal.current = saved;
      setJournal(saved);
      setMessage(
        isAccepted
          ? "Journal saved. Your plan and reflection will return together."
          : "Plan saved. Return after Accepted to compare it with what worked.",
      );
    } catch {
      setIsError(true);
      setMessage(
        "We couldn’t save your journal. Check your connection and try again.",
      );
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
          <p className="quiz-kicker">Private problem journal</p>
          <h3 id={`solution-note-title-${problemSlug}`}>
            {isAccepted
              ? "Compare your plan with what passed."
              : "Plan the behavior before the syntax."}
          </h3>
          <p>
            {isAccepted
              ? "Keep the original reasoning, then record why the solution worked and what you would avoid next time."
              : "Name the input, pressure-test one edge case, and order the steps before you start changing code."}
          </p>
        </div>
        <span>{isAccepted ? "Stage 2 · Reflect" : "Stage 1 · Plan"}</span>
      </div>

      <div className="practice-journal-stage" aria-label="Journal stages">
        <span className={hasCompletePlan ? "is-complete" : "is-active"}>
          Plan
        </span>
        <i aria-hidden="true" />
        <span
          className={
            savedJournal.reflection.trim().length > 0
              ? "is-complete"
              : isAccepted
                ? "is-active"
                : ""
          }
        >
          Reflect
        </span>
      </div>

      <div className="practice-journal-fields">
        {PLAN_FIELDS.map((field) => (
          <label
            className="practice-journal-field"
            htmlFor={`solution-note-${field.key}-${problemSlug}`}
            key={field.key}
          >
            <span aria-hidden="true">{field.number}</span>
            <strong>{field.label}</strong>
            <small>{field.prompt}</small>
            <textarea
              id={`solution-note-${field.key}-${problemSlug}`}
              aria-label={field.label}
              maxLength={MAX_PRACTICE_JOURNAL_FIELD_LENGTH[field.key]}
              value={journal[field.key]}
              placeholder={field.placeholder}
              onChange={(event) => updateField(field.key, event.target.value)}
            />
          </label>
        ))}
      </div>

      {isAccepted ? (
        <label
          className="practice-solution-note-field practice-journal-reflection"
          htmlFor={`solution-note-reflection-${problemSlug}`}
        >
          <span>Post-Accepted reflection</span>
          <small>
            Why did this approach pass, and which common mistake will you avoid?
          </small>
          <textarea
            id={`solution-note-reflection-${problemSlug}`}
            aria-label="Post-Accepted reflection"
            maxLength={MAX_PRACTICE_JOURNAL_FIELD_LENGTH.reflection}
            value={journal.reflection}
            placeholder="For example: Converting both tokens before addition avoided string concatenation."
            onChange={(event) => updateField("reflection", event.target.value)}
          />
        </label>
      ) : null}

      <div className="practice-solution-note-save">
        <button
          type="button"
          disabled={isSaving || (!hasUnsavedChanges && hasSavedJournal)}
          onClick={saveJournal}
        >
          {isSaving
            ? "Saving…"
            : isAccepted
              ? hasSavedJournal
                ? "Update journal"
                : "Save journal"
              : hasSavedJournal
                ? "Update plan"
                : "Save plan"}
        </button>
        <p className={isError ? "is-error" : ""} aria-live="polite">
          {message}
        </p>
      </div>
      <p className="practice-journal-privacy">
        Private to your account. Keep passwords and personal information out.
      </p>
    </section>
  );
}
