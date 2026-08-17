import { describe, expect, it } from "vitest";
import {
  buildJavaScriptLabActivity,
  buildJavaScriptLabCatalogProgress,
  getFirstIncompleteExerciseIndex,
  getJavaScriptFoundationsEntry,
  getNextIncompleteExerciseIndex,
  isJavaScriptCodeLabExercise,
  isJavaScriptLabExercise,
  JAVASCRIPT_CODE_LAB_SLUGS,
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

  it("limits private source drafts to the 42 code-writing exercises", () => {
    const codeExerciseKeys = JAVASCRIPT_LABS.flatMap((lab) =>
      lab.exerciseIds
        .filter((exerciseId) =>
          isJavaScriptCodeLabExercise(lab.slug, exerciseId),
        )
        .map((exerciseId) => `${lab.slug}:${exerciseId}`),
    );

    expect(JAVASCRIPT_CODE_LAB_SLUGS).toHaveLength(11);
    expect(codeExerciseKeys).toHaveLength(42);
    expect(isJavaScriptCodeLabExercise("foundations", "parse-and-sum")).toBe(
      true,
    );
    expect(isJavaScriptCodeLabExercise("tracing", "assignment-order")).toBe(
      false,
    );
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

  it("builds a newest-first guided activity record from authored exercises", () => {
    const activity = buildJavaScriptLabActivity([
      {
        labSlug: "foundations",
        exerciseId: "understand-the-judge",
        completedAt: "2026-08-04T12:00:00.000Z",
      },
      {
        labSlug: "foundations",
        exerciseId: "parse-and-sum",
        completedAt: "2026-08-05T12:00:00.000Z",
      },
      {
        labSlug: "unknown",
        exerciseId: "borrowed-result",
        completedAt: "2026-08-06T12:00:00.000Z",
      },
      {
        labSlug: "foundations",
        exerciseId: "parse-and-sum",
        completedAt: "not-a-date",
      },
    ]);

    expect(activity.completedCount).toBe(2);
    expect(activity.totalCount).toBe(55);
    expect(activity.recentCompletions).toHaveLength(2);
    expect(activity.recentCompletions[0]).toMatchObject({
      labTitle: "JavaScript foundations",
      exerciseTitle: "Turn input into numbers",
      exerciseNumber: 2,
      exerciseCount: 4,
      href: "/practice/foundations",
    });
    expect(activity.nextAction).toEqual({
      title: "Continue JavaScript foundations, exercise 3.",
      description:
        "This is the first unfinished guided exercise in your private lab record.",
      label: "Continue guided practice",
      href: "/practice/foundations",
    });
  });

  it("caps recent activity and gives a truthful review action after 55 steps", () => {
    const completions = JAVASCRIPT_LABS.flatMap((lab, labIndex) =>
      lab.exerciseIds.map((exerciseId, exerciseIndex) => ({
        labSlug: lab.slug,
        exerciseId,
        completedAt: new Date(
          Date.UTC(2026, 7, labIndex + 1, exerciseIndex),
        ),
      })),
    );
    const activity = buildJavaScriptLabActivity(completions);

    expect(activity.completedCount).toBe(55);
    expect(activity.recentCompletions).toHaveLength(8);
    expect(activity.nextAction).toEqual({
      title: "All 55 guided steps are saved.",
      description:
        "Reopen the foundations lab to revisit the guided path without changing your saved completion record.",
      label: "Review foundations",
      href: "/practice/foundations",
    });
  });
});
