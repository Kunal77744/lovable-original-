import Link from "next/link";
import type { SavedCodingProblem } from "@/db/coding-practice";

type ProblemBookmarkCollectionProps = {
  bookmarks: SavedCodingProblem[];
  completedSlugs: string[];
};

export function ProblemBookmarkCollection({
  bookmarks,
  completedSlugs,
}: ProblemBookmarkCollectionProps) {
  const completed = new Set(completedSlugs);
  const firstSavedProblem =
    bookmarks.find((problem) => !completed.has(problem.slug)) ?? bookmarks[0];
  const unfinishedCount = bookmarks.filter(
    (problem) => !completed.has(problem.slug),
  ).length;

  return (
    <section
      className="bookmark-collection-shell"
      id="main-content"
      tabIndex={-1}
      aria-labelledby="bookmark-collection-title"
    >
      <nav className="bookmark-collection-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/practice">JavaScript practice</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Saved problems</span>
      </nav>

      <header className="bookmark-collection-hero">
        <div>
          <p className="eyebrow">Private saved collection</p>
          <h1 id="bookmark-collection-title">
            Keep the problems worth another pass.
          </h1>
          <p>
            Every problem you save for later returns here in path order. Reopen
            the exact exercise without changing your code, verdicts, or progress.
          </p>
          {firstSavedProblem ? (
            <Link
              className="bookmark-collection-primary-action"
              href={`/practice/${firstSavedProblem.slug}`}
            >
              {unfinishedCount > 0
                ? "Open first unfinished save"
                : "Revisit first saved problem"}{" "}
              <span aria-hidden="true">→</span>
            </Link>
          ) : null}
        </div>
        <div
          className="bookmark-collection-count"
          aria-label={`${bookmarks.length} saved ${
            bookmarks.length === 1 ? "problem" : "problems"
          }`}
        >
          <strong>{bookmarks.length}</strong>
          <span>{bookmarks.length === 1 ? "problem" : "problems"}</span>
          <small>Private to your account</small>
        </div>
      </header>

      {bookmarks.length > 0 ? (
        <section
          className="bookmark-collection-list-panel"
          aria-labelledby="bookmark-collection-list-title"
        >
          <div className="bookmark-collection-list-heading">
            <div>
              <p className="eyebrow">Your saved path</p>
              <h2 id="bookmark-collection-list-title">
                Return when you are ready to solve.
              </h2>
            </div>
            <p>
              {unfinishedCount} unfinished · {bookmarks.length - unfinishedCount}{" "}
              Accepted
            </p>
          </div>

          <ol className="bookmark-collection-list">
            {bookmarks.map((problem) => {
              const isCompleted = completed.has(problem.slug);
              const isFirstSavedProblem = problem.slug === firstSavedProblem?.slug;

              return (
                <li
                  className={isFirstSavedProblem ? "is-first" : undefined}
                  key={problem.slug}
                >
                  <span className="bookmark-collection-number">
                    {String(problem.number).padStart(2, "0")}
                  </span>
                  <div className="bookmark-collection-copy">
                    <span>{problem.skill}</span>
                    <h3>{problem.title}</h3>
                    <small>{isCompleted ? "Accepted" : "Unfinished"}</small>
                  </div>
                  <Link
                    href={`/practice/${problem.slug}`}
                    aria-label={`Open ${problem.title}`}
                  >
                    Open problem <span aria-hidden="true">→</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ) : (
        <section
          className="bookmark-collection-empty"
          aria-labelledby="bookmark-collection-empty-title"
        >
          <p className="eyebrow">Nothing saved yet</p>
          <h2 id="bookmark-collection-empty-title">
            Build your collection from the problem path.
          </h2>
          <p>
            Use Save for later inside any judged JavaScript problem. It will
            appear here for this account.
          </p>
          <Link href="/practice">
            Browse all 12 problems <span aria-hidden="true">→</span>
          </Link>
        </section>
      )}

      <div className="bookmark-collection-return">
        <Link href="/practice">← Back to JavaScript practice</Link>
      </div>
    </section>
  );
}
