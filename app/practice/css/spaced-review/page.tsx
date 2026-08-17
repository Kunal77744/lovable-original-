import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter, SiteNav } from "@/app/site-chrome";
import { CssSpacedReview } from "@/components/css-spaced-review";
import { getCssPracticeCatalogProgress } from "@/db/css-practice";
import { getCssSpacedReviewResultForStudent } from "@/db/css-spaced-review";
import { getSignInHref } from "@/lib/account-destination";
import { auth } from "@/lib/auth";
import { CSS_PRACTICE_CHALLENGES } from "@/lib/css-practice-challenges";
import {
  CSS_SPACED_REVIEW_ITEMS,
  formatCssSpacedReviewDueDate,
  isCssSpacedReviewDue,
} from "@/lib/css-spaced-review";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private CSS spaced review | Lovable Original",
  description:
    "Recall selectors, box sizing, and responsive constraints in one private CSS spaced-review session.",
  robots: { index: false, follow: false },
};

export default async function CssSpacedReviewPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect(getSignInHref("/practice/css/spaced-review"));
    return null;
  }

  const [progress, savedResult] = await Promise.all([
    getCssPracticeCatalogProgress(session.user.id),
    getCssSpacedReviewResultForStudent(session.user.id),
  ]);
  const reviewDue = isCssSpacedReviewDue(savedResult);
  const pathComplete = progress.completedCount === progress.totalCount;
  const nextChallenge =
    CSS_PRACTICE_CHALLENGES.find(
      (challenge) => challenge.slug === progress.nextChallengeSlug,
    ) ?? CSS_PRACTICE_CHALLENGES[0];

  return (
    <main>
      <SiteNav currentPage="practice" studentSession />
      <div
        className="mixed-review-shell foundations-review-shell"
        id="main-content"
        tabIndex={-1}
      >
        <nav className="problem-breadcrumbs" aria-label="CSS review navigation">
          <Link href="/practice/css">CSS practice</Link>
          <span aria-hidden="true">/</span>
          <span>Spaced review</span>
        </nav>

        <header className="mixed-review-hero foundations-review-hero">
          <div>
            <p className="eyebrow">Private spaced review · completed CSS path</p>
            <h1>Recall the CSS decisions before the browser surprises you.</h1>
            <p>
              Revisit four decisions from your completed challenges. Each answer
              returns one authored explanation, then your next review date adapts
              to the result.
            </p>
          </div>
          <aside aria-label="CSS spaced review boundaries">
            <strong>{CSS_SPACED_REVIEW_ITEMS.length} CSS concepts</strong>
            <span>
              {savedResult && !reviewDue
                ? `Next review ${formatCssSpacedReviewDueDate(savedResult.nextDueAt)}`
                : "About 4 minutes"}
            </span>
            <p>
              {savedResult && !reviewDue
                ? `Last recall ${savedResult.correctCount}/${savedResult.totalCount}. Only the result and due date are saved.`
                : "Choices stay browser-local. Only the result and next due date save."}
            </p>
          </aside>
        </header>

        {pathComplete ? (
          <CssSpacedReview initialResult={reviewDue ? null : savedResult} />
        ) : (
          <section
            className="mixed-review-locked"
            aria-labelledby="css-spaced-review-locked-title"
          >
            <p className="eyebrow">Finish the CSS path first</p>
            <h2 id="css-spaced-review-locked-title">
              Complete all six challenges to build your recall set.
            </h2>
            <p>
              This session recalls only CSS decisions you have already completed.
              Your exact next challenge is ready below.
            </p>
            <Link
              className="primary-action"
              href={`/practice/css/${nextChallenge.slug}`}
            >
              Continue {nextChallenge.title} <span aria-hidden="true">→</span>
            </Link>
          </section>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
