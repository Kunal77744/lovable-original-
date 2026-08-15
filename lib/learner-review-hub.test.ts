import { describe, expect, it } from "vitest";
import { buildLearnerReviewHub } from "./learner-review-hub";

const continuation = {
  label: "Solve problem 03",
  href: "/practice/reverse-a-string",
  kicker: "Continue your practice streak",
  title: "Reverse a string",
  description: "Keep moving forward at the exact unfinished problem.",
};

describe("buildLearnerReviewHub", () => {
  it("prioritizes due recall before unresolved saved repairs", () => {
    const review = buildLearnerReviewHub({
      courseCompleted: true,
      webFoundationsResult: null,
      javascriptReviewItemCount: 4,
      javascriptMixedResult: null,
      javascriptRepairCount: 3,
      cssRepairCount: 2,
      continuation,
      now: new Date("2026-08-15T12:00:00.000Z"),
    });

    expect(review.ready.map((item) => item.id)).toEqual([
      "web-foundations",
      "javascript-mixed",
      "javascript-repair",
      "css-repair",
    ]);
    expect(review.ready[0]).toMatchObject({
      href: "/courses/web-development-foundations/review",
      kind: "due",
    });
    expect(review.ready[2]).toMatchObject({
      href: "/practice/review",
      kind: "repair",
    });
    expect(review.ready[3]).toMatchObject({
      href: "/practice/css/review",
      kind: "repair",
    });
  });

  it("keeps not-yet-due review results scheduled and preserves exact continuation", () => {
    const review = buildLearnerReviewHub({
      courseCompleted: true,
      webFoundationsResult: {
        correctCount: 4,
        totalCount: 4,
        completedAt: "2026-08-14T12:00:00.000Z",
        nextDueAt: "2026-08-21T12:00:00.000Z",
      },
      javascriptReviewItemCount: 4,
      javascriptMixedResult: {
        correctCount: 3,
        totalCount: 4,
        completedAt: "2026-08-14T12:00:00.000Z",
        nextDueAt: "2026-08-21T12:00:00.000Z",
      },
      javascriptRepairCount: 0,
      cssRepairCount: 0,
      continuation,
      now: new Date("2026-08-15T12:00:00.000Z"),
    });

    expect(review.ready).toEqual([]);
    expect(review.scheduled.map((item) => item.id)).toEqual([
      "web-foundations",
      "javascript-mixed",
    ]);
    expect(review.scheduled[0].detail).toContain("Aug 21");
    expect(review.continuation).toEqual(continuation);
  });

  it("does not offer review paths the learner has not unlocked", () => {
    const review = buildLearnerReviewHub({
      courseCompleted: false,
      webFoundationsResult: null,
      javascriptReviewItemCount: 0,
      javascriptMixedResult: null,
      javascriptRepairCount: 0,
      cssRepairCount: 0,
      continuation,
    });

    expect(review.ready).toEqual([]);
    expect(review.scheduled).toEqual([]);
    expect(review.continuation.href).toBe("/practice/reverse-a-string");
  });
});
