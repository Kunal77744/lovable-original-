import type { Metadata } from "next";
import Link from "next/link";
import { CODING_PROBLEMS } from "@/lib/coding-problems";
import { SiteFooter, SiteNav, SkipLink } from "../../site-chrome";

const pageDescription =
  "Practice JavaScript with 12 free problems covering foundations, sets, stacks, frequency maps, binary search, and sliding windows. Run code in your browser and save Accepted progress.";
const shareImageAlt =
  "Twelve free JavaScript practice problems with browser-run checks and saved Accepted progress.";
const firstProblem = CODING_PROBLEMS[0];

export const metadata: Metadata = {
  title: "JavaScript Practice: 12 Free Problems | Lovable Original",
  description: pageDescription,
  alternates: {
    canonical: "/learn/beginner-javascript-practice",
  },
  openGraph: {
    type: "website",
    url: "/learn/beginner-javascript-practice",
    title: "JavaScript Practice: 12 Free Problems | Lovable Original",
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
    title: "JavaScript Practice: 12 Free Problems | Lovable Original",
    description: pageDescription,
    images: [
      {
        url: "/opengraph-image",
        alt: shareImageAlt,
      },
    ],
  },
};

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

export default function BeginnerJavaScriptPracticeEntryPage() {
  return (
    <>
      <SkipLink />
      <SiteNav currentPage="practice" />

      <main id="main-content" tabIndex={-1}>
        <section
          className="learn-entry-hero javascript-entry-hero"
          aria-labelledby="javascript-entry-title"
        >
          <div className="learn-entry-copy">
            <p className="eyebrow">JavaScript practice path</p>
            <h1 id="javascript-entry-title">
              Make your first 12 problems count.
            </h1>
            <p className="learn-entry-lede">
              Twelve problems, one ordered path
            </p>
            <Link
              className="primary-action"
              href={`/practice/${firstProblem.slug}`}
            >
              Start problem {String(firstProblem.number).padStart(2, "0")}
              <ArrowIcon />
            </Link>
            <p className="learn-entry-note">
              Free to practice · Browser-run verdicts · Saved code with an
              account
            </p>
          </div>

          <figure className="javascript-judge-preview">
            <figcaption>
              <span>Problem 01 · Sum two numbers</span>
              <span className="entry-proof-badge">
                <span aria-hidden="true">✓</span>
                Accepted
              </span>
            </figcaption>
            <div className="javascript-code-preview">
              <div className="javascript-code-lines" aria-label="JavaScript solution">
                <span>
                  <b>function</b> solve(input) {"{"}
                </span>
                <span className="code-indent">
                  <b>const</b> [a, b] = input
                </span>
                <span className="code-indent-two">.trim().split(&quot; &quot;)</span>
                <span className="code-indent-two">.map(Number);</span>
                <span className="code-indent">
                  <b>return</b> String(a + b);
                </span>
                <span>{"}"}</span>
              </div>
              <div className="javascript-verdict">
                <span>Deterministic checks</span>
                <strong>4 of 4 passed</strong>
                <div aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          </figure>
        </section>

        <section
          className="learn-outcome-section javascript-outcome-section"
          aria-labelledby="javascript-outcome"
        >
          <div className="learn-outcome-heading">
            <p className="eyebrow">A 12-problem first streak</p>
            <h2 id="javascript-outcome">
              Practice the basics in a useful order.
            </h2>
            <p>
              Each problem isolates one beginner skill, so you can see exactly
              what passed and move to the next unfinished challenge.
            </p>
          </div>

          <div className="javascript-skill-list" role="list">
            {CODING_PROBLEMS.map((problem) => (
              <div role="listitem" key={problem.slug}>
                <span>{String(problem.number).padStart(2, "0")}</span>
                <div>
                  <strong>{problem.title}</strong>
                  <small>{problem.skill}</small>
                </div>
                <span>{problem.difficulty}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
