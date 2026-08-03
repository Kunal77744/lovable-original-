import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CssChallengeWorkspace } from "@/components/css-challenge-workspace";
import {
  getCssPracticeCatalogProgress,
  getCssPracticeChallengeForStudent,
  getCssPracticePathFeedbackForStudent,
} from "@/db/css-practice";
import { auth } from "@/lib/auth";
import {
  CSS_PRACTICE_CHALLENGE_COUNT,
  CSS_PRACTICE_CHALLENGES,
  getCssPracticeChallenge,
  gradeCssPracticeChallenge,
} from "@/lib/css-practice-challenges";
import { SiteFooter, SiteNav } from "../../../site-chrome";

export const dynamic = "force-dynamic";

type CssChallengePageProps = {
  params: Promise<{ challengeSlug: string }>;
};

export async function generateMetadata({
  params,
}: CssChallengePageProps): Promise<Metadata> {
  const { challengeSlug } = await params;
  const challenge = getCssPracticeChallenge(challengeSlug);

  if (!challenge) {
    return { title: "CSS challenge not found | Lovable Original" };
  }

  return {
    title: `${challenge.title} CSS practice | Lovable Original`,
    description: `${challenge.outcome} Get deterministic CSS feedback and save your exact attempt after sign-in.`,
    alternates: { canonical: `/practice/css/${challenge.slug}` },
  };
}

export default async function CssChallengePage({
  params,
}: CssChallengePageProps) {
  const { challengeSlug } = await params;
  const challenge = getCssPracticeChallenge(challengeSlug);

  if (!challenge) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  const [studentState, catalogProgress] = await Promise.all([
    getCssPracticeChallengeForStudent(session?.user.id ?? null, challengeSlug),
    getCssPracticeCatalogProgress(session?.user.id ?? null),
  ]);
  const pathFeedbackState = session
    ? await getCssPracticePathFeedbackForStudent(session.user.id)
    : { isEligible: false, feedback: null };

  if (!studentState) notFound();

  const previousChallenge =
    CSS_PRACTICE_CHALLENGES[challenge.number - 2] ?? null;
  const nextChallenge = CSS_PRACTICE_CHALLENGES[challenge.number] ?? null;
  const checks = gradeCssPracticeChallenge(challenge.slug, studentState.css);

  if (!checks) notFound();

  return (
    <main>
      <SiteNav currentPage="practice" studentSession={Boolean(session)} />
      <div className="css-challenge-shell" id="main-content" tabIndex={-1}>
        <nav
          className="problem-breadcrumbs"
          aria-label="CSS challenge navigation"
        >
          <Link href="/practice/css">CSS practice</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="step">
            Step {challenge.number} of {CSS_PRACTICE_CHALLENGE_COUNT}
          </span>
        </nav>

        <header className="css-challenge-brief">
          <div>
            <p className="eyebrow">
              Step {challenge.number} of {CSS_PRACTICE_CHALLENGE_COUNT} ·{" "}
              {challenge.skill}
            </p>
            <h1>{challenge.title}</h1>
            <p>{challenge.brief}</p>
          </div>
          <div className="css-challenge-outcome">
            <span>Done looks like</span>
            <strong>{challenge.outcome}</strong>
          </div>
        </header>

        <CssChallengeWorkspace
          attempts={studentState.attempts}
          bestVerdict={studentState.bestVerdict}
          challenge={{ slug: challenge.slug, title: challenge.title, checks }}
          initialCss={studentState.css}
          initialPathFeedback={pathFeedbackState.feedback}
          isSignedIn={Boolean(session)}
          isPathFeedbackEligible={pathFeedbackState.isEligible}
          nextChallengeSlug={catalogProgress.nextChallengeSlug}
        />

        <nav
          className="problem-step-navigation"
          aria-label="Adjacent CSS challenges"
        >
          {previousChallenge ? (
            <Link href={`/practice/css/${previousChallenge.slug}`}>
              <span>Previous step</span>
              <strong>{previousChallenge.title}</strong>
            </Link>
          ) : (
            <span />
          )}
          {nextChallenge ? (
            <Link href={`/practice/css/${nextChallenge.slug}`}>
              <span>Next step</span>
              <strong>{nextChallenge.title}</strong>
            </Link>
          ) : (
            <Link href="/practice/css">
              <span>Path complete</span>
              <strong>Review CSS practice</strong>
            </Link>
          )}
        </nav>
      </div>
      <SiteFooter />
    </main>
  );
}
