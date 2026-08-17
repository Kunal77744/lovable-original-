import { parse } from "parse5";
import { MAX_SEMANTIC_HTML_LENGTH } from "@/lib/semantic-html-workspace";

export const GUIDED_PROJECT_SLUG = "semantic-html-article";
export const GUIDED_PROJECT_TITLE = "Semantic HTML field guide";
export const GUIDED_PROJECT_TOTAL_CHECKS = 6;

export const GUIDED_PROJECT_STARTER = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>My field guide to the web</title>
    <style>
      body {
        margin: 0;
        padding: 2rem;
        color: #17231e;
        background: #f6f7f2;
        font: 16px/1.65 system-ui, sans-serif;
      }

      header, main, footer {
        max-width: 46rem;
        margin-inline: auto;
      }

      article, aside {
        margin-block: 2rem;
      }
    </style>
  </head>
  <body>
    <header>
      <p>My field guide to the web</p>
    </header>

    <main>
      <article>
        <!-- Add one h1 and an opening paragraph. -->

        <!-- Add at least two sections. Each needs an h2 and paragraph. -->

        <!-- Add one aside with a useful tip or supporting note. -->
      </article>
    </main>

    <footer>
      <p>Written while learning Web Development Foundations.</p>
    </footer>
  </body>
</html>`;

export type GuidedProjectCheckId =
  | "ordered-landmarks"
  | "single-article"
  | "article-introduction"
  | "two-sections"
  | "section-copy"
  | "supporting-aside";

export type GuidedProjectCheck = {
  id: GuidedProjectCheckId;
  label: string;
  guidance: string;
  passed: boolean;
};

export type GuidedProjectSubmission = {
  status: "completed" | "needs-revision";
  checks: GuidedProjectCheck[];
  passedChecks: number;
  totalChecks: number;
  submittedAt: string;
};

export type GuidedProjectRecord = {
  html: string;
  saved: boolean;
  updatedAt: string | null;
  hasUnreviewedChanges: boolean;
  submission: GuidedProjectSubmission | null;
};

type HtmlNode = {
  nodeName?: string;
  tagName?: string;
  childNodes?: HtmlNode[];
  value?: string;
};

export type GuidedProjectStructureItem = {
  tag: string;
  kind: "landmark" | "heading";
  description: string;
  label: string | null;
  depth: number;
};

export type GuidedProjectStructure = {
  items: GuidedProjectStructureItem[];
  landmarkCount: number;
  headingCount: number;
  truncated: boolean;
};

const STRUCTURE_LANDMARKS = new Map([
  ["header", "Page header"],
  ["nav", "Navigation"],
  ["main", "Main content"],
  ["article", "Article"],
  ["section", "Section"],
  ["aside", "Supporting note"],
  ["footer", "Page footer"],
]);
const STRUCTURE_ITEM_LIMIT = 24;

function descendants(node: HtmlNode): HtmlNode[] {
  const nodes: HtmlNode[] = [];

  for (const child of node.childNodes ?? []) {
    nodes.push(child, ...descendants(child));
  }

  return nodes;
}

function elementsWithin(node: HtmlNode | undefined) {
  return descendants(node ?? {}).filter((child) => Boolean(child.tagName));
}

function hasDirectContent(node: HtmlNode | undefined, tagName: string) {
  return elementsWithin(node).some(
    (child) => child.tagName?.toLowerCase() === tagName,
  );
}

function textContent(node: HtmlNode): string {
  return [node.value ?? "", ...(node.childNodes ?? []).map(textContent)]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getGuidedProjectStructure(
  html: string,
): GuidedProjectStructure {
  const document = parse(html) as HtmlNode;
  const elements = elementsWithin(document);
  const body = elements.find((node) => node.tagName === "body") ?? document;
  const items: GuidedProjectStructureItem[] = [];
  let landmarkCount = 0;
  let headingCount = 0;

  function visit(node: HtmlNode, depth: number) {
    const tag = node.tagName?.toLowerCase();
    const landmarkDescription = tag ? STRUCTURE_LANDMARKS.get(tag) : undefined;
    const headingMatch = tag?.match(/^h([1-6])$/);
    const isStructureItem = Boolean(landmarkDescription || headingMatch);

    if (landmarkDescription && tag) {
      landmarkCount += 1;
      if (items.length < STRUCTURE_ITEM_LIMIT) {
        items.push({
          tag,
          kind: "landmark",
          description: landmarkDescription,
          label: null,
          depth,
        });
      }
    } else if (headingMatch && tag) {
      headingCount += 1;
      if (items.length < STRUCTURE_ITEM_LIMIT) {
        const headingText = textContent(node);
        items.push({
          tag,
          kind: "heading",
          description: `Heading level ${headingMatch[1]}`,
          label:
            headingText.length > 70
              ? `${headingText.slice(0, 67).trimEnd()}…`
              : headingText || "Untitled heading",
          depth,
        });
      }
    }

    for (const child of node.childNodes ?? []) {
      visit(child, isStructureItem ? depth + 1 : depth);
    }
  }

  for (const child of body.childNodes ?? []) {
    visit(child, 0);
  }

  return {
    items,
    landmarkCount,
    headingCount,
    truncated: landmarkCount + headingCount > STRUCTURE_ITEM_LIMIT,
  };
}

export function getEmptyGuidedProjectChecks(): GuidedProjectCheck[] {
  return [
    {
      id: "ordered-landmarks",
      label: "Frame the page with ordered landmarks",
      guidance:
        "Place one <header> before <main> and one <footer> after it.",
      passed: false,
    },
    {
      id: "single-article",
      label: "Keep one complete article inside main",
      guidance: "Use exactly one <main> containing exactly one <article>.",
      passed: false,
    },
    {
      id: "article-introduction",
      label: "Open with a clear topic and introduction",
      guidance: "Give the article one <h1> followed by an opening <p>.",
      passed: false,
    },
    {
      id: "two-sections",
      label: "Develop the guide in two sections",
      guidance:
        "Add at least two <section> elements inside the article, each with an <h2>.",
      passed: false,
    },
    {
      id: "section-copy",
      label: "Explain the idea inside every section",
      guidance: "Give each section at least one paragraph of supporting copy.",
      passed: false,
    },
    {
      id: "supporting-aside",
      label: "Add one useful supporting note",
      guidance: "Place one <aside> inside the article for a tip or related detail.",
      passed: false,
    },
  ];
}

export function gradeGuidedProject(html: string): GuidedProjectCheck[] {
  const document = parse(html) as HtmlNode;
  const elements = elementsWithin(document);
  const body = elements.find((node) => node.tagName === "body");
  const directBodyElements = (body?.childNodes ?? []).filter((node) =>
    Boolean(node.tagName),
  );
  const headers = directBodyElements.filter((node) => node.tagName === "header");
  const mains = directBodyElements.filter((node) => node.tagName === "main");
  const footers = directBodyElements.filter((node) => node.tagName === "footer");
  const headerIndex = directBodyElements.indexOf(headers[0]);
  const mainIndex = directBodyElements.indexOf(mains[0]);
  const footerIndex = directBodyElements.indexOf(footers[0]);
  const articles = elementsWithin(mains[0]).filter(
    (node) => node.tagName === "article",
  );
  const article = articles[0];
  const articleElements = elementsWithin(article);
  const headings = articleElements.filter((node) => node.tagName === "h1");
  const firstHeadingIndex = articleElements.indexOf(headings[0]);
  const firstParagraphIndex = articleElements.findIndex(
    (node) => node.tagName === "p",
  );
  const sections = articleElements.filter((node) => node.tagName === "section");
  const sectionsHaveHeadings = sections.every((section) =>
    hasDirectContent(section, "h2"),
  );
  const sectionsHaveCopy = sections.every((section) =>
    hasDirectContent(section, "p"),
  );

  return getEmptyGuidedProjectChecks().map((check) => {
    switch (check.id) {
      case "ordered-landmarks":
        return {
          ...check,
          passed:
            headers.length === 1 &&
            mains.length === 1 &&
            footers.length === 1 &&
            headerIndex < mainIndex &&
            footerIndex > mainIndex,
        };
      case "single-article":
        return {
          ...check,
          passed: mains.length === 1 && articles.length === 1,
        };
      case "article-introduction":
        return {
          ...check,
          passed:
            headings.length === 1 &&
            firstHeadingIndex >= 0 &&
            firstParagraphIndex > firstHeadingIndex,
        };
      case "two-sections":
        return {
          ...check,
          passed: sections.length >= 2 && sectionsHaveHeadings,
        };
      case "section-copy":
        return {
          ...check,
          passed: sections.length >= 2 && sectionsHaveCopy,
        };
      case "supporting-aside":
        return {
          ...check,
          passed: articleElements.some((node) => node.tagName === "aside"),
        };
    }
  });
}

export function hasValidGuidedProjectHtml(html: string) {
  return html.length > 0 && html.length <= MAX_SEMANTIC_HTML_LENGTH;
}

export function isGuidedProjectSlug(slug: string) {
  return slug === GUIDED_PROJECT_SLUG;
}
