import { ALGORITHM_EFFICIENCY_EXERCISES } from "./javascript-algorithm-efficiency";
import { JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES } from "./javascript-algorithm-patterns";
import { JAVASCRIPT_DATA_STRUCTURE_EXERCISES } from "./javascript-data-structures";
import { JAVASCRIPT_DEBUGGING_DRILLS } from "./debugging-lab";
import { JAVASCRIPT_DOM_EXERCISES } from "./javascript-dom-exercises";
import { JAVASCRIPT_FOUNDATION_EXERCISES } from "./javascript-foundations";
import { JAVASCRIPT_FUNCTION_EXERCISES } from "./javascript-functions-scope";
import type {
  JavaScriptLabCatalogProgress,
  JavaScriptLabSlug,
} from "./javascript-lab-progress";
import { JAVASCRIPT_LINKED_LIST_EXERCISES } from "./javascript-linked-lists";
import { JAVASCRIPT_RECURSION_EXERCISES } from "./javascript-recursion";
import { JAVASCRIPT_SEARCH_SORT_EXERCISES } from "./javascript-search-sort";
import { JAVASCRIPT_STACKS_QUEUES_EXERCISES } from "./javascript-stacks-queues";
import { JAVASCRIPT_TEST_DESIGN_EXERCISES } from "./javascript-test-design";
import { JAVASCRIPT_TRACE_EXERCISES } from "./javascript-tracing";
import { JAVASCRIPT_TREES_GRAPHS_EXERCISES } from "./javascript-trees-graphs";

type JavaScriptMixedReviewPrompt = {
  labSlug: JavaScriptLabSlug;
  labTitle: string;
  concept: string;
  exerciseTitle: string;
  scenario: string;
  recoveryCue: string;
  takeaway: string;
};

export type JavaScriptMixedReviewItem = JavaScriptMixedReviewPrompt & {
  id: string;
  options: Array<{ id: JavaScriptLabSlug; label: string }>;
  correctOptionId: JavaScriptLabSlug;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function isBoundedJavaScriptMixedReviewResult(result: {
  correctCount: number;
  totalCount: number;
}) {
  return (
    Number.isInteger(result.correctCount) &&
    Number.isInteger(result.totalCount) &&
    result.totalCount >= 3 &&
    result.totalCount <= 6 &&
    result.correctCount >= 0 &&
    result.correctCount <= result.totalCount
  );
}

export function getJavaScriptMixedReviewIntervalDays(result: {
  correctCount: number;
  totalCount: number;
}) {
  if (!isBoundedJavaScriptMixedReviewResult(result)) return null;

  const recallRate = result.correctCount / result.totalCount;
  if (recallRate >= 0.75) return 7;
  if (recallRate >= 0.5) return 3;
  return 1;
}

export function getJavaScriptMixedReviewDueAt(
  result: { correctCount: number; totalCount: number },
  completedAt: Date,
) {
  const intervalDays = getJavaScriptMixedReviewIntervalDays(result);
  if (!intervalDays) throw new Error("Mixed review result is outside its bounded range.");
  return new Date(completedAt.getTime() + intervalDays * DAY_IN_MS);
}

export function isJavaScriptMixedReviewDue(
  result: { nextDueAt: string } | null,
  now = new Date(),
) {
  if (!result) return true;
  const nextDueAt = Date.parse(result.nextDueAt);
  return !Number.isFinite(nextDueAt) || nextDueAt <= now.getTime();
}

export function formatJavaScriptMixedReviewDueDate(nextDueAt: string) {
  const date = new Date(nextDueAt);
  if (!Number.isFinite(date.getTime())) return "your next visit";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

const foundations = JAVASCRIPT_FOUNDATION_EXERCISES[0];
const tracing = JAVASCRIPT_TRACE_EXERCISES[0];
const debugging = JAVASCRIPT_DEBUGGING_DRILLS[0];
const testDesign = JAVASCRIPT_TEST_DESIGN_EXERCISES[0];
const dataStructures = JAVASCRIPT_DATA_STRUCTURE_EXERCISES[0];
const functions = JAVASCRIPT_FUNCTION_EXERCISES[0];
const recursion = JAVASCRIPT_RECURSION_EXERCISES[0];
const searchSort = JAVASCRIPT_SEARCH_SORT_EXERCISES[0];
const stacksQueues = JAVASCRIPT_STACKS_QUEUES_EXERCISES[0];
const linkedLists = JAVASCRIPT_LINKED_LIST_EXERCISES[0];
const treesGraphs = JAVASCRIPT_TREES_GRAPHS_EXERCISES[0];
const dom = JAVASCRIPT_DOM_EXERCISES[0];
const efficiency = ALGORITHM_EFFICIENCY_EXERCISES[0];
const algorithmPatterns = JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES[0];

export const JAVASCRIPT_MIXED_REVIEW_PROMPTS: readonly JavaScriptMixedReviewPrompt[] = [
  {
    labSlug: "foundations",
    labTitle: "JavaScript foundations",
    concept: foundations.concept,
    exerciseTitle: foundations.title,
    scenario: foundations.prompt,
    recoveryCue: foundations.recoveryCue,
    takeaway: foundations.takeaway,
  },
  {
    labSlug: "tracing",
    labTitle: "Code tracing",
    concept: tracing.concept,
    exerciseTitle: tracing.title,
    scenario: tracing.prompt,
    recoveryCue: tracing.recoveryCue,
    takeaway: tracing.takeaway,
  },
  {
    labSlug: "debugging",
    labTitle: "Debugging",
    concept: debugging.concept,
    exerciseTitle: debugging.title,
    scenario: debugging.brief,
    recoveryCue: debugging.recoveryCue,
    takeaway: debugging.takeaway,
  },
  {
    labSlug: "test-design",
    labTitle: "Test design",
    concept: testDesign.concept,
    exerciseTitle: testDesign.title,
    scenario: testDesign.problem,
    recoveryCue: testDesign.recoveryCue,
    takeaway: testDesign.takeaway,
  },
  {
    labSlug: "data-structures",
    labTitle: "Data structures",
    concept: dataStructures.structure,
    exerciseTitle: dataStructures.title,
    scenario: dataStructures.prompt,
    recoveryCue: dataStructures.recoveryCue,
    takeaway: dataStructures.takeaway,
  },
  {
    labSlug: "functions",
    labTitle: "Functions and scope",
    concept: functions.concept,
    exerciseTitle: functions.title,
    scenario: functions.prompt,
    recoveryCue: functions.recoveryCue,
    takeaway: functions.takeaway,
  },
  {
    labSlug: "recursion",
    labTitle: "Recursion fundamentals",
    concept: recursion.concept,
    exerciseTitle: recursion.title,
    scenario: recursion.prompt,
    recoveryCue: recursion.recoveryCue,
    takeaway: recursion.takeaway,
  },
  {
    labSlug: "search-sort",
    labTitle: "Searching and sorting",
    concept: searchSort.concept,
    exerciseTitle: searchSort.title,
    scenario: searchSort.prompt,
    recoveryCue: searchSort.recoveryCue,
    takeaway: searchSort.takeaway,
  },
  {
    labSlug: "stacks-queues",
    labTitle: "Stacks and queues",
    concept: stacksQueues.concept,
    exerciseTitle: stacksQueues.title,
    scenario: stacksQueues.prompt,
    recoveryCue: stacksQueues.recoveryCue,
    takeaway: stacksQueues.takeaway,
  },
  {
    labSlug: "linked-lists",
    labTitle: "Linked-list fundamentals",
    concept: linkedLists.concept,
    exerciseTitle: linkedLists.title,
    scenario: linkedLists.prompt,
    recoveryCue: linkedLists.recoveryCue,
    takeaway: linkedLists.takeaway,
  },
  {
    labSlug: "trees-graphs",
    labTitle: "Trees and graphs",
    concept: treesGraphs.concept,
    exerciseTitle: treesGraphs.title,
    scenario: treesGraphs.prompt,
    recoveryCue: treesGraphs.recoveryCue,
    takeaway: treesGraphs.takeaway,
  },
  {
    labSlug: "dom",
    labTitle: "DOM fundamentals",
    concept: dom.concept,
    exerciseTitle: dom.title,
    scenario: dom.prompt,
    recoveryCue: dom.recoveryCue,
    takeaway: dom.takeaway,
  },
  {
    labSlug: "efficiency",
    labTitle: "Algorithm efficiency",
    concept: efficiency.concept,
    exerciseTitle: efficiency.title,
    scenario: efficiency.scenario,
    recoveryCue: efficiency.recoveryCue,
    takeaway: efficiency.takeaway,
  },
  {
    labSlug: "algorithm-patterns",
    labTitle: "Algorithm patterns",
    concept: algorithmPatterns.concept,
    exerciseTitle: algorithmPatterns.title,
    scenario: algorithmPatterns.prompt,
    recoveryCue: algorithmPatterns.recoveryCue,
    takeaway: algorithmPatterns.takeaway,
  },
];

function selectEvenly<T>(items: readonly T[], limit: number) {
  if (items.length <= limit) return [...items];

  return Array.from({ length: limit }, (_, index) => {
    const sourceIndex = Math.round((index * (items.length - 1)) / (limit - 1));
    return items[sourceIndex];
  });
}

export function buildJavaScriptMixedReviewSession(
  labs: JavaScriptLabCatalogProgress["labs"],
  limit = 4,
  rotationSeed = 0,
): JavaScriptMixedReviewItem[] {
  const boundedLimit = Math.max(3, Math.min(limit, 6));
  const completedSlugs = new Set(
    labs.filter((lab) => lab.state === "complete").map((lab) => lab.slug),
  );
  const eligiblePrompts = JAVASCRIPT_MIXED_REVIEW_PROMPTS.filter((prompt) =>
    completedSlugs.has(prompt.labSlug),
  );

  if (eligiblePrompts.length < 3) return [];

  const normalizedRotation =
    ((Math.trunc(rotationSeed) % eligiblePrompts.length) +
      eligiblePrompts.length) %
    eligiblePrompts.length;
  const rotatedPrompts = [
    ...eligiblePrompts.slice(normalizedRotation),
    ...eligiblePrompts.slice(0, normalizedRotation),
  ];
  const selected = selectEvenly(rotatedPrompts, boundedLimit);
  return selected.map((prompt, index) => {
    const optionPrompts = [
      prompt,
      selected[(index + 1) % selected.length],
      selected[(index + 2) % selected.length],
    ];
    const rotation = index % optionPrompts.length;
    const orderedOptions = [
      ...optionPrompts.slice(rotation),
      ...optionPrompts.slice(0, rotation),
    ];

    return {
      ...prompt,
      id: `mixed-review-${prompt.labSlug}`,
      correctOptionId: prompt.labSlug,
      options: orderedOptions.map((option) => ({
        id: option.labSlug,
        label: option.takeaway,
      })),
    };
  });
}
