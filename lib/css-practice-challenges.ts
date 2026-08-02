export type CssChallengeDifficulty = "Beginner";

export type CssChallengeCheck = {
  id: string;
  label: string;
  guidance: string;
  passed: boolean;
};

type CssChallengeRequirement = Omit<CssChallengeCheck, "passed"> & {
  selector: string;
  property?: string;
  value?: RegExp;
};

export type CssPracticeChallenge = {
  slug: string;
  number: number;
  title: string;
  skill: string;
  difficulty: CssChallengeDifficulty;
  brief: string;
  outcome: string;
  starterCss: string;
  requirements: CssChallengeRequirement[];
};

export const MAX_CSS_CHALLENGE_LENGTH = 12_000;

const NON_ZERO_LENGTH = /^(?!0(?:px|rem|em|%)?\b).+/i;

export const CSS_PRACTICE_CHALLENGES: CssPracticeChallenge[] = [
  {
    slug: "class-selector",
    number: 1,
    title: "Select one card",
    skill: "Class selectors",
    difficulty: "Beginner",
    brief:
      "Use the card class instead of styling every article on the page. Give this component its own surface and readable text color.",
    outcome: "Only the learning card gets a white surface and dark text.",
    starterCss: `/* Target the learning card by its class. */

`,
    requirements: [
      {
        id: "card-selector",
        label: "Use the .learning-card selector",
        guidance: "Put these declarations inside .learning-card { ... }.",
        selector: ".learning-card",
      },
      {
        id: "card-background",
        label: "Give the card a white surface",
        guidance: "Add background: #ffffff to .learning-card.",
        selector: ".learning-card",
        property: "background",
        value: /^(?:#fff(?:fff)?|white)$/i,
      },
      {
        id: "card-color",
        label: "Set the card text color",
        guidance: "Add color: #17231e to .learning-card.",
        selector: ".learning-card",
        property: "color",
        value: /^#17231e$/i,
      },
    ],
  },
  {
    slug: "descendant-selector",
    number: 2,
    title: "Scope the lesson count",
    skill: "Descendant selectors",
    difficulty: "Beginner",
    brief:
      "Make the count stand out without changing every strong element. Scope the rule to strong text inside the learning card.",
    outcome: "The lesson count becomes green and bold while other emphasis stays unchanged.",
    starterCss: `.learning-card {
  color: #17231e;
}

/* Target only strong text inside the card. */
`,
    requirements: [
      {
        id: "descendant-selector",
        label: "Scope the rule to the card",
        guidance: "Use .learning-card strong { ... }.",
        selector: ".learning-card strong",
      },
      {
        id: "count-color",
        label: "Use the lesson accent color",
        guidance: "Add color: #175437 to .learning-card strong.",
        selector: ".learning-card strong",
        property: "color",
        value: /^#175437$/i,
      },
      {
        id: "count-weight",
        label: "Make the count visibly stronger",
        guidance: "Add font-weight: 700 or font-weight: bold.",
        selector: ".learning-card strong",
        property: "font-weight",
        value: /^(?:[7-9]00|bold)$/i,
      },
    ],
  },
  {
    slug: "predictable-width",
    number: 3,
    title: "Keep the width predictable",
    skill: "Box sizing",
    difficulty: "Beginner",
    brief:
      "Keep padding and the border inside a declared 280px width. The card should not grow when its inner space is added.",
    outcome: "The finished card stays 280px wide, including padding and border.",
    starterCss: `.learning-card {
  width: 280px;
  padding: 24px;
  border: 2px solid #287652;
  /* Keep all of this inside 280px. */
}
`,
    requirements: [
      {
        id: "fixed-width",
        label: "Declare the card width",
        guidance: "Keep width: 280px on .learning-card.",
        selector: ".learning-card",
        property: "width",
        value: /^280px$/i,
      },
      {
        id: "border-box",
        label: "Include padding and border in the width",
        guidance: "Add box-sizing: border-box to .learning-card.",
        selector: ".learning-card",
        property: "box-sizing",
        value: /^border-box$/i,
      },
      {
        id: "visible-border",
        label: "Keep a visible card edge",
        guidance: "Keep a non-zero border on .learning-card.",
        selector: ".learning-card",
        property: "border",
        value: NON_ZERO_LENGTH,
      },
    ],
  },
  {
    slug: "inside-and-between",
    number: 4,
    title: "Separate inside from between",
    skill: "Padding and margin",
    difficulty: "Beginner",
    brief:
      "Use padding for space inside the card and margin for space before the supporting paragraph. Keep the two jobs separate.",
    outcome: "The card has 24px inner space and the paragraph starts 12px below its heading.",
    starterCss: `.learning-card {
  width: 280px;
  box-sizing: border-box;
  /* Add space inside the card. */
}

.learning-card p {
  /* Add space above this paragraph. */
}
`,
    requirements: [
      {
        id: "card-padding",
        label: "Add inner card space",
        guidance: "Add padding: 24px to .learning-card.",
        selector: ".learning-card",
        property: "padding",
        value: /^24px$/i,
      },
      {
        id: "paragraph-selector",
        label: "Target the paragraph inside the card",
        guidance: "Keep the spacing rule inside .learning-card p { ... }.",
        selector: ".learning-card p",
      },
      {
        id: "paragraph-margin",
        label: "Add space before the paragraph",
        guidance: "Add margin-top: 12px to .learning-card p.",
        selector: ".learning-card p",
        property: "margin-top",
        value: /^12px$/i,
      },
    ],
  },
  {
    slug: "link-hit-area",
    number: 5,
    title: "Build a clear link target",
    skill: "Nested class selectors",
    difficulty: "Beginner",
    brief:
      "Turn the card link into a clear target without changing links elsewhere. Give the nested class its own box.",
    outcome: "The card link gets an inline block, comfortable padding, and rounded corners.",
    starterCss: `/* Target only the link inside the learning card. */
.learning-card .card-link {
  color: #ffffff;
  background: #287652;
}
`,
    requirements: [
      {
        id: "nested-link-selector",
        label: "Keep the link rule inside the card",
        guidance: "Use .learning-card .card-link { ... }.",
        selector: ".learning-card .card-link",
      },
      {
        id: "inline-block",
        label: "Let padding form a stable box",
        guidance: "Add display: inline-block to the card link.",
        selector: ".learning-card .card-link",
        property: "display",
        value: /^inline-block$/i,
      },
      {
        id: "link-padding",
        label: "Give the link a usable hit area",
        guidance: "Add non-zero padding to the card link.",
        selector: ".learning-card .card-link",
        property: "padding",
        value: NON_ZERO_LENGTH,
      },
      {
        id: "link-radius",
        label: "Round the link corners",
        guidance: "Add a non-zero border-radius to the card link.",
        selector: ".learning-card .card-link",
        property: "border-radius",
        value: NON_ZERO_LENGTH,
      },
    ],
  },
  {
    slug: "centered-card",
    number: 6,
    title: "Center a reusable card",
    skill: "Compound context",
    difficulty: "Beginner",
    brief:
      "Center the card inside its stage while keeping the rule local to this component. Preserve a predictable maximum width.",
    outcome: "The stage card centers itself and never grows beyond 280px.",
    starterCss: `.stage .learning-card {
  width: 100%;
  /* Keep the card narrow and center it. */
}
`,
    requirements: [
      {
        id: "stage-card-selector",
        label: "Scope the rule to the staged card",
        guidance: "Use .stage .learning-card { ... }.",
        selector: ".stage .learning-card",
      },
      {
        id: "card-max-width",
        label: "Cap the card width",
        guidance: "Add max-width: 280px to .stage .learning-card.",
        selector: ".stage .learning-card",
        property: "max-width",
        value: /^280px$/i,
      },
      {
        id: "center-card",
        label: "Center the card in its stage",
        guidance: "Add margin-inline: auto to .stage .learning-card.",
        selector: ".stage .learning-card",
        property: "margin-inline",
        value: /^auto$/i,
      },
    ],
  },
];

export const CSS_PRACTICE_CHALLENGE_COUNT = CSS_PRACTICE_CHALLENGES.length;

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

export function getCssPracticeChallenge(slug: string) {
  return CSS_PRACTICE_CHALLENGES.find((challenge) => challenge.slug === slug) ?? null;
}

export function gradeCssPracticeChallenge(slug: string, css: string) {
  const challenge = getCssPracticeChallenge(slug);

  if (!challenge) return null;

  return challenge.requirements.map((requirement): CssChallengeCheck => {
    const block = declarationBlock(css, requirement.selector);
    const passed = requirement.property
      ? hasDeclaration(block, requirement.property, requirement.value)
      : block.length > 0;

    return {
      id: requirement.id,
      label: requirement.label,
      guidance: requirement.guidance,
      passed,
    };
  });
}

export function hasValidCssChallengeLength(css: string) {
  return css.length > 0 && css.length <= MAX_CSS_CHALLENGE_LENGTH;
}

function sanitizePreviewCss(css: string) {
  return css
    .replace(/@import[\s\S]*?;/gi, "")
    .replace(/url\s*\([^)]*\)/gi, "none")
    .replace(/<\/style/gi, "<\\/style");
}

export function buildCssChallengePreview(css: string) {
  const safeCss = sanitizePreviewCss(css);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; base-uri 'none'; connect-src 'none'; form-action 'none'; frame-src 'none'; img-src data:; object-src 'none'; script-src 'none'; style-src 'unsafe-inline'" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      * { box-sizing: border-box; }
      body { min-height: 100vh; margin: 0; padding: 2rem; color: #17231e; background: #f6f7f2; font: 16px/1.55 system-ui, sans-serif; }
      .stage { min-height: calc(100vh - 4rem); display: grid; place-items: center; }
      .learning-card { width: 280px; padding: 18px; border: 1px solid #cbd7ce; background: #eef3ed; }
      .learning-card h1, .learning-card p { margin: 0; }
      .learning-card p { margin-top: 8px; }
      .learning-card .card-link { margin-top: 18px; color: #175437; }
      ${safeCss}
    </style>
  </head>
  <body>
    <div class="stage">
      <article class="learning-card">
        <small>CSS practice</small>
        <h1>Predict the whole box.</h1>
        <p><strong>6 short challenges</strong> build one reusable card.</p>
        <a class="card-link" href="#">Continue learning</a>
      </article>
    </div>
  </body>
</html>`;
}
