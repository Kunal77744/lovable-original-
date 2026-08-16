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
      expect(exercise.operationWalkthrough.steps.length).toBeGreaterThanOrEqual(3);
      expect(exercise.operationWalkthrough.itemOrder.length).toBeGreaterThan(20);
      for (const step of exercise.operationWalkthrough.steps) {
        expect(step.operation.length).toBeGreaterThan(3);
        expect(step.explanation.length).toBeGreaterThan(20);
      }
    }
  });

  it("authors truthful walkthroughs for every stack and queue outcome", () => {
    expect(
      JAVASCRIPT_STACKS_QUEUES_EXERCISES.map((exercise) => ({
        slug: exercise.slug,
        structure: exercise.operationWalkthrough.structure,
        finalItems:
          exercise.operationWalkthrough.steps.at(-1)?.items ?? [],
        removedItem:
          exercise.operationWalkthrough.steps.at(-1)?.removedItem ?? null,
      })),
    ).toEqual([
      {
        slug: "remove-the-newest-item",
        structure: "stack",
        finalItems: ["red"],
        removedItem: "blue",
      },
      {
        slug: "balance-delimiter-pairs",
        structure: "stack",
        finalItems: [],
        removedItem: "(",
      },
      {
        slug: "serve-the-oldest-item",
        structure: "queue",
        finalItems: ["Cleo"],
        removedItem: "Ben",
      },
      {
        slug: "choose-stack-or-queue",
        structure: "stack",
        finalItems: ["Rename heading"],
        removedItem: "Change color",
      },
    ]);
  });

  it("uses unique exercise slugs", () => {
    const slugs = JAVASCRIPT_STACKS_QUEUES_EXERCISES.map(
      (exercise) => exercise.slug,
    );
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
