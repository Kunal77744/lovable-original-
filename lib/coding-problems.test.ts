import { describe, expect, it } from "vitest";
import {
  CODING_PROBLEMS,
  getNextUnfinishedCodingProblemSlug,
  gradeCodingOutputs,
  getCodingProblemPreview,
  hasValidCodingSolutionLength,
} from "./coding-problems";

describe("coding problems", () => {
  it("defines six distinct beginner problems with deterministic tests", () => {
    expect(CODING_PROBLEMS).toHaveLength(6);
    expect(new Set(CODING_PROBLEMS.map((problem) => problem.slug)).size).toBe(6);
    expect(CODING_PROBLEMS.map((problem) => problem.number)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
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
      expect(problem.recoveryHint.length).toBeGreaterThan(80);
    }
    expect(
      new Set(CODING_PROBLEMS.map((problem) => problem.recoveryHint)).size,
    ).toBe(6);
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

  it("builds a distinct, accurate preview for every problem", () => {
    const previews = CODING_PROBLEMS.map((problem) => ({
      slug: problem.slug,
      preview: getCodingProblemPreview(problem.slug),
    }));

    expect(previews).toEqual([
      {
        slug: "sum-two-numbers",
        preview: {
          title: "Sum two numbers JavaScript problem | Lovable Original",
          description:
            "Sum two numbers: solve this beginner JavaScript problem with browser-run checks. Sign in to save your code, attempts, and Accepted result.",
        },
      },
      {
        slug: "even-or-odd",
        preview: {
          title: "Even or odd JavaScript problem | Lovable Original",
          description:
            "Even or odd: solve this beginner JavaScript problem with browser-run checks. Sign in to save your code, attempts, and Accepted result.",
        },
      },
      {
        slug: "multiplication-table",
        preview: {
          title:
            "Multiplication table JavaScript problem | Lovable Original",
          description:
            "Multiplication table: solve this beginner JavaScript problem with browser-run checks. Sign in to save your code, attempts, and Accepted result.",
        },
      },
      {
        slug: "largest-value",
        preview: {
          title: "Largest value JavaScript problem | Lovable Original",
          description:
            "Largest value: solve this beginner JavaScript problem with browser-run checks. Sign in to save your code, attempts, and Accepted result.",
        },
      },
      {
        slug: "reverse-a-word",
        preview: {
          title: "Reverse a word JavaScript problem | Lovable Original",
          description:
            "Reverse a word: solve this beginner JavaScript problem with browser-run checks. Sign in to save your code, attempts, and Accepted result.",
        },
      },
      {
        slug: "fizz-buzz",
        preview: {
          title: "FizzBuzz sequence JavaScript problem | Lovable Original",
          description:
            "FizzBuzz sequence: solve this beginner JavaScript problem with browser-run checks. Sign in to save your code, attempts, and Accepted result.",
        },
      },
    ]);

    expect(new Set(previews.map(({ preview }) => preview?.title)).size).toBe(6);
    expect(new Set(previews.map(({ preview }) => preview?.description)).size).toBe(
      6,
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
