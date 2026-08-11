import { describe, expect, it, vi } from "vitest";
import { projectReviewAttemptValues } from "./project-review-history";

describe("projectReviewAttemptValues", () => {
  it("stores only the bounded result facts needed by the private record", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "00000000-0000-4000-8000-000000000001",
    );
    const createdAt = new Date("2026-08-11T09:15:00.000Z");

    expect(
      projectReviewAttemptValues({
        userId: "learner-1",
        projectSlug: "semantic-html-article",
        status: "needs-revision",
        passedChecks: 4,
        totalChecks: 6,
        createdAt,
      }),
    ).toEqual({
      id: "00000000-0000-4000-8000-000000000001",
      userId: "learner-1",
      projectSlug: "semantic-html-article",
      status: "needs-revision",
      passedChecks: 4,
      totalChecks: 6,
      createdAt,
    });
  });
});
