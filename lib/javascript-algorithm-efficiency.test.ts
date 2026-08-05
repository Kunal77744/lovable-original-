import { describe, expect, it } from "vitest";
import { ALGORITHM_EFFICIENCY_EXERCISES } from "./javascript-algorithm-efficiency";

describe("algorithm efficiency exercises", () => {
  it("covers four distinct complexity decisions in authored order", () => {
    expect(ALGORITHM_EFFICIENCY_EXERCISES).toHaveLength(4);
    expect(
      ALGORITHM_EFFICIENCY_EXERCISES.map((exercise) => exercise.concept),
    ).toEqual([
      "Constant time",
      "Linear time",
      "Quadratic time",
      "Space-time tradeoff",
    ]);
    expect(
      ALGORITHM_EFFICIENCY_EXERCISES.map((exercise) => exercise.number),
    ).toEqual([1, 2, 3, 4]);
  });

  it("gives every decision two approaches and bounded teaching", () => {
    for (const exercise of ALGORITHM_EFFICIENCY_EXERCISES) {
      expect(exercise.approaches).toHaveLength(2);
      expect(
        exercise.approaches.some(
          (approach) => approach.id === exercise.correctApproachId,
        ),
      ).toBe(true);
      expect(exercise.recoveryCue.length).toBeGreaterThan(30);
      expect(exercise.explanation.length).toBeGreaterThan(50);
      expect(exercise.takeaway.length).toBeGreaterThan(50);
    }
  });

  it("names the operation cost and growth for both approaches", () => {
    for (const exercise of ALGORITHM_EFFICIENCY_EXERCISES) {
      for (const approach of exercise.approaches) {
        expect(approach.workAtScale).toMatch(/operation|lookup|check|comparison|addition/);
        expect(approach.growth).toMatch(/^O\(.+\)$/);
      }
    }
  });
});
