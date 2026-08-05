import { describe, expect, it } from "vitest";
import { JAVASCRIPT_TRACE_EXERCISES } from "./javascript-tracing";

describe("JavaScript trace exercises", () => {
  it("offers four ordered exercises with one valid answer each", () => {
    expect(JAVASCRIPT_TRACE_EXERCISES).toHaveLength(4);
    expect(JAVASCRIPT_TRACE_EXERCISES.map((exercise) => exercise.number)).toEqual([
      1, 2, 3, 4,
    ]);

    for (const exercise of JAVASCRIPT_TRACE_EXERCISES) {
      expect(exercise.choices).toContain(exercise.correctOutput);
      expect(exercise.traceSteps).toHaveLength(3);
      expect(exercise.recoveryCue.length).toBeGreaterThan(30);
      expect(exercise.takeaway.length).toBeGreaterThan(30);
    }
  });

  it("covers four distinct code-reading concepts", () => {
    expect(
      new Set(JAVASCRIPT_TRACE_EXERCISES.map((exercise) => exercise.concept)).size,
    ).toBe(4);
  });
});

