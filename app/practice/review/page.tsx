import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getCodingCatalogProgress,
  getCodingMistakeReviewQueueForStudent,
  getCodingProblemBookmarksForStudent,
} from "@/db/coding-practice";
import { auth } from "@/lib/auth";
import { buildCodingReviewSession } from "@/lib/coding-review-session";
import { SiteFooter, SiteNav } from "../../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript review session | Lovable Original",
  description:
    "Revisit up to three private JavaScript weak spots from saved Wrong Answers and problems saved for later.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PracticeReviewPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/account?mode=signin");
  }

  const [mistakes, bookmarks, progress] = await Promise.all([
    getCodingMistakeReviewQueueForStudent(session.user.id),
    getCodingProblemBookmarksForStudent(session.user.id),
    getCodingCatalogProgress(session.user.id),
  ]);
  const reviewItems = buildCodingReviewSession({
    mistakes,
    bookmarks,
    completedSlugs: progress.completedSlugs,
  });
  const pathComplete = progress.completedCount === progress.totalCount;

  return (
    <main>
      <SiteNav currentPage="practice" studentSession />
      <div
        className="review-session-shell"
        id="main-content"
        tabIndex={-1}
      >
        <nav className="review-session-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/practice">JavaScript practice</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Private review session</span>
        </nav>

        <header className="review-session-hero">
          <div>
            <p className="eyebrow">Private review session</p>
            <h1>Turn saved weak spots into one short session.</h1>
            <p>
              Revisit up to three problems. Unresolved Wrong Answers come first,
              then problems you saved for later. Your next result rebuilds this
              list automatically.
            </p>
          </div>
          <div
            className="review-session-count"
            aria-label={`${reviewItems.length} review problems`}
          >
            <strong>{reviewItems.length}</strong>
            <span>{reviewItems.length === 1 ? "problem" : "problems"}</span>
            <small>Maximum 3</small>
          </div>
        </header>

        {reviewItems.length > 0 ? (
          <section
            className="review-session-plan"
            aria-labelledby="review-session-plan-title"
          >
            <div className="review-session-plan-heading">
              <div>
                <p className="eyebrow">Today&apos;s order</p>
                <h2 id="review-session-plan-title">
                  Start with the first problem, then work down.
                </h2>
              </div>
              <p>Only your saved verdicts and bookmarks decide this order.</p>
            </div>

            <ol className="review-session-list">
              {reviewItems.map((item, index) => (
                <li
                  className={index === 0 ? "is-first" : undefined}
                  key={item.slug}
                >
                  <div className="review-session-step">
                    <span>
                      {String(index + 1).padStart(2, "0")} /{" "}
                      {String(reviewItems.length).padStart(2, "0")}
                    </span>
                    <small>
                      {item.source === "mistake"
                        ? "Unresolved mistake"
                        : item.acceptedBefore
                          ? "Accepted before · saved for later"
                          : "Saved for later"}
                    </small>
                  </div>
                  <div className="review-session-copy">
                    <span>{item.skill}</span>
                    <h3>{item.title}</h3>
                    {item.source === "mistake" ? (
                      <>
                        <strong>{item.concept}</strong>
                        <p>{item.recoveryHint}</p>
                        <small>
                          Latest attempt: {item.passedTests}/{item.totalTests}{" "}
                          checks
                        </small>
                      </>
                    ) : (
                      <p>
                        You saved this problem for another pass. Reopen the exact
                        exercise and test your current approach.
                      </p>
                    )}
                  </div>
                  <Link
                    className={
                      index === 0
                        ? "review-session-primary-action"
                        : "review-session-link"
                    }
                    href={`/practice/${item.slug}`}
                  >
                    {index === 0 ? "Start this review" : "Open problem"}{" "}
                    <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ) : (
          <section
            className={
              pathComplete
                ? "review-session-empty is-complete"
                : "review-session-empty"
            }
            aria-labelledby="review-session-empty-title"
          >
            <p className="eyebrow">
              {pathComplete ? "Review complete" : "Nothing waiting yet"}
            </p>
            <h2 id="review-session-empty-title">
              {pathComplete
                ? "Your saved review session is clear."
                : "Your first weak spot will appear here."}
            </h2>
            <p>
              {pathComplete
                ? "All six problems are Accepted, with no unresolved mistakes or saved bookmarks waiting."
                : "A saved Wrong Answer or Save for later choice will build a private review session automatically."}
            </p>
            <Link href="/practice">
              {pathComplete
                ? "Review the full path"
                : "Return to JavaScript practice"}{" "}
              <span aria-hidden="true">→</span>
            </Link>
          </section>
        )}

        <div className="review-session-return">
          <Link href="/practice">← Back to the six-step path</Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
