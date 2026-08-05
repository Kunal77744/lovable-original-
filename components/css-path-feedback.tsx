"use client";

import { FormEvent, useState } from "react";
import {
  MAX_CSS_PATH_FEEDBACK_COMMENT_LENGTH,
  type CssPathFeedbackUsefulness,
  type SavedCssPathFeedback,
} from "@/lib/css-path-feedback";
import { captureCssPathFeedbackSubmitted } from "@/lib/product-analytics";

type CssPathFeedbackProps = {
  initialFeedback: SavedCssPathFeedback | null;
};

const usefulnessChoices: Array<{
  value: CssPathFeedbackUsefulness;
  label: string;
}> = [
  { value: "not_yet", label: "Not yet" },
  { value: "somewhat", label: "Somewhat" },
  { value: "very", label: "Very useful" },
];

export function CssPathFeedback({ initialFeedback }: CssPathFeedbackProps) {
  const [usefulness, setUsefulness] = useState<CssPathFeedbackUsefulness | "">(
    initialFeedback?.usefulness ?? "",
  );
  const [comment, setComment] = useState(initialFeedback?.comment ?? "");
  const [savedFeedback, setSavedFeedback] = useState(initialFeedback);
  const [message, setMessage] = useState<string | null>(
    initialFeedback
      ? "Your private response is saved. You can revise it anytime."
      : null,
  );
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const remainingCommentCharacters =
    MAX_CSS_PATH_FEEDBACK_COMMENT_LENGTH - comment.length;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsError(false);

    if (!usefulness) {
      setIsError(true);
      setMessage("Choose how useful the CSS path felt.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/practice/css/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usefulness, comment }),
      });
      const payload = (await response.json()) as {
        feedback?: SavedCssPathFeedback;
        error?: string;
      };

      if (!response.ok || !payload.feedback) {
        setIsError(true);
        setMessage(
          payload.error ?? "We couldn’t save your response. Try again.",
        );
        return;
      }

      setSavedFeedback(payload.feedback);
      setComment(payload.feedback.comment);
      setMessage(
        "Thanks. Your private response is saved, and you can revise it anytime.",
      );
      captureCssPathFeedbackSubmitted(payload.feedback.usefulness);
    } catch {
      setIsError(true);
      setMessage(
        "We couldn’t save your response. Check your connection and try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section
      className="course-feedback practice-feedback css-path-feedback"
      aria-labelledby="css-path-feedback-title"
    >
      <div className="course-feedback-heading">
        <div>
          <p className="quiz-kicker">CSS path complete · optional · private</p>
          <h3 id="css-path-feedback-title">Did this path make CSS clearer?</h3>
        </div>
        {savedFeedback ? <span>Saved</span> : null}
      </div>

      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>How useful was the six-challenge path?</legend>
          <div className="course-feedback-choices">
            {usefulnessChoices.map((choice) => (
              <label key={choice.value}>
                <input
                  type="radio"
                  name="css-path-usefulness"
                  value={choice.value}
                  checked={usefulness === choice.value}
                  onChange={() => setUsefulness(choice.value)}
                />
                <span>{choice.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="course-feedback-comment">
          <span>
            What helped or got in the way? <small>Optional</small>
          </span>
          <textarea
            aria-describedby="css-path-feedback-comment-note"
            value={comment}
            maxLength={MAX_CSS_PATH_FEEDBACK_COMMENT_LENGTH}
            rows={3}
            onChange={(event) => setComment(event.target.value)}
            placeholder="One detail about the challenges, checks, or explanations"
          />
          <span
            id="css-path-feedback-comment-note"
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
              {remainingCommentCharacters === 1 ? "character" : "characters"}{" "}
              remaining
            </span>
          </span>
        </label>

        <div className="course-feedback-submit">
          <button type="submit" disabled={isSaving}>
            {isSaving
              ? "Saving…"
              : savedFeedback
                ? "Update response"
                : "Save response"}
          </button>
          <p className={isError ? "is-error" : ""} aria-live="polite">
            {message ??
              "Analytics receive the choice only, never your CSS or comment."}
          </p>
        </div>
      </form>
    </section>
  );
}
