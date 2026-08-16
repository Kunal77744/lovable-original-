import { describe, expect, it } from "vitest";
import { JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES } from "@/lib/javascript-algorithm-patterns";
import { JAVASCRIPT_DATA_STRUCTURE_EXERCISES } from "@/lib/javascript-data-structures";
import { JAVASCRIPT_DOM_EXERCISES } from "@/lib/javascript-dom-exercises";
import { JAVASCRIPT_FUNCTION_EXERCISES } from "@/lib/javascript-functions-scope";
import { JAVASCRIPT_LINKED_LIST_EXERCISES } from "@/lib/javascript-linked-lists";
import { JAVASCRIPT_RECURSION_EXERCISES } from "@/lib/javascript-recursion";
import { JAVASCRIPT_STACKS_QUEUES_EXERCISES } from "@/lib/javascript-stacks-queues";
import { JAVASCRIPT_TRACE_EXERCISES } from "@/lib/javascript-tracing";
import { JAVASCRIPT_TREES_GRAPHS_EXERCISES } from "@/lib/javascript-trees-graphs";

function totalSteps<T>(items: T[], readSteps: (item: T) => unknown[]) {
  return items.reduce((total, item) => total + readSteps(item).length, 0);
}

describe("guided JavaScript teaching release", () => {
  it("keeps every authored exercise and success-gated teaching state", () => {
    expect(JAVASCRIPT_TRACE_EXERCISES).toHaveLength(4);
    expect(
      totalSteps(JAVASCRIPT_TRACE_EXERCISES, (exercise) =>
        exercise.practiceSteps,
      ),
    ).toBe(12);

    expect(JAVASCRIPT_RECURSION_EXERCISES).toHaveLength(4);
    expect(
      totalSteps(JAVASCRIPT_RECURSION_EXERCISES, (exercise) =>
        exercise.stackTrace.steps,
      ),
    ).toBe(28);

    expect(JAVASCRIPT_STACKS_QUEUES_EXERCISES).toHaveLength(4);
    expect(
      totalSteps(JAVASCRIPT_STACKS_QUEUES_EXERCISES, (exercise) =>
        exercise.operationWalkthrough.steps,
      ),
    ).toBe(17);

    expect(JAVASCRIPT_LINKED_LIST_EXERCISES).toHaveLength(4);
    expect(
      totalSteps(JAVASCRIPT_LINKED_LIST_EXERCISES, (exercise) =>
        exercise.pointerWalkthrough.steps,
      ),
    ).toBe(17);

    expect(JAVASCRIPT_TREES_GRAPHS_EXERCISES).toHaveLength(4);
    expect(
      totalSteps(JAVASCRIPT_TREES_GRAPHS_EXERCISES, (exercise) =>
        exercise.walkthrough.steps,
      ),
    ).toBe(17);

    expect(JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES).toHaveLength(4);
    expect(
      totalSteps(JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES, (exercise) =>
        exercise.walkthrough.steps,
      ),
    ).toBe(18);

    expect(JAVASCRIPT_DOM_EXERCISES).toHaveLength(4);
    expect(
      totalSteps(JAVASCRIPT_DOM_EXERCISES, (exercise) =>
        exercise.walkthrough.steps,
      ),
    ).toBe(13);

    expect(JAVASCRIPT_FUNCTION_EXERCISES).toHaveLength(4);
    expect(
      totalSteps(JAVASCRIPT_FUNCTION_EXERCISES, (exercise) =>
        exercise.callFrameReplay.steps,
      ),
    ).toBe(16);

    expect(JAVASCRIPT_DATA_STRUCTURE_EXERCISES).toHaveLength(4);
    expect(
      totalSteps(JAVASCRIPT_DATA_STRUCTURE_EXERCISES, (exercise) =>
        exercise.walkthrough.steps,
      ),
    ).toBe(15);
  });
});
