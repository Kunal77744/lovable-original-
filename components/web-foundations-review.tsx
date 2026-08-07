"use client";

import Link from "next/link";
import { useState } from "react";
import type { SavedWebFoundationsReviewResult } from "@/db/web-foundations-review";
import {
  formatWebFoundationsReviewDueDate,
  WEB_FOUNDATIONS_REVIEW_ITEMS,
} from "@/lib/web-foundations-review";

export function WebFoundationsReview({
  initialResult,
}: {
  initialResult: SavedWebFoundationsReviewResult | null;
}) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [checkedOptionId, setCheckedOptionId] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [savedResult, setSavedResult] =
    useState<SavedWebFoundationsReviewResult | null>(initialResult);
  const [saveStatus, setSaveStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const question = WEB_FOUNDATIONS_REVIEW_ITEMS[questionIndex];
  const isCorrect = checkedOptionId === question.correctOptionId;

  function checkAnswer() {
    if (!selectedOptionId || checkedOptionId) return;
    setCheckedOptionId(selectedOptionId);
    if (selectedOptionId === question.correctOptionId) {
      setCorrectCount((count) => count + 1);
    }
  }

  async function continueReview() {
    if (!checkedOptionId) return;
    if (questionIndex === WEB_FOUNDATIONS_REVIEW_ITEMS.length - 1) {
      setSaving(true);
      setSaveStatus("Saving your private review result.");
      try {
        const response = await fetch(
          "/api/courses/web-development-foundations/review",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              correctCount,
              totalCount: WEB_FOUNDATIONS_REVIEW_ITEMS.length,
            }),
          },
        );
        const body = (await response.json().catch(() => null)) as
          | SavedWebFoundationsReviewResult
          | { error?: string }
          | null;
        if (!response.ok || !body || !("nextDueAt" in body)) {
          setSaveStatus(
            body && "error" in body && body.error
              ? body.error
              : "Your result was not saved. Try again.",
          );
          return;
        }

        setSavedResult(body);
        setSaveStatus("Saved privately to your account.");
      } catch {
        setSaveStatus("Your result was not saved. Try again.");
      } finally {
        setSaving(false);
      }
      return;
    }

    setQuestionIndex((index) => index + 1);
    setSelectedOptionId(null);
    setCheckedOptionId(null);
  }

  if (savedResult) {
    return (
      <section
        className="mixed-review-complete foundations-review-complete"
        aria-labelledby="foundations-review-complete-title"
      >
        <div
          className="mixed-review-score"
          aria-label={`${savedResult.correctCount} of ${savedResult.totalCount} concepts recalled`}
        >
          <strong>{savedResult.correctCount}</strong>
          <span>of {savedResult.totalCount}</span>
        </div>
        <div>
          <p className="eyebrow">Private lesson review saved</p>
          <h2 id="foundations-review-complete-title">
            Your next foundations review is set for{" "}
            {formatWebFoundationsReviewDueDate(savedResult.nextDueAt)}.
          </h2>
          <p>
            Only this result and next review date belong to your account. Your
            choices stayed in this browser, and course completion did not change.
          </p>
          <div className="mixed-review-complete-actions">
            <Link className="primary-action" href="/projects/semantic-html-article">
              Continue the field guide <span aria-hidden="true">→</span>
            </Link>
            <Link className="mixed-review-record-link" href="/dashboard">
              Return to dashboard
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="mixed-review-workspace foundations-review-workspace"
      aria-labelledby="foundations-review-question-title"
    >
      <div className="mixed-review-progress">
        <span>
          Concept {questionIndex + 1} of {WEB_FOUNDATIONS_REVIEW_ITEMS.length}
        </span>
        <div
          aria-label="Foundations review progress"
          aria-valuemax={WEB_FOUNDATIONS_REVIEW_ITEMS.length}
          aria-valuemin={1}
          aria-valuenow={questionIndex + 1}
          role="progressbar"
        >
          <span
            style={{
              width: `${((questionIndex + 1) / WEB_FOUNDATIONS_REVIEW_ITEMS.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="mixed-review-question-heading">
        <p className="eyebrow">
          {question.lessonTitle} · {question.concept}
        </p>
        <h2 id="foundations-review-question-title">
          Which choice preserves the principle?
        </h2>
        <p>{question.prompt}</p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (checkedOptionId) void continueReview();
          else checkAnswer();
        }}
      >
        <fieldset disabled={Boolean(checkedOptionId)}>
          <legend>Choose one answer.</legend>
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
            className={
              isCorrect ? "mixed-review-feedback is-correct" : "mixed-review-feedback"
            }
          >
            <p className="eyebrow">{isCorrect ? "Recalled" : "One more pass"}</p>
            <strong>{question.takeaway}</strong>
            {!isCorrect ? <p>{question.recoveryCue}</p> : null}
          </div>
        ) : null}

        <div className="mixed-review-controls">
          <Link href="/dashboard">Leave review</Link>
          <button disabled={!selectedOptionId || saving} type="submit">
            {checkedOptionId
              ? questionIndex === WEB_FOUNDATIONS_REVIEW_ITEMS.length - 1
                ? saving
                  ? "Saving result"
                  : saveStatus
                    ? "Retry saving result"
                    : "Finish and save"
                : "Next concept"
              : "Check my recall"}
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <p className="mixed-review-save-status" aria-live="polite" aria-atomic="true">
          {saveStatus}
        </p>
      </form>
    </section>
  );
}
