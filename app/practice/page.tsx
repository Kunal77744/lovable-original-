import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { getCodingCatalogProgress } from "@/db/coding-practice";
import { auth } from "@/lib/auth";
import {
  CODING_PROBLEMS,
  getCodingProblem,
  getNextUnfinishedCodingProblemSlug,
} from "@/lib/coding-problems";
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
            {session ? (
              <Link
                className="practice-skill-record-link"
                href="/practice/progress"
              >
                View private skill record <span aria-hidden="true">→</span>
              </Link>
            ) : null}
          </aside>
        </section>

        <section className="problem-catalog" aria-labelledby="catalog-title">
          <div className="problem-catalog-heading">
            <div>
              <p className="eyebrow">Six-step path · JavaScript</p>
              <h2 id="catalog-title">
                Build from input handling to FizzBuzz.
              </h2>
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
