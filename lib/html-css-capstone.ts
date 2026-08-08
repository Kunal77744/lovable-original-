import { parse } from "parse5";
import { buildSandboxedPreviewDocument } from "@/lib/semantic-html-workspace";

export const HTML_CSS_CAPSTONE_SLUG = "html-css-resource-library";
export const HTML_CSS_CAPSTONE_TITLE = "Learning resource library";
export const HTML_CSS_CAPSTONE_TOTAL_CHECKS = 6;
export const MAX_HTML_CSS_CAPSTONE_HTML_LENGTH = 30_000;
export const MAX_HTML_CSS_CAPSTONE_CSS_LENGTH = 20_000;

export const HTML_CSS_CAPSTONE_STARTER_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>My learning library</title>
  </head>
  <body>
    <header>
      <p>My learning library</p>
    </header>

    <main>
      <article>
        <h1>Resources I can return to</h1>
        <p>Three useful starting points for building on the web.</p>

        <div class="resource-grid">
          <!-- Add three sections with the resource-card class. -->
          <!-- Each section needs an h2, a paragraph, and a resource-link. -->
        </div>
      </article>
    </main>

    <footer>
      <p>Built after Web Development Foundations.</p>
    </footer>
  </body>
</html>`;

export const HTML_CSS_CAPSTONE_STARTER_CSS = `:root {
  color: #17231e;
  background: #f6f7f2;
  font: 16px/1.6 system-ui, sans-serif;
}

body {
  margin: 0;
  padding: 32px;
}

header,
main,
footer {
  max-width: 880px;
  margin-inline: auto;
}

/* Turn this container into a spaced grid. */
.resource-grid {
}

/* Give every resource a predictable card box. */
.resource-card {
}

/* Turn each card link into a clear target. */
.resource-card .resource-link {
}`;

export type HtmlCssCapstoneCheckId =
  | "semantic-frame"
  | "three-resources"
  | "grid-layout"
  | "card-box"
  | "scoped-link"
  | "complete-contract";

export type HtmlCssCapstoneCheck = {
  id: HtmlCssCapstoneCheckId;
  label: string;
  guidance: string;
  passed: boolean;
};

export type HtmlCssCapstoneSubmission = {
  status: "completed" | "needs-revision";
  checks: HtmlCssCapstoneCheck[];
  passedChecks: number;
  totalChecks: number;
  submittedAt: string;
};

export type HtmlCssCapstoneRecord = {
  html: string;
  css: string;
  saved: boolean;
  updatedAt: string | null;
  hasUnreviewedChanges: boolean;
  submission: HtmlCssCapstoneSubmission | null;
};

type HtmlNode = {
  tagName?: string;
  childNodes?: HtmlNode[];
  attrs?: Array<{ name: string; value: string }>;
};

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

function hasClass(node: HtmlNode, className: string) {
  return Boolean(
    node.attrs
      ?.find((attribute) => attribute.name.toLowerCase() === "class")
      ?.value.split(/\s+/)
      .includes(className),
  );
}

function stripComments(css: string) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function escapeForRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function declarationBlock(css: string, selector: string) {
  const pattern = new RegExp(`${escapeForRegExp(selector)}\\s*\\{([^}]*)\\}`, "i");
  return stripComments(css).match(pattern)?.[1] ?? "";
}

function hasDeclaration(block: string, property: string, value?: RegExp) {
  const match = block.match(
    new RegExp(`(?:^|;)\\s*${escapeForRegExp(property)}\\s*:\\s*([^;]+)`, "i"),
  );

  return Boolean(match && (!value || value.test(match[1].trim())));
}

const NON_ZERO_LENGTH = /^(?!0(?:px|rem|em|%)?\b).+/i;

export function getEmptyHtmlCssCapstoneChecks(): HtmlCssCapstoneCheck[] {
  return [
    {
      id: "semantic-frame",
      label: "Frame the library with semantic landmarks",
      guidance: "Place one header before main, keep one article inside main, and finish with one footer.",
      passed: false,
    },
    {
      id: "three-resources",
      label: "Write three complete resource sections",
      guidance: "Add three resource-card sections. Give each one an h2, paragraph, and resource-link.",
      passed: false,
    },
    {
      id: "grid-layout",
      label: "Arrange the resources with a real grid",
      guidance: "Set .resource-grid to display: grid and add a non-zero gap between its children.",
      passed: false,
    },
    {
      id: "card-box",
      label: "Build one predictable reusable card",
      guidance: "Give .resource-card border-box sizing, non-zero padding, and a visible border.",
      passed: false,
    },
    {
      id: "scoped-link",
      label: "Create a clear link target inside each card",
      guidance: "Use .resource-card .resource-link with inline-block display, non-zero padding, and a green background.",
      passed: false,
    },
    {
      id: "complete-contract",
      label: "Connect the HTML hooks to the CSS rules",
      guidance: "Keep the resource-grid, resource-card, and resource-link class names aligned across both files.",
      passed: false,
    },
  ];
}

export function gradeHtmlCssCapstone(
  html: string,
  css: string,
): HtmlCssCapstoneCheck[] {
  const document = parse(html) as HtmlNode;
  const elements = elementsWithin(document);
  const body = elements.find((node) => node.tagName === "body");
  const directBodyElements = (body?.childNodes ?? []).filter((node) => node.tagName);
  const headers = directBodyElements.filter((node) => node.tagName === "header");
  const mains = directBodyElements.filter((node) => node.tagName === "main");
  const footers = directBodyElements.filter((node) => node.tagName === "footer");
  const headerIndex = directBodyElements.indexOf(headers[0]);
  const mainIndex = directBodyElements.indexOf(mains[0]);
  const footerIndex = directBodyElements.indexOf(footers[0]);
  const articles = elementsWithin(mains[0]).filter((node) => node.tagName === "article");
  const articleElements = elementsWithin(articles[0]);
  const resourceCards = articleElements.filter(
    (node) => node.tagName === "section" && hasClass(node, "resource-card"),
  );
  const resourceCardsComplete =
    resourceCards.length >= 3 &&
    resourceCards.every((card) => {
      const cardElements = elementsWithin(card);
      return (
        cardElements.some((node) => node.tagName === "h2") &&
        cardElements.some((node) => node.tagName === "p") &&
        cardElements.some(
          (node) => node.tagName === "a" && hasClass(node, "resource-link"),
        )
      );
    });
  const hasGridHook = articleElements.some((node) => hasClass(node, "resource-grid"));
  const gridBlock = declarationBlock(css, ".resource-grid");
  const cardBlock = declarationBlock(css, ".resource-card");
  const linkBlock = declarationBlock(css, ".resource-card .resource-link");
  const hasGridRule =
    hasDeclaration(gridBlock, "display", /^grid$/i) &&
    hasDeclaration(gridBlock, "gap", NON_ZERO_LENGTH);
  const hasCardRule =
    hasDeclaration(cardBlock, "box-sizing", /^border-box$/i) &&
    hasDeclaration(cardBlock, "padding", NON_ZERO_LENGTH) &&
    hasDeclaration(cardBlock, "border", NON_ZERO_LENGTH);
  const hasLinkRule =
    hasDeclaration(linkBlock, "display", /^inline-block$/i) &&
    hasDeclaration(linkBlock, "padding", NON_ZERO_LENGTH) &&
    (hasDeclaration(linkBlock, "background", /^(?:#287652|rgb\(40\s*,\s*118\s*,\s*82\))$/i) ||
      hasDeclaration(linkBlock, "background-color", /^(?:#287652|rgb\(40\s*,\s*118\s*,\s*82\))$/i));

  return getEmptyHtmlCssCapstoneChecks().map((check) => {
    switch (check.id) {
      case "semantic-frame":
        return {
          ...check,
          passed:
            headers.length === 1 &&
            mains.length === 1 &&
            articles.length === 1 &&
            footers.length === 1 &&
            headerIndex < mainIndex &&
            footerIndex > mainIndex,
        };
      case "three-resources":
        return { ...check, passed: resourceCardsComplete };
      case "grid-layout":
        return { ...check, passed: hasGridRule };
      case "card-box":
        return { ...check, passed: hasCardRule };
      case "scoped-link":
        return { ...check, passed: hasLinkRule };
      case "complete-contract":
        return {
          ...check,
          passed:
            hasGridHook &&
            resourceCards.length >= 3 &&
            resourceCards.every((card) =>
              elementsWithin(card).some(
                (node) => node.tagName === "a" && hasClass(node, "resource-link"),
              ),
            ) &&
            gridBlock.length > 0 &&
            cardBlock.length > 0 &&
            linkBlock.length > 0,
        };
    }
  });
}

export function hasValidHtmlCssCapstoneSource(html: string, css: string) {
  return (
    html.length > 0 &&
    html.length <= MAX_HTML_CSS_CAPSTONE_HTML_LENGTH &&
    css.length > 0 &&
    css.length <= MAX_HTML_CSS_CAPSTONE_CSS_LENGTH
  );
}

function sanitizePreviewCss(css: string) {
  return css
    .replace(/@import[\s\S]*?;/gi, "")
    .replace(/url\s*\([^)]*\)/gi, "none")
    .replace(/</g, "\\3c ");
}

export function buildHtmlCssCapstonePreview(html: string, css: string) {
  const safeHtml = buildSandboxedPreviewDocument(html);
  const safeCss = sanitizePreviewCss(css);

  return safeHtml.replace("</head>", `<style>${safeCss}</style></head>`);
}

export function serializeHtmlCssCapstoneSource(html: string, css: string) {
  return JSON.stringify({ html, css });
}

export function parseHtmlCssCapstoneSource(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "html" in parsed &&
      typeof parsed.html === "string" &&
      "css" in parsed &&
      typeof parsed.css === "string"
    ) {
      return { html: parsed.html, css: parsed.css };
    }
  } catch {
    // A malformed private draft falls back to a safe starter instead of exposing it.
  }

  return {
    html: HTML_CSS_CAPSTONE_STARTER_HTML,
    css: HTML_CSS_CAPSTONE_STARTER_CSS,
  };
}
