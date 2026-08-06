import { describe, expect, it } from "vitest";
import {
  getNextTimedCodingChallengeProblem,
  isTimedCodingChallengeInAuthoredOrder,
  TIMED_CODING_CHALLENGE_MINUTES,
  TIMED_CODING_CHALLENGE_PROBLEMS,
} from "./timed-coding-challenge";

describe("timed coding challenge", () => {
  it("uses exactly three existing problems in authored order", () => {
    expect(TIMED_CODING_CHALLENGE_MINUTES).toBe(30);
    expect(TIMED_CODING_CHALLENGE_PROBLEMS).toHaveLength(3);
    expect(TIMED_CODING_CHALLENGE_PROBLEMS.map((problem) => problem.number)).toEqual([
      2, 4, 6,
    ]);
    expect(isTimedCodingChallengeInAuthoredOrder()).toBe(true);
  });

  it("returns the first challenge problem without an Accepted result", () => {
    expect(
      getNextTimedCodingChallengeProblem(["even-or-odd", "sum-two-numbers"])
        ?.slug,
    ).toBe("largest-value");
  });

  it("returns no unfinished problem after all three are Accepted", () => {
    expect(
      getNextTimedCodingChallengeProblem([
        "even-or-odd",
        "largest-value",
        "fizz-buzz",
      ]),
    ).toBeNull();
  });
});
