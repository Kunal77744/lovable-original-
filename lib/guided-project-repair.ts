import type { GuidedProjectCheckId } from "@/lib/guided-project";

export type GuidedProjectRepairChoice = {
  id: string;
  code: string;
  correct: boolean;
  feedback: string;
};

export type GuidedProjectRepairDrill = {
  checkId: GuidedProjectCheckId;
  concept: string;
  title: string;
  prompt: string;
  brokenCode: string;
  choices: GuidedProjectRepairChoice[];
};

const GUIDED_PROJECT_REPAIR_DRILLS: Record<
  GuidedProjectCheckId,
  GuidedProjectRepairDrill
> = {
  "ordered-landmarks": {
    checkId: "ordered-landmarks",
    concept: "Page landmarks",
    title: "Put the page landmarks in reading order.",
    prompt: "Which repair gives the page one clear beginning, middle, and end?",
    brokenCode: `<main>...</main>
<header>...</header>
<footer>...</footer>`,
    choices: [
      {
        id: "header-main-footer",
        code: `<header>...</header>
<main>...</main>
<footer>...</footer>`,
        correct: true,
        feedback:
          "Correct. Header, main, and footer now follow the page's reading order.",
      },
      {
        id: "main-header-footer",
        code: `<main>...</main>
<header>...</header>
<footer>...</footer>`,
        correct: false,
        feedback:
          "Not yet. The header still comes after the page's main content.",
      },
    ],
  },
  "single-article": {
    checkId: "single-article",
    concept: "Article boundary",
    title: "Keep the field guide inside one article.",
    prompt: "Which repair leaves one complete article inside main?",
    brokenCode: `<main>
  <article>First half</article>
  <article>Second half</article>
</main>`,
    choices: [
      {
        id: "one-article",
        code: `<main>
  <article>Complete field guide</article>
</main>`,
        correct: true,
        feedback:
          "Correct. One main landmark now contains one complete article.",
      },
      {
        id: "two-articles",
        code: `<main>
  <article>First half</article>
  <article>Second half</article>
</main>`,
        correct: false,
        feedback:
          "Not yet. The project asks for one article, not two separate articles.",
      },
    ],
  },
  "article-introduction": {
    checkId: "article-introduction",
    concept: "Heading hierarchy",
    title: "Lead with the topic before the introduction.",
    prompt: "Which repair gives the article a clear topic and opening paragraph?",
    brokenCode: `<article>
  <p>This guide explains semantic HTML.</p>
  <h1>Semantic HTML field guide</h1>
</article>`,
    choices: [
      {
        id: "heading-before-copy",
        code: `<article>
  <h1>Semantic HTML field guide</h1>
  <p>This guide explains semantic HTML.</p>
</article>`,
        correct: true,
        feedback:
          "Correct. The h1 names the topic before the opening paragraph develops it.",
      },
      {
        id: "copy-before-heading",
        code: `<article>
  <p>This guide explains semantic HTML.</p>
  <h1>Semantic HTML field guide</h1>
</article>`,
        correct: false,
        feedback:
          "Not yet. Put the article's single h1 before its opening paragraph.",
      },
    ],
  },
  "two-sections": {
    checkId: "two-sections",
    concept: "Section structure",
    title: "Give each part of the guide its own heading.",
    prompt: "Which repair creates two named sections inside the article?",
    brokenCode: `<section>
  <p>Landmarks give a page structure.</p>
</section>
<section>
  <p>Headings create an outline.</p>
</section>`,
    choices: [
      {
        id: "two-headed-sections",
        code: `<section>
  <h2>Landmarks</h2>
  <p>Landmarks give a page structure.</p>
</section>
<section>
  <h2>Headings</h2>
  <p>Headings create an outline.</p>
</section>`,
        correct: true,
        feedback:
          "Correct. Both sections now have an h2 that names the idea they explain.",
      },
      {
        id: "one-heading-for-two-sections",
        code: `<h2>Page structure</h2>
<section>Landmarks</section>
<section>Headings</section>`,
        correct: false,
        feedback:
          "Not yet. Each section needs its own h2 inside the section.",
      },
    ],
  },
  "section-copy": {
    checkId: "section-copy",
    concept: "Explained sections",
    title: "Explain the idea inside every section.",
    prompt: "Which repair gives both section headings supporting copy?",
    brokenCode: `<section><h2>Landmarks</h2></section>
<section><h2>Headings</h2></section>`,
    choices: [
      {
        id: "copy-in-each-section",
        code: `<section>
  <h2>Landmarks</h2>
  <p>Landmarks name each page region.</p>
</section>
<section>
  <h2>Headings</h2>
  <p>Headings reveal the content order.</p>
</section>`,
        correct: true,
        feedback:
          "Correct. Each section now has a paragraph that develops its heading.",
      },
      {
        id: "copy-after-sections",
        code: `<section><h2>Landmarks</h2></section>
<section><h2>Headings</h2></section>
<p>Both ideas matter.</p>`,
        correct: false,
        feedback:
          "Not yet. Put supporting copy inside each section, not after both sections.",
      },
    ],
  },
  "supporting-aside": {
    checkId: "supporting-aside",
    concept: "Supporting content",
    title: "Mark the useful note as supporting content.",
    prompt: "Which repair gives the article one semantic supporting note?",
    brokenCode: `<div class="tip">
  Read the page without its styles.
</div>`,
    choices: [
      {
        id: "semantic-aside",
        code: `<aside>
  Read the page without its styles.
</aside>`,
        correct: true,
        feedback:
          "Correct. Aside tells the browser this note supports the article's main idea.",
      },
      {
        id: "generic-div",
        code: `<div class="tip">
  Read the page without its styles.
</div>`,
        correct: false,
        feedback:
          "Not yet. A class can style the note, but it does not give the note semantic meaning.",
      },
    ],
  },
};

export function getGuidedProjectRepairDrill(
  checkId: GuidedProjectCheckId,
): GuidedProjectRepairDrill {
  return GUIDED_PROJECT_REPAIR_DRILLS[checkId];
}
