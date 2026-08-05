import { describe, expect, it } from "vitest";
import { JAVASCRIPT_FUNCTION_EXERCISES } from "./javascript-functions-scope";

describe("JAVASCRIPT_FUNCTION_EXERCISES", () => {
  it("orders four distinct function concepts", () => {
    expect(JAVASCRIPT_FUNCTION_EXERCISES.map((exercise) => exercise.concept)).toEqual([
      "Parameters",
      "Return values",
      "Local scope",
      "Closures",
    ]);
    expect(JAVASCRIPT_FUNCTION_EXERCISES.map((exercise) => exercise.number)).toEqual([
      1, 2, 3, 4,
    ]);
  });

  it("starts every exercise unfinished with three deterministic checks", () => {
    for (const exercise of JAVASCRIPT_FUNCTION_EXERCISES) {
      expect(exercise.starterCode).toContain("function solve(input)");
      expect(exercise.starterCode).toContain("//");
      expect(exercise.tests).toHaveLength(3);
      expect(exercise.recoveryCue.length).toBeGreaterThan(50);
      expect(exercise.takeaway.length).toBeGreaterThan(60);
    }
  });

  it("keeps recovery and teaching guidance code-free", () => {
    for (const exercise of JAVASCRIPT_FUNCTION_EXERCISES) {
      expect(exercise.recoveryCue).not.toContain("=>");
      expect(exercise.recoveryCue).not.toContain("function solve");
      expect(exercise.takeaway).not.toContain("=>");
      expect(exercise.takeaway).not.toContain("function solve");
    }
  });
});
