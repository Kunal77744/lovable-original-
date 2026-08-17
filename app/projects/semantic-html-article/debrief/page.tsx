import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PrintProjectDebriefButton } from "@/components/print-project-debrief-button";
import { getGuidedProjectForStudent } from "@/db/guided-project";
import { getSignInHref } from "@/lib/account-destination";
import { auth } from "@/lib/auth";
import {
  GUIDED_PROJECT_SLUG,
  GUIDED_PROJECT_TITLE,
  GUIDED_PROJECT_TOTAL_CHECKS,
} from "@/lib/guided-project";
import { SiteFooter, SiteNav } from "../../../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private semantic HTML project debrief | Lovable Original",
  description:
    "Review the structure, interview prompts, and portfolio wording behind your completed semantic HTML field guide.",
  robots: {
    index: false,
    follow: false,
  },
};

const ARCHITECTURE_STAGES = [
  {
    number: "01",
    title: "Frame the document",
    detail:
      "Use header, main, and footer in order so the page communicates its broad structure before any detail is read.",
  },
  {
    number: "02",
    title: "Center one complete article",
    detail:
      "Give the main topic one article, one h1, and an opening paragraph that sets up the field guide.",
  },
  {
    number: "03",
    title: "Develop and support the idea",
    detail:
      "Use headed sections for the explanation and an aside for a useful note that supports the main article.",
  },
] as const;

const INTERVIEW_PROMPTS = [
  {
    question: "Why use an article instead of a generic div?",
    cue: "Explain what makes the field guide a self-contained piece of content.",
  },
  {
    question: "How does the heading hierarchy help someone navigate?",
    cue: "Connect the single h1 and section h2 elements to the page outline.",
  },
  {
    question: "When is an aside appropriate inside an article?",
    cue: "Separate supporting context from the explanation a reader needs in sequence.",
  },
] as const;

const README_STARTER = `# Semantic HTML field guide

A single-file page explaining how meaningful HTML structure works.

## What it demonstrates
- page-level header, main, and footer landmarks
- one self-contained article with a clear heading hierarchy
- two explained sections and a supporting aside
- meaningful structure across six deterministic checks

## Verification
Passed six deterministic semantic HTML project outcomes in Lovable Original.`;

export default async function SemanticHtmlArticleDebriefPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(getSignInHref("/projects/semantic-html-article/debrief"));
  }

  const project = await getGuidedProjectForStudent(
    session.user.id,
    GUIDED_PROJECT_SLUG,
  );
  const completed =
    project?.submission?.status === "completed" &&
    project.submission.totalChecks === GUIDED_PROJECT_TOTAL_CHECKS &&
    project.submission.passedChecks === GUIDED_PROJECT_TOTAL_CHECKS &&
    project.submission.checks.every((check) => check.passed) &&
    !project.hasUnreviewedChanges;

  if (!project || !completed || !project.submission) {
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
            Earn a current 6/6 review for the semantic HTML field guide. The
            debrief then turns that saved result into architecture notes,
            interview prompts, and truthful portfolio wording.
          </p>
          <Link
            className="primary-action"
            href="/projects/semantic-html-article"
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
          href="/projects/semantic-html-article"
        >
          <span aria-hidden="true">←</span>
          Semantic HTML field guide
        </Link>

        <header className="project-debrief-hero">
          <div>
            <p className="project-private-cue">Private project debrief</p>
            <p className="eyebrow">Project 01 · Completed evidence</p>
            <h1 id="project-debrief-title">
              Explain how the page structure carries meaning.
            </h1>
            <p>
              Turn a completed semantic HTML result into a clear structure
              story, an interview explanation, and portfolio wording you can
              defend.
            </p>
          </div>
          <aside aria-label="Saved project result">
            <span>Reviewed result</span>
            <strong>6/6</strong>
            <p>{GUIDED_PROJECT_TITLE}</p>
            <dl>
              <div>
                <dt>File</dt>
                <dd>HTML</dd>
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
                  Six structural outcomes, checked together.
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
              Built a semantic HTML field guide using ordered page landmarks,
              one self-contained article, a clear heading hierarchy, two
              explained sections, and a supporting aside across six checked
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
                Tell the structure story in three stages.
              </h2>
              <p>
                The review proves the document structure, not how you arrived
                there. Use this sequence to explain your choices in your own
                words.
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
              Explain decisions, not just tags.
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
            <h2 id="project-debrief-readme-title">
              Document the result plainly.
            </h2>
            <pre>{README_STARTER}</pre>
          </section>
        </div>

        <details className="project-debrief-source">
          <summary>Review the exact saved HTML</summary>
          <div>
            <p>
              This is the private source attached to the current completed
              review.
            </p>
            <pre>{project.html}</pre>
          </div>
        </details>

        <div className="project-debrief-actions project-debrief-screen-only">
          <PrintProjectDebriefButton />
          <Link className="text-link" href="/projects/semantic-html-article">
            Return to the project
          </Link>
          <Link className="text-link" href="/projects">
            View private projects
          </Link>
        </div>
      </section>
      <div className="project-debrief-screen-only">
        <SiteFooter />
      </div>
    </main>
  );
}
