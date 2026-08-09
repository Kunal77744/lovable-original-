"use client";

import { FormEvent, useRef, useState } from "react";
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
  const latestUsefulness = useRef<CourseFeedbackUsefulness | "">(
    (initialFeedback?.usefulness ?? "") as CourseFeedbackUsefulness | "",
  );
  const latestComment = useRef(initialFeedback?.comment ?? "");
  const [savedFeedback, setSavedFeedback] = useState(initialFeedback);
  const [message, setMessage] = useState<string | null>(
    initialFeedback ? "Your feedback is saved. You can revise it anytime." : null,
  );
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const firstUsefulnessChoiceRef = useRef<HTMLInputElement>(null);
  const remainingCommentCharacters =
    MAX_COURSE_FEEDBACK_COMMENT_LENGTH - comment.length;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsError(false);

    if (!latestUsefulness.current) {
      setIsError(true);
      setMessage("Choose how useful the lesson was.");
      firstUsefulnessChoiceRef.current?.focus();
      return;
    }

    const submittedUsefulness = latestUsefulness.current;
    const submittedComment = latestComment.current;
    setIsSaving(true);

    try {
      const response = await fetch(`/api/courses/${courseSlug}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usefulness: submittedUsefulness,
          comment: submittedComment,
        }),
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
      captureLearnerEventOnce("feedback_submitted", {
        course_slug: courseSlug,
        lesson_slug: lessonSlug,
      });

      if (
        latestUsefulness.current !== submittedUsefulness ||
        latestComment.current !== submittedComment
      ) {
        setMessage(
          "Your earlier feedback is saved. Newer changes are still unsaved.",
        );
        return;
      }

      const savedUsefulness = payload.feedback
        .usefulness as CourseFeedbackUsefulness;
      latestUsefulness.current = savedUsefulness;
      latestComment.current = payload.feedback.comment;
      setUsefulness(savedUsefulness);
      setComment(payload.feedback.comment);
      setMessage("Thanks. Your feedback is saved, and you can revise it anytime.");
    } catch {
      setIsError(true);
      setMessage("We couldn’t save your feedback. Check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section
      className="course-feedback"
      aria-labelledby="course-feedback-title"
    >
      <div className="course-feedback-heading">
        <div>
          <p className="quiz-kicker">Optional · 30 seconds</p>
          <h3 id="course-feedback-title">
            Did this lesson help you build with more confidence?
          </h3>
        </div>
        {savedFeedback ? <span>Saved</span> : null}
      </div>

      <form onSubmit={handleSubmit} aria-busy={isSaving}>
        <fieldset>
          <legend>How useful was this lesson?</legend>
          <div className="course-feedback-choices">
            {usefulnessChoices.map((choice) => (
              <label key={choice.value}>
                <input
                  ref={
                    choice.value === "not_yet"
                      ? firstUsefulnessChoiceRef
                      : undefined
                  }
                  type="radio"
                  name="usefulness"
                  value={choice.value}
                  checked={usefulness === choice.value}
                  aria-describedby={
                    isError && !usefulness ? "course-feedback-status" : undefined
                  }
                  onChange={() => {
                    latestUsefulness.current = choice.value;
                    setUsefulness(choice.value);
                  }}
                />
                <span>{choice.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="course-feedback-comment">
          <label htmlFor="course-feedback-comment">
            What should we improve next? <small>Optional</small>
          </label>
          <textarea
            id="course-feedback-comment"
            name="comment"
            aria-describedby="course-feedback-comment-help course-feedback-comment-count"
            value={comment}
            maxLength={MAX_COURSE_FEEDBACK_COMMENT_LENGTH}
            rows={3}
            onChange={(event) => {
              latestComment.current = event.target.value;
              setComment(event.target.value);
            }}
            placeholder="One detail that felt clear, confusing, or missing"
          />
          <span className="course-feedback-note">
            <span id="course-feedback-comment-help">
              Don’t include passwords or personal information.
            </span>
            <span
              id="course-feedback-comment-count"
              className="course-feedback-remaining"
              aria-live="polite"
              aria-atomic="true"
            >
              {remainingCommentCharacters}{" "}
              {remainingCommentCharacters === 1 ? "character" : "characters"} remaining
            </span>
          </span>
        </div>

        <div className="course-feedback-submit">
          <button type="submit" disabled={isSaving}>
            {isSaving
              ? "Saving…"
              : savedFeedback
                ? "Update feedback"
                : "Save feedback"}
          </button>
          <p
            id="course-feedback-status"
            className={isError ? "is-error" : ""}
            role={isError ? "alert" : "status"}
            aria-atomic="true"
          >
            {message ?? "Only your account can return to this response."}
          </p>
        </div>
      </form>
    </section>
  );
}
