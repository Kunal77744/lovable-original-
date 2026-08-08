import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CodingWorkspace } from "@/components/coding-workspace";
import { ProblemBookmarkButton } from "@/components/problem-bookmark-button";
import { PracticeProblemStartTracker } from "@/components/practice-problem-start-tracker";
import {
  getCodingProblemBookmarkForStudent,
  getCodingProblemForStudent,
  getCodingSubmissionForStudent,
  getPracticeFeedbackForStudent,
} from "@/db/coding-practice";
import { auth } from "@/lib/auth";
import {
  formatDailyCodingChallengeDate,
  isCurrentDailyCodingChallenge,
} from "@/lib/daily-coding-challenge";
import {
  CODING_PROBLEM_COUNT,
  CODING_PROBLEMS,
  getCodingProblem,
  getCodingProblemPreview,
} from "@/lib/coding-problems";
import { SiteFooter, SiteNav } from "../../site-chrome";

export const dynamic = "force-dynamic";

type ProblemPageProps = {
  params: Promise<{ problemSlug: string }>;
  searchParams?: Promise<{
    review?: string | string[];
    submission?: string | string[];
    daily?: string | string[];
  }>;
};

export async function generateMetadata({
  params,
}: ProblemPageProps): Promise<Metadata> {
  const { problemSlug } = await params;
  const problem = getCodingProblem(problemSlug);
  const preview = getCodingProblemPreview(problemSlug);

  if (!problem || !preview) {
    return { title: "Problem not found | Lovable Original" };
  }

  return {
    ...preview,
    alternates: {
      canonical: `/practice/${problem.slug}`,
    },
  };
}

export default async function ProblemPage({ params, searchParams }: ProblemPageProps) {
  const { problemSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const submissionParam = resolvedSearchParams?.submission;
  const requestedSubmissionId =
    typeof submissionParam === "string" ? submissionParam : null;
  const reviewParam = resolvedSearchParams?.review;
  const dailyParam = resolvedSearchParams?.daily;
  const problem = getCodingProblem(problemSlug);

  if (!problem) notFound();

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const [studentState, isBookmarked, requestedSubmission] = await Promise.all([
    getCodingProblemForStudent(session?.user.id ?? null, problemSlug),
    session
      ? getCodingProblemBookmarkForStudent(session.user.id, problemSlug)
      : Promise.resolve(false),
    session && requestedSubmissionId
      ? getCodingSubmissionForStudent(session.user.id, requestedSubmissionId)
      : Promise.resolve(null),
  ]);

  if (!studentState) notFound();

  const practiceFeedbackState = session
    ? await getPracticeFeedbackForStudent(session.user.id, problemSlug)
    : { isEligible: false, feedback: null };

  if (!practiceFeedbackState) notFound();

  const isReviewSession = Boolean(session) && reviewParam === "1";
  const dailyChallengeDate =
    session &&
    typeof dailyParam === "string" &&
    isCurrentDailyCodingChallenge({
      dateKey: dailyParam,
      problemSlug,
    })
      ? dailyParam
      : null;
  const isDailyChallenge = Boolean(dailyChallengeDate);

  const previousProblem = CODING_PROBLEMS[problem.number - 2] ?? null;
  const nextProblem = CODING_PROBLEMS[problem.number] ?? null;
  const loadedSubmission =
    requestedSubmission?.problemSlug === problemSlug &&
    requestedSubmission.code !== null
      ? {
          id: requestedSubmission.id,
          code: requestedSubmission.code,
          createdAt: requestedSubmission.createdAt,
          verdict: requestedSubmission.verdict,
          passedTests: requestedSubmission.passedTests,
          totalTests: requestedSubmission.totalTests,
        }
      : null;

  return (
    <main>
      {problem.number === 1 ? (
        <PracticeProblemStartTracker problemSlug={problem.slug} />
      ) : null}
      <SiteNav currentPage="practice" studentSession={Boolean(session)} />
      <div
        className="coding-problem-shell"
        id="main-content"
        tabIndex={-1}
      >
        <nav className="problem-breadcrumbs" aria-label="Problem navigation">
          <Link
            href={
              isDailyChallenge
                ? "/practice/daily"
                : isReviewSession
                  ? "/practice/review"
                  : "/practice"
            }
          >
            {isDailyChallenge
              ? "Daily challenge"
              : isReviewSession
                ? "Private review session"
                : "Practice arena"}
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="step">
            Step {problem.number} of {CODING_PROBLEM_COUNT}
          </span>
        </nav>

        <div className="coding-problem-layout">
          <article className="problem-brief">
            <div className="problem-brief-heading">
              <p className="eyebrow">
                Step {problem.number} of {CODING_PROBLEM_COUNT} · {problem.skill}
              </p>
              {dailyChallengeDate ? (
                <p className="daily-problem-context">
                  Daily challenge · {formatDailyCodingChallengeDate(dailyChallengeDate)} UTC
                </p>
              ) : null}
              <h1>{problem.title}</h1>
              <div className="problem-meta">
                <span>{problem.difficulty}</span>
                <span>JavaScript</span>
                <span>1,000 ms</span>
              </div>
              {session ? (
                <ProblemBookmarkButton
                  initialBookmarked={Boolean(isBookmarked)}
                  problemSlug={problem.slug}
                  problemTitle={problem.title}
                />
              ) : null}
            </div>

            <section>
              <h2>Problem</h2>
              <p>{problem.statement}</p>
            </section>
            <section>
              <h2>Input</h2>
              <p>{problem.inputFormat}</p>
            </section>
            <section>
              <h2>Output</h2>
              <p>{problem.outputFormat}</p>
            </section>
            <section>
              <h2>Examples</h2>
              <div className="problem-examples">
                {problem.examples.map((example, index) => (
                  <div className="problem-example" key={`${example.input}-${index}`}>
                    <div>
                      <span>Input</span>
                      <pre>{example.input}</pre>
                    </div>
                    <div>
                      <span>Output</span>
                      <pre>{example.output}</pre>
                    </div>
                    <p>{example.explanation}</p>
                  </div>
                ))}
              </div>
            </section>
          </article>

          <CodingWorkspace
            key={loadedSubmission?.id ?? "current-editor"}
            attempts={studentState.attempts}
            bestVerdict={studentState.bestVerdict}
            initialCode={loadedSubmission?.code ?? studentState.code}
            initialAcceptedCode={
              loadedSubmission
                ? loadedSubmission.verdict === "Accepted"
                  ? loadedSubmission.code
                  : null
                : studentState.latestAcceptedCode
            }
            initialCustomTestCases={studentState.customTestCases}
            initialPracticeFeedback={practiceFeedbackState.feedback}
            initialSolutionNote={studentState.solutionNote}
            isSignedIn={Boolean(session)}
            isPracticeFeedbackEligible={practiceFeedbackState.isEligible}
            isReviewSession={isReviewSession}
            dailyChallengeDate={dailyChallengeDate}
            loadedSubmission={loadedSubmission}
            problem={{
              slug: problem.slug,
              title: problem.title,
              recoveryHint: problem.recoveryHint,
              recoveryHints: problem.recoveryHints,
              acceptedExplanation: problem.acceptedExplanation,
              starterCode: problem.starterCode,
              tests: problem.tests.map((test) => ({ input: test.input })),
              example: {
                input: problem.examples[0].input,
                expectedOutput: problem.examples[0].output,
              },
            }}
          />
        </div>

        <nav className="problem-step-navigation" aria-label="Adjacent problems">
          {previousProblem ? (
            <Link href={`/practice/${previousProblem.slug}`}>
              <span>Previous step</span>
              <strong>{previousProblem.title}</strong>
            </Link>
          ) : (
            <span />
          )}
          {nextProblem ? (
            <Link href={`/practice/${nextProblem.slug}`}>
              <span>Next step</span>
              <strong>{nextProblem.title}</strong>
            </Link>
          ) : (
            <Link href="/practice">
              <span>Path complete</span>
              <strong>Back to the arena</strong>
            </Link>
          )}
        </nav>
      </div>
      <SiteFooter />
    </main>
  );
}
