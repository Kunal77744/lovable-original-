import type { Metadata } from "next";
import Link from "next/link";
import {
  FIRST_COURSE,
  FIRST_LESSON,
  STUDENT_ACCESS_PROMISE,
} from "@/lib/first-course-content";
import { SiteFooter, SiteNav, SkipLink } from "../../site-chrome";

export const metadata: Metadata = {
  title: "Web Development Foundations | Lovable Original",
  description:
    "Read a free 18-minute semantic HTML lesson, then create a free account only when you want to build, grade, and save your page.",
  alternates: {
    canonical: "/courses/web-development-foundations",
  },
  openGraph: {
    type: "website",
    url: "/courses/web-development-foundations",
    title: "Web Development Foundations | Lovable Original",
    description:
      "Read a free 18-minute semantic HTML lesson, then create a free account only when you want to build, grade, and save your page.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Web Development Foundations | Lovable Original",
    description:
      "Read a free 18-minute semantic HTML lesson, then create a free account only when you want to build, grade, and save your page.",
  },
};

const courseSteps = [
  {
    number: "01",
    label: "Learn",
    title: "Read the page before you style it.",
    copy: "Three focused sections explain how landmarks, headings, and articles give a document useful structure.",
  },
  {
    number: "02",
    label: "Build",
    title: "Turn the structure into a saved page.",
    copy: "Write semantic HTML in the course workspace, see the page take shape, and save the exact result to your account.",
  },
  {
    number: "03",
    label: "Recall",
    title: "Prove the choices make sense.",
    copy: "Answer four questions, pass at 75%, and return to your best score and completed progress from the dashboard.",
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
        <section className="course-overview-hero" aria-labelledby="course-title">
          <div className="course-overview-copy">
            <p className="eyebrow">Web Development Foundations</p>
            <h1 id="course-title">
              Build a semantic article page in 18 minutes.
            </h1>
            <p className="course-overview-lede">
              Read the complete lesson free, then create a free student account
              only when you want to build, grade, and save your own semantic
              HTML page.
            </p>
            <Link
              className="primary-action"
              href={`/learn/${FIRST_COURSE.slug}/${FIRST_LESSON.slug}`}
            >
              Read the lesson free
              <ArrowIcon />
            </Link>
            <p className="course-overview-note">
              No payment · No account to read · Free account to save
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
              <div className="course-code-panel" aria-label="Semantic HTML code">
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
            <strong>100% free</strong>
            <span>No student course paywall</span>
          </div>
          <div>
            <strong>18 minutes</strong>
            <span>One focused lesson</span>
          </div>
          <div>
            <strong>75% to pass</strong>
            <span>Four recall questions</span>
          </div>
        </section>

        <section className="course-journey" aria-labelledby="journey-title">
          <div className="course-journey-heading">
            <p className="eyebrow">The complete course</p>
            <h2 id="journey-title">Structure, practice, proof.</h2>
            <p>
              {STUDENT_ACCESS_PROMISE} Your free account protects the work you
              choose to save.
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
