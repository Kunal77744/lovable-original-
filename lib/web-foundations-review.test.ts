import { describe, expect, it } from "vitest";
import {
  getWebFoundationsReviewDueAt,
  getWebFoundationsReviewIntervalDays,
  isBoundedWebFoundationsReviewResult,
  isWebFoundationsReviewDue,
  WEB_FOUNDATIONS_REVIEW_ITEMS,
} from "./web-foundations-review";

describe("Web Foundations review", () => {
  it("uses four authored prompts across both lessons", () => {
    expect(WEB_FOUNDATIONS_REVIEW_ITEMS).toHaveLength(4);
    expect(new Set(WEB_FOUNDATIONS_REVIEW_ITEMS.map((item) => item.lessonTitle))).toEqual(
      new Set(["Semantic HTML", "Selectors and the box model"]),
    );
    expect(
      WEB_FOUNDATIONS_REVIEW_ITEMS.every((item) =>
        item.options.some((option) => option.id === item.correctOptionId),
      ),
    ).toBe(true);
  });

  it("accepts only the fixed bounded result", () => {
    expect(isBoundedWebFoundationsReviewResult({ correctCount: 3, totalCount: 4 })).toBe(true);
    expect(isBoundedWebFoundationsReviewResult({ correctCount: 5, totalCount: 4 })).toBe(false);
    expect(isBoundedWebFoundationsReviewResult({ correctCount: 2, totalCount: 3 })).toBe(false);
  });

  it("schedules the next review after one, three, or seven days", () => {
    expect(getWebFoundationsReviewIntervalDays({ correctCount: 1, totalCount: 4 })).toBe(1);
    expect(getWebFoundationsReviewIntervalDays({ correctCount: 2, totalCount: 4 })).toBe(3);
    expect(getWebFoundationsReviewIntervalDays({ correctCount: 3, totalCount: 4 })).toBe(7);

    const completedAt = new Date("2026-08-07T12:00:00.000Z");
    expect(
      getWebFoundationsReviewDueAt(
        { correctCount: 3, totalCount: 4 },
        completedAt,
      ).toISOString(),
    ).toBe("2026-08-14T12:00:00.000Z");
  });

  it("becomes due only at or after the saved date", () => {
    const result = { nextDueAt: "2026-08-10T12:00:00.000Z" };
    expect(isWebFoundationsReviewDue(result, new Date("2026-08-10T11:59:59.000Z"))).toBe(false);
    expect(isWebFoundationsReviewDue(result, new Date("2026-08-10T12:00:00.000Z"))).toBe(true);
  });
});
