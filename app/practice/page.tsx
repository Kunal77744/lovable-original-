import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import {
  getCodingCatalogProgress,
  getCodingMistakeReviewQueueForStudent,
  getCodingProblemBookmarksForStudent,
} from "@/db/coding-practice";
import { getJavaScriptLabCatalogProgress } from "@/db/javascript-lab-progress";
import { getJavaScriptCapstoneSummary } from "@/db/javascript-capstone";
import { getJavaScriptMixedReviewResultForStudent } from "@/db/javascript-mixed-review";
import { auth } from "@/lib/auth";
import { getJavaScriptFoundationsEntry } from "@/lib/javascript-lab-progress";
import {
  CODING_PROBLEMS,
  getCodingProblem,
  getNextUnfinishedCodingProblemSlug,
} from "@/lib/coding-problems";
import { buildCodingReviewSession } from "@/lib/coding-review-session";
import {
  buildJavaScriptMixedReviewSession,
  formatJavaScriptMixedReviewDueDate,
  isJavaScriptMixedReviewDue,
} from "@/lib/javascript-mixed-review";
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

const PRACTICE_LAB_GROUPS = [
  {
    label: "Reason about code",
    description: "Read, repair, and test small programs before you rely on a judge.",
    labs: [
      { href: "/practice/tracing", title: "Trace values", meta: "4 predictions" },
      { href: "/practice/debugging", title: "Repair defects", meta: "3 drills" },
      { href: "/practice/test-design", title: "Find edge cases", meta: "4 decisions" },
    ],
  },
  {
    label: "Build with JavaScript",
    description: "Strengthen the language and browser skills behind larger solutions.",
    labs: [
      { href: "/practice/data-structures", title: "Use data structures", meta: "4 exercises" },
      { href: "/practice/functions", title: "Practice functions and scope", meta: "4 exercises" },
      { href: "/practice/recursion", title: "Practice recursion", meta: "4 exercises" },
      { href: "/practice/search-sort", title: "Search and sort values", meta: "4 exercises" },
      { href: "/practice/stacks-queues", title: "Use stacks and queues", meta: "4 exercises" },
      { href: "/practice/linked-lists", title: "Follow linked lists", meta: "4 exercises" },
      { href: "/practice/trees-graphs", title: "Traverse trees and graphs", meta: "4 exercises" },
      { href: "/practice/dom", title: "Work with the DOM", meta: "4 exercises" },
    ],
  },
  {
    label: "Solve with intent",
    description: "Choose a better approach, then bring it into a focused judged set.",
    labs: [
      { href: "/practice/efficiency", title: "Compare efficiency", meta: "4 decisions" },
      { href: "/practice/algorithm-patterns", title: "Implement algorithm patterns", meta: "4 exercises" },
      { href: "/practice/challenge", title: "Take the 30-minute challenge", meta: "3 problems" },
    ],
  },
] as const;

export default async function PracticePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const [
    progress,
    savedProblems,
    reviewQueue,
    labProgress,
    capstoneSummary,
    mixedReviewResult,
  ] = await Promise.all([
    getCodingCatalogProgress(session?.user.id ?? null),
    session
      ? getCodingProblemBookmarksForStudent(session.user.id)
      : Promise.resolve([]),
    session
      ? getCodingMistakeReviewQueueForStudent(session.user.id)
      : Promise.resolve([]),
    session ? getJavaScriptLabCatalogProgress(session.user.id) : Promise.resolve(null),
      session
        ? getJavaScriptCapstoneSummary(session.user.id)
        : Promise.resolve(null),
      session
        ? getJavaScriptMixedReviewResultForStudent(session.user.id)
        : Promise.resolve(null),
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
  const foundationsEntry = getJavaScriptFoundationsEntry(
    labProgress,
    progress.completedCount,
  );
  const mixedReviewItems = labProgress
    ? buildJavaScriptMixedReviewSession(labProgress.labs)
    : [];
  const mixedReviewDue = isJavaScriptMixedReviewDue(mixedReviewResult);
  const foundationsStarted = (foundationsEntry?.completedCount ?? 0) > 0;
  const primaryActionLabel = session
    ? foundationsEntry
      ? foundationsStarted
        ? `Continue foundations · step ${foundationsEntry.nextExerciseNumber} of ${foundationsEntry.totalCount}`
        : "Start JavaScript foundations"
      : progress.completedCount === 0
        ? "Start problem 01"
      : nextProblemSlug
      ? `Continue at step ${primaryProblem.number} of ${progress.totalCount}`
      : "Review the six-step path"
    : `Start step 1 of ${progress.totalCount}`;
  const primaryActionHref =
    session && foundationsEntry
      ? foundationsEntry.href
      : `/practice/${primaryProblem.slug}`;

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
              href={primaryActionHref}
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
              <div className="practice-progress-links">
                <Link
                  className="practice-progress-link practice-skill-record-link"
                  href="/practice/progress"
                >
                  View private skill record <span aria-hidden="true">→</span>
                </Link>
                <Link
                  className="practice-progress-link practice-activity-link"
                  href="/practice/activity"
                >
                  View 28-day activity <span aria-hidden="true">→</span>
                </Link>
              </div>
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
            <section
              className="practice-learning-map"
              aria-labelledby="learning-map-title"
            >
              <div className="practice-learning-map-heading">
                <div>
                  <p className="eyebrow">Private practice labs</p>
                  <h2 id="learning-map-title">Choose the skill you need next.</h2>
                </div>
                <p>
                  Short browser-only labs give recovery after a miss. Saved
                  completion records practice, not judged mastery.
                </p>
              </div>

              <aside className="practice-readiness-entry">
                <div>
                  <small>Not sure which skill needs work?</small>
                  <strong>Check six core JavaScript concepts in five minutes.</strong>
                  <p>
                    Your first weak concept opens the exact guided lab that fits.
                    Only the final result saves.
                  </p>
                </div>
                <Link href="/practice/readiness">
                  Check my readiness <span aria-hidden="true">→</span>
                </Link>
              </aside>

              <Link
                className="practice-learning-start"
                href={labProgress?.nextHref ?? "/practice/foundations"}
              >
                <span>
                  <small>
                    Saved practice · {labProgress?.completedCount ?? 0}/{labProgress?.totalCount ?? 55} exercises
                  </small>
                  <strong>
                    {labProgress?.nextLabTitle
                      ? `Continue ${labProgress.nextLabTitle}, exercise ${labProgress.nextExerciseNumber}.`
                      : "Review the private JavaScript labs."}
                  </strong>
                </span>
                <span aria-hidden="true">→</span>
              </Link>

              {mixedReviewItems.length > 0 ? (
                <aside className="practice-mixed-review-entry">
                  <div>
                    <small>
                      {mixedReviewResult && !mixedReviewDue
                        ? `Spaced recall · next ${formatJavaScriptMixedReviewDueDate(mixedReviewResult.nextDueAt)}`
                        : "Spaced recall · completed labs only"}
                    </small>
                    <strong>
                      {mixedReviewResult && !mixedReviewDue
                        ? `Last review saved at ${mixedReviewResult.correctCount}/${mixedReviewResult.totalCount}.`
                        : `Bring ${mixedReviewItems.length} JavaScript concepts back at once.`}
                    </strong>
                    <p>
                      Answers stay in your browser. Only the bounded result and
                      next due date save, without changing judged mastery.
                    </p>
                  </div>
                  <Link href="/practice/mixed-review">
                    {mixedReviewResult && !mixedReviewDue
                      ? "View review schedule"
                      : mixedReviewResult
                        ? "Review due concepts"
                        : "Start spaced review"} <span aria-hidden="true">→</span>
                  </Link>
                </aside>
              ) : null}

              <div className="practice-learning-groups">
                {PRACTICE_LAB_GROUPS.map((group) => (
                  <section className="practice-learning-group" key={group.label}>
                    <div>
                      <h3>{group.label}</h3>
                      <p>{group.description}</p>
                    </div>
                    <div className="practice-learning-links">
                      {group.labs.map((lab) => (
                        <Link href={lab.href} key={lab.href}>
                          <span>
                            <strong>{lab.title}</strong>
                            <small>{lab.meta}</small>
                          </span>
                          <span aria-hidden="true">→</span>
                        </Link>
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              <Link
                className={`practice-capstone-entry ${
                  capstoneSummary?.state === "completed" ? "is-complete" : ""
                }`}
                href="/projects/javascript-expense-report"
              >
                <span className="practice-capstone-number" aria-hidden="true">
                  02
                </span>
                <span className="practice-capstone-copy">
                  <small>Private JavaScript capstone</small>
                  <strong>Build an expense report from raw data.</strong>
                  <span>
                    Combine parsing, arrays, objects, sorting, totals, and exact
                    output in one saved project.
                  </span>
                </span>
                <span className="practice-capstone-state">
                  <small>
                    {capstoneSummary?.state === "completed"
                      ? "Complete"
                      : capstoneSummary?.state === "in-progress"
                        ? "In progress"
                        : "Not started"}
                  </small>
                  <strong>{capstoneSummary?.passedChecks ?? 0}/6 outcomes</strong>
                  <span>
                    {capstoneSummary?.state === "completed"
                      ? "Review project"
                      : capstoneSummary?.state === "in-progress"
                        ? "Continue project"
                        : "Start project"}{" "}
                    <span aria-hidden="true">→</span>
                  </span>
                </span>
              </Link>

              <div className="practice-learning-playground">
                <p>
                  <strong>Need a blank canvas?</strong> Keep one private JavaScript
                  file outside the fixed exercises.
                </p>
                <Link href="/playground">
                  Open the playground <span aria-hidden="true">→</span>
                </Link>
              </div>
            </section>
          ) : null}
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
