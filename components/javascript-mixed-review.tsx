"use client";

import Link from "next/link";
import { useState } from "react";
import type { JavaScriptMixedReviewItem } from "@/lib/javascript-mixed-review";

export function JavaScriptMixedReview({
  items,
}: {
  items: JavaScriptMixedReviewItem[];
}) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [checkedOptionId, setCheckedOptionId] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [complete, setComplete] = useState(false);

  const question = items[questionIndex];
  const isCorrect = checkedOptionId === question.correctOptionId;

  function checkAnswer() {
    if (!selectedOptionId || checkedOptionId) return;
    setCheckedOptionId(selectedOptionId);
    if (selectedOptionId === question.correctOptionId) {
      setCorrectCount((count) => count + 1);
    }
  }

  function continueReview() {
    if (!checkedOptionId) return;
    if (questionIndex === items.length - 1) {
      setComplete(true);
      return;
    }

    setQuestionIndex((index) => index + 1);
    setSelectedOptionId(null);
    setCheckedOptionId(null);
  }

  function restartReview() {
    setQuestionIndex(0);
    setSelectedOptionId(null);
    setCheckedOptionId(null);
    setCorrectCount(0);
    setComplete(false);
  }

  if (complete) {
    return (
      <section className="mixed-review-complete" aria-labelledby="mixed-review-complete-title">
        <div className="mixed-review-score" aria-label={`${correctCount} of ${items.length} concepts recalled`}>
          <strong>{correctCount}</strong>
          <span>of {items.length}</span>
        </div>
        <div>
          <p className="eyebrow">Review complete</p>
          <h2 id="mixed-review-complete-title">
            You brought {items.length} completed concepts back to mind.
          </h2>
          <p>
            This browser-only result is a recall check, not judged mastery. No
            answers or score were added to your account.
          </p>
          <div className="mixed-review-complete-actions">
            <Link className="primary-action" href="/practice">
              Return to JavaScript practice <span aria-hidden="true">→</span>
            </Link>
            <button onClick={restartReview} type="button">
              Review the same concepts again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mixed-review-workspace" aria-labelledby="mixed-review-question-title">
      <div className="mixed-review-progress">
        <span>
          Concept {questionIndex + 1} of {items.length}
        </span>
        <div
          aria-label="Mixed review progress"
          aria-valuemax={items.length}
          aria-valuemin={1}
          aria-valuenow={questionIndex + 1}
          role="progressbar"
        >
          <span
            style={{ width: `${((questionIndex + 1) / items.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mixed-review-question-heading">
        <p className="eyebrow">
          {question.labTitle} · {question.concept}
        </p>
        <h2 id="mixed-review-question-title">Which principle fits this situation?</h2>
        <strong>{question.exerciseTitle}</strong>
        <p>{question.scenario}</p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (checkedOptionId) continueReview();
          else checkAnswer();
        }}
      >
        <fieldset disabled={Boolean(checkedOptionId)}>
          <legend>Choose the rule you would use.</legend>
          <div className="mixed-review-options">
            {question.options.map((option) => (
              <label key={option.id}>
                <input
                  checked={selectedOptionId === option.id}
                  name={question.id}
                  onChange={() => setSelectedOptionId(option.id)}
                  type="radio"
                  value={option.id}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {checkedOptionId ? (
          <div
            aria-live="polite"
            className={isCorrect ? "mixed-review-feedback is-correct" : "mixed-review-feedback"}
          >
            <p className="eyebrow">{isCorrect ? "Recalled" : "One more pass"}</p>
            <strong>{question.takeaway}</strong>
            {!isCorrect ? <p>{question.recoveryCue}</p> : null}
          </div>
        ) : null}

        <div className="mixed-review-controls">
          <Link href="/practice">Leave review</Link>
          <button disabled={!selectedOptionId} type="submit">
            {checkedOptionId
              ? questionIndex === items.length - 1
                ? "Finish review"
                : "Next concept"
              : "Check my recall"}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>
    </section>
  );
}
