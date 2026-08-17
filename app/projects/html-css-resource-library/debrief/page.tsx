import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PrintProjectDebriefButton } from "@/components/print-project-debrief-button";
import { getHtmlCssCapstoneForStudent } from "@/db/html-css-capstone";
import { auth } from "@/lib/auth";
import { getSignInHref } from "@/lib/account-destination";
import {
  HTML_CSS_CAPSTONE_TITLE,
  HTML_CSS_CAPSTONE_TOTAL_CHECKS,
} from "@/lib/html-css-capstone";
import { SiteFooter, SiteNav } from "../../../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private HTML and CSS project debrief | Lovable Original",
  description:
    "Review the structure, styling contract, and interview prompts behind your completed HTML and CSS resource library.",
  robots: {
    index: false,
    follow: false,
  },
};

const ARCHITECTURE_STAGES = [
  {
    number: "01",
    title: "Give the page meaning",
    detail:
      "Use header, main, article, section, and footer landmarks so the document explains its own structure.",
  },
  {
    number: "02",
    title: "Name a reusable contract",
    detail:
      "Repeat resource-card and resource-link hooks in the HTML so one scoped rule can style every resource.",
  },
  {
    number: "03",
    title: "Control layout and boxes",
    detail:
      "Let grid arrange the collection, then use gap, padding, borders, and border-box sizing to keep each card predictable.",
  },
] as const;

const INTERVIEW_PROMPTS = [
  {
    question: "Why use a section for each resource card?",
    cue: "Connect the repeated content to its heading and to the larger article landmark.",
  },
  {
    question: "What makes the class hooks reusable?",
    cue: "Explain why the same resource-card rule works without depending on a card's position.",
  },
  {
    question: "How do grid gap and card padding solve different spacing problems?",
    cue: "Separate the space between components from the space inside each component.",
  },
] as const;

const README_STARTER = `# Learning resource library

A two-file front-end project that organizes learning links into reusable resource cards.

## What it demonstrates
- semantic page landmarks and section headings
- shared HTML class hooks across repeated content
- CSS Grid layout with deliberate spacing
- predictable card boxes and clear link targets

## Verification
Passed six deterministic HTML and CSS project outcomes in Lovable Original.`;

export default async function HtmlCssResourceLibraryDebriefPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(getSignInHref("/projects/html-css-resource-library/debrief"));
  }

  const project = await getHtmlCssCapstoneForStudent(session.user.id);
  const completed =
    project.submission?.status === "completed" &&
    project.submission.totalChecks === HTML_CSS_CAPSTONE_TOTAL_CHECKS &&
    project.submission.passedChecks === HTML_CSS_CAPSTONE_TOTAL_CHECKS &&
    project.submission.checks.every((check) => check.passed) &&
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
            Earn a current 6/6 review for the resource library. The debrief then
            turns that saved result into architecture notes, interview prompts,
            and truthful portfolio wording.
          </p>
          <Link
            className="primary-action"
            href="/projects/html-css-resource-library"
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
    <main className="project-debrief-page html-css-debrief-page">
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
          href="/projects/html-css-resource-library"
        >
          <span aria-hidden="true">←</span>
          Learning resource library
        </Link>

        <header className="project-debrief-hero">
          <div>
            <p className="project-private-cue">Private project debrief</p>
            <p className="eyebrow">Project 03 · Completed evidence</p>
            <h1 id="project-debrief-title">Explain how both files work together.</h1>
            <p>
              Turn a finished front-end result into a clear structure story,
              an interview explanation, and portfolio wording you can defend.
            </p>
          </div>
          <aside aria-label="Saved project result">
            <span>Reviewed result</span>
            <strong>6/6</strong>
            <p>{HTML_CSS_CAPSTONE_TITLE}</p>
            <dl>
              <div>
                <dt>Files</dt>
                <dd>HTML + CSS</dd>
              </div>
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
                  Six outcomes across two files.
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
              Built a responsive HTML and CSS resource library using semantic
              landmarks, reusable class hooks, CSS Grid, deliberate spacing,
              predictable card boxes, and clear link targets across six checked
              outcomes.
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
                Tell the two-file story in three stages.
              </h2>
              <p>
                The review proves the contract works. Use this sequence to
                explain why you chose each structure and styling rule.
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
              Explain decisions, not just appearance.
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

        <details className="project-debrief-source html-css-debrief-source">
          <summary>Review the exact saved HTML and CSS</summary>
          <div>
            <p>
              These are the two private files attached to the current completed
              review.
            </p>
            <div className="html-css-debrief-source-files">
              <section aria-labelledby="html-css-debrief-html-title">
                <h2 id="html-css-debrief-html-title">index.html</h2>
                <pre>{project.html}</pre>
              </section>
              <section aria-labelledby="html-css-debrief-css-title">
                <h2 id="html-css-debrief-css-title">styles.css</h2>
                <pre>{project.css}</pre>
              </section>
            </div>
          </div>
        </details>

        <div className="project-debrief-actions project-debrief-screen-only">
          <PrintProjectDebriefButton />
          <Link className="text-link" href="/projects/html-css-resource-library">
            Return to the project
          </Link>
          <Link className="text-link" href="/profile">
            View private progress
          </Link>
        </div>
      </section>
      <div className="project-debrief-screen-only">
        <SiteFooter />
      </div>
    </main>
  );
}
