"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type { QuizQuestion } from "@/lib/first-course-content";
import { captureLearnerEventOnce } from "@/lib/product-analytics";
import { CourseFeedback } from "@/components/course-feedback";
import { RevisionPack } from "@/components/revision-pack";

type QuizResult = {
  score: number;
  correctCount: number;
  totalCount: number;
  passed: boolean;
  completed: boolean;
  savedScore: number;
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
};

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
}: LessonQuizProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (Object.keys(answers).length !== questions.length) {
      setError("Answer every question before checking your work.");
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

      if (payload.completed) {
        captureLearnerEventOnce("quiz_completed", {
          course_slug: courseSlug,
          lesson_slug: lessonSlug,
          passed: true,
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
          is saved and the dashboard now shows {courseLessonCount} of{" "}
          {courseLessonCount} {lessonCountLabel} complete.
        </p>
        <Link className="lesson-primary-action" href="#revision-pack">
          Start revision
          <span aria-hidden="true">→</span>
        </Link>
        <Link className="completion-dashboard-link" href="/dashboard">
          View saved progress
        </Link>
        <RevisionPack
          lessonSlug={lessonSlug}
          practiceHref={completesCourse ? "/practice" : undefined}
        />
        <CourseFeedback
          courseSlug={courseSlug}
          lessonSlug={lessonSlug}
          initialFeedback={initialFeedback}
        />
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
        Answer from memory. A wrong attempt is saved as progress, and you can
        retry immediately.
      </p>

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
                    onChange={() =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: choice.id,
                      }))
                    }
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
                : "Your score is saved to your account."}
          </p>
        </div>
      </form>
    </section>
  );
}
