export type WebFoundationsReviewItem = {
  id: string;
  lessonTitle: string;
  concept: string;
  prompt: string;
  options: Array<{ id: string; label: string }>;
  correctOptionId: string;
  takeaway: string;
  recoveryCue: string;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const WEB_FOUNDATIONS_REVIEW_ITEMS: WebFoundationsReviewItem[] = [
  {
    id: "page-main-landmark",
    lessonTitle: "Semantic HTML",
    concept: "Page landmarks",
    prompt:
      "A page has a site header, navigation, one article, and a footer. Which element should wrap the page's unique central content?",
    options: [
      { id: "main", label: "<main>" },
      { id: "header", label: "<header>" },
      { id: "section", label: "<section>" },
    ],
    correctOptionId: "main",
    takeaway:
      "Use <main> for the page's unique central content so its purpose is clear to browsers and assistive technology.",
    recoveryCue:
      "Ask which landmark should appear once and contain the content visitors came to this page for.",
  },
  {
    id: "article-heading-order",
    lessonTitle: "Semantic HTML",
    concept: "Heading hierarchy",
    prompt:
      "An article begins with its page title, then introduces two major topics. Which heading pattern communicates that structure?",
    options: [
      { id: "h1-h2-h2", label: "One <h1>, then two <h2> headings" },
      { id: "h1-h3-h3", label: "One <h1>, then two <h3> headings" },
      { id: "h2-h1-h1", label: "One <h2>, then two <h1> headings" },
    ],
    correctOptionId: "h1-h2-h2",
    takeaway:
      "A clear hierarchy starts with the page's main heading and moves one level down for equal major sections.",
    recoveryCue:
      "Choose heading levels for document structure, not for their default visual size.",
  },
  {
    id: "reusable-card-selector",
    lessonTitle: "Selectors and the box model",
    concept: "Reusable selectors",
    prompt:
      "Three resource cards should share the same spacing and border. Which selector gives them a reusable styling hook?",
    options: [
      { id: "class", label: ".resource-card" },
      { id: "id", label: "#resource-card" },
      { id: "universal", label: "*" },
    ],
    correctOptionId: "class",
    takeaway:
      "A class selector is the reusable contract for styling several elements that share the same role.",
    recoveryCue:
      "IDs describe one unique element; look for the selector designed to be reused across a group.",
  },
  {
    id: "predictable-card-width",
    lessonTitle: "Selectors and the box model",
    concept: "Predictable sizing",
    prompt:
      "A card has width, padding, and a border. Which declaration keeps the declared width inclusive of its padding and border?",
    options: [
      { id: "border-box", label: "box-sizing: border-box" },
      { id: "content-box", label: "box-sizing: content-box" },
      { id: "overflow", label: "overflow: hidden" },
    ],
    correctOptionId: "border-box",
    takeaway:
      "border-box keeps padding and borders inside the declared width, which makes component sizing easier to predict.",
    recoveryCue:
      "Look for the box model rule that changes how the browser calculates the element's total width.",
  },
  {
    id: "responsive-grid-tracks",
    lessonTitle: "Responsive CSS Grid",
    concept: "Flexible tracks",
    prompt:
      "A resource grid should add columns when space allows without choosing a device list. Which track rule expresses that relationship?",
    options: [
      {
        id: "auto-fit",
        label: "repeat(auto-fit, minmax(14rem, 1fr))",
      },
      { id: "fixed", label: "grid-template-columns: 14rem 14rem 14rem" },
      { id: "nowrap", label: "white-space: nowrap" },
    ],
    correctOptionId: "auto-fit",
    takeaway:
      "auto-fit and minmax() let the container choose how many readable tracks fit while each track can share spare space.",
    recoveryCue:
      "Look for the rule that combines a safe minimum with a flexible maximum and no fixed column count.",
  },
  {
    id: "accessible-form-label",
    lessonTitle: "Accessible forms",
    concept: "Field labels",
    prompt:
      "An email field needs a visible name that remains available after someone begins typing. Which markup creates the dependable connection?",
    options: [
      {
        id: "for-id",
        label: "A label whose for value matches the input id",
      },
      {
        id: "placeholder",
        label: "A placeholder with no label",
      },
      {
        id: "same-class",
        label: "The label and input sharing one CSS class",
      },
    ],
    correctOptionId: "for-id",
    takeaway:
      "Matching for and id gives the field a persistent accessible name and makes the visible label a useful click target.",
    recoveryCue:
      "Choose the native HTML relationship that names the control without relying on disappearing placeholder text.",
  },
];

export function isBoundedWebFoundationsReviewResult(result: {
  correctCount: number;
  totalCount: number;
}) {
  return (
    Number.isInteger(result.correctCount) &&
    result.totalCount === WEB_FOUNDATIONS_REVIEW_ITEMS.length &&
    result.correctCount >= 0 &&
    result.correctCount <= result.totalCount
  );
}

export function getWebFoundationsReviewIntervalDays(result: {
  correctCount: number;
  totalCount: number;
}) {
  if (!isBoundedWebFoundationsReviewResult(result)) return null;
  const recallRate = result.correctCount / result.totalCount;
  if (recallRate >= 0.75) return 7;
  if (recallRate >= 0.5) return 3;
  return 1;
}

export function getWebFoundationsReviewDueAt(
  result: { correctCount: number; totalCount: number },
  completedAt: Date,
) {
  const intervalDays = getWebFoundationsReviewIntervalDays(result);
  if (!intervalDays) {
    throw new Error("Foundations review result is outside its bounded range.");
  }
  return new Date(completedAt.getTime() + intervalDays * DAY_IN_MS);
}

export function isWebFoundationsReviewDue(
  result: { nextDueAt: string; totalCount?: number } | null,
  now = new Date(),
) {
  if (!result) return true;
  if (
    result.totalCount !== undefined &&
    result.totalCount !== WEB_FOUNDATIONS_REVIEW_ITEMS.length
  ) {
    return true;
  }
  const nextDueAt = Date.parse(result.nextDueAt);
  return !Number.isFinite(nextDueAt) || nextDueAt <= now.getTime();
}

export function formatWebFoundationsReviewDueDate(nextDueAt: string) {
  const date = new Date(nextDueAt);
  if (!Number.isFinite(date.getTime())) return "your next visit";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}
