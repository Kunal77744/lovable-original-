import { describe, expect, it } from "vitest";
import { CODING_PROBLEMS } from "./coding-problems";
import { getCodingSolutionReview } from "./coding-solution-review";

const acceptedSources: Record<string, string> = {
  "sum-two-numbers": `function solve(input) {
    const [left, right] = input.trim().split(/\\s+/).map(Number);
    return String(left + right);
  }`,
  "even-or-odd": `function solve(input) {
    return Number(input) % 2 === 0 ? "Even" : "Odd";
  }`,
  "multiplication-table": `function solve(input) {
    const values = [];
    for (let multiplier = 1; multiplier <= 10; multiplier += 1) values.push(Number(input) * multiplier);
    return values.join(" ");
  }`,
  "largest-value": `function solve(input) {
    const [, ...values] = input.trim().split(/\\s+/).map(Number);
    return String(Math.max(...values));
  }`,
  "reverse-a-word": `function solve(input) {
    return input.trim().split("").reverse().join("");
  }`,
  "fizz-buzz": `function solve(input) {
    const output = [];
    for (let value = 1; value <= Number(input); value += 1) {
      if (value % 15 === 0) output.push("FizzBuzz");
      else if (value % 3 === 0) output.push("Fizz");
      else if (value % 5 === 0) output.push("Buzz");
      else output.push(String(value));
    }
    return output.join(" ");
  }`,
};

describe("coding solution reviews", () => {
  it("returns three bounded, problem-specific points for all six problems", () => {
    const reviews = CODING_PROBLEMS.map((problem) => {
      const review = getCodingSolutionReview(
        problem.slug,
        acceptedSources[problem.slug],
      );

      expect(review?.points).toHaveLength(3);
      expect(
        review?.points.filter((point) => point.kind === "consideration"),
      ).toHaveLength(1);
      expect(review?.points.map((point) => point.label)).toEqual([
        "Seen in your source",
        "Checks proved",
        "Keep testing",
      ]);
      expect(review?.points.every((point) => point.text.length <= 130)).toBe(true);

      return review;
    });

    expect(
      new Set(reviews.map((review) => review?.points[0].text)).size,
    ).toBe(CODING_PROBLEMS.length);
    expect(
      new Set(reviews.map((review) => review?.points[1].text)).size,
    ).toBe(CODING_PROBLEMS.length);
  });

  it("does not echo learner source or expose a reference solution", () => {
    const privateMarker = "privateLearnerIdentifier";
    const review = getCodingSolutionReview(
      "sum-two-numbers",
      `function solve(input) { const ${privateMarker} = input.split(" "); return String(+${privateMarker}[0] + +${privateMarker}[1]); }`,
    );
    const renderedReview = JSON.stringify(review);

    expect(renderedReview).not.toContain(privateMarker);
    expect(renderedReview).not.toContain("function solve");
    expect(renderedReview).not.toContain("return String");
  });

  it("refuses unknown problems and empty source", () => {
    expect(
      getCodingSolutionReview("private-problem", "function solve() {}"),
    ).toBeNull();
    expect(getCodingSolutionReview("sum-two-numbers", "   ")).toBeNull();
  });
});
