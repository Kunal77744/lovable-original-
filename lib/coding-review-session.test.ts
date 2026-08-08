import { describe, expect, it } from "vitest";
import { buildCodingReviewSession } from "./coding-review-session";

const mistake = (slug: string, number: number) => ({
  slug,
  number,
  title: `Problem ${number}`,
  skill: `Skill ${number}`,
  concept: `Concept ${number}`,
  recoveryHint: `Try ${number}`,
  passedTests: number - 1,
  totalTests: 4,
  attemptedAt: `2026-08-04T0${number}:00:00.000Z`,
});

const bookmark = (slug: string, number: number) => ({
  slug,
  number,
  title: `Problem ${number}`,
  skill: `Skill ${number}`,
});

describe("buildCodingReviewSession", () => {
  it("puts unresolved mistakes before bookmarks and removes duplicates", () => {
    const session = buildCodingReviewSession({
      mistakes: [mistake("largest-value", 4), mistake("even-or-odd", 2)],
      bookmarks: [
        bookmark("largest-value", 4),
        bookmark("reverse-a-word", 5),
      ],
      completedSlugs: ["reverse-a-word"],
    });

    expect(session.map(({ slug, source }) => ({ slug, source }))).toEqual([
      { slug: "largest-value", source: "mistake" },
      { slug: "even-or-odd", source: "mistake" },
      { slug: "reverse-a-word", source: "bookmark" },
    ]);
    expect(session[2]).toEqual(
      expect.objectContaining({ acceptedBefore: true, concept: null }),
    );
  });

  it("keeps the review session to three deterministic items", () => {
    const session = buildCodingReviewSession({
      mistakes: [mistake("one", 1), mistake("two", 2)],
      bookmarks: [
        bookmark("three", 3),
        bookmark("four", 4),
        bookmark("five", 5),
      ],
      completedSlugs: [],
      limit: 10,
    });

    expect(session.map((item) => item.slug)).toEqual(["one", "two", "three"]);
  });

  it("returns a truthful empty session when no private weak spots exist", () => {
    expect(
      buildCodingReviewSession({
        mistakes: [],
        bookmarks: [],
        completedSlugs: ["sum-two-numbers"],
      }),
    ).toEqual([]);
  });
});
