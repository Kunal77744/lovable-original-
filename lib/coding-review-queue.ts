import { getCodingProblem } from "./coding-problems";

export type SavedCodingVerdict = {
  id: string;
  problemSlug: string;
  verdict: string;
  passedTests: number;
  totalTests: number;
  createdAt: Date;
};

export type CodingMistakeReviewItem = {
  slug: string;
  number: number;
  title: string;
  skill: string;
  concept: string;
  recoveryHint: string;
  passedTests: number;
  totalTests: number;
  attemptedAt: string;
};

export function buildCodingMistakeReviewQueue(
  orderedVerdicts: SavedCodingVerdict[],
): CodingMistakeReviewItem[] {
  const seenProblems = new Set<string>();

  return orderedVerdicts.flatMap((attempt) => {
    if (seenProblems.has(attempt.problemSlug)) return [];
    seenProblems.add(attempt.problemSlug);

    const problem = getCodingProblem(attempt.problemSlug);

    if (!problem || attempt.verdict !== "Wrong Answer") return [];

    return [
      {
        slug: problem.slug,
        number: problem.number,
        title: problem.title,
        skill: problem.skill,
        concept: problem.acceptedExplanation.concept,
        recoveryHint: problem.recoveryHint,
        passedTests: attempt.passedTests,
        totalTests: attempt.totalTests,
        attemptedAt: attempt.createdAt.toISOString(),
      },
    ];
  });
}
