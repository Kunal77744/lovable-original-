import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter, SiteNav } from "@/app/site-chrome";
import { JavaScriptMixedReview } from "@/components/javascript-mixed-review";
import { getJavaScriptMixedReviewResultForStudent } from "@/db/javascript-mixed-review";
import { getJavaScriptLabCatalogProgress } from "@/db/javascript-lab-progress";
import { auth } from "@/lib/auth";
import {
  buildJavaScriptMixedReviewSession,
  formatJavaScriptMixedReviewDueDate,
  isJavaScriptMixedReviewDue,
} from "@/lib/javascript-mixed-review";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript mixed review | Lovable Original",
  description:
    "Recall several completed JavaScript lab concepts in one private, browser-only review session.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function JavaScriptMixedReviewPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/account?mode=signin&next=/practice/mixed-review");
    return null;
  }

  const [labProgress, savedResult] = await Promise.all([
    getJavaScriptLabCatalogProgress(session.user.id),
    getJavaScriptMixedReviewResultForStudent(session.user.id),
  ]);
  const reviewDue = isJavaScriptMixedReviewDue(savedResult);
  const rotationSeed = savedResult
    ? Math.floor(Date.parse(savedResult.completedAt) / (24 * 60 * 60 * 1000))
    : 0;
  const reviewItems = buildJavaScriptMixedReviewSession(
    labProgress.labs,
    4,
    reviewDue ? rotationSeed : 0,
  );
  const nextLabel = labProgress.nextLabTitle
    ? `Continue ${labProgress.nextLabTitle}, exercise ${labProgress.nextExerciseNumber}`
    : "Return to JavaScript practice";
  const nextHref = labProgress.nextLabTitle ? labProgress.nextHref : "/practice";

  return (
    <main>
      <SiteNav currentPage="practice" studentSession />
      <div className="mixed-review-shell" id="main-content" tabIndex={-1}>
        <nav className="problem-breadcrumbs" aria-label="Mixed review navigation">
          <Link href="/practice">Practice arena</Link>
          <span aria-hidden="true">/</span>
          <span>Mixed review</span>
        </nav>

        <header className="mixed-review-hero">
          <div>
            <p className="eyebrow">Private mixed review · completed labs</p>
            <h1>Bring several JavaScript concepts back at once.</h1>
            <p>
              Recall the rule behind each completed lab without reopening old
              exercises. Feedback comes from the teaching you already unlocked.
            </p>
          </div>
          <aside aria-label="Mixed review boundaries">
            <strong>
              {reviewItems.length > 0
                ? `${reviewItems.length} concepts`
                : "3 labs needed"}
            </strong>
            <span>
              {savedResult && !reviewDue
                ? `Next review ${formatJavaScriptMixedReviewDueDate(savedResult.nextDueAt)}`
                : "About 4 minutes"}
            </span>
            <p>
              {savedResult && !reviewDue
                ? `Last recall ${savedResult.correctCount}/${savedResult.totalCount}. Only the result and due date are saved.`
                : "Answers stay browser-local. Only the result and next due date save."}
            </p>
          </aside>
        </header>

        {reviewItems.length > 0 ? (
          <JavaScriptMixedReview
            initialResult={reviewDue ? null : savedResult}
            items={reviewItems}
            nextHref={nextHref}
            nextLabel={nextLabel}
            studentScope={session.user.id}
          />
        ) : (
          <section className="mixed-review-locked" aria-labelledby="mixed-review-locked-title">
            <p className="eyebrow">Build your review set</p>
            <h2 id="mixed-review-locked-title">Complete three labs first.</h2>
            <p>
              Mixed review uses only concepts you have already completed. Your
              exact unfinished guided step is ready below.
            </p>
            <Link className="primary-action" href={labProgress.nextHref}>
              Continue guided JavaScript <span aria-hidden="true">→</span>
            </Link>
          </section>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
