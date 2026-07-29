import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteNav, SkipLink } from "../../site-chrome";

const pageTitle = "HTML Semantic Tags Cheat Sheet | Lovable Original";
const pageDescription =
  "Use this HTML semantic tags cheat sheet to choose header, nav, main, article, section, aside, and footer, with examples and a six-check page review.";
const canonicalPath = "/learn/semantic-html-cheat-sheet";

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
        alt: "A semantic HTML page arranged into header, navigation, main content, article, and footer regions.",
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
        alt: "A semantic HTML page arranged into header, navigation, main content, article, and footer regions.",
      },
    ],
  },
};

const semanticTags = [
  {
    tag: "<header>",
    job: "Introduces a page or a section.",
    use: "Use it for a title, introductory copy, logo, or local navigation that belongs to the nearest page, article, or section.",
    avoid:
      "Do not assume every header must sit at the very top of the document. An article can have its own header.",
  },
  {
    tag: "<nav>",
    job: "Groups major navigation links.",
    use: "Use it for a primary menu, a table of contents, or a set of links that helps people move through the site or page.",
    avoid:
      "Do not wrap every small group of links in nav. Footer policies and one-off links often need no navigation landmark.",
  },
  {
    tag: "<main>",
    job: "Contains the page’s unique central content.",
    use: "Use one visible main element for the content that makes this page different from the rest of the site.",
    avoid:
      "Do not place repeated site navigation, the site-wide footer, or more than one visible main region inside a document.",
  },
  {
    tag: "<article>",
    job: "Holds a self-contained composition.",
    use: "Use it when the content could stand on its own or be reused elsewhere, such as a post, tutorial, review, or forum message.",
    avoid:
      "Do not use article merely because a block is visually large. Independence is the test, not size.",
  },
  {
    tag: "<section>",
    job: "Groups a themed part of a document.",
    use: "Use it when a heading can name the group and the group belongs to a larger page or article.",
    avoid:
      "Do not use section as a styling wrapper. If no useful heading exists, a div may describe the structure more honestly.",
  },
  {
    tag: "<aside>",
    job: "Adds related but nonessential context.",
    use: "Use it for a glossary, pull quote, related links, author note, or sidebar that supports the surrounding content.",
    avoid:
      "Do not put information in aside if understanding the main content depends on it.",
  },
  {
    tag: "<figure>",
    job: "Connects media or an example with its caption.",
    use: "Use it for an image, diagram, code sample, or table that can be referenced as one unit. Pair it with figcaption when a caption helps.",
    avoid:
      "Do not use figure just to center an image. The content-and-caption relationship is what gives it meaning.",
  },
  {
    tag: "<footer>",
    job: "Closes a page or section with supporting information.",
    use: "Use it for authorship, related links, legal text, or source details that belong to the nearest page, article, or section.",
    avoid:
      "Do not limit footer to the bottom of the website. An article can have its own footer too.",
  },
];

const reviewChecks = [
  {
    number: "01",
    title: "One visible main",
    copy: "The page has one main element around its unique content, outside the repeated site header and footer.",
  },
  {
    number: "02",
    title: "A logical heading outline",
    copy: "The h1 names the page, and lower-level headings describe nested topics without jumping levels for visual size.",
  },
  {
    number: "03",
    title: "Navigation earns its landmark",
    copy: "Nav wraps a meaningful route or table of contents, not every cluster of links.",
  },
  {
    number: "04",
    title: "Articles can stand alone",
    copy: "Each article makes sense if it appears in a feed, search result, or another page.",
  },
  {
    number: "05",
    title: "Sections have names",
    copy: "Each section represents a real topic and normally begins with a heading that identifies it.",
  },
  {
    number: "06",
    title: "Generic wrappers stay generic",
    copy: "Div and span handle layout or styling when no semantic element describes the content’s job.",
  },
];

const faqItems = [
  {
    question: "What is semantic HTML?",
    answer:
      "Semantic HTML uses elements whose names describe the role of their content. A main element communicates more than a generic div because its purpose is built into the markup.",
  },
  {
    question: "Should I use section or div?",
    answer:
      "Use section for a named topic within a larger document, usually with its own heading. Use div when you only need a neutral wrapper for layout, styling, or scripting.",
  },
  {
    question: "Can an article contain sections?",
    answer:
      "Yes. An article can contain sections when each section covers a distinct part of that self-contained article. A section can also contain articles when it groups several independent entries under one theme.",
  },
  {
    question: "Does semantic HTML improve SEO?",
    answer:
      "It helps search engines and assistive technology understand page structure, but it does not guarantee rankings. Useful content, crawlability, links, and a clear answer to the search query still matter.",
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

export default function SemanticHtmlCheatSheetPage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "HTML Semantic Tags Cheat Sheet",
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
          className="cheat-sheet-hero"
          aria-labelledby="cheat-sheet-title"
        >
          <div className="cheat-sheet-hero-copy">
            <p className="eyebrow">HTML semantic tags cheat sheet</p>
            <h1 id="cheat-sheet-title">
              Choose the tag that explains the job.
            </h1>
            <p className="cheat-sheet-lede">
              A practical reference for <code>&lt;header&gt;</code>,{" "}
              <code>&lt;nav&gt;</code>, <code>&lt;main&gt;</code>,{" "}
              <code>&lt;article&gt;</code>, <code>&lt;section&gt;</code>,{" "}
              <code>&lt;aside&gt;</code>, and <code>&lt;footer&gt;</code>.
              Start with meaning, then use the complete example and six checks
              to review your page.
            </p>
            <Link
              className="primary-action"
              href="/courses/web-development-foundations"
            >
              Learn semantic HTML in 18 minutes
              <ArrowIcon />
            </Link>
            <p className="learn-entry-note">
              Free course overview · Full lesson readable before signup
            </p>
          </div>

          <figure className="semantic-anatomy-board">
            <figcaption>
              <span>A semantic page anatomy</span>
              <span>Meaning before styling</span>
            </figcaption>
            <div className="anatomy-canvas">
              <div className="anatomy-header">
                <code>&lt;header&gt;</code>
                <div>
                  <span>Page title</span>
                  <code>&lt;nav&gt;</code>
                </div>
              </div>
              <div className="anatomy-main">
                <code>&lt;main&gt;</code>
                <div className="anatomy-article">
                  <code>&lt;article&gt;</code>
                  <div>
                    <span>Self-contained story</span>
                    <span>Heading + content</span>
                  </div>
                </div>
                <div className="anatomy-aside">
                  <code>&lt;aside&gt;</code>
                  <span>Related context</span>
                </div>
              </div>
              <div className="anatomy-footer">
                <code>&lt;footer&gt;</code>
                <span>Source and authorship</span>
              </div>
            </div>
          </figure>
        </section>

        <nav className="cheat-sheet-index" aria-label="On this page">
          <span>On this page</span>
          <a href="#tag-reference">Tag reference</a>
          <a href="#decision-guide">Article, section, or div?</a>
          <a href="#complete-example">Complete example</a>
          <a href="#review-checks">Six checks</a>
          <a href="#semantic-html-faq">FAQ</a>
        </nav>

        <article className="cheat-sheet-content">
          <header className="cheat-sheet-introduction">
            <p className="eyebrow">The fast rule</p>
            <h2>Pick an element for what the content is, not how it looks.</h2>
            <p>
              Semantic elements describe the role of content. CSS controls its
              appearance. That separation makes a document easier to navigate,
              maintain, and interpret without forcing a particular visual
              design.
            </p>
            <p>
              Start by asking what job a block performs. Is it the page’s unique
              content? Use <code>&lt;main&gt;</code>. Could it stand alone? Try{" "}
              <code>&lt;article&gt;</code>. Is it one named topic within
              something larger? Consider <code>&lt;section&gt;</code>. If the
              wrapper has no content meaning, <code>&lt;div&gt;</code> remains
              the honest choice.
            </p>
          </header>

          <section
            className="semantic-tag-reference"
            id="tag-reference"
            aria-labelledby="tag-reference-title"
          >
            <div className="section-kicker">
              <p className="eyebrow">Quick reference</p>
              <h2 id="tag-reference-title">Eight tags and the job each one does.</h2>
            </div>
            <div className="semantic-tag-list">
              {semanticTags.map((item) => (
                <section className="semantic-tag-row" key={item.tag}>
                  <div className="semantic-tag-name">
                    <code>{item.tag}</code>
                    <strong>{item.job}</strong>
                  </div>
                  <div>
                    <p>
                      <b>Use it when:</b> {item.use}
                    </p>
                    <p>
                      <b>Watch for:</b> {item.avoid}
                    </p>
                  </div>
                </section>
              ))}
            </div>
          </section>

          <section
            className="semantic-decision-guide"
            id="decision-guide"
            aria-labelledby="decision-guide-title"
          >
            <div className="decision-guide-copy">
              <p className="eyebrow">The common fork</p>
              <h2 id="decision-guide-title">Article, section, or div?</h2>
              <p>
                These elements can all wrap a block, but they do not communicate
                the same thing. Use the smallest decision that fits the content.
              </p>
            </div>
            <ol className="decision-path">
              <li>
                <span>01</span>
                <div>
                  <h3>Could this content stand on its own?</h3>
                  <p>
                    If it still makes sense in a feed, search result, or another
                    page, use <code>&lt;article&gt;</code>.
                  </p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <h3>Can a heading name this part?</h3>
                  <p>
                    If it is one distinct topic inside a larger document, use{" "}
                    <code>&lt;section&gt;</code>.
                  </p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <h3>Is the wrapper only for layout or behavior?</h3>
                  <p>
                    If it has no content role of its own, use{" "}
                    <code>&lt;div&gt;</code>.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <section
            className="semantic-code-example"
            id="complete-example"
            aria-labelledby="complete-example-title"
          >
            <div className="code-example-heading">
              <div>
                <p className="eyebrow">Complete example</p>
                <h2 id="complete-example-title">
                  A small page with a clear reading order.
                </h2>
              </div>
              <p>
                Read the structure without the CSS. The element names still tell
                you where the page begins, what matters most, what can stand
                alone, and what is supplementary.
              </p>
            </div>
            <pre aria-label="Complete semantic HTML page example">
              <code>{`<body>
  <header>
    <a href="/">Field Notes</a>
    <nav aria-label="Primary">
      <a href="/guides">Guides</a>
      <a href="/about">About</a>
    </nav>
  </header>

  <main>
    <article>
      <header>
        <p>HTML foundations</p>
        <h1>How landmarks shape a page</h1>
      </header>

      <section aria-labelledby="why-landmarks">
        <h2 id="why-landmarks">Why landmarks matter</h2>
        <p>They give each region a recognizable job.</p>
      </section>

      <aside aria-labelledby="quick-check">
        <h2 id="quick-check">Quick check</h2>
        <p>Can you find the page’s unique content?</p>
      </aside>

      <footer>
        <p>Written by the Field Notes team.</p>
      </footer>
    </article>
  </main>

  <footer>
    <p>© Field Notes</p>
  </footer>
</body>`}</code>
            </pre>
            <div className="code-example-notes">
              <p>
                <span>1</span>
                The site header and site footer sit outside main because they
                repeat across pages.
              </p>
              <p>
                <span>2</span>
                The article has its own header and footer because both describe
                that self-contained story.
              </p>
              <p>
                <span>3</span>
                The section and aside each have a heading, so their purpose
                stays clear in the document outline.
              </p>
            </div>
          </section>

          <section
            className="semantic-review-section"
            id="review-checks"
            aria-labelledby="review-checks-title"
          >
            <div className="review-heading">
              <p className="eyebrow">Before you ship</p>
              <h2 id="review-checks-title">Review the page in six checks.</h2>
              <p>
                A semantic page should make sense before its colors, columns,
                and spacing load. Use these checks on the HTML itself.
              </p>
            </div>
            <ol className="semantic-review-list">
              {reviewChecks.map((check) => (
                <li key={check.number}>
                  <span>{check.number}</span>
                  <div>
                    <h3>{check.title}</h3>
                    <p>{check.copy}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="lesson-continuation">
              Want to apply the reference to a real page?{" "}
              <Link href="/learn/semantic-html">
                Build a saved semantic HTML article in the focused lesson
              </Link>
              .
            </p>
          </section>

          <section
            className="semantic-faq"
            id="semantic-html-faq"
            aria-labelledby="semantic-faq-title"
          >
            <div>
              <p className="eyebrow">Short answers</p>
              <h2 id="semantic-faq-title">Semantic HTML FAQ</h2>
            </div>
            <div className="semantic-faq-list">
              {faqItems.map((item) => (
                <details key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
