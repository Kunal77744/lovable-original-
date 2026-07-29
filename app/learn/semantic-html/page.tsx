import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteNav, SkipLink } from "../../site-chrome";

const pageDescription =
  "Learn semantic HTML in one 18-minute lesson. Build and save an article page, pass five structure checks, and test your recall with four questions.";
const shareImageAlt =
  "Learn semantic HTML by building and saving a structured article page with Lovable Original.";

export const metadata: Metadata = {
  title: "Learn Semantic HTML by Building a Page | Lovable Original",
  description: pageDescription,
  alternates: {
    canonical: "/learn/semantic-html",
  },
  openGraph: {
    type: "website",
    url: "/learn/semantic-html",
    title: "Learn Semantic HTML by Building a Page | Lovable Original",
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
    title: "Learn Semantic HTML by Building a Page | Lovable Original",
    description: pageDescription,
    images: [
      {
        url: "/opengraph-image",
        alt: shareImageAlt,
      },
    ],
  },
};

const courseSteps = [
  {
    number: "01",
    title: "Read the structure",
    copy: "See how headings, landmarks, and articles make a document easier to understand.",
  },
  {
    number: "02",
    title: "Build the article",
    copy: "Write semantic HTML, watch the preview update, and submit the page against five checks.",
  },
  {
    number: "03",
    title: "Check your recall",
    copy: "Answer four questions, pass at 75%, and keep your best result with a free account.",
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

export default function SemanticHtmlEntryPage() {
  return (
    <>
      <SkipLink />
      <SiteNav currentPage="course" />

      <main id="main-content" tabIndex={-1}>
        <section
          className="learn-entry-hero semantic-entry-hero"
          aria-labelledby="semantic-entry-title"
        >
          <div className="learn-entry-copy">
            <p className="eyebrow">Learn semantic HTML by building</p>
            <h1 id="semantic-entry-title">
              Give every part of a page a clear job.
            </h1>
            <p className="learn-entry-lede">
              Learn how browsers read a document, then build and save a semantic
              article page in one focused 18-minute lesson.
            </p>
            <Link
              className="primary-action"
              href="/learn/web-development-foundations/semantic-html"
            >
              Read the full 18-minute lesson
              <ArrowIcon />
            </Link>
            <p className="learn-entry-note">
              Free to read · Five structure checks · 75% quiz pass mark
            </p>
          </div>

          <figure className="semantic-document-map">
            <figcaption>
              <span>Your finished page</span>
              <span className="entry-proof-badge">
                <span aria-hidden="true">✓</span>
                5/5 checks
              </span>
            </figcaption>
            <div className="semantic-page-canvas">
              <div className="semantic-landmark semantic-header-landmark">
                <code>&lt;header&gt;</code>
                <span>Article identity</span>
              </div>
              <div className="semantic-landmark semantic-main-landmark">
                <code>&lt;main&gt;</code>
                <div className="semantic-article-landmark">
                  <code>&lt;article&gt;</code>
                  <strong>Field notes from the web</strong>
                  <span>A clear heading and a useful reading order.</span>
                </div>
              </div>
              <div className="semantic-landmark semantic-footer-landmark">
                <code>&lt;footer&gt;</code>
                <span>Source and context</span>
              </div>
            </div>
          </figure>
        </section>

        <section className="learn-outcome-section" aria-labelledby="semantic-outcome">
          <div className="learn-outcome-heading">
            <p className="eyebrow">One complete result</p>
            <h2 id="semantic-outcome">
              Go from unfamiliar tags to a saved article.
            </h2>
            <p>
              The lesson connects explanation, a real build, and a short recall
              check. You finish with working HTML, not a page of notes.
            </p>
            <Link
              className="learn-reference-link"
              href="/learn/semantic-html-cheat-sheet"
            >
              Keep the HTML semantic tags cheat sheet nearby
              <ArrowIcon />
            </Link>
          </div>

          <ol className="learn-step-rail">
            {courseSteps.map((step) => (
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
