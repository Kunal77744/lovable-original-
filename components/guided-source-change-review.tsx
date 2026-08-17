"use client";

import { useMemo } from "react";
import { getSourceChangeReview } from "@/lib/source-change-review";

export function SourceChangeReview({
  currentSource,
  starterSource,
}: {
  currentSource: string;
  starterSource: string;
}) {
  const review = useMemo(
    () => getSourceChangeReview(starterSource, currentSource),
    [currentSource, starterSource],
  );

  if (currentSource === starterSource) return null;

  return (
    <details className="guided-source-change-review">
      <summary>
        <span>Review changes from starter</span>
        <small>Browser-only. Your code stays unchanged.</small>
      </summary>
      <div className="guided-source-change-review-body">
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
                Can you explain why each change is needed before you run the
                checks?
              </p>
            </div>
            <ol aria-label="Changes from the authored starter">
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
