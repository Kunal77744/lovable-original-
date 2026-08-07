import { describe, expect, it } from "vitest";
import type { JavaScriptLabCatalogProgress } from "./javascript-lab-progress";
import {
  buildJavaScriptMixedReviewSession,
  getJavaScriptMixedReviewDueAt,
  getJavaScriptMixedReviewIntervalDays,
  isBoundedJavaScriptMixedReviewResult,
  isJavaScriptMixedReviewDue,
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
    expect(
      buildJavaScriptMixedReviewSession(labsWithCompletedCount(14), 2),
    ).toHaveLength(3);
    expect(
      buildJavaScriptMixedReviewSession(labsWithCompletedCount(14), 9),
    ).toHaveLength(6);
  });

  it("rotates due sessions without adding unfinished concepts", () => {
    const labs = labsWithCompletedCount(8);
    const first = buildJavaScriptMixedReviewSession(labs, 4, 0);
    const rotated = buildJavaScriptMixedReviewSession(labs, 4, 1);

    expect(rotated).not.toEqual(first);
    expect(
      rotated.every((item) =>
        labs.some(
          (lab) => lab.slug === item.labSlug && lab.state === "complete",
        ),
      ),
    ).toBe(true);
  });
});

describe("JavaScript mixed-review schedule", () => {
  it("keeps the saved result bounded", () => {
    expect(
      isBoundedJavaScriptMixedReviewResult({ correctCount: 3, totalCount: 4 }),
    ).toBe(true);
    expect(
      isBoundedJavaScriptMixedReviewResult({ correctCount: 5, totalCount: 4 }),
    ).toBe(false);
    expect(
      isBoundedJavaScriptMixedReviewResult({ correctCount: 2, totalCount: 2 }),
    ).toBe(false);
  });

  it("uses one, three, or seven days based on bounded recall", () => {
    expect(getJavaScriptMixedReviewIntervalDays({ correctCount: 1, totalCount: 4 })).toBe(1);
    expect(getJavaScriptMixedReviewIntervalDays({ correctCount: 2, totalCount: 4 })).toBe(3);
    expect(getJavaScriptMixedReviewIntervalDays({ correctCount: 3, totalCount: 4 })).toBe(7);

    const completedAt = new Date("2026-08-07T12:00:00.000Z");
    expect(
      getJavaScriptMixedReviewDueAt(
        { correctCount: 3, totalCount: 4 },
        completedAt,
      ).toISOString(),
    ).toBe("2026-08-14T12:00:00.000Z");
  });

  it("becomes due only at or after the saved date", () => {
    const result = { nextDueAt: "2026-08-10T12:00:00.000Z" };
    expect(isJavaScriptMixedReviewDue(result, new Date("2026-08-10T11:59:59.000Z"))).toBe(false);
    expect(isJavaScriptMixedReviewDue(result, new Date("2026-08-10T12:00:00.000Z"))).toBe(true);
  });
});
