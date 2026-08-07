"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SavedJavaScriptReadinessResult } from "@/db/javascript-readiness";
import type { JavaScriptLabCatalogProgress } from "@/lib/javascript-lab-progress";
import {
  getJavaScriptReadinessRecommendation,
  JAVASCRIPT_READINESS_QUESTIONS,
} from "@/lib/javascript-readiness";

type JavaScriptReadinessCheckProps = {
  initialResult: SavedJavaScriptReadinessResult | null;
  recommendationLabs: JavaScriptLabCatalogProgress["labs"];
};

export function JavaScriptReadinessCheck({
  initialResult,
  recommendationLabs,
}: JavaScriptReadinessCheckProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savedResult, setSavedResult] = useState(initialResult);
  const [isRetaking, setIsRetaking] = useState(!initialResult);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");
  const progressByLab = useMemo(
    () => new Map(recommendationLabs.map((item) => [item.slug, item])),
    [recommendationLabs],
  );

  function startRetake() {
    setAnswers({});
    setQuestionIndex(0);
    setStatus("");
    setIsRetaking(true);
  }

  if (savedResult && !isRetaking) {
    const recommendation = getJavaScriptReadinessRecommendation(
      savedResult.recommendedLabSlug,
    );
    const recommendedLab = progressByLab.get(savedResult.recommendedLabSlug);
    const recommendationHref = recommendedLab?.href ?? "/practice";
    const recommendationIsComplete = recommendedLab?.state === "complete";

    return (
      <section className="readiness-result" aria-labelledby="readiness-result-title">
        <div className="readiness-score" aria-label={`${savedResult.correctCount} of ${savedResult.totalCount} checks passed`}>
          <span>{savedResult.correctCount}</span>
          <small>of {savedResult.totalCount} checks</small>
        </div>
        <div className="readiness-result-copy">
          <p className="eyebrow">
            {recommendationIsComplete
              ? "Recommended practice complete"
              : "Your private readiness result"}
          </p>
          <h2 id="readiness-result-title">
            {recommendationIsComplete
              ? `${recommendedLab.title} is complete.`
              : recommendation?.title}
          </h2>
          <p>
            {recommendationIsComplete
              ? `You saved all ${recommendedLab.completedCount} of ${recommendedLab.totalCount} exercises in this lab. Retake the six checks to find your current next step.`
              : recommendation?.reason}
          </p>
          <p className="readiness-saved-note">
            {recommendationIsComplete
              ? "Your last score stays saved until you finish a retake. Individual choices are not stored."
              : "Only this score and recommendation are saved to your account. Your individual choices are not stored."}
          </p>
          <div className="readiness-result-actions">
            {recommendationIsComplete ? (
              <button
                className="readiness-retake-primary"
                type="button"
                onClick={startRetake}
              >
                Retake for next step <span aria-hidden="true">→</span>
              </button>
            ) : (
              <Link className="primary-action" href={recommendationHref}>
                Open recommended lab <span aria-hidden="true">→</span>
              </Link>
            )}
            {recommendationIsComplete ? (
              <Link className="readiness-review-link" href={recommendationHref}>
                Review completed lab
              </Link>
            ) : null}
            {!recommendationIsComplete ? (
              <button
                type="button"
                onClick={startRetake}
              >
                Retake the check
              </button>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  const question = JAVASCRIPT_READINESS_QUESTIONS[questionIndex];
  const selectedOption = answers[question.id];
  const isLastQuestion =
    questionIndex === JAVASCRIPT_READINESS_QUESTIONS.length - 1;

  async function continueCheck() {
    if (!selectedOption || isSaving) return;
    if (!isLastQuestion) {
      setQuestionIndex((current) => current + 1);
      setStatus("");
      return;
    }

    setIsSaving(true);
    setStatus("Saving your private readiness result.");
    const response = await fetch("/api/practice/readiness", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        answers: JAVASCRIPT_READINESS_QUESTIONS.map((item) => ({
          questionId: item.id,
          optionId: answers[item.id],
        })),
      }),
    }).catch(() => null);

    if (!response?.ok) {
      setIsSaving(false);
      setStatus("Your result was not saved. Try again without losing your choices.");
      return;
    }

    const result = (await response.json()) as SavedJavaScriptReadinessResult;
    setSavedResult(result);
    setIsRetaking(false);
    setIsSaving(false);
    setStatus("Readiness result saved privately.");
  }

  return (
    <section className="readiness-workspace" aria-labelledby="readiness-question-title">
      <div className="readiness-progress" aria-label={`Question ${questionIndex + 1} of ${JAVASCRIPT_READINESS_QUESTIONS.length}`}>
        <span>
          Question {questionIndex + 1} of {JAVASCRIPT_READINESS_QUESTIONS.length}
        </span>
        <div
          role="progressbar"
          aria-label="Readiness check progress"
          aria-valuemin={1}
          aria-valuemax={JAVASCRIPT_READINESS_QUESTIONS.length}
          aria-valuenow={questionIndex + 1}
        >
          <span
            style={{
              width: `${((questionIndex + 1) / JAVASCRIPT_READINESS_QUESTIONS.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void continueCheck();
        }}
      >
        <fieldset>
          <legend>
            <span>{question.concept}</span>
            <strong id="readiness-question-title">{question.prompt}</strong>
          </legend>
          {question.code ? <pre><code>{question.code}</code></pre> : null}
          <div className="readiness-options">
            {question.options.map((option) => (
              <label key={option.id}>
                <input
                  checked={selectedOption === option.id}
                  name={question.id}
                  onChange={() => {
                    setAnswers((current) => ({
                      ...current,
                      [question.id]: option.id,
                    }));
                    setStatus("");
                  }}
                  type="radio"
                  value={option.id}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="readiness-controls">
          {questionIndex > 0 ? (
            <button
              className="readiness-back"
              disabled={isSaving}
              onClick={() => setQuestionIndex((current) => current - 1)}
              type="button"
            >
              Previous
            </button>
          ) : (
            <span />
          )}
          <button
            className="readiness-continue"
            disabled={!selectedOption || isSaving}
            type="submit"
          >
            {isSaving
              ? "Saving..."
              : isLastQuestion
                ? "Save my result"
                : "Next concept"}
            {!isSaving ? <span aria-hidden="true">→</span> : null}
          </button>
        </div>
      </form>
      <p className="readiness-status" aria-live="polite" aria-atomic="true">
        {status}
      </p>
    </section>
  );
}
