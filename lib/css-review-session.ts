import { getCssPracticeChallenge } from "./css-practice-challenges";

export type SavedCssReviewAttempt = {
  id: string;
  challengeSlug: string;
  verdict: string;
  passedChecks: number;
  totalChecks: number;
  createdAt: Date;
};

export type CssReviewSessionItem = {
  slug: string;
  number: number;
  title: string;
  skill: string;
  outcome: string;
  passedChecks: number;
  totalChecks: number;
  attemptedAt: string;
};

export function buildCssReviewSession(
  latestAttempts: SavedCssReviewAttempt[],
  limit = 3,
): CssReviewSessionItem[] {
  const boundedLimit = Math.max(1, Math.min(limit, 3));
  const seenChallenges = new Set<string>();

  return [...latestAttempts]
    .sort((left, right) => {
      const timeDifference =
        right.createdAt.getTime() - left.createdAt.getTime();

      return timeDifference || right.id.localeCompare(left.id);
    })
    .flatMap((attempt) => {
      if (seenChallenges.has(attempt.challengeSlug)) return [];
      seenChallenges.add(attempt.challengeSlug);

      if (attempt.verdict !== "Needs revision") return [];

      const challenge = getCssPracticeChallenge(attempt.challengeSlug);

      if (!challenge) return [];

      return [
        {
          slug: challenge.slug,
          number: challenge.number,
          title: challenge.title,
          skill: challenge.skill,
          outcome: challenge.outcome,
          passedChecks: attempt.passedChecks,
          totalChecks: attempt.totalChecks,
          attemptedAt: attempt.createdAt.toISOString(),
        },
      ];
    })
    .slice(0, boundedLimit);
}
