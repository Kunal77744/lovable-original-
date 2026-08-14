import { describe, expect, it } from "vitest";
import {
  buildJavaScriptLabCatalogProgress,
  getFirstIncompleteExerciseIndex,
  getJavaScriptFoundationsEntry,
  getNextIncompleteExerciseIndex,
  isJavaScriptLabExercise,
  JAVASCRIPT_LABS,
} from "./javascript-lab-progress";

describe("JavaScript lab progress catalog", () => {
  it("keeps a zero-Accepted learner on the exact unfinished foundations step", () => {
    const progress = buildJavaScriptLabCatalogProgress([
      { labSlug: "foundations", exerciseId: "understand-the-judge" },
      { labSlug: "foundations", exerciseId: "parse-and-sum" },
    ]);

    expect(getJavaScriptFoundationsEntry(progress, 0)).toEqual({
      href: "/practice/foundations",
      completedCount: 2,
      totalCount: 4,
      nextExerciseNumber: 3,
    });
  });

  it("does not send an Accepted learner back to foundations", () => {
    const progress = buildJavaScriptLabCatalogProgress([]);

    expect(getJavaScriptFoundationsEntry(progress, 1)).toBeNull();
  });

  it("opens problem 01 after every foundations step is saved", () => {
    const foundations = JAVASCRIPT_LABS[0];
    const progress = buildJavaScriptLabCatalogProgress(
      foundations.exerciseIds.map((exerciseId) => ({
        labSlug: foundations.slug,
        exerciseId,
      })),
    );

    expect(getJavaScriptFoundationsEntry(progress, 0)).toBeNull();
  });

  it("defines 55 unique saved steps across fourteen private labs", () => {
    const keys = JAVASCRIPT_LABS.flatMap((lab) =>
      lab.exerciseIds.map((exerciseId) => `${lab.slug}:${exerciseId}`),
    );
    expect(JAVASCRIPT_LABS).toHaveLength(14);
    expect(keys).toHaveLength(55);
    expect(new Set(keys)).toHaveLength(55);
  });

  it("rejects unknown lab and exercise combinations", () => {
    expect(isJavaScriptLabExercise("tracing", "assignment-order")).toBe(true);
    expect(
      isJavaScriptLabExercise("foundations", "understand-the-judge"),
    ).toBe(true);
    expect(isJavaScriptLabExercise("tracing", "parse-input")).toBe(false);
    expect(isJavaScriptLabExercise("recursion", "stop-at-the-base-case")).toBe(
      true,
    );
    expect(isJavaScriptLabExercise("search-sort", "scan-for-first-match")).toBe(
      true,
    );
    expect(isJavaScriptLabExercise("stacks-queues", "remove-the-newest-item")).toBe(
      true,
    );
    expect(isJavaScriptLabExercise("linked-lists", "connect-the-next-node")).toBe(
      true,
    );
    expect(
      isJavaScriptLabExercise("trees-graphs", "walk-a-tree-depth-first"),
    ).toBe(true);
    expect(
      isJavaScriptLabExercise("algorithm-patterns", "slide-a-fixed-window"),
    ).toBe(true);
    expect(isJavaScriptLabExercise("unknown", "assignment-order")).toBe(false);
  });

  it("resumes at the first unfinished exercise and skips completed work", () => {
    const ids = ["one", "two", "three"];
    expect(getFirstIncompleteExerciseIndex(ids, ["one"])).toBe(1);
    expect(getNextIncompleteExerciseIndex(ids, ["one", "two"], 0)).toBe(2);
    expect(getFirstIncompleteExerciseIndex(ids, ids)).toBe(3);
  });

  it("moves through completed exercises in order during an explicit review", () => {
    const ids = ["one", "two", "three"];

    expect(getNextIncompleteExerciseIndex(ids, ids, 0, true)).toBe(1);
    expect(getNextIncompleteExerciseIndex(ids, ids, 2, true)).toBe(3);
  });

  it("builds one honest private record across every saved lab", () => {
    const foundations = JAVASCRIPT_LABS[0];
    const tracing = JAVASCRIPT_LABS[1];
    const progress = buildJavaScriptLabCatalogProgress([
      ...foundations.exerciseIds.map((exerciseId) => ({
        labSlug: foundations.slug,
        exerciseId,
      })),
      { labSlug: tracing.slug, exerciseId: tracing.exerciseIds[0] },
      { labSlug: "unknown", exerciseId: "borrowed-result" },
    ]);

    expect(progress.completedCount).toBe(foundations.exerciseIds.length + 1);
    expect(progress.totalCount).toBe(55);
    expect(progress.nextLabSlug).toBe("tracing");
    expect(progress.nextExerciseNumber).toBe(2);
    expect(progress.labs).toHaveLength(14);
    expect(progress.labs[0]).toMatchObject({
      state: "complete",
      completedCount: foundations.exerciseIds.length,
      nextExerciseNumber: null,
    });
    expect(progress.labs[1]).toMatchObject({
      state: "in-progress",
      completedCount: 1,
      nextExerciseNumber: 2,
    });
    expect(progress.labs[2]).toMatchObject({
      state: "not-started",
      completedCount: 0,
      nextExerciseNumber: 1,
    });
  });

  it("resumes the foundations unit at the exact unfinished route", () => {
    const fresh = buildJavaScriptLabCatalogProgress([]);
    expect(fresh.nextHref).toBe("/practice/judge-basics");
    expect(fresh.nextExerciseNumber).toBe(1);

    const afterJudge = buildJavaScriptLabCatalogProgress([
      { labSlug: "foundations", exerciseId: "understand-the-judge" },
    ]);
    expect(afterJudge.nextHref).toBe("/practice/foundations");
    expect(afterJudge.nextExerciseNumber).toBe(2);
    expect(afterJudge.labs[0]).toMatchObject({
      href: "/practice/foundations",
      completedCount: 1,
      totalCount: 4,
      state: "in-progress",
    });
  });
});
