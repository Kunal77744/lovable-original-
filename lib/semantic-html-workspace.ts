import { parse, serialize } from "parse5";

export const SEMANTIC_HTML_STARTER = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Browser field notes</title>
    <style>
      body {
        margin: 0;
        padding: 2rem;
        color: #17231e;
        background: #f6f7f2;
        font: 16px/1.6 system-ui, sans-serif;
      }

      header, main, footer {
        max-width: 42rem;
        margin-inline: auto;
      }
    </style>
  </head>
  <body>
    <header>
      <p>Browser field notes</p>
    </header>

    <main>
      <!-- Build one article with an h1 and a section with an h2. -->
    </main>

    <footer>
      <p>Built while learning semantic HTML.</p>
    </footer>
  </body>
</html>`;

export const MAX_SEMANTIC_HTML_LENGTH = 50_000;

export type SemanticHtmlCheck = {
  id: "page-header" | "main-article" | "article-heading" | "article-section" | "page-footer";
  label: string;
  guidance: string;
  passed: boolean;
};

type HtmlNode = {
  nodeName?: string;
  tagName?: string;
  childNodes?: HtmlNode[];
  attrs?: Array<{ name: string; value: string }>;
};

const PREVIEW_CSP = [
  "default-src 'none'",
  "base-uri 'none'",
  "connect-src 'none'",
  "font-src 'none'",
  "form-action 'none'",
  "frame-src 'none'",
  "img-src data:",
  "media-src 'none'",
  "object-src 'none'",
  "script-src 'none'",
  "style-src 'unsafe-inline'",
].join("; ");
const BLOCKED_PREVIEW_ELEMENTS = new Set([
  "base",
  "embed",
  "form",
  "frame",
  "frameset",
  "iframe",
  "link",
  "object",
  "portal",
  "script",
]);
const BLOCKED_PREVIEW_ATTRIBUTES = new Set([
  "action",
  "data",
  "formaction",
  "href",
  "poster",
  "src",
  "srcset",
  "xlink:href",
]);

function descendants(node: HtmlNode): HtmlNode[] {
  const nodes: HtmlNode[] = [];

  for (const child of node.childNodes ?? []) {
    nodes.push(child, ...descendants(child));
  }

  return nodes;
}

function hasDescendant(node: HtmlNode | undefined, tagName: string) {
  return Boolean(
    node &&
      descendants(node).some(
        (descendant) => descendant.tagName?.toLowerCase() === tagName,
      ),
  );
}

export function gradeSemanticHtml(html: string): SemanticHtmlCheck[] {
  const document = parse(html) as HtmlNode;
  const elements = descendants(document).filter((node) => Boolean(node.tagName));
  const body = elements.find((node) => node.tagName === "body");
  const pageElements = body ? descendants(body) : elements;
  const headerIndex = pageElements.findIndex((node) => node.tagName === "header");
  const mainElements = pageElements.filter((node) => node.tagName === "main");
  const main = mainElements[0];
  const mainIndex = pageElements.indexOf(main);
  const article = descendants(main ?? {}).find((node) => node.tagName === "article");
  const footerIndex = pageElements.findIndex((node) => node.tagName === "footer");
  const section = descendants(article ?? {}).find((node) => node.tagName === "section");

  return [
    {
      id: "page-header",
      label: "Introduce the page with a header",
      guidance:
        "Add one <header> before <main> for the page identity or navigation.",
      passed: headerIndex >= 0 && mainIndex >= 0 && headerIndex < mainIndex,
    },
    {
      id: "main-article",
      label: "Put the article inside one main landmark",
      guidance:
        "Use exactly one <main>, then place one complete <article> inside it.",
      passed: mainElements.length === 1 && Boolean(article),
    },
    {
      id: "article-heading",
      label: "Give the article one clear page heading",
      guidance: "Add an <h1> inside the <article> to name its main topic.",
      passed: hasDescendant(article, "h1"),
    },
    {
      id: "article-section",
      label: "Group one idea in a labelled section",
      guidance:
        "Add a <section> inside the article and introduce that section with an <h2>.",
      passed: Boolean(section) && hasDescendant(section, "h2"),
    },
    {
      id: "page-footer",
      label: "Close the page with a footer",
      guidance:
        "Add one <footer> after <main> for the author or supporting context.",
      passed: mainIndex >= 0 && footerIndex > mainIndex,
    },
  ];
}

export function hasValidSemanticHtmlLength(html: string) {
  return html.length > 0 && html.length <= MAX_SEMANTIC_HTML_LENGTH;
}

function sanitizePreviewNode(node: HtmlNode) {
  node.attrs = node.attrs?.filter((attribute) => {
    const name = attribute.name.toLowerCase();
    const isRefreshMeta =
      node.tagName === "meta" &&
      name === "http-equiv" &&
      attribute.value.toLowerCase() === "refresh";

    return (
      !name.startsWith("on") &&
      !BLOCKED_PREVIEW_ATTRIBUTES.has(name) &&
      !isRefreshMeta
    );
  });
  node.childNodes = node.childNodes
    ?.filter(
      (child) => {
        if (!child.tagName) {
          return true;
        }

        const tagName = child.tagName.toLowerCase();
        const isHttpEquivMeta =
          tagName === "meta" &&
          child.attrs?.some(
            (attribute) => attribute.name.toLowerCase() === "http-equiv",
          );

        return !BLOCKED_PREVIEW_ELEMENTS.has(tagName) && !isHttpEquivMeta;
      },
    )
    .map((child) => sanitizePreviewNode(child));

  return node;
}

export function buildSandboxedPreviewDocument(html: string) {
  const document = parse(html);
  sanitizePreviewNode(document as HtmlNode);
  const serialized = serialize(document);

  return serialized.replace(
    "<head>",
    `<head><meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}">`,
  );
}
