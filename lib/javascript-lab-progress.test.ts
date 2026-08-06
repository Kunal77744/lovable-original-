import { describe, expect, it } from "vitest";
import {
  getFirstIncompleteExerciseIndex,
  getNextIncompleteExerciseIndex,
  isJavaScriptLabExercise,
  JAVASCRIPT_LABS,
} from "./javascript-lab-progress";

describe("JavaScript lab progress catalog", () => {
  it("defines 34 unique exercises across nine private labs", () => {
    const keys = JAVASCRIPT_LABS.flatMap((lab) =>
      lab.exerciseIds.map((exerciseId) => `${lab.slug}:${exerciseId}`),
    );
    expect(JAVASCRIPT_LABS).toHaveLength(9);
    expect(keys).toHaveLength(34);
    expect(new Set(keys)).toHaveLength(34);
  });

  it("rejects unknown lab and exercise combinations", () => {
    expect(isJavaScriptLabExercise("tracing", "assignment-order")).toBe(true);
    expect(isJavaScriptLabExercise("tracing", "parse-input")).toBe(false);
    expect(isJavaScriptLabExercise("recursion", "stop-at-the-base-case")).toBe(
      true,
    );
    expect(isJavaScriptLabExercise("unknown", "assignment-order")).toBe(false);
  });

  it("resumes at the first unfinished exercise and skips completed work", () => {
    const ids = ["one", "two", "three"];
    expect(getFirstIncompleteExerciseIndex(ids, ["one"])).toBe(1);
    expect(getNextIncompleteExerciseIndex(ids, ["one", "two"], 0)).toBe(2);
    expect(getFirstIncompleteExerciseIndex(ids, ids)).toBe(3);
  });
});
