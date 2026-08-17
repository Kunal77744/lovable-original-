import { describe, expect, it } from "vitest";
import {
  getWebFoundationsReviewDueAt,
  getWebFoundationsReviewIntervalDays,
  isBoundedWebFoundationsReviewResult,
  isWebFoundationsReviewDue,
  WEB_FOUNDATIONS_REVIEW_ITEMS,
} from "./web-foundations-review";

describe("Web Foundations review", () => {
  it("uses six authored prompts across all four lessons", () => {
    expect(WEB_FOUNDATIONS_REVIEW_ITEMS).toHaveLength(6);
    expect(new Set(WEB_FOUNDATIONS_REVIEW_ITEMS.map((item) => item.lessonTitle))).toEqual(
      new Set([
        "Semantic HTML",
        "Selectors and the box model",
        "Responsive CSS Grid",
        "Accessible forms",
      ]),
    );
    expect(
      WEB_FOUNDATIONS_REVIEW_ITEMS.every((item) =>
        item.options.some((option) => option.id === item.correctOptionId),
      ),
    ).toBe(true);
  });

  it("accepts only the fixed bounded result", () => {
    expect(isBoundedWebFoundationsReviewResult({ correctCount: 5, totalCount: 6 })).toBe(true);
    expect(isBoundedWebFoundationsReviewResult({ correctCount: 7, totalCount: 6 })).toBe(false);
    expect(isBoundedWebFoundationsReviewResult({ correctCount: 2, totalCount: 4 })).toBe(false);
  });

  it("schedules the next review after one, three, or seven days", () => {
    expect(getWebFoundationsReviewIntervalDays({ correctCount: 2, totalCount: 6 })).toBe(1);
    expect(getWebFoundationsReviewIntervalDays({ correctCount: 4, totalCount: 6 })).toBe(3);
    expect(getWebFoundationsReviewIntervalDays({ correctCount: 5, totalCount: 6 })).toBe(7);

    const completedAt = new Date("2026-08-07T12:00:00.000Z");
    expect(
      getWebFoundationsReviewDueAt(
        { correctCount: 5, totalCount: 6 },
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
