import { describe, expect, it } from "vitest";
import { JAVASCRIPT_RECURSION_EXERCISES } from "./javascript-recursion";

describe("JAVASCRIPT_RECURSION_EXERCISES", () => {
  it("orders four distinct recursion fundamentals", () => {
    expect(
      JAVASCRIPT_RECURSION_EXERCISES.map((exercise) => exercise.concept),
    ).toEqual(["Base case", "Smaller input", "Call stack", "Termination"]);
    expect(
      JAVASCRIPT_RECURSION_EXERCISES.map((exercise) => exercise.number),
    ).toEqual([1, 2, 3, 4]);
  });

  it("starts every exercise unfinished with three deterministic checks", () => {
    for (const exercise of JAVASCRIPT_RECURSION_EXERCISES) {
      expect(exercise.starterCode).toContain("function solve(input)");
      expect(exercise.starterCode).toContain("//");
      expect(exercise.tests).toHaveLength(3);
      expect(exercise.recoveryCue.length).toBeGreaterThan(70);
      expect(exercise.takeaway.length).toBeGreaterThan(80);
      expect(exercise.stackTrace.steps.length).toBeGreaterThanOrEqual(5);
      expect(exercise.stackTrace.steps[0].phase).toBe("Call");
      expect(exercise.stackTrace.steps.at(-1)?.phase).toBe("Return");
      expect(
        exercise.stackTrace.steps.some((step) => step.phase === "Base case"),
      ).toBe(true);
    }
  });

  it("keeps recovery and teaching guidance code-free", () => {
    for (const exercise of JAVASCRIPT_RECURSION_EXERCISES) {
      expect(exercise.recoveryCue).not.toContain("=>");
      expect(exercise.recoveryCue).not.toContain("function solve");
      expect(exercise.takeaway).not.toContain("=>");
      expect(exercise.takeaway).not.toContain("function solve");
    }
  });
});
