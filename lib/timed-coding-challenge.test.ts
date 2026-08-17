import { describe, expect, it } from "vitest";
import { CODING_PROBLEMS } from "./coding-problems";
import {
  areTimedCodingChallengeSetsInAuthoredOrder,
  formatTimedCodingChallengeElapsedTime,
  getNextTimedCodingChallengeProblem,
  getRecommendedTimedCodingChallengeSet,
  getTimedCodingChallengeSet,
  isTimedCodingChallengeElapsedSeconds,
  isTimedCodingChallengeSetId,
  TIMED_CODING_CHALLENGE_MINUTES,
  TIMED_CODING_CHALLENGE_PROBLEMS,
  TIMED_CODING_CHALLENGE_SETS,
} from "./timed-coding-challenge";

describe("timed coding challenge", () => {
  it("keeps the original challenge as the first stable set", () => {
    expect(TIMED_CODING_CHALLENGE_MINUTES).toBe(30);
    expect(TIMED_CODING_CHALLENGE_PROBLEMS).toHaveLength(3);
    expect(TIMED_CODING_CHALLENGE_PROBLEMS.map((problem) => problem.number)).toEqual([
      2, 4, 6,
    ]);
    expect(TIMED_CODING_CHALLENGE_SETS[0].id).toBe("core-path");
  });

  it("covers all 12 judged problems once across four authored-order sets", () => {
    const timedProblemSlugs = TIMED_CODING_CHALLENGE_SETS.flatMap(
      (challengeSet) => challengeSet.problems.map((problem) => problem.slug),
    );

    expect(TIMED_CODING_CHALLENGE_SETS).toHaveLength(4);
    expect(timedProblemSlugs).toHaveLength(CODING_PROBLEMS.length);
    expect(new Set(timedProblemSlugs).size).toBe(CODING_PROBLEMS.length);
    expect(new Set(timedProblemSlugs)).toEqual(
      new Set(CODING_PROBLEMS.map((problem) => problem.slug)),
    );
    expect(areTimedCodingChallengeSetsInAuthoredOrder()).toBe(true);
  });

  it("returns the first unfinished problem in a selected set", () => {
    const challengeSet = getTimedCodingChallengeSet("collections");

    expect(challengeSet).not.toBeNull();
    expect(
      getNextTimedCodingChallengeProblem(
        ["count-vowels", "sum-two-numbers"],
        challengeSet!,
      )?.slug,
    ).toBe("unique-values");
  });

  it("recommends the first set with unfinished Accepted progress", () => {
    expect(
      getRecommendedTimedCodingChallengeSet([
        "even-or-odd",
        "largest-value",
        "fizz-buzz",
      ]).id,
    ).toBe("input-and-loops");
  });

  it("returns no unfinished problem after a selected set is Accepted", () => {
    expect(
      getNextTimedCodingChallengeProblem([
        "even-or-odd",
        "largest-value",
        "fizz-buzz",
      ]),
    ).toBeNull();
  });

  it("validates and formats only bounded result fields", () => {
    expect(isTimedCodingChallengeSetId("collections")).toBe(true);
    expect(isTimedCodingChallengeSetId("unknown-set")).toBe(false);
    expect(isTimedCodingChallengeElapsedSeconds(0)).toBe(true);
    expect(isTimedCodingChallengeElapsedSeconds(1_800)).toBe(true);
    expect(isTimedCodingChallengeElapsedSeconds(1_801)).toBe(false);
    expect(isTimedCodingChallengeElapsedSeconds(1.5)).toBe(false);
    expect(formatTimedCodingChallengeElapsedTime(754)).toBe("12m 34s");
  });
});
