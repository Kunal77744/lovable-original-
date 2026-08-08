import { CODING_PROBLEMS, getCodingProblem } from "@/lib/coding-problems";

export const TIMED_CODING_CHALLENGE_MINUTES = 30;

const TIMED_CODING_CHALLENGE_SET_DEFINITIONS = [
  {
    id: "core-path",
    title: "Core path",
    description: "Conditions, arrays, and a complete sequence under one deadline.",
    slugs: ["even-or-odd", "largest-value", "fizz-buzz"],
  },
  {
    id: "input-and-loops",
    title: "Input and loops",
    description: "Parsing, repetition, and string traversal without a warm-up round.",
    slugs: ["sum-two-numbers", "multiplication-table", "reverse-a-word"],
  },
  {
    id: "collections",
    title: "Collections",
    description: "Traverse text, remove duplicates, and reason with a stack.",
    slugs: ["count-vowels", "unique-values", "balanced-brackets"],
  },
  {
    id: "search-and-windows",
    title: "Search and windows",
    description: "Frequency maps, binary search, and sliding-window reasoning.",
    slugs: [
      "first-unique-character",
      "binary-search-index",
      "maximum-window-sum",
    ],
  },
] as const;

export type TimedCodingChallengeSetId =
  (typeof TIMED_CODING_CHALLENGE_SET_DEFINITIONS)[number]["id"];

export type TimedCodingChallengeSet = {
  id: TimedCodingChallengeSetId;
  title: string;
  description: string;
  problems: (typeof CODING_PROBLEMS)[number][];
};

export const TIMED_CODING_CHALLENGE_SETS: TimedCodingChallengeSet[] =
  TIMED_CODING_CHALLENGE_SET_DEFINITIONS.map((challengeSet) => ({
    ...challengeSet,
    problems: challengeSet.slugs.map((slug) => {
      const problem = getCodingProblem(slug);

      if (!problem) {
        throw new Error(`Timed coding challenge problem not found: ${slug}`);
      }

      return problem;
    }),
  }));

// Keep the original three-problem challenge available as the first stable set.
export const TIMED_CODING_CHALLENGE_PROBLEMS =
  TIMED_CODING_CHALLENGE_SETS[0].problems;

export function getTimedCodingChallengeSet(setId: string | null | undefined) {
  return (
    TIMED_CODING_CHALLENGE_SETS.find(
      (challengeSet) => challengeSet.id === setId,
    ) ?? null
  );
}

export function getNextTimedCodingChallengeProblem(
  completedSlugs: string[],
  challengeSet: TimedCodingChallengeSet = TIMED_CODING_CHALLENGE_SETS[0],
) {
  const completed = new Set(completedSlugs);

  return (
    challengeSet.problems.find((problem) => !completed.has(problem.slug)) ?? null
  );
}

export function getRecommendedTimedCodingChallengeSet(completedSlugs: string[]) {
  return (
    TIMED_CODING_CHALLENGE_SETS.find((challengeSet) =>
      getNextTimedCodingChallengeProblem(completedSlugs, challengeSet),
    ) ?? TIMED_CODING_CHALLENGE_SETS[0]
  );
}

export function areTimedCodingChallengeSetsInAuthoredOrder() {
  const authoredPositions = new Map(
    CODING_PROBLEMS.map((problem, index) => [problem.slug, index]),
  );

  return TIMED_CODING_CHALLENGE_SETS.every((challengeSet) => {
    const selectedPositions = challengeSet.problems.map(
      (problem) => authoredPositions.get(problem.slug) ?? -1,
    );

    return selectedPositions.every(
      (position, index) =>
        index === 0 || position > selectedPositions[index - 1],
    );
  });
}

export function isTimedCodingChallengeInAuthoredOrder() {
  return areTimedCodingChallengeSetsInAuthoredOrder();
}
