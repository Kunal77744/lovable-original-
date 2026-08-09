import { describe, expect, it } from "vitest";
import {
  CODING_PROBLEMS,
  CODING_SOLUTION_SCAFFOLD,
} from "./coding-problems";

describe("JavaScript problem starter code", () => {
  it("starts every unsolved problem with a function scaffold, not the answer", () => {
    expect(CODING_SOLUTION_SCAFFOLD).toContain("function solve(input)");
    expect(CODING_SOLUTION_SCAFFOLD).toContain('return ""');
    expect(CODING_PROBLEMS.map((problem) => problem.starterCode)).toEqual(
      Array.from({ length: CODING_PROBLEMS.length }, () => CODING_SOLUTION_SCAFFOLD),
    );
    expect(
      CODING_PROBLEMS.every((problem) =>
        problem.tests.every((test) => test.expectedOutput.length > 0),
      ),
    ).toBe(true);
  });
});
