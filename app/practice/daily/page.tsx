import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter, SiteNav, SkipLink } from "@/app/site-chrome";
import { getCodingCatalogProgress } from "@/db/coding-practice";
import { getDailyCodingChallengeCompletionForStudent } from "@/db/daily-coding-challenge";
import { auth } from "@/lib/auth";
import {
  formatDailyCodingChallengeDate,
  getDailyCodingChallenge,
  toUtcDateKey,
} from "@/lib/daily-coding-challenge";
import {
  getCodingProblem,
  getNextUnfinishedCodingProblemSlug,
} from "@/lib/coding-problems";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private daily JavaScript challenge | Lovable Original",
  description:
    "Solve one deterministic JavaScript problem each UTC day and save completion only after an Accepted result.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DailyCodingChallengePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(
      `/account?mode=signin&next=${encodeURIComponent("/practice/daily")}`,
    );
  }

  const now = new Date();
  const challengeDate = toUtcDateKey(now);
  const challenge = getDailyCodingChallenge(now);
  const [completion, progress] = await Promise.all([
    getDailyCodingChallengeCompletionForStudent(
      session.user.id,
      challengeDate,
    ),
    getCodingCatalogProgress(session.user.id),
  ]);
  const completedToday = completion?.problemSlug === challenge.slug;
  const nextProblemSlug = getNextUnfinishedCodingProblemSlug(
    progress.completedSlugs,
  );
  const nextProblem = nextProblemSlug ? getCodingProblem(nextProblemSlug) : null;
  const challengeHref = `/practice/${challenge.slug}?daily=${challengeDate}`;

  return (
    <>
      <SkipLink />
      <SiteNav currentPage="practice" studentSession />
      <main id="main-content" className="daily-challenge-shell">
        <nav className="daily-challenge-breadcrumb" aria-label="Breadcrumb">
          <Link href="/practice">JavaScript practice</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Daily challenge</span>
        </nav>

        <section className="daily-challenge-hero" aria-labelledby="daily-title">
          <div className="daily-challenge-copy">
            <p className="eyebrow">Private daily challenge · UTC</p>
            <h1 id="daily-title">One focused problem for today.</h1>
            <p>
              Everyone gets the same JavaScript problem on {formatDailyCodingChallengeDate(challengeDate)}.
              Your account records today only after today’s problem earns an Accepted result.
            </p>
            <Link className="primary-action" href={challengeHref}>
              {completedToday ? "Review today’s problem" : "Start today’s problem"}{" "}
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <aside
            className={`daily-challenge-status${completedToday ? " is-complete" : ""}`}
            aria-label="Today’s challenge status"
          >
            <span>{completedToday ? "Completed today" : "Ready today"}</span>
            <strong>{String(challenge.number).padStart(2, "0")}</strong>
            <p>{completedToday ? "Accepted and saved to your account." : "Not completed yet."}</p>
          </aside>
        </section>

        <section className="daily-challenge-problem" aria-labelledby="daily-problem-title">
          <div>
            <p className="eyebrow">Today’s problem</p>
            <h2 id="daily-problem-title">{challenge.title}</h2>
            <p>{challenge.statement}</p>
          </div>
          <dl>
            <div>
              <dt>Concept</dt>
              <dd>{challenge.skill}</dd>
            </div>
            <div>
              <dt>Difficulty</dt>
              <dd>{challenge.difficulty}</dd>
            </div>
            <div>
              <dt>Checks</dt>
              <dd>{challenge.tests.length} deterministic</dd>
            </div>
          </dl>
        </section>

        <aside className="daily-challenge-normal-path">
          <div>
            <span>Your ordered path stays separate</span>
            <p>
              Daily completion does not replace your exact next unfinished step.
            </p>
          </div>
          <Link href={nextProblem ? `/practice/${nextProblem.slug}` : "/practice"}>
            {nextProblem
              ? `Continue at problem ${String(nextProblem.number).padStart(2, "0")}`
              : "Review the completed path"}{" "}
            <span aria-hidden="true">→</span>
          </Link>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
