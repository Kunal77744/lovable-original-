import { describe, expect, it } from "vitest";
import { CODING_PROBLEMS } from "./coding-problems";
import { buildCodingSkillRecord } from "./coding-skill-record";

describe("buildCodingSkillRecord", () => {
  it("starts a fresh learner at the first JavaScript skill", () => {
    const record = buildCodingSkillRecord({
      completedSlugs: [],
      attempts: [],
    });

    expect(record).toMatchObject({
      acceptedCount: 0,
      totalCount: 12,
      attemptCount: 0,
      practiceDays: 0,
      lastPracticedAt: null,
    });
    expect(record.skills.map((skill) => skill.state)).toEqual(
      Array(12).fill("not-started"),
    );
    expect(record.nextAction).toMatchObject({
      label: "Start problem 01",
      href: "/practice/sum-two-numbers",
    });
  });

  it("prioritizes the most recent unresolved Wrong Answer", () => {
    const record = buildCodingSkillRecord({
      completedSlugs: ["sum-two-numbers"],
      attempts: [
        {
          problemSlug: "even-or-odd",
          verdict: "Wrong Answer",
          passedTests: 3,
          totalTests: 4,
          createdAt: "2026-08-03T09:00:00.000Z",
        },
        {
          problemSlug: "largest-value",
          verdict: "Wrong Answer",
          passedTests: 2,
          totalTests: 4,
          createdAt: "2026-08-04T09:00:00.000Z",
        },
      ],
    });

    expect(record.nextAction).toMatchObject({
      label: "Retry problem 04",
      href: "/practice/largest-value",
    });
    expect(record.nextAction.description).toContain("2/4 checks");
    expect(record.practiceDays).toBe(2);
  });

  it("keeps an Accepted skill accepted after a later failed retry", () => {
    const record = buildCodingSkillRecord({
      completedSlugs: ["sum-two-numbers"],
      attempts: [
        {
          problemSlug: "sum-two-numbers",
          verdict: "Wrong Answer",
          passedTests: 2,
          totalTests: 4,
          createdAt: "2026-08-05T09:00:00.000Z",
        },
        {
          problemSlug: "sum-two-numbers",
          verdict: "Accepted",
          passedTests: 4,
          totalTests: 4,
          createdAt: "2026-08-04T09:00:00.000Z",
        },
      ],
    });

    expect(record.skills[0]).toMatchObject({
      state: "accepted",
      resultLabel: "4/4 checks",
      lastAttemptedAt: "2026-08-05T09:00:00.000Z",
    });
    expect(record.nextAction.href).toBe("/practice/even-or-odd");
  });

  it("reviews the first skill when all 12 have been Accepted", () => {
    const record = buildCodingSkillRecord({
      completedSlugs: CODING_PROBLEMS.map((problem) => problem.slug),
      attempts: [],
    });

    expect(record.acceptedCount).toBe(12);
    expect(record.nextAction).toMatchObject({
      label: "Review problem 01",
      href: "/practice/sum-two-numbers?mode=clean",
    });
  });

  it("drops attempts for problems outside the authored catalog", () => {
    const record = buildCodingSkillRecord({
      completedSlugs: [],
      attempts: [
        {
          problemSlug: "unknown-problem",
          verdict: "Accepted",
          passedTests: 10,
          totalTests: 10,
          createdAt: "2026-08-05T09:00:00.000Z",
        },
      ],
    });

    expect(record.attemptCount).toBe(0);
    expect(record.practiceDays).toBe(0);
  });
});
