import type { Metadata } from "next";
import Link from "next/link";
import { CSS_PRACTICE_CHALLENGES } from "@/lib/css-practice-challenges";
import { SiteFooter, SiteNav, SkipLink } from "../../site-chrome";
import styles from "../question-answer.module.css";

const canonicalPath = "/learn/what-is-the-css-box-model";
const pageTitle = "What Is the CSS Box Model? A Beginner Guide | Lovable Original";
const pageDescription =
  "Learn how content, padding, border, and margin form the CSS box model, then practice selectors and predictable sizing in six free challenges.";
const firstChallenge = CSS_PRACTICE_CHALLENGES[0];

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
        alt: "The four layers of the CSS box model: content, padding, border, and margin.",
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
        alt: "The four layers of the CSS box model: content, padding, border, and margin.",
      },
    ],
  },
};

const layers = [
  {
    number: "01",
    title: "Content holds the thing itself",
    copy: "Text, an image, or another child sits in the content area. Width and height apply here by default.",
  },
  {
    number: "02",
    title: "Padding creates inner space",
    copy: "Padding separates the content from its border. The element's background continues through this layer.",
  },
  {
    number: "03",
    title: "The border draws the edge",
    copy: "A border wraps the content and padding. Its thickness contributes to the final rendered size.",
  },
  {
    number: "04",
    title: "Margin separates nearby boxes",
    copy: "Margin sits outside the border and creates distance between this element and the next one.",
  },
];

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" width="20" height="20" fill="none">
      <path d="M4 10h11M11 6l4 4-4 4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export default function CssBoxModelAnswerPage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "What Is the CSS Box Model?",
    description: pageDescription,
    url: `https://lovable-original-eight.vercel.app${canonicalPath}`,
    author: { "@type": "Organization", name: "Lovable Original" },
    about: ["CSS", "CSS box model", "CSS selectors"],
  };

  return (
    <div className={styles.page}>
      <SkipLink />
      <SiteNav currentPage="course" />

      <main id="main-content" tabIndex={-1}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />

        <section className={styles.hero} aria-labelledby="css-answer-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>A beginner answer</p>
            <h1 id="css-answer-title">What is the CSS box model?</h1>
            <p className={styles.lede}>
              Every element is a rectangular box made from content, padding,
              border, and margin. Those four layers decide how much room the
              element takes up.
            </p>
            <Link
              className={styles.primaryAction}
              data-primary-action="true"
              href={`/practice/css/${firstChallenge.slug}`}
            >
              Practice CSS in 6 challenges
              <ArrowIcon />
            </Link>
            <p className={styles.note}>
              Free to try · Exact checks · Saved drafts with an account
            </p>
          </div>

          <figure className={styles.visual}>
            <figcaption>
              <span>One element, four layers</span>
              <span className={styles.visualBadge}>Outside to inside</span>
            </figcaption>
            <div className={styles.boxStage}>
              <div className={styles.boxLayer}>
                Margin
                <div className={`${styles.boxLayer} ${styles.boxBorder}`}>
                  Border
                  <div className={`${styles.boxLayer} ${styles.boxPadding}`}>
                    Padding
                    <div className={`${styles.boxLayer} ${styles.boxContent}`}>
                      Content · 280px
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </figure>
        </section>

        <article className={styles.content}>
          <header className={styles.articleIntro}>
            <p className={styles.eyebrow}>The short version</p>
            <h2>A selector finds the element. The box model sizes it.</h2>
            <div>
              <p>
                A CSS selector answers which element should change. The box
                model then explains the space around that element, from its
                content to the margin outside its border.
              </p>
              <p>
                The common surprise is arithmetic. With the default content-box
                model, padding and border are added outside a declared width.
                With <code>box-sizing: border-box</code>, they fit inside it.
              </p>
            </div>
          </header>

          <section className={styles.stepsSection} aria-labelledby="box-layers-title">
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>Read the box</p>
              <h2 id="box-layers-title">Four layers, one final size.</h2>
              <p>
                Start at the content and move outward. Each layer has a separate
                job in the layout.
              </p>
            </div>
            <ol className={styles.stepList}>
              {layers.map((layer) => (
                <li key={layer.number}>
                  <span>{layer.number}</span>
                  <div>
                    <h3>{layer.title}</h3>
                    <p>{layer.copy}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.exampleSection} aria-labelledby="border-box-title">
            <div className={styles.exampleHeading}>
              <p className={styles.eyebrow}>Predictable width</p>
              <h2 id="border-box-title">Keep padding inside the number you chose.</h2>
              <p>
                This rule keeps the whole card at 280 pixels wide, including its
                padding and border.
              </p>
              <Link
                className={styles.referenceLink}
                href="/learn/web-development-foundations/css-selectors-box-model"
              >
                Read the complete CSS lesson
                <ArrowIcon />
              </Link>
            </div>
            <pre className={styles.exampleCard} aria-label="A CSS border-box example">
              <code>{`.learning-card {
  width: 280px;
  padding: 24px;
  border: 2px solid #287652;
  box-sizing: border-box;
}`}</code>
            </pre>
          </section>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
