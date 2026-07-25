import { SiteFooter, SiteNav } from "./site-chrome";

const learningLoop = [
  {
    number: "01",
    title: "Understand",
    copy: "Short, structured lessons help you see the idea before the details blur together.",
  },
  {
    number: "02",
    title: "Practice",
    copy: "Quizzes, notes, flashcards, and coding exercises turn passive reading into recall.",
  },
  {
    number: "03",
    title: "Build",
    copy: "Projects and interview practice connect what you know to the work you want to do.",
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
    <main>
      <SiteNav />

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">Learn. Recall. Build.</p>
          <h1 id="hero-title">
            Lovable Original turns what you study into what you can do.
          </h1>
          <p className="hero-lede">
            Lovable Original is an AI-first learning platform designed to help
            students understand faster, remember longer, and become job-ready
            through real practice.
          </p>
          <a className="primary-action" href="#learning-path">
            See the learning path
            <ArrowIcon />
          </a>
          <p className="launch-note">The first focused course is being built now.</p>
          <p className="spelling-note">
            Searched for &quot;Loveable Original&quot;? You&apos;re in the right
            place.
          </p>
        </div>

        <div className="course-window" aria-label="Product learning path preview">
          <div className="window-topbar">
            <div className="window-brand">
              <span className="window-logo">L</span>
              <span>Learning workspace</span>
            </div>
            <span className="progress-label">32% complete</span>
          </div>

          <div className="course-content">
            <div className="course-meta">
              <span>Module 03</span>
              <span>12 min</span>
            </div>
            <p className="lesson-label">Foundations</p>
            <h2>Turn a hard idea into a clear mental model.</h2>
            <p className="lesson-copy">
              Learn the concept, explain it in your own words, then apply it
              before moving on.
            </p>

            <div className="lesson-checklist">
              <div>
                <CheckIcon />
                <span>Guided explanation</span>
              </div>
              <div>
                <CheckIcon />
                <span>Active recall prompt</span>
              </div>
              <div className="current-step">
                <span className="step-dot" />
                <span>Build it yourself</span>
              </div>
            </div>
          </div>

          <div className="progress-track" aria-hidden="true">
            <span />
          </div>
        </div>
      </section>

      <section className="learning-path" id="learning-path" aria-labelledby="path-title">
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

      <SiteFooter />
    </main>
  );
}
