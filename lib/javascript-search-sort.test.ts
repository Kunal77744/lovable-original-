import { describe, expect, it } from "vitest";
import { JAVASCRIPT_SEARCH_SORT_EXERCISES } from "./javascript-search-sort";

describe("JavaScript searching and sorting fundamentals", () => {
  it("orders four distinct search and sort decisions", () => {
    expect(JAVASCRIPT_SEARCH_SORT_EXERCISES).toHaveLength(4);
    expect(
      JAVASCRIPT_SEARCH_SORT_EXERCISES.map((exercise) => exercise.concept),
    ).toEqual([
      "Linear search",
      "Binary search",
      "Numeric sort",
      "Choose a tool",
    ]);
  });

  it("keeps three deterministic checks and bounded teaching per exercise", () => {
    for (const exercise of JAVASCRIPT_SEARCH_SORT_EXERCISES) {
      expect(exercise.tests).toHaveLength(3);
      expect(exercise.starterCode).toContain("function solve(input)");
      expect(exercise.recoveryCue.length).toBeGreaterThan(50);
      expect(exercise.takeaway.length).toBeGreaterThan(50);
      expect(exercise.recoveryCue).not.toContain("return ");
    }
  });

  it("uses unique exercise slugs", () => {
    const slugs = JAVASCRIPT_SEARCH_SORT_EXERCISES.map(
      (exercise) => exercise.slug,
    );
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
