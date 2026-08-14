import { describe, expect, it } from "vitest";
import { buildDailyLearningPlan } from "./daily-learning-plan";

const continuation = {
  label: "Continue exercise 3",
  href: "/practice/tracing",
  kicker: "12/55 guided steps saved",
  title: "Code tracing",
  description: "Continue at the exact first unfinished JavaScript exercise.",
};

describe("buildDailyLearningPlan", () => {
  it("keeps a fresh learner focused on one exact continuation", () => {
    const plan = buildDailyLearningPlan({
      continuation,
      courseCompleted: false,
      foundationsReview: null,
      javascriptReviewAvailable: false,
      javascriptReview: null,
      dailyChallenge: null,
      now: new Date("2026-08-09T12:00:00.000Z"),
    });

    expect(plan.dateLabel).toBe("Sunday, August 9");
    expect(plan.continuation).toEqual(continuation);
    expect(plan.items).toEqual([]);
  });

  it("puts due reviews and today's problem ahead of scheduled work", () => {
    const plan = buildDailyLearningPlan({
      continuation,
      courseCompleted: true,
      foundationsReview: null,
      javascriptReviewAvailable: true,
      javascriptReview: {
        correctCount: 4,
        totalCount: 4,
        nextDueAt: "2026-08-16T12:00:00.000Z",
      },
      dailyChallenge: {
        number: 7,
        title: "Count vowels",
        completed: false,
      },
      now: new Date("2026-08-09T12:00:00.000Z"),
    });

    expect(plan.items.map((item) => [item.id, item.state])).toEqual([
      ["web-review", "due"],
      ["daily-challenge", "due"],
      ["javascript-review", "scheduled"],
    ]);
    expect(plan.items[2].label).toBe("Next Aug 16");
  });

  it("shows completed daily practice without turning it into a new mastery record", () => {
    const plan = buildDailyLearningPlan({
      continuation,
      courseCompleted: false,
      foundationsReview: null,
      javascriptReviewAvailable: false,
      javascriptReview: null,
      dailyChallenge: {
        number: 1,
        title: "Sum two numbers",
        completed: true,
      },
      now: new Date("2026-08-09T12:00:00.000Z"),
    });

    expect(plan.items[0]).toMatchObject({
      id: "daily-challenge",
      label: "Completed today",
      state: "complete",
      href: "/practice/daily",
    });
  });
});
