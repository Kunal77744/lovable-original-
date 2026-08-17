export type CssSpacedReviewItem = {
  id: string;
  challengeTitle: string;
  concept: string;
  prompt: string;
  options: Array<{ id: string; label: string }>;
  correctOptionId: string;
  takeaway: string;
  recoveryCue: string;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const CSS_SPACED_REVIEW_ITEMS: CssSpacedReviewItem[] = [
  {
    id: "reusable-card-selector",
    challengeTitle: "Select one card",
    concept: "Reusable selectors",
    prompt:
      "Several learning cards need the same surface and text color without changing every article. Which selector creates the reusable hook?",
    options: [
      { id: "class", label: ".learning-card" },
      { id: "element", label: "article" },
      { id: "universal", label: "*" },
    ],
    correctOptionId: "class",
    takeaway:
      "A class selector gives related components one reusable styling contract without widening the rule to every element of that type.",
    recoveryCue:
      "Look for the selector that can be shared by several cards while leaving unrelated articles alone.",
  },
  {
    id: "scoped-descendant",
    challengeTitle: "Scope the lesson count",
    concept: "Scoped emphasis",
    prompt:
      "Only strong text inside a learning card should become green. Which selector keeps that emphasis inside the component?",
    options: [
      { id: "scoped", label: ".learning-card strong" },
      { id: "all-strong", label: "strong" },
      { id: "card-only", label: ".learning-card" },
    ],
    correctOptionId: "scoped",
    takeaway:
      "A descendant selector starts with the component boundary, then narrows the rule to matching content inside it.",
    recoveryCue:
      "Begin with the outer card selector, then name the element that should change inside it.",
  },
  {
    id: "inclusive-width",
    challengeTitle: "Keep the width predictable",
    concept: "Box sizing",
    prompt:
      "A 280px card also has padding and a border. Which declaration keeps those parts inside the declared width?",
    options: [
      { id: "border-box", label: "box-sizing: border-box" },
      { id: "content-box", label: "box-sizing: content-box" },
      { id: "overflow", label: "overflow: hidden" },
    ],
    correctOptionId: "border-box",
    takeaway:
      "border-box includes padding and border inside the declared width, making the finished component easier to predict.",
    recoveryCue:
      "Choose the sizing model that changes how padding and border contribute to total width.",
  },
  {
    id: "fluid-centered-card",
    challengeTitle: "Center a reusable card",
    concept: "Responsive constraints",
    prompt:
      "A card should shrink with its stage, stop growing at 280px, and stay centered. Which pair supplies the ceiling and shares leftover inline space?",
    options: [
      {
        id: "max-auto",
        label: "max-width: 280px; margin-inline: auto",
      },
      { id: "width-padding", label: "width: 280px; padding: auto" },
      { id: "min-center", label: "min-width: 280px; text-align: center" },
    ],
    correctOptionId: "max-auto",
    takeaway:
      "A maximum width sets the readable ceiling, while automatic inline margins split the remaining space and center the block.",
    recoveryCue:
      "Separate the two jobs: one declaration limits growth, and another distributes unused horizontal space.",
  },
];

export function isBoundedCssSpacedReviewResult(result: {
  correctCount: number;
  totalCount: number;
}) {
  return (
    Number.isInteger(result.correctCount) &&
    result.totalCount === CSS_SPACED_REVIEW_ITEMS.length &&
    result.correctCount >= 0 &&
    result.correctCount <= result.totalCount
  );
}

export function getCssSpacedReviewIntervalDays(result: {
  correctCount: number;
  totalCount: number;
}) {
  if (!isBoundedCssSpacedReviewResult(result)) return null;
  const recallRate = result.correctCount / result.totalCount;
  if (recallRate >= 0.75) return 7;
  if (recallRate >= 0.5) return 3;
  return 1;
}

export function getCssSpacedReviewDueAt(
  result: { correctCount: number; totalCount: number },
  completedAt: Date,
) {
  const intervalDays = getCssSpacedReviewIntervalDays(result);
  if (!intervalDays) {
    throw new Error("CSS spaced-review result is outside its bounded range.");
  }
  return new Date(completedAt.getTime() + intervalDays * DAY_IN_MS);
}

export function isCssSpacedReviewDue(
  result: { nextDueAt: string } | null,
  now = new Date(),
) {
  if (!result) return true;
  const nextDueAt = Date.parse(result.nextDueAt);
  return !Number.isFinite(nextDueAt) || nextDueAt <= now.getTime();
}

export function formatCssSpacedReviewDueDate(nextDueAt: string) {
  const date = new Date(nextDueAt);
  if (!Number.isFinite(date.getTime())) return "your next visit";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}
