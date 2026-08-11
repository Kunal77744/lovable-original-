import Link from "next/link";
import { SiteFooter, SiteNav } from "@/app/site-chrome";
import { CODING_PROBLEMS } from "@/lib/coding-problems";
import type { SavedTimedCodingChallengeResult } from "@/db/timed-coding-challenge";
import {
  formatTimedCodingChallengeElapsedTime,
  getNextTimedCodingChallengeProblem,
  getRecommendedTimedCodingChallengeSet,
  getTimedCodingChallengeSet,
  TIMED_CODING_CHALLENGE_MINUTES,
  TIMED_CODING_CHALLENGE_SETS,
} from "@/lib/timed-coding-challenge";
import { TimedCodingChallengeTimer } from "./timed-coding-challenge-timer";

type TimedCodingChallengeViewProps = {
  completedSlugs: string[];
  recentResults: SavedTimedCodingChallengeResult[];
  selectedSetId?: string | null;
};

function formatResultDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function TimedCodingChallengeView({
  completedSlugs,
  recentResults,
  selectedSetId,
}: TimedCodingChallengeViewProps) {
  const completed = new Set(completedSlugs);
  const recommendedSet = getRecommendedTimedCodingChallengeSet(completedSlugs);
  const selectedSet =
    getTimedCodingChallengeSet(selectedSetId) ?? recommendedSet;
  const selectedSetIndex = TIMED_CODING_CHALLENGE_SETS.findIndex(
    (challengeSet) => challengeSet.id === selectedSet.id,
  );
  const completedCount = selectedSet.problems.filter((problem) =>
    completed.has(problem.slug),
  ).length;
  const overallCompletedCount = CODING_PROBLEMS.filter((problem) =>
    completed.has(problem.slug),
  ).length;
  const nextProblem = getNextTimedCodingChallengeProblem(
    completedSlugs,
    selectedSet,
  );
  const actionProblem = nextProblem ?? selectedSet.problems[0];
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
            <p className="eyebrow">
              Private timed practice · Set {selectedSetIndex + 1} of {TIMED_CODING_CHALLENGE_SETS.length}
            </p>
            <h1>{selectedSet.title}. Thirty focused minutes.</h1>
            <p>
              {selectedSet.description} The existing judge and your saved
              Accepted results work exactly as they do in the 12-problem path.
            </p>
            <Link
              className="primary-action"
              href={`/practice/${actionProblem.slug}`}
            >
              {actionLabel} <span aria-hidden="true">→</span>
            </Link>
            <p className="challenge-next-note">
              {nextProblem
                ? `Next set problem: ${nextProblem.number}. ${nextProblem.title}`
                : "All three are Accepted. Review starts from the first problem in this set."}
            </p>
          </div>

          <TimedCodingChallengeTimer
            challengeSetId={selectedSet.id}
            key={selectedSet.id}
          />
        </header>

        <section
          className="challenge-set-picker"
          aria-labelledby="challenge-set-picker-title"
        >
          <div className="challenge-set-picker-heading">
            <div>
              <p className="eyebrow">Four stable sets</p>
              <h2 id="challenge-set-picker-title">Choose a three-problem set.</h2>
            </div>
            <span>
              Accepted {overallCompletedCount} of {CODING_PROBLEMS.length}
            </span>
          </div>

          <div className="challenge-set-options">
            {TIMED_CODING_CHALLENGE_SETS.map((challengeSet, index) => {
              const setCompletedCount = challengeSet.problems.filter((problem) =>
                completed.has(problem.slug),
              ).length;
              const isSelected = challengeSet.id === selectedSet.id;

              return (
                <Link
                  aria-current={isSelected ? "page" : undefined}
                  className={isSelected ? "is-selected" : undefined}
                  href={`/practice/challenge?set=${challengeSet.id}`}
                  key={challengeSet.id}
                >
                  <span>Set {String(index + 1).padStart(2, "0")}</span>
                  <strong>{challengeSet.title}</strong>
                  <small>Accepted {setCompletedCount} of 3</small>
                </Link>
              );
            })}
          </div>
        </section>

        <section
          className="challenge-problem-set"
          aria-labelledby="challenge-set-title"
        >
          <div className="challenge-set-heading">
            <div>
              <p className="eyebrow">Selected set</p>
              <h2 id="challenge-set-title">{selectedSet.title}</h2>
            </div>
            <span>
              Accepted {completedCount} of {selectedSet.problems.length}
            </span>
          </div>

          <ol className="challenge-problem-list">
            {selectedSet.problems.map((problem, index) => {
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
              <p>Each set keeps its own browser timer. Pause, resume, or reset it.</p>
            </div>
            <div>
              <strong>Existing judge</strong>
              <p>Every submission uses the same deterministic checks as practice.</p>
            </div>
            <div>
              <strong>One private result</strong>
              <p>
                Finishing saves the set, elapsed time, and current Accepted
                count. It creates no score, rating, leaderboard, or analytics event.
              </p>
            </div>
          </aside>
        </section>

        <section
          className="challenge-result-history"
          aria-labelledby="challenge-result-history-title"
        >
          <div className="challenge-result-history-heading">
            <div>
              <p className="eyebrow">Saved to this account</p>
              <h2 id="challenge-result-history-title">Recent timed results</h2>
            </div>
            <span>Latest {Math.min(recentResults.length, 6)} of 6</span>
          </div>

          {recentResults.length === 0 ? (
            <p className="challenge-result-history-empty">
              No timed result yet. Start any set, then finish when you choose to
              save its current Accepted count and elapsed time.
            </p>
          ) : (
            <ol className="challenge-result-history-list">
              {recentResults.map((result) => {
                const resultSet = getTimedCodingChallengeSet(
                  result.challengeSetId,
                );
                if (!resultSet) return null;
                const resultSetIndex = TIMED_CODING_CHALLENGE_SETS.findIndex(
                  (challengeSet) => challengeSet.id === resultSet.id,
                );

                return (
                  <li key={result.id}>
                    <div>
                      <span>Set {String(resultSetIndex + 1).padStart(2, "0")}</span>
                      <strong>{resultSet.title}</strong>
                    </div>
                    <dl>
                      <div>
                        <dt>Accepted</dt>
                        <dd>{result.solvedCount} of 3</dd>
                      </div>
                      <div>
                        <dt>Elapsed</dt>
                        <dd>
                          {formatTimedCodingChallengeElapsedTime(
                            result.elapsedSeconds,
                          )}
                        </dd>
                      </div>
                    </dl>
                    <time dateTime={result.completedAt}>
                      {formatResultDate(result.completedAt)}
                    </time>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
