import Link from "next/link";
import { SiteFooter, SiteNav, SkipLink } from "./site-chrome";

const learningLoop = [
  {
    number: "01",
    title: "Learn the structure",
    copy: "Three focused sections show how semantic HTML gives a page meaning before styling begins.",
  },
  {
    number: "02",
    title: "Check your recall",
    copy: "A four-question quiz tests the choices that make a page clearer for browsers and people.",
  },
  {
    number: "03",
    title: "Complete the course",
    copy: "Build and save your page, pass at 75%, and return to your best score and progress from the dashboard.",
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

export default function Home() {
  return (
    <>
      <SkipLink />
      <SiteNav />

      <main id="main-content" tabIndex={-1}>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">Web Development Foundations</p>
            <h1 id="hero-title">
              Lovable Original helps you build a page the browser understands.
            </h1>
            <p className="hero-lede">
              In one 18-minute semantic HTML lesson, build and save an article
              page, check your recall with four questions, and keep your course
              result.
            </p>
            <Link className="primary-action" href="/account">
              Start Web Development Foundations
              <ArrowIcon />
            </Link>
            <p className="launch-note">
              One focused lesson. One practical result. Your best quiz score
              stays with your free student account.
            </p>
            <p className="spelling-note">
              Searched for &quot;Loveable Original&quot;? You&apos;re in the
              right place.
            </p>
          </div>

          <div
            className="course-window"
            aria-label="Web Development Foundations course preview"
          >
            <div className="window-topbar">
              <div className="window-brand">
                <span className="window-logo">L</span>
                <span>Web Development Foundations</span>
              </div>
              <span className="progress-label">Preview · 32% complete</span>
            </div>

            <div className="course-content">
              <div className="course-meta">
                <span>Lesson 01</span>
                <span>18 min</span>
              </div>
              <p className="lesson-label">Semantic HTML</p>
              <h2>Build a page the browser understands.</h2>
              <p className="lesson-copy">
                Turn a blank document into an accessible article page, then
                check your choices with a short quiz.
              </p>

              <div className="lesson-checklist">
                <div>
                  <CheckIcon />
                  <span>Three focused lesson sections</span>
                </div>
                <div>
                  <CheckIcon />
                  <span>Four recall questions</span>
                </div>
                <div className="current-step">
                  <span className="step-dot" />
                  <span>Saved best score and progress</span>
                </div>
              </div>
            </div>

            <div className="progress-track" aria-hidden="true">
              <span />
            </div>
          </div>
        </section>

        <section
          className="learning-path"
          id="learning-path"
          aria-labelledby="path-title"
        >
          <div className="section-heading">
            <p className="eyebrow">A better learning loop</p>
            <h2 id="path-title">From first lesson to real confidence.</h2>
          </div>
          <div className="path-grid">
            {learningLoop.map((step) => (
              <article className="path-step" key={step.number}>
                <span className="step-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
