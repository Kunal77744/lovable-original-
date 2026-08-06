import { describe, expect, it } from "vitest";
import { JAVASCRIPT_LINKED_LIST_EXERCISES } from "./javascript-linked-lists";

describe("JavaScript linked-list fundamentals", () => {
  it("orders four distinct linked-list decisions", () => {
    expect(JAVASCRIPT_LINKED_LIST_EXERCISES).toHaveLength(4);
    expect(
      JAVASCRIPT_LINKED_LIST_EXERCISES.map((exercise) => exercise.concept),
    ).toEqual([
      "Node links",
      "Traversal",
      "Reverse links",
      "Choose an operation",
    ]);
  });

  it("keeps three deterministic checks and bounded teaching per exercise", () => {
    for (const exercise of JAVASCRIPT_LINKED_LIST_EXERCISES) {
      expect(exercise.tests).toHaveLength(3);
      expect(exercise.starterCode).toContain("function solve(input)");
      expect(exercise.recoveryCue.length).toBeGreaterThan(50);
      expect(exercise.takeaway.length).toBeGreaterThan(50);
      expect(exercise.recoveryCue).not.toContain("return ");
    }
  });

  it("uses unique exercise slugs", () => {
    const slugs = JAVASCRIPT_LINKED_LIST_EXERCISES.map(
      (exercise) => exercise.slug,
    );
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
