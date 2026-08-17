"use client";

import { useMemo, useState } from "react";
import { getSourceChangeReview } from "@/lib/source-change-review";

export function SourceChangeReview({
  currentSource,
  savedSource,
  starterSource,
}: {
  currentSource: string;
  savedSource?: string;
  starterSource: string;
}) {
  const [comparisonBaseline, setComparisonBaseline] = useState<
    "saved" | "starter"
  >("saved");
  const hasStarterChanges = currentSource !== starterSource;
  const hasDistinctSavedBaseline =
    savedSource !== undefined && savedSource !== starterSource;
  const hasSavedChanges =
    savedSource !== undefined && currentSource !== savedSource;
  const canCompareWithSaved = hasDistinctSavedBaseline && hasSavedChanges;
  const activeBaseline =
    comparisonBaseline === "saved" && canCompareWithSaved ? "saved" : "starter";
  const comparisonSource =
    activeBaseline === "saved" ? (savedSource ?? starterSource) : starterSource;
  const review = useMemo(
    () => getSourceChangeReview(comparisonSource, currentSource),
    [comparisonSource, currentSource],
  );

  if (!hasStarterChanges && !hasSavedChanges) return null;

  const showsBaselineChoices = canCompareWithSaved && hasStarterChanges;
  const baselineLabel =
    activeBaseline === "saved" ? "the last saved check" : "the authored starter";

  return (
    <details className="guided-source-change-review">
      <summary>
        <span>
          {canCompareWithSaved
            ? "Review code changes"
            : "Review changes from starter"}
        </span>
        <small>
          {canCompareWithSaved
            ? "Compare this draft with your starter or last saved check."
            : "Browser-only. Your code stays unchanged."}
        </small>
      </summary>
      <div className="guided-source-change-review-body">
        {showsBaselineChoices ? (
          <div
            className="guided-source-change-baselines"
            role="group"
            aria-label="Compare current code with"
          >
            <button
              type="button"
              aria-pressed={activeBaseline === "starter"}
              onClick={() => setComparisonBaseline("starter")}
            >
              Authored starter
            </button>
            <button
              type="button"
              aria-pressed={activeBaseline === "saved"}
              onClick={() => setComparisonBaseline("saved")}
            >
              Last saved check
            </button>
          </div>
        ) : null}
        {review.tooLarge ? (
          <p>
            This solution is too long for the line review. Your editor and saved
            work are unchanged.
          </p>
        ) : (
          <>
            <div className="guided-source-change-review-heading">
              <p>
                <strong>{review.additions} added</strong>
                <span aria-hidden="true"> · </span>
                <strong>{review.removals} removed</strong>
              </p>
              <p>
                {activeBaseline === "saved"
                  ? "These are the edits made since your last saved check."
                  : "Can you explain why each change is needed before you run the checks?"}
              </p>
            </div>
            <ol aria-label={`Changes from ${baselineLabel}`}>
              {review.changes.map((change, index) => (
                <li
                  className={
                    change.kind === "added" ? "is-added" : "is-removed"
                  }
                  key={`${change.kind}-${change.lineNumber}-${index}`}
                >
                  <span>
                    {change.kind === "added" ? "+" : "−"}
                    {change.lineNumber}
                  </span>
                  <code>{change.content || " "}</code>
                </li>
              ))}
            </ol>
            {review.hiddenChangeCount > 0 ? (
              <p className="guided-source-change-review-more">
                {review.hiddenChangeCount} more changed lines are hidden to keep
                this review focused.
              </p>
            ) : null}
          </>
        )}
      </div>
    </details>
  );
}

export const GuidedSourceChangeReview = SourceChangeReview;
