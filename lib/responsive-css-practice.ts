export const RESPONSIVE_CSS_STARTER = `.resource-grid {
  display: grid;
  /* Let the browser add columns when room is available. */
  grid-template-columns: repeat(/* finish this rule */);
  /* Add breathing room between cards. */
}

.resource-card {
  min-width: 0;
}`;

export const MAX_RESPONSIVE_CSS_LENGTH = 12_000;

export type ResponsiveCssCheck = {
  id: "grid-layout" | "fluid-columns" | "grid-gap" | "shrinkable-card";
  label: string;
  guidance: string;
  passed: boolean;
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

function stripComments(css: string) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function escapeForRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function declarationBlock(css: string, selector: string) {
  const pattern = new RegExp(
    `${escapeForRegExp(selector)}\\s*\\{([^}]*)\\}`,
    "i",
  );
  return stripComments(css).match(pattern)?.[1] ?? "";
}

function declarationValue(block: string, property: string) {
  return (
    block
      .match(
        new RegExp(
          `(?:^|;)\\s*${escapeForRegExp(property)}\\s*:\\s*([^;]+)`,
          "i",
        ),
      )?.[1]
      .trim() ?? ""
  );
}

export function gradeResponsiveCss(css: string): ResponsiveCssCheck[] {
  const gridBlock = declarationBlock(css, ".resource-grid");
  const cardBlock = declarationBlock(css, ".resource-card");
  const columns = declarationValue(gridBlock, "grid-template-columns");
  const gap = declarationValue(gridBlock, "gap");

  return [
    {
      id: "grid-layout",
      label: "Make the resource list a grid",
      guidance: "Keep display: grid inside .resource-grid.",
      passed: /^grid$/i.test(declarationValue(gridBlock, "display")),
    },
    {
      id: "fluid-columns",
      label: "Let columns respond to available space",
      guidance:
        "Use repeat() with auto-fit or auto-fill and minmax() in grid-template-columns.",
      passed:
        /^repeat\s*\(/i.test(columns) &&
        /auto-(?:fit|fill)/i.test(columns) &&
        /minmax\s*\(/i.test(columns),
    },
    {
      id: "grid-gap",
      label: "Separate cards without individual margins",
      guidance: "Add a non-zero gap to .resource-grid.",
      passed: /^(?!0(?:px|rem|em|%)?\b).+/i.test(gap),
    },
    {
      id: "shrinkable-card",
      label: "Allow card content to shrink inside the track",
      guidance: "Keep min-width: 0 inside .resource-card.",
      passed: /^0(?:px)?$/i.test(declarationValue(cardBlock, "min-width")),
    },
  ];
}

export function hasValidResponsiveCssLength(css: string) {
  return css.length > 0 && css.length <= MAX_RESPONSIVE_CSS_LENGTH;
}

function sanitizePreviewCss(css: string) {
  return css
    .replace(/@import[\s\S]*?;/gi, "")
    .replace(/url\s*\([^)]*\)/gi, "none")
    .replace(/<\/style/gi, "<\\/style");
}

export function buildResponsiveCssPreview(css: string) {
  const safeCss = sanitizePreviewCss(css);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      * { box-sizing: border-box; }
      body {
        min-height: 100vh;
        margin: 0;
        padding: 1.5rem;
        color: #17231e;
        background: #f6f7f2;
        font: 15px/1.5 system-ui, sans-serif;
      }
      h1 { margin: 0 0 1rem; font: 600 1.35rem/1.2 Georgia, serif; }
      .resource-grid { display: block; }
      .resource-card {
        margin-bottom: 0.75rem;
        padding: 1rem;
        border: 1px solid #c8d1c9;
        border-radius: 12px;
        background: #fff;
      }
      .resource-card small { color: #287652; }
      .resource-card h2 { margin: 0.35rem 0; font-size: 1rem; }
      .resource-card p { margin: 0; color: #52615a; }
      ${safeCss}
    </style>
  </head>
  <body>
    <h1>Frontend field notes</h1>
    <section class="resource-grid" aria-label="Learning resources">
      <article class="resource-card"><small>HTML</small><h2>Landmarks</h2><p>Give every region a clear job.</p></article>
      <article class="resource-card"><small>CSS</small><h2>Box model</h2><p>Predict the space around content.</p></article>
      <article class="resource-card"><small>Layout</small><h2>Grid</h2><p>Let available space shape the columns.</p></article>
    </section>
  </body>
</html>`;
}
