import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteNav, SkipLink } from "../site-chrome";

export const metadata: Metadata = {
  title: "About Lovable Original | Learn, recall, and build",
  description:
    "Lovable Original is an AI-first learning platform for students who want to understand faster, remember longer, and build job-ready skills.",
  alternates: {
    canonical: "/about",
  },
};

const learningLoop = [
  {
    number: "01",
    title: "Learn it clearly",
    copy: "Focused explanations turn difficult topics into ideas you can work with.",
  },
  {
    number: "02",
    title: "Recall it actively",
    copy: "Prompts, quizzes, and practice make memory part of the lesson.",
  },
  {
    number: "03",
    title: "Use it for real",
    copy: "Projects and interview practice connect knowledge to practical ability.",
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
              Lovable Original is an AI-first learning platform for students who
              want to understand difficult material faster, remember it longer,
              and turn knowledge into job-ready skill.
            </p>
            <Link className="primary-action" href="/#learning-path">
              Explore the learning path
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
              The first focused course is being built now. The goal is simple:
              help a student move from &quot;I&apos;ve seen this before&quot; to
              &quot;I can explain it, use it, and prove it.&quot;
            </p>
          </div>
        </section>

        <section className="about-standard" aria-labelledby="standard-title">
          <div className="about-standard-heading">
            <p className="eyebrow">The standard</p>
            <h2 id="standard-title">Every lesson has somewhere to go.</h2>
          </div>
          <p className="about-standard-copy">
            A clear explanation leads to recall. Recall leads to practice.
            Practice leads to a project, an interview answer, or a skill you can
            use outside the course.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
