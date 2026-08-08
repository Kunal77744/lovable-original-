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
  "count-vowels": {
    sourcePatterns: [
      {
        matches: (source) => /includes\s*\(/.test(source),
        text: "Your source uses one bounded membership check to classify each character as a vowel or consonant.",
      },
      {
        matches: (source) => /Set\s*\(/.test(source) && /\.has\s*\(/.test(source),
        text: "Your source keeps the vowel choices in a set and checks each character against it.",
      },
      {
        matches: (source) => /\.filter\s*\(/.test(source),
        text: "Your source filters the traversed characters down to the vowel matches before counting them.",
      },
    ],
    fallbackSourcePoint:
      "Your source visits the word's characters and returns one vowel count from solve(input).",
    verifiedPoint:
      "The traversal passed repeated vowels, a no-vowel word, and a one-character boundary.",
    consideration:
      "Keep all five vowels in one private case so later membership changes cannot quietly drop one.",
  },
  "unique-values": {
    sourcePatterns: [
      {
        matches: (source) => /new\s+Set\s*\(/.test(source),
        text: "Your source uses a set to retain one copy of each value while preserving first appearance.",
      },
      {
        matches: (source) => /\.has\s*\(/.test(source) && /\.add\s*\(/.test(source),
        text: "Your source explicitly checks prior values before adding a first appearance to the result.",
      },
    ],
    fallbackSourcePoint:
      "Your source separates the count and returns each list value only on its first appearance.",
    verifiedPoint:
      "The same path passed repeated negatives, an already-unique list, and a single value.",
    consideration:
      "Keep an out-of-order duplicate case nearby so a future sort cannot change first-appearance order.",
  },
  "balanced-brackets": {
    sourcePatterns: [
      {
        matches: (source) => /\.push\s*\(/.test(source) && /\.pop\s*\(/.test(source),
        text: "Your source uses stack push and pop operations to match the latest unmatched opening bracket.",
      },
      {
        matches: (source) => /(?:Map|\{)[\s\S]*(?:\)|\]|\})/.test(source),
        text: "Your source keeps an explicit relationship between each closing bracket and its valid opening partner.",
      },
    ],
    fallbackSourcePoint:
      "Your source validates closing brackets against the most recent unmatched opening bracket.",
    verifiedPoint:
      "The stack rule passed nested pairs, crossed pairs, an early close, and leftover openings.",
    consideration:
      "Keep both ([)] and (() in your private cases so equal counts cannot stand in for correct order.",
  },
  "first-unique-character": {
    sourcePatterns: [
      {
        matches: (source) => /(?:Map|Object\.create|\{\})/.test(source),
        text: "Your source records character frequencies before it selects a character from the original word.",
      },
      {
        matches: (source) => /\.find\s*\(/.test(source),
        text: "Your source selects the first character whose completed frequency equals one.",
      },
    ],
    fallbackSourcePoint:
      "Your source separates complete character counting from the ordered search for the first unique value.",
    verifiedPoint:
      "The two-stage result passed a late unique character, no unique character, and a one-character word.",
    consideration:
      "Keep a word whose first character later repeats so an early return cannot reappear during revision.",
  },
  "binary-search-index": {
    sourcePatterns: [
      {
        matches: (source) => /Math\.floor\s*\(/.test(source) && /\b(?:left|low)\b/.test(source),
        text: "Your source computes a midpoint inside explicit search boundaries before discarding one sorted half.",
      },
      {
        matches: (source) => /\b(?:while|for)\s*\(/.test(source) && /\/\s*2/.test(source),
        text: "Your source repeatedly halves the remaining search range instead of scanning every value.",
      },
    ],
    fallbackSourcePoint:
      "Your source narrows a sorted range until it returns the target index or the missing-value result.",
    verifiedPoint:
      "The boundaries passed first, last, missing, and single-value target checks.",
    consideration:
      "Keep both end positions in your local cases so later boundary changes cannot skip a one-value range.",
  },
  "maximum-window-sum": {
    sourcePatterns: [
      {
        matches: (source) => /\+=|-=/.test(source) && /\b(?:window|sum)\b/i.test(source),
        text: "Your source updates the current window sum as values enter and leave the fixed-size range.",
      },
      {
        matches: (source) => /\.slice\s*\(/.test(source) && /\.reduce\s*\(/.test(source),
        text: "Your source establishes a real first-window sum before comparing the remaining windows.",
      },
    ],
    fallbackSourcePoint:
      "Your source compares sums for contiguous windows of exactly the requested size.",
    verifiedPoint:
      "The calculation passed all-negative data, one-value windows, and a window spanning the full list.",
    consideration:
      "Keep the all-negative case nearby so the best sum always comes from a real window rather than zero.",
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
