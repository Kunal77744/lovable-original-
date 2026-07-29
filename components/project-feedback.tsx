"use client";

import { FormEvent, useState } from "react";
import {
  MAX_PROJECT_FEEDBACK_COMMENT_LENGTH,
  type ProjectFeedbackConfidence,
  type SavedProjectFeedback,
} from "@/lib/project-feedback";

type ProjectFeedbackProps = {
  projectSlug: string;
  initialFeedback: SavedProjectFeedback | null;
};

const confidenceChoices: Array<{
  value: ProjectFeedbackConfidence;
  label: string;
}> = [
  { value: "not_yet", label: "Not yet" },
  { value: "somewhat", label: "Somewhat" },
  { value: "confident", label: "Confident" },
];

export function ProjectFeedback({
  projectSlug,
  initialFeedback,
}: ProjectFeedbackProps) {
  const [confidence, setConfidence] = useState<
    ProjectFeedbackConfidence | ""
  >(initialFeedback?.confidence ?? "");
  const [comment, setComment] = useState(initialFeedback?.comment ?? "");
  const [savedFeedback, setSavedFeedback] = useState(initialFeedback);
  const [message, setMessage] = useState<string | null>(
    initialFeedback
      ? "Your private feedback is saved. You can revise it anytime."
      : null,
  );
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const remainingCommentCharacters =
    MAX_PROJECT_FEEDBACK_COMMENT_LENGTH - comment.length;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsError(false);

    if (!confidence) {
      setIsError(true);
      setMessage("Choose how confident you feel after this project.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/projects/${projectSlug}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confidence, comment }),
      });
      const payload = (await response.json()) as {
        feedback?: SavedProjectFeedback;
        error?: string;
      };

      if (!response.ok || !payload.feedback) {
        setIsError(true);
        setMessage(payload.error ?? "We couldn’t save your feedback. Try again.");
        return;
      }

      setSavedFeedback(payload.feedback);
      setComment(payload.feedback.comment);
      setMessage(
        "Thanks. Your private feedback is saved, and you can revise it anytime.",
      );
    } catch {
      setIsError(true);
      setMessage(
        "We couldn’t save your feedback. Check your connection and try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section
      className="course-feedback project-feedback"
      aria-labelledby="project-feedback-title"
    >
      <div className="course-feedback-heading">
        <div>
          <p className="quiz-kicker">Optional · private</p>
          <h3 id="project-feedback-title">
            What felt confusing while you built this?
          </h3>
        </div>
        {savedFeedback ? <span>Saved</span> : null}
      </div>

      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>
            Could you build another semantic HTML page on your own?
          </legend>
          <div className="course-feedback-choices">
            {confidenceChoices.map((choice) => (
              <label key={choice.value}>
                <input
                  type="radio"
                  name="project-confidence"
                  value={choice.value}
                  checked={confidence === choice.value}
                  onChange={() => setConfidence(choice.value)}
                />
                <span>{choice.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="course-feedback-comment">
          <span>
            Where did you hesitate? <small>Optional</small>
          </span>
          <textarea
            aria-describedby="project-feedback-comment-note"
            value={comment}
            maxLength={MAX_PROJECT_FEEDBACK_COMMENT_LENGTH}
            rows={3}
            onChange={(event) => setComment(event.target.value)}
            placeholder="One step, check, or idea that felt unclear"
          />
          <span
            id="project-feedback-comment-note"
            className="course-feedback-note"
          >
            <span>
              Saved only to your account. Don’t include personal information.
            </span>
            <span
              className="course-feedback-remaining"
              aria-live="polite"
              aria-atomic="true"
            >
              {remainingCommentCharacters}{" "}
              {remainingCommentCharacters === 1
                ? "character"
                : "characters"}{" "}
              remaining
            </span>
          </span>
        </label>

        <div className="course-feedback-submit">
          <button type="submit" disabled={isSaving}>
            {isSaving
              ? "Saving…"
              : savedFeedback
                ? "Update feedback"
                : "Save feedback"}
          </button>
          <p className={isError ? "is-error" : ""} aria-live="polite">
            {message ?? "Your response stays private and out of analytics."}
          </p>
        </div>
      </form>
    </section>
  );
}
