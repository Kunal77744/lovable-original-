import type { CodingMistakeReviewItem } from "./coding-review-queue";

export type ReviewSessionBookmark = {
  slug: string;
  number: number;
  title: string;
  skill: string;
};

export type CodingReviewSessionItem = ReviewSessionBookmark & {
  source: "mistake" | "bookmark";
  acceptedBefore: boolean;
  concept: string | null;
  recoveryHint: string | null;
  passedTests: number | null;
  totalTests: number | null;
};

type CodingReviewSessionInput = {
  mistakes: CodingMistakeReviewItem[];
  bookmarks: ReviewSessionBookmark[];
  completedSlugs: string[];
  limit?: number;
};

export function buildCodingReviewSession({
  mistakes,
  bookmarks,
  completedSlugs,
  limit = 3,
}: CodingReviewSessionInput): CodingReviewSessionItem[] {
  const boundedLimit = Math.max(1, Math.min(limit, 3));
  const completed = new Set(completedSlugs);
  const included = new Set<string>();
  const session: CodingReviewSessionItem[] = [];

  for (const mistake of mistakes) {
    if (included.has(mistake.slug)) continue;

    session.push({
      slug: mistake.slug,
      number: mistake.number,
      title: mistake.title,
      skill: mistake.skill,
      source: "mistake",
      acceptedBefore: completed.has(mistake.slug),
      concept: mistake.concept,
      recoveryHint: mistake.recoveryHint,
      passedTests: mistake.passedTests,
      totalTests: mistake.totalTests,
    });
    included.add(mistake.slug);

    if (session.length === boundedLimit) return session;
  }

  for (const bookmark of bookmarks) {
    if (included.has(bookmark.slug)) continue;

    session.push({
      ...bookmark,
      source: "bookmark",
      acceptedBefore: completed.has(bookmark.slug),
      concept: null,
      recoveryHint: null,
      passedTests: null,
      totalTests: null,
    });
    included.add(bookmark.slug);

    if (session.length === boundedLimit) return session;
  }

  return session;
}
