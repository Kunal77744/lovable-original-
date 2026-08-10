import { describe, expect, it } from "vitest";
import {
  CODING_PROBLEMS,
  getNextUnfinishedCodingProblemSlug,
  gradeCodingOutputs,
  getCodingProblemPreview,
  hasValidCodingSolutionLength,
} from "./coding-problems";

describe("coding problems", () => {
  it("defines 12 distinct ordered problems with deterministic tests", () => {
    expect(CODING_PROBLEMS).toHaveLength(12);
    expect(new Set(CODING_PROBLEMS.map((problem) => problem.slug)).size).toBe(12);
    expect(CODING_PROBLEMS.map((problem) => problem.number)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
    expect(CODING_PROBLEMS.map((problem) => problem.skill)).toEqual([
      "Input handling",
      "Conditions",
      "Loops",
      "Arrays",
      "Strings",
      "Simple algorithms",
      "String traversal",
      "Sets",
      "Stacks",
      "Frequency maps",
      "Binary search",
      "Sliding windows",
    ]);

    for (const problem of CODING_PROBLEMS) {
      expect(problem.tests.length).toBeGreaterThanOrEqual(4);
      expect(problem.examples.length).toBeGreaterThan(0);
      expect(problem.constraints).toHaveLength(2);
      expect(new Set(problem.constraints).size).toBe(2);
      for (const constraint of problem.constraints) {
        expect(constraint).not.toHaveLength(0);
        expect(constraint).not.toContain("function solve");
      }
      expect(problem.starterCode).toContain("function solve(input)");
      expect(problem.recoveryHint.length).toBeGreaterThan(80);
      expect(problem.recoveryHints).toHaveLength(2);
      expect(new Set(problem.recoveryHints).size).toBe(2);
      for (const hint of problem.recoveryHints) {
        expect(hint.length).toBeGreaterThan(80);
        expect(hint).not.toContain("function solve");
      }
      expect(problem.acceptedExplanation.concept).not.toHaveLength(0);
      expect(problem.acceptedExplanation.whyItWorks).not.toHaveLength(0);
      expect(problem.acceptedExplanation.commonMistake).not.toHaveLength(0);
      expect(JSON.stringify(problem.acceptedExplanation)).not.toContain(
        "function solve",
      );
    }
    expect(
      new Set(CODING_PROBLEMS.map((problem) => problem.recoveryHint)).size,
    ).toBe(12);
    expect(
      new Set(
        CODING_PROBLEMS.map(
          (problem) => problem.acceptedExplanation.concept,
        ),
      ).size,
    ).toBe(12);
  });

  it("grades normalized outputs without executing learner code", () => {
    for (const problem of CODING_PROBLEMS) {
      expect(
        gradeCodingOutputs(
          problem.slug,
          problem.tests.map((test) => `${test.expectedOutput}\n`),
        ),
      ).toEqual({
        verdict: "Accepted",
        passedTests: problem.tests.length,
        totalTests: problem.tests.length,
      });
    }

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

  it("builds a distinct, accurate preview for every problem", () => {
    const previews = CODING_PROBLEMS.map((problem) => ({
      slug: problem.slug,
      preview: getCodingProblemPreview(problem.slug),
    }));

    for (const { slug, preview } of previews) {
      const problem = CODING_PROBLEMS.find((candidate) => candidate.slug === slug);
      expect(preview).toEqual({
        title: `${problem?.title} JavaScript problem | Lovable Original`,
        description: `${problem?.title}: solve this ${problem?.difficulty.toLowerCase()} JavaScript problem with browser-run checks. Sign in to save your code, attempts, and Accepted result.`,
      });
    }

    expect(new Set(previews.map(({ preview }) => preview?.title)).size).toBe(12);
    expect(new Set(previews.map(({ preview }) => preview?.description)).size).toBe(
      12,
    );
    expect(getCodingProblemPreview("missing-problem")).toBeNull();
  });

  it("selects the first unfinished problem and stops at a complete catalog", () => {
    expect(
      getNextUnfinishedCodingProblemSlug([
        "sum-two-numbers",
        "multiplication-table",
      ]),
    ).toBe("even-or-odd");
    expect(
      getNextUnfinishedCodingProblemSlug(
        CODING_PROBLEMS.map((problem) => problem.slug),
      ),
    ).toBeNull();
  });
});
