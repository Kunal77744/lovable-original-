import { describe, expect, it } from "vitest";
import { JAVASCRIPT_TREES_GRAPHS_EXERCISES } from "./javascript-trees-graphs";

describe("JavaScript trees and graphs practice", () => {
  it("orders four distinct traversal decisions", () => {
    expect(JAVASCRIPT_TREES_GRAPHS_EXERCISES).toHaveLength(4);
    expect(
      JAVASCRIPT_TREES_GRAPHS_EXERCISES.map((exercise) => exercise.concept),
    ).toEqual([
      "Depth-first traversal",
      "Breadth-first traversal",
      "Graph reachability",
      "Choose a traversal",
    ]);
  });

  it("keeps three deterministic checks and bounded teaching per exercise", () => {
    for (const exercise of JAVASCRIPT_TREES_GRAPHS_EXERCISES) {
      expect(exercise.tests).toHaveLength(3);
      expect(exercise.starterCode).toContain("function solve(input)");
      expect(exercise.recoveryCue.length).toBeGreaterThan(50);
      expect(exercise.takeaway.length).toBeGreaterThan(50);
      expect(exercise.recoveryCue).not.toContain("return ");
      expect(exercise.walkthrough.steps.length).toBeGreaterThanOrEqual(3);
      expect(exercise.walkthrough.steps.length).toBeLessThanOrEqual(5);
      expect(
        exercise.walkthrough.steps.every(
          (step) => step.visited.length > 0 && step.focusValue.length > 0,
        ),
      ).toBe(true);
    }
  });

  it("uses unique exercise slugs", () => {
    const slugs = JAVASCRIPT_TREES_GRAPHS_EXERCISES.map(
      (exercise) => exercise.slug,
    );
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
