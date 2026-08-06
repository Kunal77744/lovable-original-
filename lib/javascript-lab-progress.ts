import { ALGORITHM_EFFICIENCY_EXERCISES } from "./javascript-algorithm-efficiency";
import { JAVASCRIPT_DATA_STRUCTURE_EXERCISES } from "./javascript-data-structures";
import { JAVASCRIPT_DEBUGGING_DRILLS } from "./debugging-lab";
import { JAVASCRIPT_DOM_EXERCISES } from "./javascript-dom-exercises";
import { JAVASCRIPT_FOUNDATION_EXERCISES } from "./javascript-foundations";
import { JAVASCRIPT_FUNCTION_EXERCISES } from "./javascript-functions-scope";
import { JAVASCRIPT_RECURSION_EXERCISES } from "./javascript-recursion";
import { JAVASCRIPT_SEARCH_SORT_EXERCISES } from "./javascript-search-sort";
import { JAVASCRIPT_TEST_DESIGN_EXERCISES } from "./javascript-test-design";
import { JAVASCRIPT_TRACE_EXERCISES } from "./javascript-tracing";

export const JAVASCRIPT_LABS = [
  {
    slug: "foundations",
    title: "JavaScript foundations",
    href: "/practice/foundations",
    exerciseIds: JAVASCRIPT_FOUNDATION_EXERCISES.map((exercise) => exercise.slug),
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
] as const;

export type JavaScriptLabSlug = (typeof JAVASCRIPT_LABS)[number]["slug"];

export function getJavaScriptLab(labSlug: string) {
  return JAVASCRIPT_LABS.find((lab) => lab.slug === labSlug) ?? null;
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
