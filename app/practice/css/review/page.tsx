import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getCssPracticeCatalogProgress,
  getCssReviewSessionForStudent,
} from "@/db/css-practice";
import { auth } from "@/lib/auth";
import { getSignInHref } from "@/lib/account-destination";
import { SiteFooter, SiteNav } from "../../../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private CSS review session | Lovable Original",
  description:
    "Revisit up to three private CSS challenges from your latest saved attempts that still need revision.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CssReviewPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect(getSignInHref("/practice/css/review"));
  }

  const [reviewItems, progress] = await Promise.all([
    getCssReviewSessionForStudent(session.user.id),
    getCssPracticeCatalogProgress(session.user.id),
  ]);
  const pathComplete = progress.completedCount === progress.totalCount;

  return (
    <main>
      <SiteNav currentPage="practice" studentSession />
      <div className="review-session-shell" id="main-content" tabIndex={-1}>
        <nav className="review-session-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/practice/css">CSS practice</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Private review session</span>
        </nav>

        <header className="review-session-hero">
          <div>
            <p className="eyebrow">Private CSS review</p>
            <h1>Repair the rules that still need a second pass.</h1>
            <p>
              Revisit up to three exact challenges from your latest saved
              attempts. A later completed result clears that challenge from
              this list automatically.
            </p>
          </div>
          <div
            className="review-session-count"
            aria-label={`${reviewItems.length} CSS review challenges`}
          >
            <strong>{reviewItems.length}</strong>
            <span>{reviewItems.length === 1 ? "challenge" : "challenges"}</span>
            <small>Maximum 3</small>
          </div>
        </header>

        {reviewItems.length > 0 ? (
          <section
            className="review-session-plan"
            aria-labelledby="css-review-plan-title"
          >
            <div className="review-session-plan-heading">
              <div>
                <p className="eyebrow">Most recent first</p>
                <h2 id="css-review-plan-title">
                  Start with the newest unfinished rule.
                </h2>
              </div>
              <p>
                Only your latest saved result for each challenge decides what
                stays here.
              </p>
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
                    <small>Needs revision</small>
                  </div>
                  <div className="review-session-copy">
                    <span>{item.skill}</span>
                    <h3>{item.title}</h3>
                    <strong>{item.outcome}</strong>
                    <small>
                      Latest attempt: {item.passedChecks}/{item.totalChecks}{" "}
                      checks
                    </small>
                  </div>
                  <Link
                    className={
                      index === 0
                        ? "review-session-primary-action"
                        : "review-session-link"
                    }
                    href={`/practice/css/${item.slug}?review=1`}
                  >
                    {index === 0 ? "Start this review" : "Open challenge"}{" "}
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
            aria-labelledby="css-review-empty-title"
          >
            <p className="eyebrow">
              {pathComplete ? "Review complete" : "Nothing waiting yet"}
            </p>
            <h2 id="css-review-empty-title">
              {pathComplete
                ? "Your saved CSS review is clear."
                : "Your first revision will appear here."}
            </h2>
            <p>
              {pathComplete
                ? "All six CSS challenges are complete, with no latest saved result still needing revision."
                : "A saved Needs revision result will add the exact challenge here automatically."}
            </p>
            <Link href="/practice/css">
              {pathComplete
                ? "Review the full CSS path"
                : "Return to CSS practice"}{" "}
              <span aria-hidden="true">→</span>
            </Link>
          </section>
        )}

        <div className="review-session-return">
          <Link href="/practice/css">← Back to the six-step CSS path</Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
