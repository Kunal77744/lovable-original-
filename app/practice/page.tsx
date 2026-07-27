import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { getCodingCatalogProgress } from "@/db/coding-practice";
import { auth } from "@/lib/auth";
import { CODING_PROBLEMS } from "@/lib/coding-problems";
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
  const progress = await getCodingCatalogProgress(session?.user.id ?? null);
  const completedSlugs = new Set(progress.completedSlugs);
  const catalogProgressLabel = session
    ? `Accepted ${progress.completedCount} of ${progress.totalCount}`
    : `${progress.totalCount} problems`;

  return (
    <main>
      <SiteNav currentPage="practice" studentSession={Boolean(session)} />
      <div id="main-content" tabIndex={-1}>
        <section className="practice-hero" aria-labelledby="practice-title">
          <div className="practice-hero-copy">
            <p className="eyebrow">JavaScript practice arena</p>
            <h1 id="practice-title">Six problems. One honest first streak.</h1>
            <p>
              Work from input handling to FizzBuzz in a focused beginner set.
              Run every solution in your browser, submit against deterministic
              checks, and keep your progress free.
            </p>
            <Link
              className="primary-action"
              href={`/practice/${CODING_PROBLEMS[0].slug}`}
            >
              Solve problem 01 <span aria-hidden="true">→</span>
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
                  ? "Beginner set complete. Every accepted result is saved."
                  : "Accepted solutions stay attached to your account."
                : "Create a free account to save code, attempts, and accepted results."}
            </p>
          </aside>
        </section>

        <section className="problem-catalog" aria-labelledby="catalog-title">
          <div className="problem-catalog-heading">
            <div>
              <p className="eyebrow">Beginner set · JavaScript</p>
              <h2 id="catalog-title">Build the habit one problem at a time.</h2>
            </div>
            <span aria-label={catalogProgressLabel}>
              {catalogProgressLabel}
            </span>
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
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
