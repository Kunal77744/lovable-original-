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
      expect(exercise.pointerWalkthrough.steps.length).toBeGreaterThanOrEqual(
        3,
      );
      for (const step of exercise.pointerWalkthrough.steps) {
        expect(step.action.length).toBeGreaterThan(5);
        expect(step.explanation.length).toBeGreaterThan(30);
        expect(step.nodes.length).toBeGreaterThan(0);
        expect(step.pointers.length).toBeGreaterThan(0);
        expect(step.facts).toHaveLength(2);
      }
    }
  });

  it("authors a truthful final pointer state for every linked-list outcome", () => {
    expect(
      JAVASCRIPT_LINKED_LIST_EXERCISES.map((exercise) => {
        const finalStep = exercise.pointerWalkthrough.steps.at(-1);

        return {
          slug: exercise.slug,
          nodes: finalStep?.nodes.map((node) => [
            node.value,
            node.next,
            node.state ?? null,
          ]),
          pointers: finalStep?.pointers,
        };
      }),
    ).toEqual([
      {
        slug: "connect-the-next-node",
        nodes: [
          ["red", "blue", null],
          ["blue", "green", "changed"],
          ["green", null, null],
        ],
        pointers: [
          { name: "head", target: "red" },
          { name: "tail", target: "green" },
        ],
      },
      {
        slug: "traverse-every-node",
        nodes: [
          ["4", "seven", null],
          ["7", "two", null],
          ["2", null, null],
        ],
        pointers: [
          { name: "head", target: "four" },
          { name: "current", target: null },
        ],
      },
      {
        slug: "reverse-the-links",
        nodes: [
          ["red", null, null],
          ["blue", "red", null],
          ["green", "blue", "changed"],
        ],
        pointers: [
          { name: "previous", target: "green" },
          { name: "current", target: null },
        ],
      },
      {
        slug: "choose-the-list-operation",
        nodes: [
          ["A", "b", null],
          ["B", null, "changed"],
          ["C", null, "detached"],
        ],
        pointers: [
          { name: "known", target: "b" },
          { name: "removed", target: "c" },
        ],
      },
    ]);
  });

  it("uses unique exercise slugs", () => {
    const slugs = JAVASCRIPT_LINKED_LIST_EXERCISES.map(
      (exercise) => exercise.slug,
    );
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
