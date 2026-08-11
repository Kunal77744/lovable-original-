import type { Metadata } from "next";
import Link from "next/link";
import { CODING_PROBLEM_COUNT, CODING_PROBLEMS } from "@/lib/coding-problems";
import { SiteFooter, SiteNav, SkipLink } from "../../site-chrome";
import styles from "../question-answer.module.css";

const canonicalPath = "/learn/how-to-practice-javascript";
const pageTitle =
  "How to Practice JavaScript as a Beginner | Lovable Original";
const pageDescription =
  "Learn a practical beginner JavaScript loop: read input, trace a small solution, run a browser check, and submit across 12 free judged problems.";
const firstProblem = CODING_PROBLEMS[0];

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: "article",
    url: canonicalPath,
    title: pageTitle,
    description: pageDescription,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "A beginner JavaScript problem moving from input through solve(input) to checked output.",
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
        alt: "A beginner JavaScript problem moving from input through solve(input) to checked output.",
      },
    ],
  },
};

const practiceLoop = [
  {
    number: "01",
    title: "Read the input and output first",
    copy: "Name the values you receive and the exact text you must return before you choose syntax.",
  },
  {
    number: "02",
    title: "Trace one small example",
    copy: "Work through the sample by hand. The steps you write down become the shape of the function.",
  },
  {
    number: "03",
    title: "Run before you submit",
    copy: "Use the visible browser check to catch parsing, formatting, and runtime mistakes without saving an attempt.",
  },
  {
    number: "04",
    title: "Use the verdict as feedback",
    copy: "A judged submission shows whether the bounded checks passed. Fix one mismatch, then run the loop again.",
  },
];

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" width="20" height="20" fill="none">
      <path d="M4 10h11M11 6l4 4-4 4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export default function PracticeJavaScriptAnswerPage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "How to Practice JavaScript as a Beginner",
    description: pageDescription,
    url: `https://lovable-original-eight.vercel.app${canonicalPath}`,
    author: { "@type": "Organization", name: "Lovable Original" },
    about: ["JavaScript", "coding practice", "beginner programming"],
  };

  return (
    <div className={styles.page}>
      <SkipLink />
      <SiteNav currentPage="practice" />

      <main id="main-content" tabIndex={-1}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />

        <section className={styles.hero} aria-labelledby="javascript-answer-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>A beginner practice loop</p>
            <h1 id="javascript-answer-title">
              How should a beginner practice JavaScript?
            </h1>
            <p className={styles.lede}>
              Solve one small input-and-output problem at a time. Read it,
              trace it, run it in the browser, then use the judged result to
              choose the next fix.
            </p>
            <Link
              className={styles.primaryAction}
              data-primary-action="true"
              href={`/practice/${firstProblem.slug}`}
            >
              Start JavaScript problem 01
              <ArrowIcon />
            </Link>
            <p className={styles.note}>
              {CODING_PROBLEM_COUNT} free problems · Browser-run checks · Saved
              Accepted progress with an account
            </p>
          </div>

          <figure className={styles.visual}>
            <figcaption>
              <span>Problem 01 · Sum two numbers</span>
              <span className={styles.visualBadge}>4 bounded checks</span>
            </figcaption>
            <div className={styles.judgeStage}>
              <div className={styles.judgeCode} aria-label="JavaScript function scaffold">
                <span><b>function</b> solve(input) {"{"}</span>
                <span>{"// Read the input."}</span>
                <span>{"// Return the exact output."}</span>
                <span>{"}"}</span>
              </div>
              <div className={styles.exampleResult}>
                <div>
                  <small>Example input</small>
                  <strong>4 9</strong>
                </div>
                <span className={styles.exampleArrow} aria-hidden="true">
                  <ArrowIcon />
                </span>
                <div>
                  <small>Expected output</small>
                  <strong>13</strong>
                </div>
              </div>
              <div className={styles.checkRail} aria-label="Four judge checks">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </figure>
        </section>

        <article className={styles.content}>
          <header className={styles.articleIntro}>
            <p className={styles.eyebrow}>The short version</p>
            <h2>Practice the whole loop, not isolated syntax.</h2>
            <div>
              <p>
                Syntax starts to stick when it solves a bounded problem. A
                useful session connects input, a small decision, exact output,
                and a result you can compare with what you expected.
              </p>
              <p>
                Keep the first problems narrow. Parsing two numbers, choosing a
                branch, or controlling a loop gives you one clear thing to
                debug instead of a large project with several unknowns.
              </p>
            </div>
          </header>

          <section className={styles.stepsSection} aria-labelledby="practice-loop-title">
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>A repeatable session</p>
              <h2 id="practice-loop-title">Four moves from prompt to verdict.</h2>
              <p>
                Repeat the same sequence across the path. The problem changes,
                but the debugging habit stays useful.
              </p>
            </div>
            <ol className={styles.stepList}>
              {practiceLoop.map((step) => (
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

          <section className={styles.exampleSection} aria-labelledby="starter-title">
            <div className={styles.exampleHeading}>
              <p className={styles.eyebrow}>Start unsolved</p>
              <h2 id="starter-title">Give every problem the same contract.</h2>
              <p>
                The editor starts with a small function. Your job is to read the
                input and return the exact output the problem requests.
              </p>
              <Link className={styles.referenceLink} href="/learn/beginner-javascript-practice">
                See all {CODING_PROBLEM_COUNT} JavaScript problems
                <ArrowIcon />
              </Link>
            </div>
            <pre className={styles.exampleCard} aria-label="An unsolved JavaScript scaffold">
              <code>{`function solve(input) {
  // Read the problem, use input,
  // and return the exact output.
  return "";
}`}</code>
            </pre>
          </section>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
