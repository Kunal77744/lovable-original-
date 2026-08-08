import { describe, expect, it } from "vitest";
import { JAVASCRIPT_FOUNDATION_EXERCISES } from "./javascript-foundations";

describe("JavaScript foundations warm-up", () => {
  it("keeps one ordered three-concept path with three checks per exercise", () => {
    expect(JAVASCRIPT_FOUNDATION_EXERCISES).toHaveLength(3);
    expect(
      JAVASCRIPT_FOUNDATION_EXERCISES.map((exercise) => exercise.number),
    ).toEqual([1, 2, 3]);
    expect(
      JAVASCRIPT_FOUNDATION_EXERCISES.map((exercise) => exercise.concept),
    ).toEqual(["Parse", "Decide", "Repeat"]);
    expect(
      JAVASCRIPT_FOUNDATION_EXERCISES.every(
        (exercise) => exercise.tests.length === 3,
      ),
    ).toBe(true);
  });

  it("starts every exercise unfinished and keeps recovery guidance code-free", () => {
    for (const exercise of JAVASCRIPT_FOUNDATION_EXERCISES) {
      expect(exercise.starterCode).toContain("//");
      expect(exercise.recoveryCue).not.toContain("function solve");
      expect(exercise.takeaway).not.toContain("function solve");
    }
  });
});
