import { describe, expect, it } from "vitest";
import {
  CODING_PROBLEMS,
  gradeCodingOutputs,
  hasValidCodingSolutionLength,
} from "./coding-problems";

describe("coding problems", () => {
  it("defines six distinct beginner problems with deterministic tests", () => {
    expect(CODING_PROBLEMS).toHaveLength(6);
    expect(new Set(CODING_PROBLEMS.map((problem) => problem.slug)).size).toBe(6);
    expect(CODING_PROBLEMS.map((problem) => problem.skill)).toEqual([
      "Input handling",
      "Conditions",
      "Loops",
      "Arrays",
      "Strings",
      "Simple algorithms",
    ]);

    for (const problem of CODING_PROBLEMS) {
      expect(problem.tests.length).toBeGreaterThanOrEqual(4);
      expect(problem.examples.length).toBeGreaterThan(0);
      expect(problem.starterCode).toContain("function solve(input)");
    }
  });

  it("grades normalized outputs without executing learner code", () => {
    expect(
      gradeCodingOutputs("sum-two-numbers", ["13\n", "-5", "0", "1000"]),
    ).toEqual({
      verdict: "Accepted",
      passedTests: 4,
      totalTests: 4,
    });
    expect(
      gradeCodingOutputs("sum-two-numbers", ["12", "-5", "0", "1000"]),
    ).toEqual({
      verdict: "Wrong Answer",
      passedTests: 3,
      totalTests: 4,
    });
    expect(gradeCodingOutputs("missing", [])).toBeNull();
  });

  it("rejects empty or oversized solutions", () => {
    expect(hasValidCodingSolutionLength("")).toBe(false);
    expect(hasValidCodingSolutionLength("function solve() {}")).toBe(true);
    expect(hasValidCodingSolutionLength("x".repeat(12_001))).toBe(false);
  });
});
