"use client";

import Link from "next/link";
import { useState } from "react";
import type { SavedJavaScriptMixedReviewResult } from "@/db/javascript-mixed-review";
import type { JavaScriptMixedReviewItem } from "@/lib/javascript-mixed-review";
import { formatJavaScriptMixedReviewDueDate } from "@/lib/javascript-mixed-review";

export function JavaScriptMixedReview({
  items,
  initialResult,
  nextHref,
  nextLabel,
}: {
  items: JavaScriptMixedReviewItem[];
  initialResult: SavedJavaScriptMixedReviewResult | null;
  nextHref: string;
  nextLabel: string;
}) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [checkedOptionId, setCheckedOptionId] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [savedResult, setSavedResult] =
    useState<SavedJavaScriptMixedReviewResult | null>(initialResult);
  const [isPracticeRound, setIsPracticeRound] = useState(false);
  const [practiceResult, setPracticeResult] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const question = items[questionIndex];
  const isCorrect = checkedOptionId === question.correctOptionId;

  function checkAnswer() {
    if (!selectedOptionId || checkedOptionId) return;
    setCheckedOptionId(selectedOptionId);
    if (selectedOptionId === question.correctOptionId) {
      setCorrectCount((count) => count + 1);
    }
  }

  function startPracticeRound() {
    setQuestionIndex(0);
    setSelectedOptionId(null);
    setCheckedOptionId(null);
    setCorrectCount(0);
    setPracticeResult(null);
    setSaveStatus("");
    setIsPracticeRound(true);
  }

  async function continueReview() {
    if (!checkedOptionId) return;
    if (questionIndex === items.length - 1) {
      if (isPracticeRound) {
        setPracticeResult(correctCount);
        setIsPracticeRound(false);
        return;
      }

      setSaving(true);
      setSaveStatus("Saving your private review result.");
      try {
        const response = await fetch("/api/practice/mixed-review", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ correctCount, totalCount: items.length }),
        });
        const body = (await response.json().catch(() => null)) as
          | SavedJavaScriptMixedReviewResult
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

  if (savedResult && !isPracticeRound) {
    const practiceRoundComplete = practiceResult !== null;

    return (
      <section className="mixed-review-complete" aria-labelledby="mixed-review-complete-title">
        <div
          className="mixed-review-score"
          aria-label={`${practiceRoundComplete ? practiceResult : savedResult.correctCount} of ${savedResult.totalCount} concepts recalled`}
        >
          <strong>
            {practiceRoundComplete ? practiceResult : savedResult.correctCount}
          </strong>
          <span>of {savedResult.totalCount}</span>
        </div>
        <div>
          <p className="eyebrow">
            {practiceRoundComplete
              ? "Browser-only practice complete"
              : "Private review saved"}
          </p>
          <h2 id="mixed-review-complete-title">
            {practiceRoundComplete
              ? `You recalled ${practiceResult} of ${savedResult.totalCount} concepts in this practice round.`
              : `Your next mixed review is set for ${formatJavaScriptMixedReviewDueDate(savedResult.nextDueAt)}.`}
          </h2>
          <p>
            {practiceRoundComplete
              ? `Your saved ${savedResult.correctCount} of ${savedResult.totalCount} result and ${formatJavaScriptMixedReviewDueDate(savedResult.nextDueAt)} review date did not change. This round stayed in this browser.`
              : "Only this bounded result and next review date belong to your account. Your answers stayed in this browser, and judged mastery did not change."}
          </p>
          <div className="mixed-review-complete-actions">
            <Link className="primary-action" href={nextHref}>
              {nextLabel} <span aria-hidden="true">→</span>
            </Link>
            <button type="button" onClick={startPracticeRound}>
              {practiceRoundComplete
                ? "Practice these prompts again"
                : "Practice these prompts now"}
            </button>
            <Link className="mixed-review-record-link" href="/practice/progress">
              View saved lab progress
            </Link>
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
          if (checkedOptionId) void continueReview();
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
          <button disabled={!selectedOptionId || saving} type="submit">
            {checkedOptionId
              ? questionIndex === items.length - 1
                ? saving
                  ? "Saving result"
                  : isPracticeRound
                    ? "Finish practice"
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
