import type { Metadata } from "next";
import Link from "next/link";
import { CODING_PROBLEMS } from "@/lib/coding-problems";
import { SiteFooter, SiteNav, SkipLink } from "../../site-chrome";

const javascriptProblemCount = CODING_PROBLEMS.length;

const courseDescription =
  `Follow one beginner coding path through semantic HTML, a reviewed field guide, ${javascriptProblemCount} JavaScript problems, and six CSS challenges.`;
const courseShareImageAlt =
  `Web Development Foundations: three practical lessons, a reviewed field guide, ${javascriptProblemCount} JavaScript problems, and six CSS challenges.`;

export const metadata: Metadata = {
  title: "Web Development Foundations | Lovable Original",
  description: courseDescription,
  alternates: {
    canonical: "/courses/web-development-foundations",
  },
  openGraph: {
    type: "website",
    url: "/courses/web-development-foundations",
    title: "Web Development Foundations | Lovable Original",
    description: courseDescription,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: courseShareImageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Web Development Foundations | Lovable Original",
    description: courseDescription,
    images: [
      {
        url: "/opengraph-image",
        alt: courseShareImageAlt,
      },
    ],
  },
};

const courseSteps = [
  {
    number: "01",
    label: "Lessons",
    title: "Build the structure, then style it.",
    copy: "Read three public HTML and CSS lessons, save three practice builds, and pass four questions per lesson at 75%.",
    href: "/learn/web-development-foundations/semantic-html",
    linkLabel: "Open the first lesson",
  },
  {
    number: "02",
    label: "Project",
    title: "Turn the lesson into a field guide.",
    copy: "Build and save a private semantic HTML field guide, review six checks, then revise your work.",
    href: "/learn/semantic-html-project",
    linkLabel: "Preview the guided project",
  },
  {
    number: "03",
    label: "JavaScript practice",
    title: "Solve one small problem at a time.",
    copy: `Continue through ${javascriptProblemCount} ordered beginner problems and return to the next unfinished step.`,
    href: "/learn/beginner-javascript-practice",
    linkLabel: "See the JavaScript path",
  },
  {
    number: "04",
    label: "CSS practice",
    title: "Make the box model predictable.",
    copy: "Work through six selector and box-model challenges, with saved attempts that resume at the next unfinished step.",
    href: "/practice/css",
    linkLabel: "See the CSS path",
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

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 18 18"
      width="18"
      height="18"
      fill="none"
    >
      <circle cx="9" cy="9" r="8.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="m5.7 9 2.1 2.2 4.7-5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function WebDevelopmentFoundationsPage() {
  return (
    <>
      <SkipLink />
      <SiteNav currentPage="course" />

      <main id="main-content" tabIndex={-1}>
        <section
          className="course-overview-hero"
          aria-labelledby="course-title"
        >
          <div className="course-overview-copy">
            <p className="eyebrow">Web Development Foundations</p>
            <h1 id="course-title">
              One beginner path from page structure to working code.
            </h1>
            <p className="course-overview-lede">
              Read three practical lessons, build a reviewed semantic HTML field
              guide, then keep practicing through {javascriptProblemCount}{" "}
              JavaScript problems and six CSS challenges. Your next unfinished
              step waits when you
              return.
            </p>
            <Link
              className="primary-action"
              href="/learn/web-development-foundations/semantic-html"
            >
              Start the beginner path
              <ArrowIcon />
            </Link>
            <p className="course-overview-note">
              Three lessons · Six-check project · {javascriptProblemCount}{" "}
              JavaScript + six CSS challenges
            </p>
          </div>

          <figure className="course-build-preview">
            <figcaption>
              <span>Semantic HTML workspace</span>
              <span className="preview-saved">
                <span aria-hidden="true" />
                Saved
              </span>
            </figcaption>
            <div className="course-build-stage">
              <div
                className="course-code-panel"
                aria-label="Semantic HTML code"
              >
                <span>&lt;main&gt;</span>
                <span className="code-indent">&lt;article&gt;</span>
                <span className="code-indent-two">
                  &lt;h1&gt;Field notes&lt;/h1&gt;
                </span>
                <span className="code-indent-two">
                  &lt;p&gt;A small story...&lt;/p&gt;
                </span>
                <span className="code-indent">&lt;/article&gt;</span>
                <span>&lt;/main&gt;</span>
              </div>
              <div
                className="course-page-panel"
                aria-label="Preview of the semantic article page"
              >
                <span className="page-kicker">Field notes · Issue 01</span>
                <strong>A page with a clear beginning.</strong>
                <span className="page-rule" />
                <p>
                  Meaningful elements help every reader find their way through
                  the story.
                </p>
                <div className="page-check">
                  <CheckIcon />
                  <span>5 structure checks passed</span>
                </div>
              </div>
            </div>
          </figure>
        </section>

        <section className="course-proof-strip" aria-label="Course facts">
          <div>
            <strong>51 minutes</strong>
            <span>Three focused lessons</span>
          </div>
          <div>
            <strong>3 saved builds</strong>
            <span>HTML and CSS practice</span>
          </div>
          <div>
            <strong>6 + {javascriptProblemCount} + 6</strong>
            <span>Project checks, JS problems, and CSS challenges</span>
          </div>
        </section>

        <section className="course-journey" aria-labelledby="journey-title">
          <div className="course-journey-heading">
            <p className="eyebrow">The complete course</p>
            <h2 id="journey-title">Follow the path from lesson to practice.</h2>
            <p>
              Every stage has one clear outcome. Start with the lesson, then use
              the quieter links to understand what comes next.
            </p>
          </div>

          <ol className="course-journey-steps">
            {courseSteps.map((step) => (
              <li key={step.number}>
                <span className="course-step-number">{step.number}</span>
                <div>
                  <p>{step.label}</p>
                  <h3>{step.title}</h3>
                  <span>{step.copy}</span>
                  <Link className="course-step-link" href={step.href}>
                    {step.linkLabel}
                    <ArrowIcon />
                  </Link>
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
