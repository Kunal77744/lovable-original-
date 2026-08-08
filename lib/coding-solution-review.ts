export type CodingSolutionReviewPoint = {
  label: "Seen in your source" | "Checks proved" | "Keep testing";
  text: string;
  kind: "strength" | "consideration";
};

export type CodingSolutionReview = {
  points: [CodingSolutionReviewPoint, CodingSolutionReviewPoint, CodingSolutionReviewPoint];
};

type SourcePattern = {
  matches: (source: string) => boolean;
  text: string;
};

type ProblemReviewRubric = {
  sourcePatterns: SourcePattern[];
  fallbackSourcePoint: string;
  verifiedPoint: string;
  consideration: string;
};

const REVIEW_RUBRICS: Record<string, ProblemReviewRubric> = {
  "sum-two-numbers": {
    sourcePatterns: [
      {
        matches: (source) =>
          /\.map\s*\(\s*Number\s*\)/.test(source) ||
          /\b(?:Number|parseInt|parseFloat)\s*\(/.test(source),
        text: "Your source explicitly turns input text into numbers before adding the two values.",
      },
      {
        matches: (source) => /\[[^\]]+,[^\]]+\]\s*=/.test(source),
        text: "Your source separates both operands at the input boundary before it combines them.",
      },
    ],
    fallbackSourcePoint:
      "Your source keeps both input values inside solve(input) and returns one numeric result.",
    verifiedPoint:
      "The same path passed positive, negative, zero, and larger-number checks.",
    consideration:
      "Keep a whitespace-heavy input in your local cases so token splitting stays deliberate.",
  },
  "even-or-odd": {
    sourcePatterns: [
      {
        matches: (source) => /%\s*2/.test(source),
        text: "Your source uses the remainder from division by 2 to choose between the two outputs.",
      },
      {
        matches: (source) => /\?[^:]+:/.test(source),
        text: "Your source expresses the two possible results as one bounded decision.",
      },
    ],
    fallbackSourcePoint:
      "Your source makes one decision inside solve(input) and returns the exact required word.",
    verifiedPoint:
      "The decision held for positive values, zero, and a negative odd number.",
    consideration:
      "Keep exact capitalization in view when you revise this solution; the output contract is case-sensitive.",
  },
  "multiplication-table": {
    sourcePatterns: [
      {
        matches: (source) => /\b(?:for|while)\s*\(/.test(source),
        text: "Your source uses an explicit loop to visit the table multipliers in order.",
      },
      {
        matches: (source) => /Array\.from\s*\(/.test(source),
        text: "Your source builds the ten table positions as one ordered sequence.",
      },
      {
        matches: (source) => /\.join\s*\(\s*["'`] ["'`]\s*\)/.test(source),
        text: "Your source joins the completed values once, which keeps separators controlled.",
      },
    ],
    fallbackSourcePoint:
      "Your source returns one ordered ten-value sequence from solve(input).",
    verifiedPoint:
      "The sequence passed first-to-tenth boundaries for positive, zero, and negative inputs.",
    consideration:
      "Keep the first and tenth multipliers in your private cases when you change the loop boundary.",
  },
  "largest-value": {
    sourcePatterns: [
      {
        matches: (source) => /Math\.max\s*\(/.test(source),
        text: "Your source isolates the data values and applies a maximum operation to that set.",
      },
      {
        matches: (source) => /\.reduce\s*\(/.test(source),
        text: "Your source carries one comparison forward while it visits the list values.",
      },
      {
        matches: (source) => /\b(?:for|while)\s*\(/.test(source),
        text: "Your source compares the list through an explicit iteration path.",
      },
    ],
    fallbackSourcePoint:
      "Your source separates the count from the values and returns one list maximum.",
    verifiedPoint:
      "The comparison passed an all-negative list, a single value, and repeated maximum values.",
    consideration:
      "Keep the all-negative case nearby so a future starting value never invents zero.",
  },
  "reverse-a-word": {
    sourcePatterns: [
      {
        matches: (source) => /\.reverse\s*\(\s*\)/.test(source),
        text: "Your source reverses the character order before returning the rebuilt word.",
      },
      {
        matches: (source) =>
          /\.length\s*-\s*1/.test(source) && /--/.test(source),
        text: "Your source walks from the final character back toward the first.",
      },
    ],
    fallbackSourcePoint:
      "Your source returns the same characters in the opposite order from solve(input).",
    verifiedPoint:
      "The transformation preserved a palindrome and a one-character word as well as longer words.",
    consideration:
      "Keep output length equal to input length when you revise the character traversal.",
  },
  "fizz-buzz": {
    sourcePatterns: [
      {
        matches: (source) => /%\s*15/.test(source),
        text: "Your source gives the shared 3-and-5 case its own divisibility check.",
      },
      {
        matches: (source) =>
          /%\s*3/.test(source) && /%\s*5/.test(source) && /&&/.test(source),
        text: "Your source combines the 3 and 5 conditions before choosing the shared label.",
      },
      {
        matches: (source) => /\.join\s*\(\s*["'`] ["'`]\s*\)/.test(source),
        text: "Your source collects the sequence before joining it into the exact output shape.",
      },
    ],
    fallbackSourcePoint:
      "Your source returns one token for every number from 1 through the requested limit.",
    verifiedPoint:
      "The ordering passed the shared case at 15, the one-value boundary, and a longer sequence.",
    consideration:
      "Keep 15 in your local cases so later condition changes cannot hide the shared rule.",
  },
};

export function getCodingSolutionReview(
  problemSlug: string,
  source: string,
): CodingSolutionReview | null {
  const rubric = REVIEW_RUBRICS[problemSlug];

  if (!rubric || source.trim().length === 0) return null;

  const sourcePoint =
    rubric.sourcePatterns.find((pattern) => pattern.matches(source))?.text ??
    rubric.fallbackSourcePoint;

  return {
    points: [
      {
        label: "Seen in your source",
        text: sourcePoint,
        kind: "strength",
      },
      {
        label: "Checks proved",
        text: rubric.verifiedPoint,
        kind: "strength",
      },
      {
        label: "Keep testing",
        text: rubric.consideration,
        kind: "consideration",
      },
    ],
  };
}
