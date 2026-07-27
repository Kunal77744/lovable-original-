"use client";

import { FormEvent, useState } from "react";
import {
  MAX_COURSE_FEEDBACK_COMMENT_LENGTH,
  type CourseFeedbackUsefulness,
} from "@/lib/course-feedback";
import { captureLearnerEventOnce } from "@/lib/product-analytics";

type SavedCourseFeedback = {
  usefulness: string;
  comment: string;
  updatedAt: string;
};

type CourseFeedbackProps = {
  courseSlug: string;
  lessonSlug: string;
  initialFeedback: SavedCourseFeedback | null;
};

const usefulnessChoices: Array<{
  value: CourseFeedbackUsefulness;
  label: string;
}> = [
  { value: "not_yet", label: "Not yet" },
  { value: "somewhat", label: "Somewhat" },
  { value: "very", label: "Very useful" },
];

export function CourseFeedback({
  courseSlug,
  lessonSlug,
  initialFeedback,
}: CourseFeedbackProps) {
  const [usefulness, setUsefulness] = useState(
    (initialFeedback?.usefulness ?? "") as CourseFeedbackUsefulness | "",
  );
  const [comment, setComment] = useState(initialFeedback?.comment ?? "");
  const [savedFeedback, setSavedFeedback] = useState(initialFeedback);
  const [message, setMessage] = useState<string | null>(
    initialFeedback ? "Your feedback is saved. You can revise it anytime." : null,
  );
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const remainingCommentCharacters =
    MAX_COURSE_FEEDBACK_COMMENT_LENGTH - comment.length;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsError(false);

    if (!usefulness) {
      setIsError(true);
      setMessage("Choose how useful the lesson was.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/courses/${courseSlug}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usefulness, comment }),
      });
      const payload = (await response.json()) as {
        feedback?: SavedCourseFeedback;
        error?: string;
      };

      if (!response.ok || !payload.feedback) {
        setIsError(true);
        setMessage(payload.error ?? "We couldn’t save your feedback. Try again.");
        return;
      }

      setSavedFeedback(payload.feedback);
      setComment(payload.feedback.comment);
      setMessage("Thanks. Your feedback is saved, and you can revise it anytime.");
      captureLearnerEventOnce("feedback_submitted", {
        course_slug: courseSlug,
        lesson_slug: lessonSlug,
      });
    } catch {
      setIsError(true);
      setMessage("We couldn’t save your feedback. Check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="course-feedback">
      <div className="course-feedback-heading">
        <div>
          <p className="quiz-kicker">Optional · 30 seconds</p>
          <h3>Did this lesson help you build with more confidence?</h3>
        </div>
        {savedFeedback ? <span>Saved</span> : null}
      </div>

      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>How useful was this lesson?</legend>
          <div className="course-feedback-choices">
            {usefulnessChoices.map((choice) => (
              <label key={choice.value}>
                <input
                  type="radio"
                  name="usefulness"
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
          <span>What should we improve next? <small>Optional</small></span>
          <textarea
            aria-describedby="course-feedback-comment-note"
            value={comment}
            maxLength={MAX_COURSE_FEEDBACK_COMMENT_LENGTH}
            rows={3}
            onChange={(event) => setComment(event.target.value)}
            placeholder="One detail that felt clear, confusing, or missing"
          />
          <span
            id="course-feedback-comment-note"
            className="course-feedback-note"
          >
            <span>Don’t include passwords or personal information.</span>
            <span
              className="course-feedback-remaining"
              aria-live="polite"
              aria-atomic="true"
            >
              {remainingCommentCharacters}{" "}
              {remainingCommentCharacters === 1 ? "character" : "characters"} remaining
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
            {message ?? "Only your account can return to this response."}
          </p>
        </div>
      </form>
    </div>
  );
}
