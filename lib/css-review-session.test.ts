import { describe, expect, it } from "vitest";
import { buildCssReviewSession } from "./css-review-session";

describe("buildCssReviewSession", () => {
  it("keeps only the three most recent failed CSS challenges", () => {
    const session = buildCssReviewSession([
      {
        id: "attempt-older",
        challengeSlug: "class-selector",
        verdict: "Needs revision",
        passedChecks: 2,
        totalChecks: 3,
        createdAt: new Date("2026-08-04T08:00:00.000Z"),
      },
      {
        id: "attempt-newest",
        challengeSlug: "descendant-selector",
        verdict: "Needs revision",
        passedChecks: 1,
        totalChecks: 3,
        createdAt: new Date("2026-08-04T12:00:00.000Z"),
      },
      {
        id: "attempt-middle",
        challengeSlug: "predictable-width",
        verdict: "Needs revision",
        passedChecks: 2,
        totalChecks: 4,
        createdAt: new Date("2026-08-04T10:00:00.000Z"),
      },
      {
        id: "attempt-fourth",
        challengeSlug: "inside-and-between",
        verdict: "Needs revision",
        passedChecks: 2,
        totalChecks: 4,
        createdAt: new Date("2026-08-04T09:00:00.000Z"),
      },
    ]);

    expect(session.map((item) => item.slug)).toEqual([
      "descendant-selector",
      "predictable-width",
      "inside-and-between",
    ]);
    expect(session[0]).toMatchObject({
      number: 2,
      title: "Scope the lesson count",
      skill: "Descendant selectors",
      passedChecks: 1,
      totalChecks: 3,
    });
  });

  it("drops a challenge after its latest attempt passes", () => {
    const session = buildCssReviewSession([
      {
        id: "attempt-pass",
        challengeSlug: "class-selector",
        verdict: "Completed",
        passedChecks: 3,
        totalChecks: 3,
        createdAt: new Date("2026-08-04T12:00:00.000Z"),
      },
      {
        id: "attempt-fail",
        challengeSlug: "class-selector",
        verdict: "Needs revision",
        passedChecks: 2,
        totalChecks: 3,
        createdAt: new Date("2026-08-04T11:30:00.000Z"),
      },
      {
        id: "attempt-other-fail",
        challengeSlug: "descendant-selector",
        verdict: "Needs revision",
        passedChecks: 2,
        totalChecks: 3,
        createdAt: new Date("2026-08-04T11:00:00.000Z"),
      },
    ]);

    expect(session.map((item) => item.slug)).toEqual([
      "descendant-selector",
    ]);
  });

  it("ignores attempts for challenges outside the authored path", () => {
    const session = buildCssReviewSession([
      {
        id: "attempt-private",
        challengeSlug: "not-a-real-challenge",
        verdict: "Needs revision",
        passedChecks: 0,
        totalChecks: 4,
        createdAt: new Date("2026-08-04T12:00:00.000Z"),
      },
    ]);

    expect(session).toEqual([]);
  });
});
