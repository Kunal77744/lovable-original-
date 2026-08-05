import { describe, expect, it } from "vitest";
import { JAVASCRIPT_DATA_STRUCTURE_EXERCISES } from "./javascript-data-structures";

describe("JAVASCRIPT_DATA_STRUCTURE_EXERCISES", () => {
  it("orders four distinct beginner data structures", () => {
    expect(
      JAVASCRIPT_DATA_STRUCTURE_EXERCISES.map((exercise) => exercise.structure),
    ).toEqual(["Arrays", "Strings", "Objects", "Sets"]);
    expect(
      JAVASCRIPT_DATA_STRUCTURE_EXERCISES.map((exercise) => exercise.number),
    ).toEqual([1, 2, 3, 4]);
  });

  it("starts every exercise unfinished with three deterministic checks", () => {
    for (const exercise of JAVASCRIPT_DATA_STRUCTURE_EXERCISES) {
      expect(exercise.starterCode).toContain("function solve(input)");
      expect(exercise.starterCode).toContain("//");
      expect(exercise.tests).toHaveLength(3);
      expect(exercise.recoveryCue.length).toBeGreaterThan(30);
      expect(exercise.takeaway.length).toBeGreaterThan(40);
    }
  });

  it("keeps teaching guidance code-free", () => {
    for (const exercise of JAVASCRIPT_DATA_STRUCTURE_EXERCISES) {
      expect(exercise.recoveryCue).not.toContain("function solve");
      expect(exercise.recoveryCue).not.toContain("=>");
      expect(exercise.takeaway).not.toContain("function solve");
      expect(exercise.takeaway).not.toContain("=>");
    }
  });
});
