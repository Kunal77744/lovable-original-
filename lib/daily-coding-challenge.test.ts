import { describe, expect, it } from "vitest";
import { CODING_PROBLEMS } from "./coding-problems";
import {
  getDailyCodingChallenge,
  getDailyCodingChallengeForDateKey,
  isCurrentDailyCodingChallenge,
  isUtcDateKey,
  toUtcDateKey,
} from "./daily-coding-challenge";

describe("daily coding challenge", () => {
  it("selects one stable catalog problem for the UTC date", () => {
    const morning = new Date("2026-08-08T00:01:00.000Z");
    const evening = new Date("2026-08-08T23:59:00.000Z");

    expect(getDailyCodingChallenge(morning)).toEqual(
      getDailyCodingChallenge(evening),
    );
    expect(CODING_PROBLEMS).toContain(getDailyCodingChallenge(morning));
    expect(toUtcDateKey(evening)).toBe("2026-08-08");
  });

  it("rotates through all 12 problems across 12 consecutive UTC dates", () => {
    const selectedSlugs = Array.from({ length: 12 }, (_, offset) =>
      getDailyCodingChallenge(
        new Date(Date.UTC(2026, 7, 1 + offset)),
      ).slug,
    );

    expect(new Set(selectedSlugs)).toEqual(
      new Set(CODING_PROBLEMS.map((problem) => problem.slug)),
    );
  });

  it("accepts only the current date and its selected problem as daily context", () => {
    const now = new Date("2026-08-08T14:30:00.000Z");
    const selected = getDailyCodingChallenge(now);

    expect(
      isCurrentDailyCodingChallenge({
        dateKey: "2026-08-08",
        problemSlug: selected.slug,
        now,
      }),
    ).toBe(true);
    expect(
      isCurrentDailyCodingChallenge({
        dateKey: "2026-08-07",
        problemSlug: selected.slug,
        now,
      }),
    ).toBe(false);
    expect(
      isCurrentDailyCodingChallenge({
        dateKey: "2026-08-08",
        problemSlug: CODING_PROBLEMS.find(
          (problem) => problem.slug !== selected.slug,
        )!.slug,
        now,
      }),
    ).toBe(false);
  });

  it("rejects malformed or impossible dates", () => {
    expect(isUtcDateKey("2026-08-08")).toBe(true);
    expect(isUtcDateKey("2026-02-30")).toBe(false);
    expect(isUtcDateKey("2026-99-99")).toBe(false);
    expect(isUtcDateKey("08-08-2026")).toBe(false);
    expect(getDailyCodingChallengeForDateKey("not-a-date")).toBeNull();
  });
});
