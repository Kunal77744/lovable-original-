import Link from "next/link";
import { SiteFooter, SiteNav } from "@/app/site-chrome";
import {
  getNextTimedCodingChallengeProblem,
  TIMED_CODING_CHALLENGE_MINUTES,
  TIMED_CODING_CHALLENGE_PROBLEMS,
} from "@/lib/timed-coding-challenge";
import { TimedCodingChallengeTimer } from "./timed-coding-challenge-timer";

type TimedCodingChallengeViewProps = {
  completedSlugs: string[];
};

export function TimedCodingChallengeView({
  completedSlugs,
}: TimedCodingChallengeViewProps) {
  const completed = new Set(completedSlugs);
  const completedCount = TIMED_CODING_CHALLENGE_PROBLEMS.filter((problem) =>
    completed.has(problem.slug),
  ).length;
  const nextProblem = getNextTimedCodingChallengeProblem(completedSlugs);
  const actionProblem = nextProblem ?? TIMED_CODING_CHALLENGE_PROBLEMS[0];
  const actionLabel = nextProblem
    ? `Open ${nextProblem.title}`
    : `Review ${actionProblem.title}`;

  return (
    <main>
      <SiteNav currentPage="practice" studentSession />
      <div className="challenge-shell" id="main-content" tabIndex={-1}>
        <nav className="problem-breadcrumbs" aria-label="Challenge navigation">
          <Link href="/practice">Practice arena</Link>
          <span aria-hidden="true">/</span>
          <span>Timed challenge</span>
        </nav>

        <header className="challenge-hero">
          <div className="challenge-hero-copy">
            <p className="eyebrow">Private timed practice · 3 problems</p>
            <h1>Three problems. Thirty focused minutes.</h1>
            <p>
              Revisit conditions, arrays, and algorithms in one short set. The
              existing judge and your saved Accepted results work exactly as
              they do in the 12-problem path.
            </p>
            <Link
              className="primary-action"
              href={`/practice/${actionProblem.slug}`}
            >
              {actionLabel} <span aria-hidden="true">→</span>
            </Link>
            <p className="challenge-next-note">
              {nextProblem
                ? `Next challenge problem: ${nextProblem.number}. ${nextProblem.title}`
                : "All three are Accepted. Review starts from the first challenge problem."}
            </p>
          </div>

          <TimedCodingChallengeTimer />
        </header>

        <section
          className="challenge-problem-set"
          aria-labelledby="challenge-set-title"
        >
          <div className="challenge-set-heading">
            <div>
              <p className="eyebrow">Your set</p>
              <h2 id="challenge-set-title">One problem from each stage.</h2>
            </div>
            <span>
              Accepted {completedCount} of {TIMED_CODING_CHALLENGE_PROBLEMS.length}
            </span>
          </div>

          <ol className="challenge-problem-list">
            {TIMED_CODING_CHALLENGE_PROBLEMS.map((problem, index) => {
              const isComplete = completed.has(problem.slug);
              const isNext = nextProblem?.slug === problem.slug;

              return (
                <li
                  className={isComplete ? "is-complete" : undefined}
                  key={problem.slug}
                >
                  <span className="challenge-problem-position">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p>
                      Path problem {problem.number} · {problem.skill}
                    </p>
                    <h3>{problem.title}</h3>
                  </div>
                  <span className="challenge-problem-state">
                    {isComplete ? "Accepted" : isNext ? "Next problem" : "Open"}
                  </span>
                  <Link href={`/practice/${problem.slug}`}>
                    {isComplete ? "Review" : "Solve"}
                    <span className="sr-only"> {problem.title}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </li>
              );
            })}
          </ol>

          <aside className="challenge-rules" aria-label="Challenge boundaries">
            <div>
              <strong>{TIMED_CODING_CHALLENGE_MINUTES} minutes</strong>
              <p>Pause, resume, or reset the browser timer when you need to.</p>
            </div>
            <div>
              <strong>Existing judge</strong>
              <p>Every submission uses the same deterministic checks as practice.</p>
            </div>
            <div>
              <strong>No extra record</strong>
              <p>
                The challenge creates no score, rating, leaderboard, or analytics
                event.
              </p>
            </div>
          </aside>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
