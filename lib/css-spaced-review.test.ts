import { describe, expect, it } from "vitest";
import {
  CSS_SPACED_REVIEW_ITEMS,
  getCssSpacedReviewDueAt,
  getCssSpacedReviewIntervalDays,
  isBoundedCssSpacedReviewResult,
  isCssSpacedReviewDue,
} from "./css-spaced-review";

describe("CSS spaced review", () => {
  it("keeps four distinct authored concepts and teaching responses", () => {
    expect(CSS_SPACED_REVIEW_ITEMS).toHaveLength(4);
    expect(new Set(CSS_SPACED_REVIEW_ITEMS.map((item) => item.id)).size).toBe(4);
    expect(CSS_SPACED_REVIEW_ITEMS.every((item) => item.takeaway.length > 40)).toBe(
      true,
    );
    expect(
      CSS_SPACED_REVIEW_ITEMS.every((item) => item.recoveryCue.length > 30),
    ).toBe(true);
  });

  it("accepts only a bounded result for the complete authored set", () => {
    expect(isBoundedCssSpacedReviewResult({ correctCount: 3, totalCount: 4 })).toBe(
      true,
    );
    expect(isBoundedCssSpacedReviewResult({ correctCount: 5, totalCount: 4 })).toBe(
      false,
    );
    expect(isBoundedCssSpacedReviewResult({ correctCount: 2, totalCount: 3 })).toBe(
      false,
    );
  });

  it("schedules the next review after one, three, or seven days", () => {
    expect(getCssSpacedReviewIntervalDays({ correctCount: 1, totalCount: 4 })).toBe(
      1,
    );
    expect(getCssSpacedReviewIntervalDays({ correctCount: 2, totalCount: 4 })).toBe(
      3,
    );
    expect(getCssSpacedReviewIntervalDays({ correctCount: 3, totalCount: 4 })).toBe(
      7,
    );
    expect(
      getCssSpacedReviewDueAt(
        { correctCount: 3, totalCount: 4 },
        new Date("2026-08-15T12:00:00.000Z"),
      ).toISOString(),
    ).toBe("2026-08-22T12:00:00.000Z");
  });

  it("becomes due at the saved UTC boundary", () => {
    const result = { nextDueAt: "2026-08-22T12:00:00.000Z" };
    expect(isCssSpacedReviewDue(result, new Date("2026-08-22T11:59:59.000Z"))).toBe(
      false,
    );
    expect(isCssSpacedReviewDue(result, new Date("2026-08-22T12:00:00.000Z"))).toBe(
      true,
    );
  });
});
