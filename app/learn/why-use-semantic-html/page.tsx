import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteNav, SkipLink } from "../../site-chrome";

const canonicalPath = "/learn/why-use-semantic-html";
const pageTitle =
  "Why Use Semantic HTML? A Beginner Guide | Lovable Original";
const pageDescription =
  "Learn why semantic HTML matters, see how meaningful tags improve page structure, and continue into a free 18-minute lesson with a real build.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: canonicalPath,
  },
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
        alt: "A generic HTML page reorganized into clear header, main, article, and footer regions.",
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
        alt: "A generic HTML page reorganized into clear header, main, article, and footer regions.",
      },
    ],
  },
};

const reasons = [
  {
    number: "01",
    title: "The structure explains itself",
    copy: "Elements such as main, article, and footer describe the job of their content before CSS changes how the page looks.",
  },
  {
    number: "02",
    title: "Landmarks make navigation clearer",
    copy: "Browsers and assistive technology can identify major page regions instead of treating every wrapper as an unnamed box.",
  },
  {
    number: "03",
    title: "The next edit starts with context",
    copy: "A meaningful element tells you why a block exists, so layout and styling changes do not have to carry that explanation alone.",
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

export default function WhyUseSemanticHtmlPage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "Why Use Semantic HTML?",
    description: pageDescription,
    url: `https://lovable-original-eight.vercel.app${canonicalPath}`,
    author: {
      "@type": "Organization",
      name: "Lovable Original",
    },
    about: ["HTML", "semantic HTML", "web accessibility"],
  };

  return (
    <>
      <SkipLink />
      <SiteNav currentPage="course" />

      <main id="main-content" tabIndex={-1}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />

        <section
          className="semantic-answer-hero"
          aria-labelledby="semantic-answer-title"
        >
          <div className="semantic-answer-copy">
            <p className="eyebrow">A beginner answer</p>
            <h1 id="semantic-answer-title">Why use semantic HTML?</h1>
            <p className="semantic-answer-lede">
              Because a tag such as <code>&lt;main&gt;</code> tells the browser
              what content does. A generic <code>&lt;div&gt;</code> only creates
              a box.
            </p>
            <Link
              className="primary-action"
              href="/learn/web-development-foundations/semantic-html"
            >
              Learn semantic HTML in 18 minutes
              <ArrowIcon />
            </Link>
            <p className="learn-entry-note">
              Free to read · Build a real article · Five structure checks
            </p>
          </div>

          <figure className="semantic-meaning-board">
            <figcaption>
              <span>Same page, clearer meaning</span>
              <span>Before / after</span>
            </figcaption>
            <div className="meaning-comparison">
              <div className="meaning-panel meaning-panel-generic">
                <span className="meaning-panel-label">Generic wrappers</span>
                <div>
                  <code>&lt;div&gt;</code>
                  <span>?</span>
                </div>
                <div className="meaning-generic-main">
                  <code>&lt;div&gt;</code>
                  <div>
                    <code>&lt;div&gt;</code>
                    <span>?</span>
                  </div>
                </div>
                <div>
                  <code>&lt;div&gt;</code>
                  <span>?</span>
                </div>
              </div>

              <div className="meaning-arrow" aria-hidden="true">
                <ArrowIcon />
              </div>

              <div className="meaning-panel meaning-panel-semantic">
                <span className="meaning-panel-label">Named regions</span>
                <div>
                  <code>&lt;header&gt;</code>
                  <span>Introduction</span>
                </div>
                <div className="meaning-semantic-main">
                  <code>&lt;main&gt;</code>
                  <div>
                    <code>&lt;article&gt;</code>
                    <span>Standalone story</span>
                  </div>
                </div>
                <div>
                  <code>&lt;footer&gt;</code>
                  <span>Source</span>
                </div>
              </div>
            </div>
          </figure>
        </section>

        <article className="semantic-answer-content">
          <header className="semantic-answer-intro">
            <p className="eyebrow">The short version</p>
            <h2>Use the element that names the content’s job.</h2>
            <div>
              <p>
                Semantic HTML is markup that carries meaning. It turns an
                outline of anonymous containers into a document with named
                regions, clear headings, and content that can stand on its own.
              </p>
              <p>
                CSS still controls appearance. Semantic HTML gives the page a
                useful structure first, even before the design loads.
              </p>
            </div>
          </header>

          <section
            className="semantic-reason-section"
            aria-labelledby="semantic-reasons-title"
          >
            <div className="semantic-reason-heading">
              <p className="eyebrow">What changes</p>
              <h2 id="semantic-reasons-title">
                Three reasons meaning beats another div.
              </h2>
            </div>
            <ol className="semantic-reason-list">
              {reasons.map((reason) => (
                <li key={reason.number}>
                  <span>{reason.number}</span>
                  <div>
                    <h3>{reason.title}</h3>
                    <p>{reason.copy}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section
            className="semantic-answer-example"
            aria-labelledby="semantic-example-title"
          >
            <div className="semantic-example-heading">
              <p className="eyebrow">A small example</p>
              <h2 id="semantic-example-title">
                The tags make the reading order visible.
              </h2>
              <p>
                This outline names one unique main region, one independent
                article, and the supporting information that closes it.
              </p>
              <Link
                className="learn-reference-link"
                href="/learn/semantic-html-cheat-sheet"
              >
                Compare eight semantic tags
                <ArrowIcon />
              </Link>
            </div>
            <pre aria-label="A short semantic HTML example">
              <code>{`<main>
  <article>
    <header>
      <h1>Field notes from the web</h1>
    </header>

    <section aria-labelledby="lesson">
      <h2 id="lesson">What I learned</h2>
      <p>Meaning comes before styling.</p>
    </section>

    <footer>Written after the first lesson.</footer>
  </article>
</main>`}</code>
            </pre>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
