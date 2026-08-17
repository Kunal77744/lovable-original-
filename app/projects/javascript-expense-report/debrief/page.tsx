import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PrintProjectDebriefButton } from "@/components/print-project-debrief-button";
import { getJavaScriptCapstoneForStudent } from "@/db/javascript-capstone";
import { auth } from "@/lib/auth";
import { getSignInHref } from "@/lib/account-destination";
import { JAVASCRIPT_CAPSTONE_TITLE } from "@/lib/javascript-capstone";
import { SiteFooter, SiteNav } from "../../../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private JavaScript project debrief | Lovable Original",
  description:
    "Review the evidence, architecture, and interview prompts behind your completed JavaScript expense report.",
  robots: {
    index: false,
    follow: false,
  },
};

const ARCHITECTURE_STAGES = [
  {
    number: "01",
    title: "Parse the rows",
    detail:
      "Turn each non-empty line into a category, description, and numeric amount.",
  },
  {
    number: "02",
    title: "Build the report data",
    detail:
      "Accumulate the total, group amounts by category, and track the largest expense.",
  },
  {
    number: "03",
    title: "Format one exact result",
    detail:
      "Sort category names and format every amount to two decimal places.",
  },
] as const;

const INTERVIEW_PROMPTS = [
  {
    question: "Why must each amount become a number before you add it?",
    cue: "Explain what JavaScript would do if the amount stayed a string.",
  },
  {
    question: "How would you add a new category without changing the report logic?",
    cue: "Describe the data structure that keeps one running total per category.",
  },
  {
    question: "Which edge case did the empty-report check protect?",
    cue: "Connect the input filter to the exact zero-total output.",
  },
] as const;

const README_STARTER = `# Expense report builder

A JavaScript data-processing project that turns delimited expense rows into a deterministic summary.

## What it does
- parses category, description, and amount records
- calculates a total and largest expense
- groups and sorts category totals
- formats every amount to two decimal places

## Verification
Passed six deterministic project outcomes in Lovable Original.`;

export default async function JavaScriptExpenseReportDebriefPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(getSignInHref("/projects/javascript-expense-report/debrief"));
  }

  const project = await getJavaScriptCapstoneForStudent(session.user.id);
  const completed =
    project.submission?.status === "completed" &&
    !project.hasUnreviewedChanges;

  if (!completed || !project.submission) {
    return (
      <main>
        <SiteNav currentPage="project" studentSession />
        <section
          className="project-debrief-locked"
          id="main-content"
          tabIndex={-1}
          aria-labelledby="project-debrief-locked-title"
        >
          <div className="project-debrief-lock-mark" aria-hidden="true">
            6/6
          </div>
          <p className="eyebrow">Private project debrief</p>
          <h1 id="project-debrief-locked-title">
            Complete the reviewed project first.
          </h1>
          <p>
            Earn a current 6/6 review for the expense report. The debrief then
            turns that saved result into architecture notes, interview prompts,
            and truthful portfolio wording.
          </p>
          <Link
            className="primary-action"
            href="/projects/javascript-expense-report"
          >
            Continue the project <span aria-hidden="true">→</span>
          </Link>
        </section>
        <SiteFooter />
      </main>
    );
  }

  const reviewedDate = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(project.submission.submittedAt));

  return (
    <main className="project-debrief-page">
      <div className="project-debrief-screen-only">
        <SiteNav currentPage="project" studentSession />
      </div>
      <section
        className="project-debrief-shell"
        id="main-content"
        tabIndex={-1}
        aria-labelledby="project-debrief-title"
      >
        <Link
          className="project-back-link project-debrief-screen-only"
          href="/projects/javascript-expense-report"
        >
          <span aria-hidden="true">←</span>
          Expense report builder
        </Link>

        <header className="project-debrief-hero">
          <div>
            <p className="project-private-cue">Private project debrief</p>
            <p className="eyebrow">Project 02 · Completed evidence</p>
            <h1 id="project-debrief-title">Explain what your 6/6 proves.</h1>
            <p>
              Turn a working JavaScript result into a clear architecture story,
              an interview explanation, and portfolio wording you can defend.
            </p>
          </div>
          <aside aria-label="Saved project result">
            <span>Reviewed result</span>
            <strong>6/6</strong>
            <p>{JAVASCRIPT_CAPSTONE_TITLE}</p>
            <dl>
              <div>
                <dt>Reviewed</dt>
                <dd>{reviewedDate}</dd>
              </div>
              <div>
                <dt>Visibility</dt>
                <dd>Account only</dd>
              </div>
            </dl>
          </aside>
        </header>

        <div className="project-debrief-grid">
          <section
            className="project-debrief-evidence"
            aria-labelledby="project-debrief-evidence-title"
          >
            <div className="project-debrief-section-heading">
              <div>
                <p className="eyebrow">Saved review evidence</p>
                <h2 id="project-debrief-evidence-title">
                  Six outcomes, checked together.
                </h2>
              </div>
              <span>6 passed</span>
            </div>
            <div className="project-debrief-checks">
              {project.submission.checks.map((check) => (
                <article key={check.id}>
                  <span aria-hidden="true">✓</span>
                  <div>
                    <strong>{check.label}</strong>
                    <p>{check.guidance}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside
            className="project-debrief-portfolio"
            aria-labelledby="project-debrief-portfolio-title"
          >
            <p className="eyebrow">Portfolio wording</p>
            <h2 id="project-debrief-portfolio-title">
              Describe the work without overstating it.
            </h2>
            <blockquote>
              Built a JavaScript expense-report tool that parses delimited
              records, aggregates category totals, identifies the largest
              expense, and returns deterministic formatted output across six
              checked cases.
            </blockquote>
            <p>
              This private debrief records checked project work. It is not a
              public credential or independent verification.
            </p>
          </aside>
        </div>

        <section
          className="project-debrief-architecture"
          aria-labelledby="project-debrief-architecture-title"
        >
          <div className="project-debrief-section-heading">
            <div>
              <p className="eyebrow">Architecture explanation</p>
              <h2 id="project-debrief-architecture-title">
                Tell the story in three stages.
              </h2>
              <p>
                The review proves outputs, not implementation style. Use this
                sequence to explain your choices in your own words.
              </p>
            </div>
          </div>
          <ol>
            {ARCHITECTURE_STAGES.map((stage) => (
              <li key={stage.number}>
                <span>{stage.number}</span>
                <div>
                  <strong>{stage.title}</strong>
                  <p>{stage.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="project-debrief-grid project-debrief-prep-grid">
          <section
            className="project-debrief-interview"
            aria-labelledby="project-debrief-interview-title"
          >
            <p className="eyebrow">Interview rehearsal</p>
            <h2 id="project-debrief-interview-title">
              Explain decisions, not just output.
            </h2>
            <ol>
              {INTERVIEW_PROMPTS.map((prompt, index) => (
                <li key={prompt.question}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{prompt.question}</strong>
                    <p>{prompt.cue}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section
            className="project-debrief-readme"
            aria-labelledby="project-debrief-readme-title"
          >
            <p className="eyebrow">README starter</p>
            <h2 id="project-debrief-readme-title">Document the result plainly.</h2>
            <pre>{README_STARTER}</pre>
          </section>
        </div>

        <details className="project-debrief-source">
          <summary>Review the exact saved source</summary>
          <div>
            <p>
              This is the private source attached to the current completed
              review.
            </p>
            <pre>{project.code}</pre>
          </div>
        </details>

        <div className="project-debrief-actions project-debrief-screen-only">
          <PrintProjectDebriefButton />
          <Link className="text-link" href="/projects/javascript-expense-report">
            Return to the project
          </Link>
          <Link className="text-link" href="/practice/progress">
            View JavaScript skill record
          </Link>
        </div>
      </section>
      <div className="project-debrief-screen-only">
        <SiteFooter />
      </div>
    </main>
  );
}
