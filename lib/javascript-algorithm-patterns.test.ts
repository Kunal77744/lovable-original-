import { describe, expect, it } from "vitest";
import { JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES } from "./javascript-algorithm-patterns";

describe("JavaScript algorithm patterns", () => {
  it("orders four distinct implementation patterns", () => {
    expect(JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES).toHaveLength(4);
    expect(
      JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES.map((exercise) => exercise.concept),
    ).toEqual([
      "Frequency map",
      "Two pointers",
      "Sliding window",
      "Prefix sums",
    ]);
  });

  it("requires code implementation rather than complexity selection", () => {
    for (const exercise of JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES) {
      expect(exercise.starterCode).toContain("function solve(input)");
      expect(exercise.prompt).toMatch(/complete/i);
      expect(exercise.tests).toHaveLength(3);
      expect(exercise.tests.every((test) => test.input.length > 0)).toBe(true);
    }
  });

  it("keeps recovery code-free and teaching behind success", () => {
    for (const exercise of JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES) {
      expect(exercise.recoveryCue.length).toBeGreaterThan(60);
      expect(exercise.takeaway.length).toBeGreaterThan(60);
      expect(exercise.recoveryCue).not.toContain("return ");
    }
  });

  it("uses unique exercise slugs", () => {
    const slugs = JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES.map(
      (exercise) => exercise.slug,
    );
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
