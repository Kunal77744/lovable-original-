import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteNav, SkipLink } from "../site-chrome";

export const metadata: Metadata = {
  title: "About Lovable Original | Learn coding by doing",
  description:
    "See how Lovable Original connects a short coding lesson, checked real work, and saved beginner practice you can return to.",
  alternates: {
    canonical: "/about",
  },
};

const learningLoop = [
  {
    number: "01",
    title: "Learn one idea",
    copy: "Read a complete 18-minute semantic HTML lesson before you decide whether to sign up.",
  },
  {
    number: "02",
    title: "Build and check it",
    copy: "Save an article page, test your recall, and revise a guided project against six checks.",
  },
  {
    number: "03",
    title: "Practice what comes next",
    copy: "Solve six browser-run JavaScript problems and resume at the first unfinished step.",
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
            <h1 id="about-title">Learn coding by doing, then keep going.</h1>
            <p className="about-lede">
              Take a short lesson, build and check real work, then keep
              practicing from where you left off. The first path connects
              semantic HTML, a guided project, and six JavaScript problems.
            </p>
            <Link
              className="primary-action"
              href="/learn/web-development-foundations/semantic-html"
            >
              Start Web Development Foundations
              <ArrowIcon />
            </Link>
          </div>

          <aside
            className="about-loop"
            aria-label="The Lovable Original learning loop"
          >
            <p className="about-loop-label">Learn · build · practice</p>
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
              The first learner path is live now. It starts with one public
              18-minute lesson, continues through a private six-check field
              guide, and moves into six judged JavaScript problems you can
              return to.
            </p>
          </div>
        </section>

        <section className="about-standard" aria-labelledby="standard-title">
          <div className="about-standard-heading">
            <p className="eyebrow">The standard</p>
            <h2 id="standard-title">Every result should lead to the next try.</h2>
          </div>
          <div className="about-standard-details">
            <p className="about-standard-label">Live now</p>
            <ul className="about-standard-list">
              <li>
                Read one complete 18-minute semantic HTML lesson, then save your
                workspace, assignment, quiz result, notes, and revision.
              </li>
              <li>
                Build a private semantic HTML field guide and revise it against
                six clear review checks.
              </li>
              <li>
                Work through six browser-run JavaScript problems with saved
                code, verdicts, and Accepted progress.
              </li>
              <li>
                Return after sign-in to your best quiz result, private learner
                profile, and first unfinished practice step.
              </li>
            </ul>
            <p className="about-standard-planned">
              <span>Also live</span>
              A lesson-bound semantic HTML tutor, private course certificate,
              five-question JavaScript fundamentals interview drill, and
              private saved JavaScript playground.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
