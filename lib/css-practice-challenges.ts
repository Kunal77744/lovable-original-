export type CssChallengeDifficulty = "Beginner";

export type CssChallengeCheck = {
  id: string;
  label: string;
  concept: string;
  nextAttempt: string;
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
  successTakeaway: {
    concept: string;
    explanation: string;
  };
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
    successTakeaway: {
      concept: "Classes keep component styles local",
      explanation:
        "Tying the surface and text color to .learning-card makes the rule reusable without changing every article on the page.",
    },
    starterCss: `/* Target the learning card by its class. */

`,
    requirements: [
      {
        id: "card-selector",
        label: "Use the .learning-card selector",
        concept:
          "A class selector limits a rule to elements that carry that reusable class.",
        nextAttempt:
          "Start with the class on the preview card, then keep the card's visual choices together in that rule.",
        selector: ".learning-card",
      },
      {
        id: "card-background",
        label: "Give the card a white surface",
        concept:
          "A component's surface belongs to the component rule, not the page around it.",
        nextAttempt:
          "Find the card rule and set its surface to the white color named in the outcome, then check again.",
        selector: ".learning-card",
        property: "background",
        value: /^(?:#fff(?:fff)?|white)$/i,
      },
      {
        id: "card-color",
        label: "Set the card text color",
        concept:
          "Text color set on a container is inherited by its children unless a narrower rule overrides it.",
        nextAttempt:
          "Put the dark text choice from the outcome on the card rule so its text can inherit it.",
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
    successTakeaway: {
      concept: "Descendant selectors narrow emphasis",
      explanation:
        "Combining the card and strong selectors changes emphasis only inside this component, while other strong text keeps its own style.",
    },
    starterCss: `.learning-card {
  color: #17231e;
}

/* Target only strong text inside the card. */
`,
    requirements: [
      {
        id: "descendant-selector",
        label: "Scope the rule to the card",
        concept:
          "A descendant selector starts with a container and narrows the match to an element inside it.",
        nextAttempt:
          "Build the selector from the outer card to its inner strong text without targeting strong text everywhere.",
        selector: ".learning-card strong",
      },
      {
        id: "count-color",
        label: "Use the lesson accent color",
        concept:
          "A color declaration changes only the elements matched by the rule that contains it.",
        nextAttempt:
          "Apply the green accent named in the outcome inside the scoped emphasis rule, then compare the preview.",
        selector: ".learning-card strong",
        property: "color",
        value: /^#175437$/i,
      },
      {
        id: "count-weight",
        label: "Make the count visibly stronger",
        concept:
          "Font weight creates emphasis without changing the text or widening the selector.",
        nextAttempt:
          "Strengthen the text weight inside the scoped rule using a value the browser treats as bold.",
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
    successTakeaway: {
      concept: "Border box makes width inclusive",
      explanation:
        "With border-box sizing, the browser counts padding and border inside the declared 280px instead of adding them outside it.",
    },
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
        concept:
          "The declared width is the target size that the browser's sizing model works from.",
        nextAttempt:
          "Keep the width target from the brief on the card before changing how padding and border are counted.",
        selector: ".learning-card",
        property: "width",
        value: /^280px$/i,
      },
      {
        id: "border-box",
        label: "Include padding and border in the width",
        concept:
          "The box-sizing model decides whether padding and border add to a declared width or fit inside it.",
        nextAttempt:
          "Choose the sizing model that keeps padding and border inside the card's declared width.",
        selector: ".learning-card",
        property: "box-sizing",
        value: /^border-box$/i,
      },
      {
        id: "visible-border",
        label: "Keep a visible card edge",
        concept:
          "A border occupies space only when its thickness is greater than zero.",
        nextAttempt:
          "Keep a visible edge on the card and make sure its thickness does not collapse to zero.",
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
    successTakeaway: {
      concept: "Padding and margin solve different spacing",
      explanation:
        "Padding moves content inward from the card edge, while the paragraph margin creates separation between neighboring content.",
    },
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
        concept:
          "Padding creates space between a component's content and its own edge.",
        nextAttempt:
          "Apply the inner-space amount from the outcome to the card itself, then watch the content move inward.",
        selector: ".learning-card",
        property: "padding",
        value: /^24px$/i,
      },
      {
        id: "paragraph-selector",
        label: "Target the paragraph inside the card",
        concept:
          "Spacing between two pieces of content should be scoped to the element that needs that separation.",
        nextAttempt:
          "Narrow the spacing rule from the card container to the paragraph inside the card.",
        selector: ".learning-card p",
      },
      {
        id: "paragraph-margin",
        label: "Add space before the paragraph",
        concept:
          "Margin creates space outside an element, separating it from the content before it.",
        nextAttempt:
          "Use the gap named in the outcome above the paragraph, without adding more inner card space.",
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
    successTakeaway: {
      concept: "Box the link before spacing it",
      explanation:
        "Inline-block lets padding and rounded corners form a stable clickable box while the scoped selector keeps other links unchanged.",
    },
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
        concept:
          "Combining the container and link classes keeps a component rule from changing similar links elsewhere.",
        nextAttempt:
          "Start with the card context, then narrow the selector to the link class shown in the preview markup.",
        selector: ".learning-card .card-link",
      },
      {
        id: "inline-block",
        label: "Let padding form a stable box",
        concept:
          "An inline-level box can flow with text while still accepting a predictable width and height from spacing.",
        nextAttempt:
          "Choose the display mode that keeps the link inline but lets its padding shape a stable box.",
        selector: ".learning-card .card-link",
        property: "display",
        value: /^inline-block$/i,
      },
      {
        id: "link-padding",
        label: "Give the link a usable hit area",
        concept:
          "Padding enlarges the clickable area around link text without changing the text itself.",
        nextAttempt:
          "Add some inner space to the scoped link and confirm the green target grows around its label.",
        selector: ".learning-card .card-link",
        property: "padding",
        value: NON_ZERO_LENGTH,
      },
      {
        id: "link-radius",
        label: "Round the link corners",
        concept:
          "Corner radius rounds the background box, and zero leaves its corners square.",
        nextAttempt:
          "Give the scoped link a visible amount of corner rounding, then compare all four corners.",
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
    successTakeaway: {
      concept: "A fluid card can still have a ceiling",
      explanation:
        "A full-width card can shrink with its stage, stop at a readable maximum, and share leftover inline space equally to stay centered.",
    },
    starterCss: `.stage .learning-card {
  width: 100%;
  /* Keep the card narrow and center it. */
}
`,
    requirements: [
      {
        id: "stage-card-selector",
        label: "Scope the rule to the staged card",
        concept:
          "A contextual selector can change a component only when it appears inside a particular layout.",
        nextAttempt:
          "Build the selector from the outer stage to the card so cards outside that stage stay unchanged.",
        selector: ".stage .learning-card",
      },
      {
        id: "card-max-width",
        label: "Cap the card width",
        concept:
          "A maximum width lets a responsive element shrink while preventing it from growing past a readable cap.",
        nextAttempt:
          "Keep the card fluid, then add the width ceiling named in the outcome to the staged-card rule.",
        selector: ".stage .learning-card",
        property: "max-width",
        value: /^280px$/i,
      },
      {
        id: "center-card",
        label: "Center the card in its stage",
        concept:
          "Automatic space on both inline sides shares the unused room and centers a constrained block.",
        nextAttempt:
          "Let the browser divide the stage's leftover horizontal space equally on both sides of the card.",
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
      concept: requirement.concept,
      nextAttempt: requirement.nextAttempt,
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
