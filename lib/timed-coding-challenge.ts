import { CODING_PROBLEMS, getCodingProblem } from "@/lib/coding-problems";

export const TIMED_CODING_CHALLENGE_MINUTES = 30;

const TIMED_CODING_CHALLENGE_SLUGS = [
  "even-or-odd",
  "largest-value",
  "fizz-buzz",
] as const;

export const TIMED_CODING_CHALLENGE_PROBLEMS =
  TIMED_CODING_CHALLENGE_SLUGS.map((slug) => {
    const problem = getCodingProblem(slug);

    if (!problem) {
      throw new Error(`Timed coding challenge problem not found: ${slug}`);
    }

    return problem;
  });

export function getNextTimedCodingChallengeProblem(completedSlugs: string[]) {
  const completed = new Set(completedSlugs);

  return (
    TIMED_CODING_CHALLENGE_PROBLEMS.find(
      (problem) => !completed.has(problem.slug),
    ) ?? null
  );
}

export function isTimedCodingChallengeInAuthoredOrder() {
  const authoredPositions = new Map(
    CODING_PROBLEMS.map((problem, index) => [problem.slug, index]),
  );
  const selectedPositions = TIMED_CODING_CHALLENGE_PROBLEMS.map(
    (problem) => authoredPositions.get(problem.slug) ?? -1,
  );

  return selectedPositions.every(
    (position, index) => index === 0 || position > selectedPositions[index - 1],
  );
}
