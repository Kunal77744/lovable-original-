import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import {
  getCodingCatalogProgress,
  getCodingMistakeReviewQueueForStudent,
  getCodingProblemBookmarksForStudent,
} from "@/db/coding-practice";
import { auth } from "@/lib/auth";
import {
  CODING_PROBLEMS,
  getCodingProblem,
  getNextUnfinishedCodingProblemSlug,
} from "@/lib/coding-problems";
import { buildCodingReviewSession } from "@/lib/coding-review-session";
import { SiteFooter, SiteNav } from "../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "JavaScript practice arena | Lovable Original",
  description:
    "Solve six free beginner JavaScript problems with instant browser-run verdicts and saved progress.",
  alternates: {
    canonical: "/practice",
  },
};

export default async function PracticePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const [progress, savedProblems, reviewQueue] = await Promise.all([
    getCodingCatalogProgress(session?.user.id ?? null),
    session
      ? getCodingProblemBookmarksForStudent(session.user.id)
      : Promise.resolve([]),
    session
      ? getCodingMistakeReviewQueueForStudent(session.user.id)
      : Promise.resolve([]),
  ]);
  const completedSlugs = new Set(progress.completedSlugs);
  const reviewSession = buildCodingReviewSession({
    mistakes: reviewQueue,
    bookmarks: savedProblems,
    completedSlugs: progress.completedSlugs,
  });
  const nextProblemSlug = getNextUnfinishedCodingProblemSlug(
    progress.completedSlugs,
  );
  const nextProblem = nextProblemSlug
    ? getCodingProblem(nextProblemSlug)
    : CODING_PROBLEMS[0];
  const primaryProblem = nextProblem ?? CODING_PROBLEMS[0];
  const catalogProgressLabel = session
    ? `Accepted ${progress.completedCount} of ${progress.totalCount}`
    : `${progress.totalCount} problems`;
  const primaryActionLabel = session
    ? nextProblemSlug
      ? `Continue at step ${primaryProblem.number} of ${progress.totalCount}`
      : "Review the six-step path"
    : `Start step 1 of ${progress.totalCount}`;

  return (
    <main>
      <SiteNav currentPage="practice" studentSession={Boolean(session)} />
      <div id="main-content" tabIndex={-1}>
        <section className="practice-hero" aria-labelledby="practice-title">
          <div className="practice-hero-copy">
            <p className="eyebrow">JavaScript practice arena</p>
            <h1 id="practice-title">Six problems. One beginner path.</h1>
            <p>
              Follow six ordered steps from input handling to FizzBuzz. Run
              every solution in your browser, submit against deterministic
              checks, and return to your next unfinished step.
            </p>
            <Link
              className="primary-action"
              href={`/practice/${primaryProblem.slug}`}
            >
              {primaryActionLabel} <span aria-hidden="true">→</span>
            </Link>
          </div>

          <aside className="practice-progress-card" aria-label="Practice progress">
            <div>
              <span>{session ? "Your progress" : "Practice set"}</span>
              <strong>
                {progress.completedCount}/{progress.totalCount}
              </strong>
            </div>
            <div
              className="practice-progress-track"
              role="progressbar"
              aria-label="Problems completed"
              aria-valuemin={0}
              aria-valuemax={progress.totalCount}
              aria-valuenow={progress.completedCount}
            >
              <span
                style={{
                  width: `${(progress.completedCount / progress.totalCount) * 100}%`,
                }}
              />
            </div>
            <p>
              {session
                ? progress.completedCount === progress.totalCount
                  ? "Six-step path complete. Every Accepted result is saved."
                  : "Complete all six steps. Accepted results stay attached to your account."
                : "Create a free account to save code, attempts, and accepted results."}
            </p>
          </aside>
        </section>

        <section className="problem-catalog" aria-labelledby="catalog-title">
          <div className="problem-catalog-heading">
            <div>
              <p className="eyebrow">Six-step path · JavaScript</p>
              <h2 id="catalog-title">
                Build from input handling to FizzBuzz.
              </h2>
              <p className="problem-catalog-helper">
                Each problem runs in browser-based JavaScript. Signed-in
                attempts are saved to your account.
              </p>
            </div>
            <div className="catalog-progress-summary">
              <span aria-label={catalogProgressLabel}>
                {catalogProgressLabel}
              </span>
              {session ? <p>Saved privately to your account</p> : null}
              {session ? (
                <Link
                  className="catalog-submission-history-link"
                  href="/submissions"
                >
                  Review saved submissions <span aria-hidden="true">→</span>
                </Link>
              ) : null}
            </div>
          </div>

          <div className="problem-table" role="list">
            {CODING_PROBLEMS.map((problem) => {
              const completed = completedSlugs.has(problem.slug);

              return (
                <Link
                  className={
                    completed ? "problem-row is-complete" : "problem-row"
                  }
                  href={`/practice/${problem.slug}`}
                  key={problem.slug}
                  role="listitem"
                >
                  <span className="problem-number">
                    {String(problem.number).padStart(2, "0")}
                  </span>
                  <span className="problem-row-copy">
                    <strong>{problem.title}</strong>
                    <small>{problem.skill}</small>
                  </span>
                  <span className="problem-difficulty">{problem.difficulty}</span>
                  <span className="problem-state">
                    {completed ? "Accepted" : "Open"}
                  </span>
                  <span className="problem-arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              );
            })}
          </div>

          {session ? (
            <aside
              className="practice-review-entry"
              aria-labelledby="practice-review-entry-title"
            >
              <div>
                <p className="eyebrow">Private review session</p>
                <h3 id="practice-review-entry-title">
                  Revisit up to three saved weak spots.
                </h3>
                <p>
                  Unresolved Wrong Answers come first, then problems you saved
                  for later. The order updates after your next result.
                </p>
              </div>
              <div className="practice-review-entry-action">
                <span>
                  {reviewSession.length}{" "}
                  {reviewSession.length === 1 ? "problem" : "problems"}
                </span>
                <Link href="/practice/review">
                  {reviewSession.length > 0
                    ? "Open review session"
                    : "Check review status"}{" "}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </aside>
          ) : null}

          {session ? (
            <aside
              className="mistake-review"
              aria-labelledby="mistake-review-title"
            >
              <div className="mistake-review-heading">
                <div>
                  <p className="eyebrow">Private review queue</p>
                  <h3 id="mistake-review-title">Mistakes to revisit</h3>
                  <p>
                    Your latest saved verdict decides what stays here. An
                    Accepted retry clears the concept.
                  </p>
                </div>
                <span>
                  {reviewQueue.length}{" "}
                  {reviewQueue.length === 1 ? "concept" : "concepts"}
                </span>
              </div>

              {reviewQueue.length > 0 ? (
                <ol className="mistake-review-list">
                  {reviewQueue.map((item) => (
                    <li key={item.slug}>
                      <div className="mistake-review-number">
                        <span>{String(item.number).padStart(2, "0")}</span>
                        <small>{item.skill}</small>
                      </div>
                      <div className="mistake-review-copy">
                        <strong>{item.concept}</strong>
                        <p>{item.recoveryHint}</p>
                        <span>
                          Latest attempt: {item.passedTests}/{item.totalTests}{" "}
                          checks
                        </span>
                      </div>
                      <Link href={`/practice/${item.slug}`}>
                        Review {item.title} <span aria-hidden="true">→</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mistake-review-empty">
                  No concepts waiting. A saved Wrong Answer adds one here;
                  an Accepted retry clears it.
                </p>
              )}
            </aside>
          ) : null}

          {session ? (
            <aside className="saved-problems" aria-labelledby="saved-problems-title">
              <div className="saved-problems-heading">
                <div>
                  <p className="eyebrow">Private shortlist</p>
                  <h3 id="saved-problems-title">Saved for later</h3>
                  <p>Private to your account.</p>
                </div>
                <span>{savedProblems.length} saved</span>
              </div>
              {savedProblems.length > 0 ? (
                <ul className="saved-problems-list">
                  {savedProblems.map((problem) => (
                    <li key={problem.slug}>
                      <Link href={`/practice/${problem.slug}`}>
                        <span>{String(problem.number).padStart(2, "0")}</span>
                        <span>
                          <strong>{problem.title}</strong>
                          <small>{problem.skill}</small>
                        </span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="saved-problems-empty">
                  Nothing saved yet. Use Save for later on any problem.
                </p>
              )}
            </aside>
          ) : null}

          {session ? (
            <aside
              className="practice-playground-entry"
              aria-label="Continue in the private playground"
            >
              <div>
                <p className="eyebrow">Free coding</p>
                <p>
                  Take an idea beyond the fixed checks in one saved JavaScript
                  file.
                </p>
              </div>
              <Link className="practice-playground-action" href="/playground">
                Open the playground <span aria-hidden="true">→</span>
              </Link>
            </aside>
          ) : null}
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
