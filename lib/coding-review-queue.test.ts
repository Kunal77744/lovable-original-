import { describe, expect, it } from "vitest";
import { buildCodingMistakeReviewQueue } from "./coding-review-queue";

const verdict = (
  id: string,
  problemSlug: string,
  result: "Accepted" | "Wrong Answer",
  createdAt: string,
) => ({
  id,
  problemSlug,
  verdict: result,
  passedTests: result === "Accepted" ? 4 : 2,
  totalTests: 4,
  createdAt: new Date(createdAt),
});

describe("buildCodingMistakeReviewQueue", () => {
  it("keeps one private-safe concept for each problem whose latest verdict is wrong", () => {
    const queue = buildCodingMistakeReviewQueue([
      verdict("latest-largest", "largest-value", "Wrong Answer", "2026-08-04T09:00:00Z"),
      verdict("older-largest", "largest-value", "Wrong Answer", "2026-08-04T08:00:00Z"),
      verdict("latest-even", "even-or-odd", "Wrong Answer", "2026-08-04T07:00:00Z"),
    ]);

    expect(queue).toEqual([
      expect.objectContaining({
        slug: "largest-value",
        concept: "Compare only the data values",
        passedTests: 2,
        totalTests: 4,
      }),
      expect.objectContaining({
        slug: "even-or-odd",
        concept: "Remainders reveal divisibility",
      }),
    ]);
    expect(JSON.stringify(queue)).not.toMatch(/function solve|private code/i);
  });

  it("clears a concept when the latest saved verdict is Accepted", () => {
    const queue = buildCodingMistakeReviewQueue([
      verdict("latest", "reverse-a-word", "Accepted", "2026-08-04T09:00:00Z"),
      verdict("older", "reverse-a-word", "Wrong Answer", "2026-08-04T08:00:00Z"),
    ]);

    expect(queue).toEqual([]);
  });

  it("ignores attempts outside the authored 12-problem catalog", () => {
    const queue = buildCodingMistakeReviewQueue([
      verdict("unknown", "private-problem", "Wrong Answer", "2026-08-04T09:00:00Z"),
    ]);

    expect(queue).toEqual([]);
  });
});
