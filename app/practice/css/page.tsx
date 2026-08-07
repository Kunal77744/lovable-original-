import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import {
  getCssPracticeCatalogProgress,
  getCssReviewSessionForStudent,
} from "@/db/css-practice";
import { getHtmlCssCapstoneSummary } from "@/db/html-css-capstone";
import { auth } from "@/lib/auth";
import {
  CSS_PRACTICE_CHALLENGE_COUNT,
  CSS_PRACTICE_CHALLENGES,
} from "@/lib/css-practice-challenges";
import { SiteFooter, SiteNav } from "../../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CSS selectors and box model practice | Lovable Original",
  description:
    "Complete six short CSS challenges with deterministic selector and box-model checks. Sign in to save drafts, attempts, and exact progress.",
  alternates: { canonical: "/practice/css" },
};

export default async function CssPracticePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const [progress, reviewSession, capstone] = await Promise.all([
    getCssPracticeCatalogProgress(session?.user.id ?? null),
    session
      ? getCssReviewSessionForStudent(session.user.id)
      : Promise.resolve([]),
    session
      ? getHtmlCssCapstoneSummary(session.user.id)
      : Promise.resolve({ state: "not-started" as const, passedChecks: 0 }),
  ]);
  const completed = new Set(progress.completedSlugs);
  const cssComplete = progress.completedCount === progress.totalCount;
  const primaryHref = cssComplete
    ? "/projects/html-css-resource-library"
    : `/practice/css/${progress.nextChallengeSlug ?? CSS_PRACTICE_CHALLENGES[0].slug}`;
  const primaryLabel = cssComplete
    ? capstone.state === "not-started"
      ? "Build the HTML and CSS capstone"
      : capstone.state === "completed"
        ? "Review the completed capstone"
        : "Resume the HTML and CSS capstone"
    : session && progress.completedCount > 0
      ? "Resume CSS practice"
      : "Start CSS practice";

  return (
    <main>
      <SiteNav currentPage="practice" studentSession={Boolean(session)} />
      <section className="css-practice-hero" id="main-content" tabIndex={-1}>
        <div className="css-practice-hero-copy">
          <p className="eyebrow">CSS foundations · six saved challenges</p>
          <h1>Practice the box until you can predict it.</h1>
          <p>
            Build one reusable learning card through selectors, spacing, box
            sizing, and scoped component rules. Each step gives exact feedback.
          </p>
          <Link
            className="hero-primary"
            href={primaryHref}
          >
            {primaryLabel}
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <aside className="css-path-progress" aria-label="CSS practice progress">
          <div>
            <span>{session ? "Saved progress" : "Practice path"}</span>
            <strong>
              {session
                ? `${progress.completedCount}/${progress.totalCount}`
                : `${CSS_PRACTICE_CHALLENGE_COUNT}`}
            </strong>
          </div>
          <div className="practice-progress-track" aria-hidden="true">
            <span
              style={{
                width: session
                  ? `${(progress.completedCount / progress.totalCount) * 100}%`
                  : "0%",
              }}
            />
          </div>
          <p>
            {session
              ? "Draft CSS, attempt history, and completion return after sign-in."
              : "Every challenge is open to try. An account keeps your exact place."}
          </p>
        </aside>
      </section>

      <section className="css-challenge-catalog" aria-labelledby="css-path-title">
        <div className="problem-catalog-heading">
          <div>
            <p className="eyebrow">One card, six decisions</p>
            <h2 id="css-path-title">Move from selector to reusable component.</h2>
          </div>
          <div className="catalog-progress-summary">
            <span>
              {session
                ? `${progress.completedCount} of ${progress.totalCount} complete`
                : `${CSS_PRACTICE_CHALLENGE_COUNT} beginner challenges`}
            </span>
            <p>{session ? "Saved privately to your account" : "No setup required"}</p>
          </div>
        </div>

        <div className="css-challenge-list">
          {CSS_PRACTICE_CHALLENGES.map((challenge) => {
            const isComplete = completed.has(challenge.slug);
            const isCurrent =
              Boolean(session) && progress.nextChallengeSlug === challenge.slug;

            return (
              <Link
                className="css-challenge-row"
                href={`/practice/css/${challenge.slug}`}
                key={challenge.slug}
              >
                <span className="problem-number">
                  {String(challenge.number).padStart(2, "0")}
                </span>
                <span className="css-challenge-row-copy">
                  <strong>{challenge.title}</strong>
                  <small>{challenge.outcome}</small>
                </span>
                <span className="problem-difficulty">{challenge.skill}</span>
                <span
                  className={isComplete ? "problem-state is-accepted" : "problem-state"}
                >
                  {isComplete ? "Completed" : isCurrent ? "Resume" : "Open"}
                </span>
                <span aria-hidden="true">→</span>
              </Link>
            );
          })}
        </div>

        {session ? (
          <aside
            className="practice-review-entry"
            aria-labelledby="css-review-entry-title"
          >
            <div>
              <p className="eyebrow">Private CSS review</p>
              <h3 id="css-review-entry-title">
                Repair up to three saved weak spots.
              </h3>
              <p>
                Your latest saved result decides what stays. Completing a
                challenge clears it from the session automatically.
              </p>
            </div>
            <div className="practice-review-entry-action">
              <span>
                {reviewSession.length}{" "}
                {reviewSession.length === 1 ? "challenge" : "challenges"}
              </span>
              <Link href="/practice/css/review">
                {reviewSession.length > 0
                  ? "Open CSS review"
                  : "Check review status"}{" "}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </aside>
        ) : null}
      </section>
      <SiteFooter />
    </main>
  );
}
