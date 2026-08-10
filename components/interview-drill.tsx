"use client";

import Link from "next/link";
import { useState } from "react";
import {
  INTERVIEW_SELF_RATINGS,
  JAVASCRIPT_INTERVIEW_DRILL,
  type InterviewDrillProgress,
  type InterviewSelfRating,
} from "@/lib/interview-drill";

type InterviewDrillProps = {
  initialProgress: InterviewDrillProgress;
};

type ProgressResponse = {
  progress?: InterviewDrillProgress;
  error?: string;
};

function getQuestionPositionLabel(questionSlug: string) {
  const questionIndex = JAVASCRIPT_INTERVIEW_DRILL.questions.findIndex(
    (question) => question.slug === questionSlug,
  );

  return `Question ${questionIndex + 1} of ${JAVASCRIPT_INTERVIEW_DRILL.questions.length}`;
}

function getAnswersToReview(progress: InterviewDrillProgress) {
  return JAVASCRIPT_INTERVIEW_DRILL.questions.flatMap((question) => {
    const savedAnswer = progress.answers.find(
      (answer) => answer.questionSlug === question.slug,
    );

    return savedAnswer && savedAnswer.rating !== "ready" ? [savedAnswer] : [];
  });
}

export function InterviewDrill({ initialProgress }: InterviewDrillProps) {
  const [progress, setProgress] = useState(initialProgress);
  const [answer, setAnswer] = useState("");
  const [rating, setRating] = useState<InterviewSelfRating | "">("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [reviewQueue, setReviewQueue] = useState<string[]>([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const totalQuestions = JAVASCRIPT_INTERVIEW_DRILL.questions.length;
  const answeredCount = progress.answers.length;
  const remainingQuestionCount = Math.max(
    totalQuestions - answeredCount,
    0,
  );
  const remainingQuestionLabel = `${remainingQuestionCount} ${
    remainingQuestionCount === 1 ? "question" : "questions"
  } remaining`;
  const reviewQuestionSlug = reviewQueue[0] ?? null;
  const isReviewing =
    progress.status === "completed" && reviewQuestionSlug !== null;
  const question =
    (reviewQuestionSlug
      ? JAVASCRIPT_INTERVIEW_DRILL.questions.find(
          (candidate) => candidate.slug === reviewQuestionSlug,
        )
      : null) ??
    JAVASCRIPT_INTERVIEW_DRILL.questions[progress.currentQuestion] ??
    JAVASCRIPT_INTERVIEW_DRILL.questions[0];
  const currentQuestionPosition = getQuestionPositionLabel(question.slug);

  function loadReviewAnswer(
    questionSlug: string,
    nextProgress: InterviewDrillProgress,
  ) {
    const savedAnswer = nextProgress.answers.find(
      (candidate) => candidate.questionSlug === questionSlug,
    );

    if (!savedAnswer) {
      return false;
    }

    setAnswer(savedAnswer.answer);
    setRating(savedAnswer.rating);
    return true;
  }

  function startReview() {
    const answersToReview = getAnswersToReview(progress);
    const firstAnswer = answersToReview[0];

    if (!firstAnswer) {
      return;
    }

    const nextQueue = answersToReview.map(
      (savedAnswer) => savedAnswer.questionSlug,
    );
    setReviewQueue(nextQueue);
    setReviewTotal(nextQueue.length);
    setAnswer(firstAnswer.answer);
    setRating(firstAnswer.rating);
    setMessage("");
  }

  function returnToSummary() {
    setReviewQueue([]);
    setReviewTotal(0);
    setAnswer("");
    setRating("");
    setMessage("Review paused. Your saved answers are unchanged.");
  }

  async function postProgress(
    payload: Record<string, unknown>,
    pendingMessage: string,
  ) {
    setIsSaving(true);
    setMessage(pendingMessage);

    try {
      const response = await fetch(
        `/api/interview/${JAVASCRIPT_INTERVIEW_DRILL.slug}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = (await response.json()) as ProgressResponse;

      if (!response.ok || !result.progress) {
        setMessage(result.error ?? "Your answer wasn’t saved. Try again.");
        return null;
      }

      setProgress(result.progress);
      return result.progress;
    } catch {
      setMessage("Your answer wasn’t saved. Check your connection and try again.");
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function startDrill() {
    const nextProgress = await postProgress(
      { action: "start" },
      "Starting the drill…",
    );

    if (nextProgress) {
      setMessage("Drill started. Each answer saves to your account.");
    }
  }

  async function saveAnswer() {
    if (!answer.trim()) {
      setMessage("Write an answer before saving this question.");
      return;
    }

    if (!rating) {
      setMessage("Compare your answer with the rubric and choose one rating.");
      return;
    }

    const nextProgress = await postProgress(
      {
        action: "save-answer",
        questionSlug: question.slug,
        answer,
        rating,
      },
      "Saving your answer…",
    );

    if (nextProgress) {
      if (isReviewing) {
        const nextQueue = reviewQueue.slice(1);
        const nextQuestionSlug = nextQueue[0];

        if (
          nextQuestionSlug &&
          loadReviewAnswer(nextQuestionSlug, nextProgress)
        ) {
          setReviewQueue(nextQueue);
          setMessage("Answer updated. Next review question.");
          return;
        }

        const remainingAnswers = getAnswersToReview(nextProgress);
        const refreshedQueue = remainingAnswers.map(
          (savedAnswer) => savedAnswer.questionSlug,
        );
        const refreshedQuestionSlug = refreshedQueue[0];

        if (
          refreshedQuestionSlug &&
          loadReviewAnswer(refreshedQuestionSlug, nextProgress)
        ) {
          setReviewQueue(refreshedQueue);
          setReviewTotal(refreshedQueue.length);
          setMessage(
            `${remainingAnswers.length} ${
              remainingAnswers.length === 1
                ? "answer still needs"
                : "answers still need"
            } another pass.`,
          );
          return;
        }

        setReviewQueue([]);
        setReviewTotal(0);
        setAnswer("");
        setRating("");
        setMessage("Review complete. All five answers are ready to explain.");
        return;
      }

      setAnswer("");
      setRating("");
      setMessage(
        nextProgress.status === "completed"
          ? "Drill complete. Your result is saved."
          : "Answer saved. Next question.",
      );
    }
  }

  if (progress.status === "not-started") {
    return (
      <section className="interview-start" aria-labelledby="interview-start-title">
        <div>
          <p className="quiz-kicker">One focused round</p>
          <h2 id="interview-start-title">
            Explain five ideas without hiding behind code.
          </h2>
          <p>
            Write a short answer, compare it with a concrete rubric, then rate
            whether you could explain it aloud. There’s no timer and no fake AI
            score.
          </p>
        </div>
        <div className="interview-start-action">
          <p className="interview-remaining-count">
            {remainingQuestionLabel}
          </p>
          <button type="button" onClick={startDrill} disabled={isSaving}>
            {isSaving ? "Starting…" : "Start the drill"}
          </button>
          <p>Your answers stay private and return with your account.</p>
          <p
            className="interview-message"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {message}
          </p>
        </div>
      </section>
    );
  }

  if (progress.status === "completed" && !isReviewing) {
    const readyCount = progress.answers.filter(
      (savedAnswer) => savedAnswer.rating === "ready",
    ).length;
    const answersToReview = getAnswersToReview(progress);
    const reviewCount = answersToReview.length;

    return (
      <section
        className="interview-complete"
        aria-labelledby="interview-complete-title"
      >
        <div className="interview-complete-heading">
          <div>
            <p className="quiz-kicker">Round complete</p>
            <h2 id="interview-complete-title">
              Five answers. One honest readiness check.
            </h2>
            <p>
              You marked {readyCount} of 5 ready to explain
              {reviewCount > 0
                ? ` and ${reviewCount} for another pass.`
                : "."}
            </p>
          </div>
          <div className="interview-result" aria-label="Interview drill result">
            <strong>{readyCount}/5</strong>
            <span>ready to explain</span>
            <small>{remainingQuestionLabel}</small>
          </div>
        </div>

        <div className="interview-answer-review">
          <h3>Your private answer record</h3>
          {JAVASCRIPT_INTERVIEW_DRILL.questions.map((savedQuestion) => {
            const savedAnswer = progress.answers.find(
              (candidate) => candidate.questionSlug === savedQuestion.slug,
            );
            const savedRating = INTERVIEW_SELF_RATINGS.find(
              (candidate) => candidate.value === savedAnswer?.rating,
            );

            return (
              <details key={savedQuestion.slug}>
                <summary>
                  <span className="interview-review-question">
                    <small>{getQuestionPositionLabel(savedQuestion.slug)}</small>
                    <span>{savedQuestion.eyebrow}</span>
                  </span>
                  <strong>{savedRating?.shortLabel ?? "Saved"}</strong>
                </summary>
                <p>{savedAnswer?.answer}</p>
                <ul>
                  {savedQuestion.rubric.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </details>
            );
          })}
        </div>

        <div className="interview-finish-action">
          {reviewCount > 0 ? (
            <button
              type="button"
              onClick={startReview}
              aria-label={`Review ${reviewCount} ${reviewCount === 1 ? "answer" : "answers"}`}
            >
              Review {reviewCount} {reviewCount === 1 ? "answer" : "answers"}
            </button>
          ) : (
            <Link href="/dashboard">
              Return to dashboard <span aria-hidden="true">→</span>
            </Link>
          )}
          <div>
            {reviewCount > 0 ? (
              <Link className="interview-summary-link" href="/dashboard">
                Return to dashboard
              </Link>
            ) : null}
            <p>Your answers are private. Only you can open this result.</p>
          </div>
        </div>
        <p
          className="interview-message"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {message}
        </p>
      </section>
    );
  }

  const reviewPosition = reviewTotal - reviewQueue.length + 1;
  const progressPercent = isReviewing
    ? ((reviewPosition - 1) / reviewTotal) * 100
    : (answeredCount / totalQuestions) * 100;

  return (
    <section className="interview-round" aria-labelledby="interview-question">
      <div className="interview-round-heading">
        <div>
          <p className="quiz-kicker">
            {isReviewing ? "Private answer review" : currentQuestionPosition}
          </p>
          <span>{question.eyebrow}</span>
        </div>
        <strong className="interview-remaining-count">
          {isReviewing
            ? `Review ${reviewPosition} of ${reviewTotal}`
            : remainingQuestionLabel}
        </strong>
      </div>
      <div
        className="interview-progress-track"
        role="progressbar"
        aria-label={
          isReviewing ? "Interview answer review progress" : "Interview drill progress"
        }
        aria-valuemin={0}
        aria-valuemax={isReviewing ? reviewTotal : totalQuestions}
        aria-valuenow={isReviewing ? reviewPosition - 1 : answeredCount}
      >
        <span style={{ width: `${progressPercent}%` }} />
      </div>

      <h2 id="interview-question">{question.prompt}</h2>

      {isReviewing ? (
        <p className="interview-review-note">
          Your exact saved answer and self-rating are loaded below. Revise only
          what you want to strengthen.
        </p>
      ) : null}

      <label className="interview-answer-field">
        <span>{isReviewing ? "Revise your saved answer" : "Your answer"}</span>
        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          disabled={isSaving}
          maxLength={2000}
          placeholder="Explain it as if the interviewer asked one follow-up."
        />
        <small>{answer.length}/2,000 characters</small>
      </label>

      <aside className="interview-rubric" aria-labelledby="interview-rubric-title">
        <p className="quiz-kicker">
          {isReviewing ? "Check the explanation" : "Compare, don’t guess"}
        </p>
        <h3 id="interview-rubric-title">A strong answer should cover</h3>
        <ul>
          {question.rubric.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </aside>

      <fieldset className="interview-rating">
        <legend>How ready are you to explain this aloud?</legend>
        <div>
          {INTERVIEW_SELF_RATINGS.map((option) => (
            <label key={option.value}>
              <input
                type="radio"
                name="interview-rating"
                value={option.value}
                checked={rating === option.value}
                onChange={() => setRating(option.value)}
                disabled={isSaving}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="interview-save-row">
        <button type="button" onClick={saveAnswer} disabled={isSaving}>
          {isSaving
            ? "Saving…"
            : isReviewing
              ? reviewQueue.length > 1
                ? "Save review and continue"
                : "Save review"
            : progress.currentQuestion ===
                JAVASCRIPT_INTERVIEW_DRILL.questions.length - 1
              ? "Save and finish"
              : "Save and continue"}
        </button>
        {isReviewing ? (
          <button
            className="interview-summary-button"
            type="button"
            onClick={returnToSummary}
            disabled={isSaving}
          >
            Return to summary
          </button>
        ) : null}
        <p
          className="interview-message"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {message}
        </p>
      </div>
    </section>
  );
}
