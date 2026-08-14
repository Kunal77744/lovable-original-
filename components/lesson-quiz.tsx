"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type {
  QuizAttemptReviewItem,
  QuizQuestion,
} from "@/lib/first-course-content";
import {
  captureLearnerEventOnce,
  captureLessonCompleted,
} from "@/lib/product-analytics";
import { announceLessonProgress } from "@/lib/lesson-progress-events";
import { CourseFeedback } from "@/components/course-feedback";
import { RevisionPack } from "@/components/revision-pack";
import { useBrowserLessonQuizProgress } from "@/components/use-browser-lesson-quiz-progress";

type QuizResult = {
  score: number;
  correctCount: number;
  totalCount: number;
  passed: boolean;
  completed: boolean;
  savedScore: number;
  review?: readonly QuizAttemptReviewItem[];
};

type LessonQuizProps = {
  courseTitle: string;
  courseLessonCount: number;
  completesCourse: boolean;
  courseSlug: string;
  lessonSlug: string;
  questions: readonly QuizQuestion[];
  passPercent: number;
  initialCompleted: boolean;
  initialScore: number | null;
  initialFeedback: {
    usefulness: string;
    comment: string;
    updatedAt: string;
  } | null;
  isSignedIn?: boolean;
  studentScope?: string | null;
  completedLessonsAfterPass?: number;
  nextLesson?: { title: string; href: string } | null;
  showRevisionPack?: boolean;
};

export function QuizAttemptReview({
  review,
  questions,
  correctCount,
  totalCount,
}: {
  review?: readonly QuizAttemptReviewItem[];
  questions: readonly QuizQuestion[];
  correctCount: number;
  totalCount: number;
}) {
  if (!review?.length) {
    return null;
  }

  return (
    <section
      className="quiz-attempt-review"
      aria-labelledby="quiz-attempt-review-title"
    >
      <div className="quiz-attempt-review-heading">
        <p className="quiz-kicker">Attempt review</p>
        <h3 id="quiz-attempt-review-title">
          Turn the score into a next attempt.
        </h3>
        <p>
          {correctCount} of {totalCount} concepts held. Read each explanation,
          then continue or retry from memory.
        </p>
      </div>
      <ol className="quiz-attempt-review-list">
        {review.map((item, index) => {
          const question = questions.find(
            (candidate) => candidate.id === item.questionId,
          );

          if (!question) {
            return null;
          }

          return (
            <li
              className={`quiz-attempt-review-item ${
                item.correct ? "is-correct" : "is-revisit"
              }`}
              key={item.questionId}
            >
              <div className="quiz-attempt-review-meta">
                <span className="quiz-attempt-review-status">
                  {item.correct ? "Confirmed" : "Revisit"}
                </span>
                <span>Question {index + 1}</span>
              </div>
              <h4>{question.prompt}</h4>
              <p>{item.explanation}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function LessonQuiz({
  courseTitle,
  courseLessonCount,
  completesCourse,
  courseSlug,
  lessonSlug,
  questions,
  passPercent,
  initialCompleted,
  initialScore,
  initialFeedback,
  isSignedIn = true,
  studentScope = null,
  completedLessonsAfterPass = courseLessonCount,
  nextLesson = null,
  showRevisionPack = lessonSlug === "semantic-html",
}: LessonQuizProps) {
  const [result, setResult] = useState<QuizResult | null>(
    initialCompleted && initialScore !== null
      ? {
          score: initialScore,
          correctCount: Math.round((initialScore / 100) * questions.length),
          totalCount: questions.length,
          passed: true,
          completed: true,
          savedScore: initialScore,
        }
      : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { answers, recovered, setAnswers } = useBrowserLessonQuizProgress({
    courseSlug,
    lessonSlug,
    questions,
    studentScope: isSignedIn ? studentScope : null,
    hasGradedResult: result !== null,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (Object.keys(answers).length !== questions.length) {
      setError("Answer every question before checking your work.");
      return;
    }

    if (!isSignedIn) {
      setError(
        "Create a free account to check your answers and save your best score.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/lessons/${lessonSlug}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
      });
      const payload = (await response.json()) as QuizResult & { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "We couldn’t save your answers. Try again.");
        return;
      }

      setResult(payload);
      announceLessonProgress({
        lessonSlug,
        completed: payload.completed,
        savedScore: payload.savedScore,
      });

      if (payload.completed) {
        captureLearnerEventOnce("quiz_completed", {
          course_slug: courseSlug,
          lesson_slug: lessonSlug,
          passed: true,
        });
        captureLessonCompleted({
          courseSlug,
          completionState: "completed",
        });
      }
    } catch {
      setError("We couldn’t save your answers. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (result?.completed) {
    const lessonCountLabel =
      courseLessonCount === 1 ? "lesson" : "lessons";

    return (
      <section className="quiz-complete" aria-labelledby="quiz-complete-title">
        <span className="completion-mark" aria-hidden="true">
          ✓
        </span>
        <p className="quiz-kicker">
          {completesCourse ? "Course complete" : "Lesson complete"}
        </p>
        <h2 id="quiz-complete-title">
          {completesCourse
            ? `You completed ${courseTitle}.`
            : "You built the foundation."}
        </h2>
        <p>
          Your best score is <strong>{result.savedScore}%</strong>. Your result
          is saved and the dashboard now shows {completedLessonsAfterPass} of{" "}
          {courseLessonCount} {lessonCountLabel} complete.
        </p>
        <Link
          className="lesson-primary-action"
          href={
            nextLesson?.href ??
            (showRevisionPack ? "#revision-pack" : "/dashboard")
          }
        >
          {nextLesson
            ? `Continue to ${nextLesson.title}`
            : showRevisionPack
              ? "Start revision"
              : "View saved progress"}
          <span aria-hidden="true">→</span>
        </Link>
        {nextLesson || showRevisionPack ? (
          <Link className="completion-dashboard-link" href="/dashboard">
            View saved progress
          </Link>
        ) : null}
        <QuizAttemptReview
          review={result.review}
          questions={questions}
          correctCount={result.correctCount}
          totalCount={result.totalCount}
        />
        {showRevisionPack ? (
          <RevisionPack
            lessonSlug={lessonSlug}
            practiceHref={completesCourse ? "/practice" : undefined}
          />
        ) : null}
        {completesCourse ? (
          <CourseFeedback
            courseSlug={courseSlug}
            lessonSlug={lessonSlug}
            initialFeedback={initialFeedback}
          />
        ) : null}
      </section>
    );
  }

  return (
    <section className="lesson-quiz" id="knowledge-check" aria-labelledby="quiz-title">
      <div className="quiz-heading">
        <div>
          <p className="quiz-kicker">Active recall</p>
          <h2 id="quiz-title">Check your mental model.</h2>
        </div>
        <span>{passPercent}% to complete</span>
      </div>
      <p className="quiz-intro">
        {isSignedIn
          ? "Answer from memory. A wrong attempt is saved as progress, and you can retry immediately."
          : "Answer from memory. You can choose all four answers before deciding whether to check them."}
      </p>
      {recovered ? (
        <p className="quiz-recovery-message" role="status">
          Recovered your unfinished quiz choices in this browser.
        </p>
      ) : null}

      <form onSubmit={handleSubmit}>
        {questions.map((question, questionIndex) => (
          <fieldset className="quiz-question" key={question.id}>
            <legend>
              <span>{String(questionIndex + 1).padStart(2, "0")}</span>
              {question.prompt}
            </legend>
            <div className="quiz-choices">
              {question.choices.map((choice) => (
                <label key={choice.id}>
                  <input
                    type="radio"
                    name={question.id}
                    value={choice.id}
                    checked={answers[question.id] === choice.id}
                    onChange={() => {
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: choice.id,
                      }));
                      setError(null);
                      if (result && !result.completed) {
                        setResult(null);
                      }
                    }}
                  />
                  <span>{choice.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <div className="quiz-submit-row">
          <button
            className="lesson-primary-action"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Checking and saving…" : "Check my answers"}
          </button>
          <p className="quiz-message" aria-live="polite">
            {error
              ? error
              : result && !result.passed
                ? `${result.score}% is saved. Review the lesson and try again.`
                : isSignedIn
                  ? "Your score is saved to your account."
                  : "Choose answers from memory, then check your work."}
            {!isSignedIn && error?.startsWith("Create a free account") ? (
              <>
                {" "}
                <Link href="/account">Create account</Link>
              </>
            ) : null}
          </p>
        </div>
      </form>
      <QuizAttemptReview
        review={result?.review}
        questions={questions}
        correctCount={result?.correctCount ?? 0}
        totalCount={result?.totalCount ?? questions.length}
      />
    </section>
  );
}
