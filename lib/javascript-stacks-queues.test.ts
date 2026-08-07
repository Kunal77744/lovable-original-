import { describe, expect, it } from "vitest";
import { JAVASCRIPT_STACKS_QUEUES_EXERCISES } from "./javascript-stacks-queues";

describe("JavaScript stacks and queues fundamentals", () => {
  it("orders four distinct stack and queue decisions", () => {
    expect(JAVASCRIPT_STACKS_QUEUES_EXERCISES).toHaveLength(4);
    expect(
      JAVASCRIPT_STACKS_QUEUES_EXERCISES.map((exercise) => exercise.concept),
    ).toEqual([
      "Stack operations",
      "Balanced delimiters",
      "Queue operations",
      "Choose a structure",
    ]);
  });

  it("keeps three deterministic checks and bounded teaching per exercise", () => {
    for (const exercise of JAVASCRIPT_STACKS_QUEUES_EXERCISES) {
      expect(exercise.tests).toHaveLength(3);
      expect(exercise.starterCode).toContain("function solve(input)");
      expect(exercise.recoveryCue.length).toBeGreaterThan(50);
      expect(exercise.takeaway.length).toBeGreaterThan(50);
      expect(exercise.recoveryCue).not.toContain("return ");
    }
  });

  it("uses unique exercise slugs", () => {
    const slugs = JAVASCRIPT_STACKS_QUEUES_EXERCISES.map(
      (exercise) => exercise.slug,
    );
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
