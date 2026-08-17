import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import {
  PracticeCatalogSearchControl,
  PracticeCatalogSearchGroup,
  PracticeCatalogSearchItem,
  PracticeCatalogSearchProvider,
} from "@/components/practice-catalog-search";
import {
  getCodingCatalogProgress,
  getCodingMistakeReviewQueueForStudent,
  getCodingProblemBookmarksForStudent,
} from "@/db/coding-practice";
import { getJavaScriptLabCatalogProgress } from "@/db/javascript-lab-progress";
import { getJavaScriptCapstoneSummary } from "@/db/javascript-capstone";
import { getJavaScriptMixedReviewResultForStudent } from "@/db/javascript-mixed-review";
import { auth } from "@/lib/auth";
import {
  getJavaScriptLabCatalogSearchText,
  getJavaScriptFoundationsEntry,
  type JavaScriptLabCatalogProgress,
  type JavaScriptLabSlug,
} from "@/lib/javascript-lab-progress";
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
    "Solve 12 free JavaScript problems with instant browser-run verdicts and saved progress.",
  alternates: {
    canonical: "/practice",
  },
};

const PRACTICE_LAB_GROUPS = [
  {
    label: "Reason about code",
    description: "Read, repair, and test small programs before you rely on a judge.",
    labs: [
      {
        slug: "tracing",
        href: "/practice/tracing",
        title: "Trace values",
        meta: "4 predictions",
      },
      {
        slug: "debugging",
        href: "/practice/debugging",
        title: "Repair defects",
        meta: "3 drills",
      },
      {
        slug: "test-design",
        href: "/practice/test-design",
        title: "Find edge cases",
        meta: "4 decisions",
      },
    ],
  },
  {
    label: "Build with JavaScript",
    description: "Strengthen the language and browser skills behind larger solutions.",
    labs: [
      {
        slug: "data-structures",
        href: "/practice/data-structures",
        title: "Use data structures",
        meta: "4 exercises",
      },
      {
        slug: "functions",
        href: "/practice/functions",
        title: "Practice functions and scope",
        meta: "4 exercises",
      },
      {
        slug: "recursion",
        href: "/practice/recursion",
        title: "Practice recursion",
        meta: "4 exercises",
      },
      {
        slug: "search-sort",
        href: "/practice/search-sort",
        title: "Search and sort values",
        meta: "4 exercises",
      },
      {
        slug: "stacks-queues",
        href: "/practice/stacks-queues",
        title: "Use stacks and queues",
        meta: "4 exercises",
      },
      {
        slug: "linked-lists",
        href: "/practice/linked-lists",
        title: "Follow linked lists",
        meta: "4 exercises",
      },
      {
        slug: "trees-graphs",
        href: "/practice/trees-graphs",
        title: "Traverse trees and graphs",
        meta: "4 exercises",
      },
      {
        slug: "dom",
        href: "/practice/dom",
        title: "Work with the DOM",
        meta: "4 exercises",
      },
    ],
  },
  {
    label: "Solve with intent",
    description: "Choose a better approach, then bring it into a focused judged set.",
    labs: [
      {
        slug: "efficiency",
        href: "/practice/efficiency",
        title: "Compare efficiency",
        meta: "4 decisions",
      },
      {
        slug: "algorithm-patterns",
        href: "/practice/algorithm-patterns",
        title: "Implement algorithm patterns",
        meta: "4 exercises",
      },
      {
        slug: null,
        href: "/practice/challenge",
        title: "Take the 30-minute challenge",
        meta: "4 timed sets",
      },
    ],
  },
] as const;

const CODING_PROBLEM_GROUPS = [
  {
    key: "foundations",
    label: "Language foundations",
    description: "Parse input, choose a branch, and control a loop.",
    firstProblem: 1,
    lastProblem: 3,
  },
  {
    key: "data-iteration",
    label: "Data and iteration",
    description: "Traverse arrays and strings, then combine simple rules.",
    firstProblem: 4,
    lastProblem: 6,
  },
  {
    key: "collections",
    label: "Collections and structure",
    description: "Track membership, preserve order, and use a stack.",
    firstProblem: 7,
    lastProblem: 9,
  },
  {
    key: "search-patterns",
    label: "Search patterns",
    description: "Count occurrences, narrow a range, and maintain a window.",
    firstProblem: 10,
    lastProblem: 12,
  },
] as const;

type CatalogStatus = "all" | "unfinished" | "accepted";
type LabCatalogStatus = "all" | "unfinished" | "completed";
type PracticeLabProgress = JavaScriptLabCatalogProgress["labs"][number];

type PracticePageProps = {
  searchParams?: Promise<{
    labs?: string | string[];
    status?: string | string[];
  }>;
};

function normalizeCatalogStatus(status: string | string[] | undefined) {
  return status === "unfinished" || status === "accepted" ? status : "all";
}

function normalizeLabCatalogStatus(status: string | string[] | undefined) {
  return status === "unfinished" || status === "completed" ? status : "all";
}

function getPracticeLabCardCopy(progress: PracticeLabProgress) {
  if (progress.state === "complete") {
    return {
      action: "Review",
      status: `${progress.completedCount} of ${progress.totalCount} saved · complete`,
    };
  }

  if (progress.state === "in-progress") {
    return {
      action: "Resume",
      status: `${progress.completedCount} of ${progress.totalCount} saved · resume exercise ${progress.nextExerciseNumber}`,
    };
  }

  return {
    action: "Start",
    status: `0 of ${progress.totalCount} saved · start exercise 1`,
  };
}

export default async function PracticePage({
  searchParams,
}: PracticePageProps = {}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const resolvedSearchParams = await searchParams;
  const requestedCatalogStatus = normalizeCatalogStatus(
    resolvedSearchParams?.status,
  );
  const requestedLabCatalogStatus = normalizeLabCatalogStatus(
    resolvedSearchParams?.labs,
  );
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
  const catalogStatus: CatalogStatus = session
    ? requestedCatalogStatus
    : "all";
  const labCatalogStatus: LabCatalogStatus = session
    ? requestedLabCatalogStatus
    : "all";
  const unfinishedCount = progress.totalCount - progress.completedCount;
  const labProgressBySlug = new Map<JavaScriptLabSlug, PracticeLabProgress>(
    labProgress?.labs.map((lab) => [lab.slug, lab]) ?? [],
  );
  const catalogLabSlugs = PRACTICE_LAB_GROUPS.flatMap((group) =>
    group.labs.flatMap((lab) => (lab.slug ? [lab.slug] : [])),
  );
  const completedLabCount = catalogLabSlugs.filter(
    (slug) => labProgressBySlug.get(slug)?.state === "complete",
  ).length;
  const unfinishedLabCount = catalogLabSlugs.length - completedLabCount;
  const labCatalogFilters: Array<{
    status: LabCatalogStatus;
    label: string;
    count: number;
    href: string;
  }> = [
    {
      status: "all",
      label: "All labs",
      count: catalogLabSlugs.length,
      href: "/practice#guided-labs",
    },
    {
      status: "unfinished",
      label: "To do",
      count: unfinishedLabCount,
      href: "/practice?labs=unfinished#guided-labs",
    },
    {
      status: "completed",
      label: "Completed",
      count: completedLabCount,
      href: "/practice?labs=completed#guided-labs",
    },
  ];
  const visibleLabGroups = PRACTICE_LAB_GROUPS.map((group) => ({
    ...group,
    labs: group.labs.filter((lab) => {
      if (!lab.slug) {
        return labCatalogStatus === "all";
      }

      const labState = labProgressBySlug.get(lab.slug)?.state;
      return (
        labCatalogStatus === "all" ||
        (labCatalogStatus === "completed"
          ? labState === "complete"
          : labState !== "complete")
      );
    }),
  })).filter((group) => group.labs.length > 0);
  const catalogFilters: Array<{
    status: CatalogStatus;
    label: string;
    count: number;
    href: string;
  }> = [
    {
      status: "all",
      label: "All",
      count: progress.totalCount,
      href: "/practice",
    },
    {
      status: "unfinished",
      label: "Unfinished",
      count: unfinishedCount,
      href: "/practice?status=unfinished",
    },
    {
      status: "accepted",
      label: "Accepted",
      count: progress.completedCount,
      href: "/practice?status=accepted",
    },
  ];
  const visibleProblemGroups = CODING_PROBLEM_GROUPS.map((group) => {
    const stageProblems = CODING_PROBLEMS.filter(
      (problem) =>
        problem.number >= group.firstProblem &&
        problem.number <= group.lastProblem,
    );

    return {
      ...group,
      acceptedCount: stageProblems.filter((problem) =>
        completedSlugs.has(problem.slug),
      ).length,
      totalCount: stageProblems.length,
      problems: stageProblems.filter(
        (problem) =>
          catalogStatus === "all" ||
          (catalogStatus === "accepted"
            ? completedSlugs.has(problem.slug)
            : !completedSlugs.has(problem.slug)),
      ),
    };
  }).filter((group) => group.problems.length > 0);
  const visibleProblemCount = visibleProblemGroups.reduce(
    (count, group) => count + group.problems.length,
    0,
  );
  const visibleProblemSearchTexts = visibleProblemGroups.flatMap((group) =>
    group.problems.map(
      (problem) =>
        `${problem.title} ${problem.skill} ${problem.acceptedExplanation.concept}`,
    ),
  );
  const visibleLabSearchTexts = visibleLabGroups.flatMap((group) =>
    group.labs.flatMap((lab) =>
      lab.slug
        ? [`${lab.title} ${getJavaScriptLabCatalogSearchText(lab.slug)}`]
        : [],
    ),
  );
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
      : "Review the 12-problem path"
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
            <h1 id="practice-title">Twelve problems. One ordered path.</h1>
            <p>
              Start with input handling, then progress through stacks, search,
              and sliding windows. Run every solution in your browser, submit
              against deterministic checks, and return to your next unfinished step.
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
                  ? "Twelve-problem path complete. Every Accepted result is saved."
                  : "Complete all 12 problems. Accepted results stay attached to your account."
                : "Create a free account to save code, attempts, and accepted results."}
            </p>
            {session ? (
              <div className="practice-progress-links">
                <Link
                  className="practice-progress-link practice-daily-link"
                  href="/practice/daily"
                >
                  Open today’s challenge <span aria-hidden="true">→</span>
                </Link>
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

        <PracticeCatalogSearchProvider>
          <section className="problem-catalog" aria-labelledby="catalog-title">
          <div className="problem-catalog-heading">
            <div>
              <p className="eyebrow">12-problem path · JavaScript</p>
              <h2 id="catalog-title">
                Build from input handling to sliding windows.
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

          {session ? (
            <PracticeCatalogSearchControl
              labSearchTexts={visibleLabSearchTexts}
              problemSearchTexts={visibleProblemSearchTexts}
            />
          ) : null}

          {session ? (
            <nav className="problem-catalog-filters" aria-label="Filter problems">
              {catalogFilters.map((filter) => (
                <Link
                  aria-current={
                    catalogStatus === filter.status ? "page" : undefined
                  }
                  className={
                    catalogStatus === filter.status ? "is-active" : undefined
                  }
                  href={filter.href}
                  key={filter.status}
                >
                  {filter.label} <span>{filter.count}</span>
                </Link>
              ))}
            </nav>
          ) : null}

          {visibleProblemCount > 0 ? (
            <div className="problem-groups">
              {visibleProblemGroups.map((group) => (
                <PracticeCatalogSearchGroup
                  key={group.key}
                  searchTexts={group.problems.map(
                    (problem) =>
                      `${problem.title} ${problem.skill} ${problem.acceptedExplanation.concept}`,
                  )}
                >
                  <section
                    className="problem-group"
                    aria-labelledby={`problem-group-${group.key}`}
                  >
                    <div className="problem-group-heading">
                      <div>
                        <h3 id={`problem-group-${group.key}`}>{group.label}</h3>
                        <p>{group.description}</p>
                      </div>
                      <div className="problem-group-meta">
                        <span>
                          {String(group.firstProblem).padStart(2, "0")}–
                          {String(group.lastProblem).padStart(2, "0")}
                        </span>
                        {session ? (
                          <span className="problem-group-progress">
                            Stage progress · {group.acceptedCount} of{" "}
                            {group.totalCount} Accepted
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="problem-table" role="list">
                      {group.problems.map((problem) => {
                        const completed = completedSlugs.has(problem.slug);
                        const searchText = `${problem.title} ${problem.skill} ${problem.acceptedExplanation.concept}`;

                        return (
                          <PracticeCatalogSearchItem
                            key={problem.slug}
                            searchText={searchText}
                          >
                            <Link
                              className={
                                completed
                                  ? "problem-row is-complete"
                                  : "problem-row"
                              }
                              href={`/practice/${problem.slug}`}
                              role="listitem"
                            >
                              <span className="problem-number">
                                {String(problem.number).padStart(2, "0")}
                              </span>
                              <span className="problem-row-copy">
                                <strong>{problem.title}</strong>
                                <small>{problem.skill}</small>
                              </span>
                              <span className="problem-difficulty">
                                {problem.difficulty}
                              </span>
                              <span className="problem-state">
                                {completed ? "Accepted" : "Open"}
                              </span>
                              <span className="problem-arrow" aria-hidden="true">
                                →
                              </span>
                            </Link>
                          </PracticeCatalogSearchItem>
                        );
                      })}
                    </div>
                  </section>
                </PracticeCatalogSearchGroup>
              ))}
            </div>
          ) : (
            <div className="problem-catalog-empty">
              <strong>
                {catalogStatus === "accepted"
                  ? "No Accepted problems yet."
                  : "Every problem is Accepted."}
              </strong>
              <p>
                {catalogStatus === "accepted"
                  ? "Your first saved Accepted result will appear here."
                  : "Use the All view whenever you want to revisit the path."}
              </p>
              <Link href="/practice">Show all 12 problems</Link>
            </div>
          )}

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

              <nav
                className="practice-lab-filters"
                aria-label="Filter guided labs"
                id="guided-labs"
              >
                {labCatalogFilters.map((filter) => (
                  <Link
                    aria-current={
                      labCatalogStatus === filter.status ? "page" : undefined
                    }
                    className={
                      labCatalogStatus === filter.status ? "is-active" : undefined
                    }
                    href={filter.href}
                    key={filter.status}
                  >
                    {filter.label} <span>{filter.count}</span>
                  </Link>
                ))}
              </nav>

              {visibleLabGroups.length > 0 ? (
                <div className="practice-learning-groups">
                  {visibleLabGroups.map((group) => (
                    <PracticeCatalogSearchGroup
                      key={group.label}
                      searchTexts={group.labs.flatMap((lab) =>
                        lab.slug
                          ? [
                              `${lab.title} ${getJavaScriptLabCatalogSearchText(lab.slug)}`,
                            ]
                          : [],
                      )}
                    >
                      <section className="practice-learning-group">
                        <div>
                          <h3>{group.label}</h3>
                          <p>{group.description}</p>
                        </div>
                        <div className="practice-learning-links">
                          {group.labs.map((lab) => {
                            const savedProgress = lab.slug
                              ? labProgressBySlug.get(lab.slug)
                              : null;
                            const cardCopy = savedProgress
                              ? getPracticeLabCardCopy(savedProgress)
                              : null;
                            const progressPercent = savedProgress
                              ? Math.round(
                                  (savedProgress.completedCount /
                                    savedProgress.totalCount) * 100,
                                )
                              : 0;
                            const searchText = lab.slug
                              ? `${lab.title} ${getJavaScriptLabCatalogSearchText(lab.slug)}`
                              : "";

                            return (
                              <PracticeCatalogSearchItem
                                key={lab.href}
                                searchText={searchText}
                              >
                                <Link
                                  aria-label={
                                    savedProgress && cardCopy
                                      ? `${cardCopy.action} ${lab.title}. ${cardCopy.status}.`
                                      : undefined
                                  }
                                  className={
                                    savedProgress
                                      ? `is-${savedProgress.state}`
                                      : undefined
                                  }
                                  href={savedProgress?.href ?? lab.href}
                                >
                                  <span className="practice-learning-lab-copy">
                                    <strong>{lab.title}</strong>
                                    <small>{cardCopy?.status ?? lab.meta}</small>
                                    {savedProgress ? (
                                      <span
                                        aria-label={`${lab.title}: ${savedProgress.completedCount} of ${savedProgress.totalCount} saved`}
                                        aria-valuemax={savedProgress.totalCount}
                                        aria-valuemin={0}
                                        aria-valuenow={savedProgress.completedCount}
                                        className="practice-learning-lab-track"
                                        role="progressbar"
                                      >
                                        <span
                                          style={{ width: `${progressPercent}%` }}
                                        />
                                      </span>
                                    ) : null}
                                  </span>
                                  <span className="practice-learning-lab-action">
                                    {cardCopy?.action ?? "Open"}{" "}
                                    <span aria-hidden="true">→</span>
                                  </span>
                                </Link>
                              </PracticeCatalogSearchItem>
                            );
                          })}
                        </div>
                      </section>
                    </PracticeCatalogSearchGroup>
                  ))}
                </div>
              ) : (
                <div className="practice-lab-filter-empty">
                  <strong>No completed guided labs yet.</strong>
                  <p>Your first finished lab will appear here automatically.</p>
                  <Link href="/practice#guided-labs">Show all 13 labs</Link>
                </div>
              )}

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
        </PracticeCatalogSearchProvider>
      </div>
      <SiteFooter />
    </main>
  );
}
