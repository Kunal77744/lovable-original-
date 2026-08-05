import { describe, expect, it } from "vitest";
import { CODING_PROBLEMS } from "./coding-problems";
import { buildCodingActivity } from "./coding-activity";

const NOW = new Date("2026-08-05T16:30:00.000Z");

describe("buildCodingActivity", () => {
  it("builds a factual 28-day record and resumes the first unfinished problem", () => {
    const activity = buildCodingActivity({
      now: NOW,
      completedSlugs: ["sum-two-numbers"],
      activityDays: [
        { date: "2026-08-01", attemptCount: 2, acceptedCount: 0 },
        { date: "2026-08-03", attemptCount: 1, acceptedCount: 0 },
        { date: "2026-08-04", attemptCount: 4, acceptedCount: 1 },
      ],
    });

    expect(activity.days).toHaveLength(28);
    expect(activity.days[0].date).toBe("2026-07-09");
    expect(activity.days.at(-1)).toMatchObject({
      date: "2026-08-05",
      attemptCount: 0,
      intensity: 0,
      isToday: true,
    });
    expect(activity.activeDays).toBe(3);
    expect(activity.attemptCount).toBe(7);
    expect(activity.acceptedCount).toBe(1);
    expect(activity.consecutiveDays).toBe(2);
    expect(activity.longestRun).toBe(2);
    expect(activity.lastActiveDate).toBe("2026-08-04");
    expect(activity.days.find((day) => day.date === "2026-08-04")).toMatchObject({
      attemptCount: 4,
      intensity: 3,
    });
    expect(activity.nextAction).toEqual({
      title: "Continue with Even or odd.",
      description:
        "This is the first unfinished step in your saved six-problem path: conditions.",
      label: "Continue problem 02",
      href: "/practice/even-or-odd",
    });
  });

  it("keeps an empty record truthful", () => {
    const activity = buildCodingActivity({
      now: NOW,
      completedSlugs: [],
      activityDays: [],
    });

    expect(activity).toMatchObject({
      activeDays: 0,
      attemptCount: 0,
      acceptedCount: 0,
      consecutiveDays: 0,
      longestRun: 0,
      lastActiveDate: null,
    });
    expect(activity.nextAction.href).toBe("/practice/sum-two-numbers");
    expect(activity.nextAction.label).toBe("Continue problem 01");
  });

  it("resets consecutive activity after a saved-day gap", () => {
    const activity = buildCodingActivity({
      now: NOW,
      completedSlugs: [],
      activityDays: [
        { date: "2026-08-02", attemptCount: 1, acceptedCount: 0 },
      ],
    });

    expect(activity.consecutiveDays).toBe(0);
    expect(activity.longestRun).toBe(1);
  });

  it("ignores invalid and future rows", () => {
    const activity = buildCodingActivity({
      now: NOW,
      completedSlugs: [],
      activityDays: [
        { date: "tomorrow", attemptCount: 8, acceptedCount: 8 },
        { date: "2026-08-06", attemptCount: 8, acceptedCount: 8 },
        { date: "2026-08-05", attemptCount: 1, acceptedCount: 0 },
      ],
    });

    expect(activity.attemptCount).toBe(1);
    expect(activity.lastActiveDate).toBe("2026-08-05");
    expect(activity.longestRun).toBe(1);
  });

  it("offers a factual review action when all six problems are Accepted", () => {
    const activity = buildCodingActivity({
      now: NOW,
      completedSlugs: CODING_PROBLEMS.map((problem) => problem.slug),
      activityDays: [],
    });

    expect(activity.nextAction).toEqual({
      title: "Review Sum two numbers.",
      description:
        "All six problems have an Accepted result. Reopen problem 01 for another independent attempt.",
      label: "Review problem 01",
      href: "/practice/sum-two-numbers",
    });
  });
});
