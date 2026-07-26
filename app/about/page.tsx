import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteNav, SkipLink } from "../site-chrome";

export const metadata: Metadata = {
  title: "About Lovable Original | Learn, recall, and build",
  description:
    "See how Lovable Original turns one semantic HTML lesson into a saved page, a four-question recall check, and progress you can return to.",
  alternates: {
    canonical: "/about",
  },
};

const learningLoop = [
  {
    number: "01",
    title: "Learn it clearly",
    copy: "Three focused sections explain how semantic HTML gives a page meaning.",
  },
  {
    number: "02",
    title: "Recall it actively",
    copy: "Four questions check the choices that make a page clearer.",
  },
  {
    number: "03",
    title: "Use it for real",
    copy: "Build and save an accessible article page in your course workspace.",
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

export default function AboutPage() {
  return (
    <>
      <SkipLink />
      <SiteNav currentPage="about" />

      <main id="main-content" tabIndex={-1}>
        <section className="about-hero" aria-labelledby="about-title">
          <div className="about-hero-copy">
            <p className="eyebrow">About Lovable Original</p>
            <h1 id="about-title">
              Learning should end in something you can do.
            </h1>
            <p className="about-lede">
              Lovable Original begins with Web Development Foundations: one
              18-minute semantic HTML lesson, a saved coding workspace, four
              recall questions, and progress you can return to.
            </p>
            <Link className="primary-action" href="/account">
              Start Web Development Foundations
              <ArrowIcon />
            </Link>
          </div>

          <aside
            className="about-loop"
            aria-label="The Lovable Original learning loop"
          >
            <p className="about-loop-label">One continuous learning loop</p>
            <ol>
              {learningLoop.map((step) => (
                <li key={step.number}>
                  <span className="about-loop-number">{step.number}</span>
                  <div>
                    <h2>{step.title}</h2>
                    <p>{step.copy}</p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </section>

        <section className="about-story" aria-labelledby="story-title">
          <div className="about-story-heading">
            <p className="eyebrow">Why we&apos;re building it</p>
            <h2 id="story-title">Passive study leaves too much behind.</h2>
          </div>

          <div className="about-story-copy">
            <p>
              Reading and watching can create the feeling of progress without
              the recall or practical confidence that real work demands. Lovable
              Original brings explanation, active practice, and building into
              one connected path.
            </p>
            <p>
              The first focused course is live now. Web Development Foundations
              takes one 18-minute lesson from explanation to a saved semantic
              HTML page, then records your best quiz score and progress.
            </p>
          </div>
        </section>

        <section className="about-standard" aria-labelledby="standard-title">
          <div className="about-standard-heading">
            <p className="eyebrow">The standard</p>
            <h2 id="standard-title">Every lesson has somewhere to go.</h2>
          </div>
          <p className="about-standard-copy">
            Today, a clear explanation leads to recall, then to a page you build
            and save. Projects, interview practice, flashcards, certificates,
            and an AI tutor are planned, not part of this first course.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
