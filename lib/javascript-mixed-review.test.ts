import { describe, expect, it } from "vitest";
import type { JavaScriptLabCatalogProgress } from "./javascript-lab-progress";
import {
  buildJavaScriptMixedReviewSession,
  JAVASCRIPT_MIXED_REVIEW_PROMPTS,
} from "./javascript-mixed-review";

function labsWithCompletedCount(count: number) {
  return JAVASCRIPT_MIXED_REVIEW_PROMPTS.map((prompt, index) => ({
    slug: prompt.labSlug,
    title: prompt.labTitle,
    href: `/practice/${prompt.labSlug}`,
    completedCount: index < count ? 4 : 0,
    totalCount: 4,
    nextExerciseNumber: index < count ? null : 1,
    state: index < count ? "complete" : "not-started",
  })) as JavaScriptLabCatalogProgress["labs"];
}

describe("buildJavaScriptMixedReviewSession", () => {
  it("stays locked until three guided labs are complete", () => {
    expect(buildJavaScriptMixedReviewSession(labsWithCompletedCount(2))).toEqual(
      [],
    );
  });

  it("builds a deterministic four-concept review from completed labs only", () => {
    const labs = labsWithCompletedCount(8);
    const first = buildJavaScriptMixedReviewSession(labs);
    const second = buildJavaScriptMixedReviewSession(labs);

    expect(first).toEqual(second);
    expect(first).toHaveLength(4);
    expect(new Set(first.map((item) => item.labSlug)).size).toBe(4);
    expect(
      first.every((item) =>
        item.options.some((option) => option.id === item.correctOptionId),
      ),
    ).toBe(true);
    expect(
      first.flatMap((item) => item.options).every((option) =>
        labs
          .filter((lab) => lab.state === "complete")
          .some((lab) => lab.slug === option.id),
      ),
    ).toBe(true);
  });

  it("keeps the session between three and six prompts", () => {
    expect(buildJavaScriptMixedReviewSession(labsWithCompletedCount(14), 2)).toHaveLength(
      3,
    );
    expect(buildJavaScriptMixedReviewSession(labsWithCompletedCount(14), 9)).toHaveLength(
      6,
    );
  });
});
