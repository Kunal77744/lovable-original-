import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ProblemDebrief } from "@/components/problem-debrief";
import { getCodingProblemForStudent } from "@/db/coding-practice";
import { getSignInHref } from "@/lib/account-destination";
import { auth } from "@/lib/auth";
import { getCodingProblem } from "@/lib/coding-problems";
import { SiteFooter, SiteNav } from "../../../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript problem debrief | Lovable Original",
  description:
    "Rehearse the reasoning and saved evidence behind an Accepted JavaScript problem.",
  robots: {
    index: false,
    follow: false,
  },
};

type ProblemDebriefPageProps = {
  params: Promise<{ problemSlug: string }>;
};

export default async function ProblemDebriefPage({
  params,
}: ProblemDebriefPageProps) {
  const { problemSlug } = await params;
  const problem = getCodingProblem(problemSlug);

  if (!problem) notFound();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(getSignInHref(`/practice/${problemSlug}/debrief`));
  }

  const studentState = await getCodingProblemForStudent(
    session.user.id,
    problemSlug,
  );

  if (!studentState) notFound();

  const acceptedCode = studentState.latestAcceptedCode;

  if (studentState.bestVerdict !== "Accepted" || !acceptedCode) {
    return (
      <main>
        <SiteNav currentPage="practice" studentSession />
        <section
          className="project-debrief-locked"
          id="main-content"
          tabIndex={-1}
          aria-labelledby="problem-debrief-locked-title"
        >
          <div className="project-debrief-lock-mark" aria-hidden="true">
            ✓
          </div>
          <p className="eyebrow">Private problem debrief</p>
          <h1 id="problem-debrief-locked-title">Reach Accepted first.</h1>
          <p>
            Pass all {problem.tests.length} checks for {problem.title}. The
            debrief will then turn the saved result into a walkthrough,
            interview rehearsal, and exact source review.
          </p>
          <Link className="primary-action" href={`/practice/${problem.slug}`}>
            Continue the problem <span aria-hidden="true">→</span>
          </Link>
        </section>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="project-debrief-page problem-debrief-page">
      <div className="project-debrief-screen-only">
        <SiteNav currentPage="practice" studentSession />
      </div>
      <ProblemDebrief
        problem={problem}
        acceptedCode={acceptedCode}
        solutionNote={studentState.solutionNote}
      />
      <div className="project-debrief-screen-only">
        <SiteFooter />
      </div>
    </main>
  );
}
