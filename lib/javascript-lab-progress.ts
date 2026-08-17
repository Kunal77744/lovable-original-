import { ALGORITHM_EFFICIENCY_EXERCISES } from "./javascript-algorithm-efficiency";
import { JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES } from "./javascript-algorithm-patterns";
import { JAVASCRIPT_DATA_STRUCTURE_EXERCISES } from "./javascript-data-structures";
import { JAVASCRIPT_DEBUGGING_DRILLS } from "./debugging-lab";
import { JAVASCRIPT_DOM_EXERCISES } from "./javascript-dom-exercises";
import { JAVASCRIPT_FOUNDATIONS_UNIT_STEPS } from "./javascript-foundations";
import { JAVASCRIPT_FUNCTION_EXERCISES } from "./javascript-functions-scope";
import { JAVASCRIPT_LINKED_LIST_EXERCISES } from "./javascript-linked-lists";
import { JAVASCRIPT_RECURSION_EXERCISES } from "./javascript-recursion";
import { JAVASCRIPT_SEARCH_SORT_EXERCISES } from "./javascript-search-sort";
import { JAVASCRIPT_STACKS_QUEUES_EXERCISES } from "./javascript-stacks-queues";
import { JAVASCRIPT_TEST_DESIGN_EXERCISES } from "./javascript-test-design";
import { JAVASCRIPT_TRACE_EXERCISES } from "./javascript-tracing";
import { JAVASCRIPT_TREES_GRAPHS_EXERCISES } from "./javascript-trees-graphs";

export const JAVASCRIPT_LABS = [
  {
    slug: "foundations",
    title: "JavaScript foundations",
    href: "/practice/foundations",
    exerciseIds: JAVASCRIPT_FOUNDATIONS_UNIT_STEPS.map((step) => step.id),
    exerciseHrefs: JAVASCRIPT_FOUNDATIONS_UNIT_STEPS.map((step) => step.href),
  },
  {
    slug: "tracing",
    title: "Code tracing",
    href: "/practice/tracing",
    exerciseIds: JAVASCRIPT_TRACE_EXERCISES.map((exercise) => exercise.id),
  },
  {
    slug: "debugging",
    title: "Debugging",
    href: "/practice/debugging",
    exerciseIds: JAVASCRIPT_DEBUGGING_DRILLS.map((exercise) => exercise.slug),
  },
  {
    slug: "test-design",
    title: "Test design",
    href: "/practice/test-design",
    exerciseIds: JAVASCRIPT_TEST_DESIGN_EXERCISES.map((exercise) => exercise.id),
  },
  {
    slug: "data-structures",
    title: "Data structures",
    href: "/practice/data-structures",
    exerciseIds: JAVASCRIPT_DATA_STRUCTURE_EXERCISES.map((exercise) => exercise.slug),
  },
  {
    slug: "functions",
    title: "Functions and scope",
    href: "/practice/functions",
    exerciseIds: JAVASCRIPT_FUNCTION_EXERCISES.map((exercise) => exercise.slug),
  },
  {
    slug: "recursion",
    title: "Recursion fundamentals",
    href: "/practice/recursion",
    exerciseIds: JAVASCRIPT_RECURSION_EXERCISES.map((exercise) => exercise.slug),
  },
  {
    slug: "search-sort",
    title: "Searching and sorting",
    href: "/practice/search-sort",
    exerciseIds: JAVASCRIPT_SEARCH_SORT_EXERCISES.map(
      (exercise) => exercise.slug,
    ),
  },
  {
    slug: "stacks-queues",
    title: "Stacks and queues",
    href: "/practice/stacks-queues",
    exerciseIds: JAVASCRIPT_STACKS_QUEUES_EXERCISES.map(
      (exercise) => exercise.slug,
    ),
  },
  {
    slug: "linked-lists",
    title: "Linked-list fundamentals",
    href: "/practice/linked-lists",
    exerciseIds: JAVASCRIPT_LINKED_LIST_EXERCISES.map(
      (exercise) => exercise.slug,
    ),
  },
  {
    slug: "trees-graphs",
    title: "Trees and graphs",
    href: "/practice/trees-graphs",
    exerciseIds: JAVASCRIPT_TREES_GRAPHS_EXERCISES.map(
      (exercise) => exercise.slug,
    ),
  },
  {
    slug: "dom",
    title: "DOM fundamentals",
    href: "/practice/dom",
    exerciseIds: JAVASCRIPT_DOM_EXERCISES.map((exercise) => exercise.slug),
  },
  {
    slug: "efficiency",
    title: "Algorithm efficiency",
    href: "/practice/efficiency",
    exerciseIds: ALGORITHM_EFFICIENCY_EXERCISES.map((exercise) => exercise.id),
  },
  {
    slug: "algorithm-patterns",
    title: "Algorithm patterns",
    href: "/practice/algorithm-patterns",
    exerciseIds: JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES.map(
      (exercise) => exercise.slug,
    ),
  },
] as const;

export type JavaScriptLabSlug = (typeof JAVASCRIPT_LABS)[number]["slug"];

const JAVASCRIPT_LAB_CATALOG_CONCEPTS = {
  foundations: JAVASCRIPT_FOUNDATIONS_UNIT_STEPS.flatMap((step) => [
    step.title,
    step.concept,
  ]),
  tracing: JAVASCRIPT_TRACE_EXERCISES.flatMap((exercise) => [
    exercise.title,
    exercise.concept,
  ]),
  debugging: JAVASCRIPT_DEBUGGING_DRILLS.flatMap((exercise) => [
    exercise.title,
    exercise.concept,
  ]),
  "test-design": JAVASCRIPT_TEST_DESIGN_EXERCISES.flatMap((exercise) => [
    exercise.title,
    exercise.concept,
  ]),
  "data-structures": JAVASCRIPT_DATA_STRUCTURE_EXERCISES.flatMap(
    (exercise) => [exercise.title, exercise.structure],
  ),
  functions: JAVASCRIPT_FUNCTION_EXERCISES.flatMap((exercise) => [
    exercise.title,
    exercise.concept,
  ]),
  recursion: JAVASCRIPT_RECURSION_EXERCISES.flatMap((exercise) => [
    exercise.title,
    exercise.concept,
  ]),
  "search-sort": JAVASCRIPT_SEARCH_SORT_EXERCISES.flatMap((exercise) => [
    exercise.title,
    exercise.concept,
  ]),
  "stacks-queues": JAVASCRIPT_STACKS_QUEUES_EXERCISES.flatMap((exercise) => [
    exercise.title,
    exercise.concept,
  ]),
  "linked-lists": JAVASCRIPT_LINKED_LIST_EXERCISES.flatMap((exercise) => [
    exercise.title,
    exercise.concept,
  ]),
  "trees-graphs": JAVASCRIPT_TREES_GRAPHS_EXERCISES.flatMap((exercise) => [
    exercise.title,
    exercise.concept,
  ]),
  dom: JAVASCRIPT_DOM_EXERCISES.flatMap((exercise) => [
    exercise.title,
    exercise.concept,
  ]),
  efficiency: ALGORITHM_EFFICIENCY_EXERCISES.flatMap((exercise) => [
    exercise.title,
    exercise.concept,
  ]),
  "algorithm-patterns": JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES.flatMap(
    (exercise) => [exercise.title, exercise.concept],
  ),
} satisfies Record<JavaScriptLabSlug, readonly string[]>;

export function getJavaScriptLabCatalogSearchText(labSlug: JavaScriptLabSlug) {
  const lab = JAVASCRIPT_LABS.find((item) => item.slug === labSlug);
  return [lab?.title, ...JAVASCRIPT_LAB_CATALOG_CONCEPTS[labSlug]]
    .filter(Boolean)
    .join(" ");
}

export type JavaScriptLabProgressState =
  | "complete"
  | "in-progress"
  | "not-started";

export type JavaScriptLabCatalogProgress = {
  completedCount: number;
  totalCount: number;
  nextLabSlug: JavaScriptLabSlug | null;
  nextLabTitle: string | null;
  nextHref: string;
  nextExerciseNumber: number | null;
  labs: Array<{
    slug: JavaScriptLabSlug;
    title: string;
    href: string;
    completedCount: number;
    totalCount: number;
    nextExerciseNumber: number | null;
    state: JavaScriptLabProgressState;
  }>;
};

export type JavaScriptFoundationsEntry = {
  href: string;
  completedCount: number;
  totalCount: number;
  nextExerciseNumber: number;
};

export function getJavaScriptFoundationsEntry(
  labProgress: JavaScriptLabCatalogProgress | null,
  acceptedProblemCount: number,
): JavaScriptFoundationsEntry | null {
  if (acceptedProblemCount > 0) return null;

  const foundations = labProgress?.labs.find(
    (lab) => lab.slug === "foundations",
  );

  if (foundations?.state === "complete") return null;

  if (foundations) {
    return {
      href: foundations.href,
      completedCount: foundations.completedCount,
      totalCount: foundations.totalCount,
      nextExerciseNumber: foundations.nextExerciseNumber ?? 1,
    };
  }

  if (labProgress && labProgress.nextLabSlug !== "foundations") return null;

  return {
    href: labProgress?.nextHref ?? "/practice/judge-basics",
    completedCount: 0,
    totalCount: JAVASCRIPT_FOUNDATIONS_UNIT_STEPS.length,
    nextExerciseNumber: labProgress?.nextExerciseNumber ?? 1,
  };
}

export function getJavaScriptLab(labSlug: string) {
  return JAVASCRIPT_LABS.find((lab) => lab.slug === labSlug) ?? null;
}

function getJavaScriptLabExerciseHref(
  lab: (typeof JAVASCRIPT_LABS)[number],
  exerciseIndex: number,
) {
  if ("exerciseHrefs" in lab) {
    return lab.exerciseHrefs[exerciseIndex] ?? lab.href;
  }

  return lab.href;
}

export function isJavaScriptLabExercise(labSlug: string, exerciseId: string) {
  const lab = getJavaScriptLab(labSlug);
  return lab ? lab.exerciseIds.some((id) => id === exerciseId) : false;
}

export function getFirstIncompleteExerciseIndex(
  exerciseIds: readonly string[],
  completedExerciseIds: readonly string[],
) {
  const completed = new Set(completedExerciseIds);
  const index = exerciseIds.findIndex((exerciseId) => !completed.has(exerciseId));
  return index === -1 ? exerciseIds.length : index;
}

export function getNextIncompleteExerciseIndex(
  exerciseIds: readonly string[],
  completedExerciseIds: readonly string[],
  currentIndex: number,
) {
  const completed = new Set(completedExerciseIds);

  for (let index = currentIndex + 1; index < exerciseIds.length; index += 1) {
    if (!completed.has(exerciseIds[index])) return index;
  }

  return exerciseIds.length;
}

export function buildJavaScriptLabCatalogProgress(
  completedExercises: ReadonlyArray<{
    labSlug: string;
    exerciseId: string;
  }>,
): JavaScriptLabCatalogProgress {
  const completedKeys = new Set(
    completedExercises
      .filter((row) => isJavaScriptLabExercise(row.labSlug, row.exerciseId))
      .map((row) => `${row.labSlug}:${row.exerciseId}`),
  );
  const labs = JAVASCRIPT_LABS.map((lab) => {
    const completedCount = lab.exerciseIds.filter((exerciseId) =>
      completedKeys.has(`${lab.slug}:${exerciseId}`),
    ).length;
    const nextExerciseIndex = lab.exerciseIds.findIndex(
      (exerciseId) => !completedKeys.has(`${lab.slug}:${exerciseId}`),
    );
    const state: JavaScriptLabProgressState =
      completedCount === lab.exerciseIds.length
        ? "complete"
        : completedCount > 0
          ? "in-progress"
          : "not-started";

    return {
      slug: lab.slug,
      title: lab.title,
      href:
        nextExerciseIndex === -1
          ? lab.href
          : getJavaScriptLabExerciseHref(lab, nextExerciseIndex),
      completedCount,
      totalCount: lab.exerciseIds.length,
      nextExerciseNumber:
        nextExerciseIndex === -1 ? null : nextExerciseIndex + 1,
      state,
    };
  });
  const nextLab = labs.find((lab) => lab.state !== "complete") ?? null;

  return {
    completedCount: completedKeys.size,
    totalCount: labs.reduce((count, lab) => count + lab.totalCount, 0),
    nextLabSlug: nextLab?.slug ?? null,
    nextLabTitle: nextLab?.title ?? null,
    nextHref: nextLab?.href ?? "/practice/foundations",
    nextExerciseNumber: nextLab?.nextExerciseNumber ?? null,
    labs,
  };
}

export function saveJavaScriptLabExercise(
  labSlug: JavaScriptLabSlug,
  exerciseId: string,
) {
  return fetch(`/api/practice/labs/${labSlug}/progress`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ exerciseId }),
  }).catch(() => null);
}
