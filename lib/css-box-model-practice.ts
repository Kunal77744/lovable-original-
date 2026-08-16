export const CSS_BOX_MODEL_STARTER = `.learning-card {
  width: 280px;
  color: #17231e;
  background: #ffffff;
  /* Keep the finished card at 280px wide. */
  /* Add inner space and a visible border. */
}

/* Make the lesson count stand out without changing every strong element. */
.learning-card strong {
  color: #175437;
}`;

export const MAX_CSS_PRACTICE_LENGTH = 12_000;

export type CssPracticeCheck = {
  id: "card-selector" | "descendant-selector" | "border-box" | "inner-space";
  label: string;
  guidance: string;
  passed: boolean;
};

export type CssBoxModelExplanation = {
  boxSizing: "border-box" | "content-box";
  width: string;
  paddingInline: string;
  borderInline: string;
  contentWidthPx: number | null;
  renderedWidthPx: number | null;
  widthPx: number | null;
  paddingInlinePx: number | null;
  borderInlinePx: number | null;
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
  const pattern = new RegExp(`${escapeForRegExp(selector)}\\s*\\{([^}]*)\\}`, "i");
  return stripComments(css).match(pattern)?.[1] ?? "";
}

function hasDeclaration(block: string, property: string, value?: RegExp) {
  const match = block.match(
    new RegExp(`(?:^|;)\\s*${escapeForRegExp(property)}\\s*:\\s*([^;]+)`, "i"),
  );

  return Boolean(match && (!value || value.test(match[1].trim())));
}

function declarationValue(block: string, property: string) {
  return block.match(
    new RegExp(`(?:^|;)\\s*${escapeForRegExp(property)}\\s*:\\s*([^;]+)`, "i"),
  )?.[1]?.trim() ?? null;
}

function cssLengthToPixels(value: string | null) {
  if (!value) {
    return null;
  }

  const match = value.trim().match(/^(-?(?:\d+|\d*\.\d+))(px)?$/i);
  if (!match) {
    return null;
  }

  const amount = Number(match[1]);
  const unit = match[2]?.toLowerCase();
  return unit === "px" || amount === 0 ? amount : null;
}

function horizontalShorthand(value: string | null) {
  if (!value) {
    return { label: "0px + 0px", pixels: 0 };
  }

  const values = value.trim().split(/\s+/);
  const right = values.length === 1 ? values[0] : values[1];
  const left = values.length < 4 ? right : values[3];
  const rightPixels = cssLengthToPixels(right);
  const leftPixels = cssLengthToPixels(left);

  return {
    label: `${left} + ${right}`,
    pixels:
      leftPixels === null || rightPixels === null ? null : leftPixels + rightPixels,
  };
}

function horizontalDeclaration(
  block: string,
  shorthandProperty: string,
  leftProperty: string,
  rightProperty: string,
) {
  const shorthand = horizontalShorthand(declarationValue(block, shorthandProperty));
  const left = declarationValue(block, leftProperty);
  const right = declarationValue(block, rightProperty);
  const leftPixels = left ? cssLengthToPixels(left) : null;
  const rightPixels = right ? cssLengthToPixels(right) : null;

  if (!left && !right) {
    return shorthand;
  }

  const fallbackValues = shorthand.label.split(" + ");
  const resolvedLeft = left ?? fallbackValues[0];
  const resolvedRight = right ?? fallbackValues[1];
  const resolvedLeftPixels = left ? leftPixels : cssLengthToPixels(fallbackValues[0]);
  const resolvedRightPixels = right ? rightPixels : cssLengthToPixels(fallbackValues[1]);

  return {
    label: `${resolvedLeft} + ${resolvedRight}`,
    pixels:
      resolvedLeftPixels === null || resolvedRightPixels === null
        ? null
        : resolvedLeftPixels + resolvedRightPixels,
  };
}

function horizontalBorder(block: string) {
  const borderWidth = declarationValue(block, "border-width");
  const border = declarationValue(block, "border");
  const shorthandWidth =
    borderWidth ?? border?.match(/(?:^|\s)(-?(?:\d+|\d*\.\d+)(?:px)?)(?:\s|$)/i)?.[1] ?? null;
  const blockWithWidth = shorthandWidth
    ? `${block}; border-inline-width: ${shorthandWidth}`
    : block;

  return horizontalDeclaration(
    blockWithWidth,
    "border-inline-width",
    "border-left-width",
    "border-right-width",
  );
}

export function explainCssBoxModel(css: string): CssBoxModelExplanation {
  const cardBlock = declarationBlock(css, ".learning-card");
  const width = declarationValue(cardBlock, "width") ?? "auto";
  const widthPx = cssLengthToPixels(width);
  const padding = horizontalDeclaration(
    cardBlock,
    "padding",
    "padding-left",
    "padding-right",
  );
  const border = horizontalBorder(cardBlock);
  const boxSizing =
    declarationValue(cardBlock, "box-sizing")?.toLowerCase() === "border-box"
      ? "border-box"
      : "content-box";
  const totalAdditions =
    padding.pixels === null || border.pixels === null
      ? null
      : padding.pixels + border.pixels;
  const renderedWidthPx =
    widthPx === null || totalAdditions === null
      ? null
      : boxSizing === "border-box"
        ? widthPx
        : widthPx + totalAdditions;
  const contentWidthPx =
    widthPx === null || totalAdditions === null
      ? null
      : boxSizing === "border-box"
        ? Math.max(0, widthPx - totalAdditions)
        : widthPx;

  return {
    boxSizing,
    width,
    paddingInline: padding.label,
    borderInline: border.label,
    contentWidthPx,
    renderedWidthPx,
    widthPx,
    paddingInlinePx: padding.pixels,
    borderInlinePx: border.pixels,
  };
}

export function gradeCssBoxModel(css: string): CssPracticeCheck[] {
  const cardBlock = declarationBlock(css, ".learning-card");
  const strongBlock = declarationBlock(css, ".learning-card strong");

  return [
    {
      id: "card-selector",
      label: "Target the card with its class",
      guidance: "Keep the card declarations inside a .learning-card selector.",
      passed: cardBlock.length > 0,
    },
    {
      id: "descendant-selector",
      label: "Target only the count inside the card",
      guidance:
        "Use .learning-card strong so the emphasis stays scoped to this component.",
      passed: strongBlock.length > 0 && hasDeclaration(strongBlock, "color"),
    },
    {
      id: "border-box",
      label: "Keep padding inside the declared width",
      guidance: "Add box-sizing: border-box to .learning-card.",
      passed: hasDeclaration(cardBlock, "box-sizing", /^border-box$/i),
    },
    {
      id: "inner-space",
      label: "Give the content room inside a visible edge",
      guidance:
        "Add padding and a non-zero border to .learning-card so the box is easy to read.",
      passed:
        hasDeclaration(cardBlock, "padding", /^(?!0(?:px|rem|em|%)?\b).+/i) &&
        hasDeclaration(cardBlock, "border", /^(?!0(?:px)?\b).+/i),
    },
  ];
}

export function hasValidCssPracticeLength(css: string) {
  return css.length > 0 && css.length <= MAX_CSS_PRACTICE_LENGTH;
}

function sanitizePreviewCss(css: string) {
  return css
    .replace(/@import[\s\S]*?;/gi, "")
    .replace(/url\s*\([^)]*\)/gi, "none")
    .replace(/<\/style/gi, "<\\/style");
}

export function buildCssBoxModelPreview(css: string) {
  const safeCss = sanitizePreviewCss(css);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { box-sizing: border-box; }
      body {
        min-height: 100vh;
        margin: 0;
        padding: 2rem;
        display: grid;
        place-items: center;
        color: #17231e;
        background: #f6f7f2;
        font: 16px/1.55 system-ui, sans-serif;
      }
      .learning-card {
        width: 280px;
        color: #17231e;
        background: #ffffff;
      }
      .learning-card p { margin: 0.5rem 0 0; }
      ${safeCss}
    </style>
  </head>
  <body>
    <article class="learning-card">
      <small>CSS foundations</small>
      <h1>Predict the whole box.</h1>
      <p><strong>2 selectors</strong> keep this card focused.</p>
    </article>
  </body>
</html>`;
}
