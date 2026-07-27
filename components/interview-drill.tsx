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

export function InterviewDrill({ initialProgress }: InterviewDrillProps) {
  const [progress, setProgress] = useState(initialProgress);
  const [answer, setAnswer] = useState("");
  const [rating, setRating] = useState<InterviewSelfRating | "">("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const question =
    JAVASCRIPT_INTERVIEW_DRILL.questions[progress.currentQuestion] ??
    JAVASCRIPT_INTERVIEW_DRILL.questions[0];

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

  if (progress.status === "completed") {
    const readyCount = progress.answers.filter(
      (savedAnswer) => savedAnswer.rating === "ready",
    ).length;
    const needsWorkCount = progress.answers.filter(
      (savedAnswer) => savedAnswer.rating === "needs-work",
    ).length;

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
              {needsWorkCount > 0
                ? ` and ${needsWorkCount} for another pass.`
                : "."}
            </p>
          </div>
          <div className="interview-result" aria-label="Interview drill result">
            <strong>{readyCount}/5</strong>
            <span>ready to explain</span>
          </div>
        </div>

        <div className="interview-answer-review">
          <h3>Your private answer record</h3>
          {JAVASCRIPT_INTERVIEW_DRILL.questions.map((savedQuestion, index) => {
            const savedAnswer = progress.answers.find(
              (candidate) => candidate.questionSlug === savedQuestion.slug,
            );
            const savedRating = INTERVIEW_SELF_RATINGS.find(
              (candidate) => candidate.value === savedAnswer?.rating,
            );

            return (
              <details key={savedQuestion.slug}>
                <summary>
                  <span>
                    {index + 1}. {savedQuestion.eyebrow}
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
          <Link href="/dashboard">
            Return to dashboard <span aria-hidden="true">→</span>
          </Link>
          <p>Your answers are private. Only you can open this result.</p>
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

  const answeredCount = progress.answers.length;
  const progressPercent =
    (answeredCount / JAVASCRIPT_INTERVIEW_DRILL.questions.length) * 100;

  return (
    <section className="interview-round" aria-labelledby="interview-question">
      <div className="interview-round-heading">
        <div>
          <p className="quiz-kicker">
            Question {progress.currentQuestion + 1} of{" "}
            {JAVASCRIPT_INTERVIEW_DRILL.questions.length}
          </p>
          <span>{question.eyebrow}</span>
        </div>
        <strong>{answeredCount}/5 saved</strong>
      </div>
      <div
        className="interview-progress-track"
        role="progressbar"
        aria-label="Interview drill progress"
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={answeredCount}
      >
        <span style={{ width: `${progressPercent}%` }} />
      </div>

      <h2 id="interview-question">{question.prompt}</h2>

      <label className="interview-answer-field">
        <span>Your answer</span>
        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          maxLength={2000}
          placeholder="Explain it as if the interviewer asked one follow-up."
        />
        <small>{answer.length}/2,000 characters</small>
      </label>

      <aside className="interview-rubric" aria-labelledby="interview-rubric-title">
        <p className="quiz-kicker">Compare, don’t guess</p>
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
            : progress.currentQuestion ===
                JAVASCRIPT_INTERVIEW_DRILL.questions.length - 1
              ? "Save and finish"
              : "Save and continue"}
        </button>
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
