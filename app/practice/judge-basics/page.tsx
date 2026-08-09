import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { JavaScriptJudgeBasics } from "@/components/javascript-judge-basics";
import { getCompletedJavaScriptLabExerciseIds } from "@/db/javascript-lab-progress";
import { auth } from "@/lib/auth";
import {
  JAVASCRIPT_FOUNDATIONS_UNIT_STEPS,
  JAVASCRIPT_JUDGE_CONTRACT_EXERCISE_ID,
} from "@/lib/javascript-foundations";
import { SiteFooter, SiteNav } from "../../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript judge basics | Lovable Original",
  description:
    "Follow one input through solve(input), number parsing, and exact returned output before judged JavaScript practice.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function JavaScriptJudgeBasicsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/account?mode=signin&next=/practice/judge-basics");
    return null;
  }

  const completedExerciseIds = await getCompletedJavaScriptLabExerciseIds(
    session.user.id,
    "foundations",
  );

  return (
    <main>
      <SiteNav currentPage="practice" studentSession />
      <div className="judge-basics-shell" id="main-content" tabIndex={-1}>
        <nav className="problem-breadcrumbs" aria-label="Judge lesson navigation">
          <Link href="/practice">Practice arena</Link>
          <span aria-hidden="true">/</span>
          <span>How the judge works</span>
        </nav>

        <header className="judge-basics-hero">
          <div>
            <p className="eyebrow">JavaScript foundations · step 1 of 4</p>
            <h1>Follow one value through the judge.</h1>
          </div>
          <div className="judge-unit-summary">
            <p>
              The judge calls one function with text, then compares the returned
              text with the expected answer. Finish this checkpoint to save step 1.
            </p>
            <ol aria-label="JavaScript foundations unit">
              {JAVASCRIPT_FOUNDATIONS_UNIT_STEPS.map((step) => (
                <li
                  className={
                    step.id === JAVASCRIPT_JUDGE_CONTRACT_EXERCISE_ID
                      ? "is-current"
                      : undefined
                  }
                  aria-current={
                    step.id === JAVASCRIPT_JUDGE_CONTRACT_EXERCISE_ID
                      ? "step"
                      : undefined
                  }
                  key={step.id}
                >
                  <span>{String(step.number).padStart(2, "0")}</span>
                  <strong>{step.concept}</strong>
                </li>
              ))}
            </ol>
          </div>
        </header>

        <JavaScriptJudgeBasics
          initialCompleted={completedExerciseIds.includes(
            JAVASCRIPT_JUDGE_CONTRACT_EXERCISE_ID,
          )}
        />
      </div>
      <SiteFooter />
    </main>
  );
}
