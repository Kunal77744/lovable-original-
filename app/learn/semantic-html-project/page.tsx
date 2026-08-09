import type { Metadata } from "next";
import Link from "next/link";
import {
  getEmptyGuidedProjectChecks,
  GUIDED_PROJECT_TOTAL_CHECKS,
} from "@/lib/guided-project";
import { SiteFooter, SiteNav, SkipLink } from "../../site-chrome";

const pageTitle =
  "Semantic HTML Project: Build a Field Guide | Lovable Original";
const pageDescription =
  "Build and save a semantic HTML field guide after Web Development Foundations, then revise it against six clear structure checks.";
const shareImageAlt =
  "A saved semantic HTML field guide with six review checks in Lovable Original.";
const projectChecks = getEmptyGuidedProjectChecks();

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: "/learn/semantic-html-project",
  },
  openGraph: {
    type: "website",
    url: "/learn/semantic-html-project",
    title: pageTitle,
    description: pageDescription,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: shareImageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: [
      {
        url: "/opengraph-image",
        alt: shareImageAlt,
      },
    ],
  },
};

const projectSteps = [
  {
    number: "01",
    title: "Finish the focused lesson",
    copy: "Read the complete 18-minute semantic HTML lesson and pass its four-question recall check.",
  },
  {
    number: "02",
    title: "Build your field guide",
    copy: "Turn the starter into one complete article with a live preview and private, account-backed drafts.",
  },
  {
    number: "03",
    title: "Revise six clear checks",
    copy: "Review landmarks, article structure, sections, supporting copy, and one useful aside until all six pass.",
  },
];

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      width="20"
      height="20"
      fill="none"
    >
      <path d="M4 10h11M11 6l4 4-4 4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export default function SemanticHtmlProjectEntryPage() {
  return (
    <>
      <SkipLink />
      <SiteNav currentPage="course" />

      <main id="main-content" tabIndex={-1}>
        <section
          className="learn-entry-hero project-entry-hero"
          aria-labelledby="project-entry-title"
        >
          <div className="learn-entry-copy">
            <p className="eyebrow">Semantic HTML guided project</p>
            <h1 id="project-entry-title">
              Turn one lesson into a field guide of your own.
            </h1>
            <p className="learn-entry-lede">
              After Web Development Foundations, build and save a complete
              semantic HTML field guide. Submit it for six clear structure
              checks, revise it, and return to the exact draft after sign-in.
            </p>
            <Link
              className="primary-action"
              href="/courses/web-development-foundations"
            >
              Explore Web Development Foundations
              <ArrowIcon />
            </Link>
            <p className="learn-entry-note">
              Full lesson readable before signup · Project work saved privately
              · Six-check review
            </p>
          </div>

          <figure className="project-discovery-preview">
            <figcaption>
              <span>Private project result</span>
              <span className="entry-proof-badge">
                <span aria-hidden="true">✓</span>
                Saved · {GUIDED_PROJECT_TOTAL_CHECKS}/
                {GUIDED_PROJECT_TOTAL_CHECKS}
              </span>
            </figcaption>
            <div className="project-discovery-canvas">
              <div className="project-discovery-document" aria-hidden="true">
                <div className="project-discovery-document-header">
                  <small>&lt;header&gt;</small>
                  <span>FIELD GUIDE 01</span>
                </div>
                <div className="project-discovery-article">
                  <small>&lt;article&gt;</small>
                  <strong>How a well-structured web page works</strong>
                  <span />
                  <span />
                  <div>
                    <span>Landmarks</span>
                    <span>Headings</span>
                  </div>
                  <aside>A useful supporting note</aside>
                </div>
                <small>&lt;footer&gt;</small>
              </div>

              <div
                className="project-discovery-review"
                aria-label={`${GUIDED_PROJECT_TOTAL_CHECKS} of ${GUIDED_PROJECT_TOTAL_CHECKS} project review checks pass`}
              >
                <span>Review saved</span>
                <strong>
                  {GUIDED_PROJECT_TOTAL_CHECKS} of {GUIDED_PROJECT_TOTAL_CHECKS}{" "}
                  checks pass
                </strong>
                <ul>
                  {projectChecks.map((check) => (
                    <li key={check.id}>
                      <span aria-hidden="true">✓</span>
                      {check.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </figure>
        </section>

        <section
          className="learn-outcome-section"
          aria-labelledby="project-outcome"
        >
          <div className="learn-outcome-heading">
            <p className="eyebrow">From lesson to independent build</p>
            <h2 id="project-outcome">Build it. Review it. Make it stronger.</h2>
            <p>
              The guided project starts after course completion. Every draft
              and review stays private to your account while you revise toward
              one finished field guide.
            </p>
          </div>

          <ol className="learn-step-rail">
            {projectSteps.map((step) => (
              <li key={step.number}>
                <span>{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
