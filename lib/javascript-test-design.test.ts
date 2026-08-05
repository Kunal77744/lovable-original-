import { describe, expect, it } from "vitest";
import { JAVASCRIPT_TEST_DESIGN_EXERCISES } from "./javascript-test-design";

describe("JAVASCRIPT_TEST_DESIGN_EXERCISES", () => {
  it("defines four ordered exercises with one breaking input each", () => {
    expect(JAVASCRIPT_TEST_DESIGN_EXERCISES).toHaveLength(4);
    expect(
      JAVASCRIPT_TEST_DESIGN_EXERCISES.map((exercise) => exercise.number),
    ).toEqual([1, 2, 3, 4]);

    for (const exercise of JAVASCRIPT_TEST_DESIGN_EXERCISES) {
      expect(exercise.choices).toHaveLength(3);
      expect(
        exercise.choices.filter(
          (choice) => choice.expectedOutput !== choice.faultyOutput,
        ),
      ).toEqual([
        expect.objectContaining({ input: exercise.correctInput }),
      ]);
      expect(exercise.recoveryCue.length).toBeGreaterThan(30);
      expect(exercise.takeaway.length).toBeGreaterThan(40);
    }
  });

  it("covers distinct reusable test-design concepts", () => {
    expect(
      new Set(
        JAVASCRIPT_TEST_DESIGN_EXERCISES.map((exercise) => exercise.concept),
      ).size,
    ).toBe(4);
  });
});
