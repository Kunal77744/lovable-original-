export type CodingRepairDrillChoice = {
  id: string;
  label: string;
};

export type CodingRepairDrill = {
  prompt: string;
  choices: [
    CodingRepairDrillChoice,
    CodingRepairDrillChoice,
    CodingRepairDrillChoice,
  ];
  correctChoiceId: string;
  recoveryCue: string;
  explanation: string;
};

const CODING_REPAIR_DRILLS: Record<string, CodingRepairDrill> = {
  "sum-two-numbers": {
    prompt: "What should happen before the two input tokens are added?",
    choices: [
      { id: "join", label: "Join the tokens into one piece of text" },
      { id: "convert", label: "Convert both tokens into numbers" },
      { id: "sort", label: "Sort the tokens from smallest to largest" },
    ],
    correctChoiceId: "convert",
    recoveryCue: "Focus on the type of each token, not their order.",
    explanation:
      "Converting both tokens makes + perform arithmetic for positive, negative, and zero values.",
  },
  "even-or-odd": {
    prompt: "Which observation is enough to choose the exact output word?",
    choices: [
      { id: "sign", label: "Whether the number is positive or negative" },
      { id: "remainder", label: "Whether division by 2 leaves remainder 0" },
      { id: "digits", label: "How many digits the number contains" },
    ],
    correctChoiceId: "remainder",
    recoveryCue: "The condition needs one property shared by every even integer.",
    explanation:
      "A remainder of 0 identifies every even integer, including 0 and negative values.",
  },
  "multiplication-table": {
    prompt: "Which loop boundary produces exactly the requested ten values?",
    choices: [
      { id: "zero-nine", label: "Multipliers 0 through 9" },
      { id: "one-nine", label: "Multipliers 1 through 9" },
      { id: "one-ten", label: "Multipliers 1 through 10" },
    ],
    correctChoiceId: "one-ten",
    recoveryCue: "Count both endpoints and compare the first and final products.",
    explanation:
      "Visiting 1 through 10 once creates ten multiples with the required first and final values.",
  },
  "largest-value": {
    prompt: "What is the safest starting maximum when every value might be negative?",
    choices: [
      { id: "zero", label: "Always start at 0" },
      { id: "first", label: "Start with the first value in the list" },
      { id: "count", label: "Start with the leading item count" },
    ],
    correctChoiceId: "first",
    recoveryCue: "Choose a starting value that is guaranteed to belong to the data.",
    explanation:
      "Starting from the first list value keeps all-negative inputs valid and avoids mixing in the count.",
  },
  "reverse-a-word": {
    prompt: "Which traversal includes every character exactly once in reverse order?",
    choices: [
      { id: "last-first", label: "Move from the final index down to 0" },
      { id: "length-zero", label: "Move from word.length down to 0" },
      { id: "first-last", label: "Move from index 0 up to the final index" },
    ],
    correctChoiceId: "last-first",
    recoveryCue: "The final valid index is one less than the string length.",
    explanation:
      "Starting at the final valid index and ending at 0 visits each character once without adding undefined.",
  },
  "fizz-buzz": {
    prompt: "Which condition must be checked before the single-divisor cases?",
    choices: [
      { id: "three", label: "Divisible by 3 only" },
      { id: "five", label: "Divisible by 5 only" },
      { id: "both", label: "Divisible by both 3 and 5" },
    ],
    correctChoiceId: "both",
    recoveryCue: "Think about the value 15 and which earlier branch could claim it.",
    explanation:
      "Checking the shared case first prevents 15 and its multiples from being captured by a single rule.",
  },
  "count-vowels": {
    prompt: "What comparison should happen for each character in the word?",
    choices: [
      { id: "position", label: "Compare its index with the word length" },
      { id: "membership", label: "Check whether its lowercase form is a vowel" },
      { id: "neighbor", label: "Check whether it matches the previous character" },
    ],
    correctChoiceId: "membership",
    recoveryCue: "The same check should work for uppercase and lowercase letters.",
    explanation:
      "Normalizing each character before a vowel-membership check counts both letter cases through one path.",
  },
  "unique-values": {
    prompt: "What must be preserved while duplicates are removed?",
    choices: [
      { id: "sorted", label: "Alphabetical or numeric order" },
      { id: "first-seen", label: "The order values first appeared" },
      { id: "last-seen", label: "Only the position of each final duplicate" },
    ],
    correctChoiceId: "first-seen",
    recoveryCue: "Compare the required output order with the original input order.",
    explanation:
      "Adding only unseen values during a left-to-right traversal removes duplicates while preserving first appearance.",
  },
  "balanced-brackets": {
    prompt: "What should a closing bracket be compared with?",
    choices: [
      { id: "first", label: "The first opening bracket in the string" },
      { id: "recent", label: "The most recent unmatched opening bracket" },
      { id: "next", label: "The next character after the closing bracket" },
    ],
    correctChoiceId: "recent",
    recoveryCue: "Nested pairs close in the opposite order from how they opened.",
    explanation:
      "A stack exposes the most recent unmatched opener, which is the only bracket the current closer may match.",
  },
  "first-unique-character": {
    prompt: "Which two-pass plan finds the first unique character reliably?",
    choices: [
      { id: "sort", label: "Sort the characters, then choose the first one" },
      { id: "count-scan", label: "Count every character, then scan the original order" },
      { id: "neighbors", label: "Compare only each pair of neighboring characters" },
    ],
    correctChoiceId: "count-scan",
    recoveryCue: "You need both total frequency and the original position.",
    explanation:
      "Counting first identifies unique characters; scanning the original string again preserves the meaning of first.",
  },
  "binary-search-index": {
    prompt: "After comparing the middle value, what must the next search keep?",
    choices: [
      { id: "both", label: "Both halves, but in reverse order" },
      { id: "possible", label: "Only the half that can still contain the target" },
      { id: "middle", label: "Only the middle value already checked" },
    ],
    correctChoiceId: "possible",
    recoveryCue: "Use the sorted order to prove which half is impossible.",
    explanation:
      "Discarding the impossible half after each comparison keeps the target candidate range valid and shrinking.",
  },
  "maximum-window-sum": {
    prompt: "How should the sum change when a fixed-size window moves one place?",
    choices: [
      { id: "recount", label: "Recalculate every value in the new window" },
      { id: "edges", label: "Subtract the outgoing value and add the incoming value" },
      { id: "largest", label: "Add only the larger of the two edge values" },
    ],
    correctChoiceId: "edges",
    recoveryCue: "Neighboring windows share every value except their two edges.",
    explanation:
      "Updating only the outgoing and incoming edges preserves the exact window sum without repeating shared work.",
  },
};

export function getCodingRepairDrill(problemSlug: string) {
  return CODING_REPAIR_DRILLS[problemSlug] ?? null;
}

export function getCodingRepairDrillSlugs() {
  return Object.keys(CODING_REPAIR_DRILLS);
}
