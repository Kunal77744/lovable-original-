import { describe, expect, it } from "vitest";
import {
  buildWeeklyCodingPracticeGoal,
  isCodingPracticeGoalTarget,
} from "./coding-practice-goal";

describe("buildWeeklyCodingPracticeGoal", () => {
  it("counts each active UTC date once inside the current Monday-to-Sunday week", () => {
    const goal = buildWeeklyCodingPracticeGoal({
      now: new Date("2026-08-08T12:00:00.000Z"),
      targetActiveDays: 3,
      activityDays: [
        { date: "2026-08-02", attemptCount: 4, acceptedCount: 1 },
        { date: "2026-08-03", attemptCount: 2, acceptedCount: 0 },
        { date: "2026-08-07", attemptCount: 6, acceptedCount: 2 },
        { date: "2026-08-09", attemptCount: 1, acceptedCount: 1 },
      ],
    });

    expect(goal).toEqual({
      targetActiveDays: 3,
      currentActiveDays: 2,
      weekStart: "2026-08-03",
      weekEnd: "2026-08-09",
    });
  });

  it("keeps a missing or invalid saved target truthful", () => {
    expect(
      buildWeeklyCodingPracticeGoal({
        now: new Date("2026-08-03T12:00:00.000Z"),
        targetActiveDays: 7,
        activityDays: [
          { date: "invalid", attemptCount: 2, acceptedCount: 1 },
          { date: "2026-08-03", attemptCount: 0, acceptedCount: 0 },
        ],
      }),
    ).toEqual({
      targetActiveDays: null,
      currentActiveDays: 0,
      weekStart: "2026-08-03",
      weekEnd: "2026-08-09",
    });
  });
});

describe("isCodingPracticeGoalTarget", () => {
  it("accepts only the three authored weekly rhythms", () => {
    expect([1, 3, 5].every(isCodingPracticeGoalTarget)).toBe(true);
    expect(isCodingPracticeGoalTarget(2)).toBe(false);
    expect(isCodingPracticeGoalTarget("3")).toBe(false);
  });
});
