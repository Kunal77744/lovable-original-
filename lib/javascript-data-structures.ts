export type JavaScriptDataStructureExercise = {
  slug: string;
  number: number;
  title: string;
  structure: "Arrays" | "Strings" | "Objects" | "Sets";
  prompt: string;
  inputFormat: string;
  outputFormat: string;
  example: {
    input: string;
    output: string;
  };
  starterCode: string;
  tests: {
    input: string;
    expectedOutput: string;
  }[];
  recoveryCue: string;
  takeaway: string;
};

export const JAVASCRIPT_DATA_STRUCTURE_EXERCISES: JavaScriptDataStructureExercise[] = [
  {
    slug: "sum-even-values",
    number: 1,
    title: "Select values from an array",
    structure: "Arrays",
    prompt:
      "Read space-separated whole numbers and return the total of only the even values.",
    inputFormat: "One line of space-separated whole numbers.",
    outputFormat: "One number: the sum of the even values.",
    example: { input: "2 7 4 9", output: "6" },
    starterCode: `function solve(input) {
  const numbers = input.trim().split(/\\s+/).map(Number);
  let total = 0;

  // Visit the array and add only its even values.

  return String(total);
}`,
    tests: [
      { input: "2 7 4 9", expectedOutput: "6" },
      { input: "1 3 5", expectedOutput: "0" },
      { input: "-2 -3 8", expectedOutput: "6" },
    ],
    recoveryCue:
      "Visit each number. Add it to total only when dividing by 2 leaves no remainder.",
    takeaway:
      "An array keeps ordered values together, so one loop can inspect each item and select what belongs.",
  },
  {
    slug: "count-vowels",
    number: 2,
    title: "Inspect a string one character at a time",
    structure: "Strings",
    prompt:
      "Return how many vowels appear in the text. Treat uppercase and lowercase letters the same.",
    inputFormat: "One line of text.",
    outputFormat: "One number: the vowel count.",
    example: { input: "Learning", output: "3" },
    starterCode: `function solve(input) {
  const text = input.trim().toLowerCase();
  let vowelCount = 0;

  // Inspect each character and count a, e, i, o, or u.

  return String(vowelCount);
}`,
    tests: [
      { input: "Learning", expectedOutput: "3" },
      { input: "rhythm", expectedOutput: "0" },
      { input: "AEIOU", expectedOutput: "5" },
    ],
    recoveryCue:
      'Check whether each character appears inside the string "aeiou", then update the count.',
    takeaway:
      "A string can be traversed like a sequence. Normalize its case once before comparing characters.",
  },
  {
    slug: "word-frequency",
    number: 3,
    title: "Count repeated words with an object",
    structure: "Objects",
    prompt:
      'Count each space-separated word, then return entries in first-seen order as "word:count" pairs.',
    inputFormat: "One line of lowercase words separated by spaces.",
    outputFormat: 'Space-separated "word:count" pairs in first-seen order.',
    example: { input: "apple banana apple", output: "apple:2 banana:1" },
    starterCode: `function solve(input) {
  const words = input.trim().split(/\\s+/);
  const counts = {};

  // Store and update one count for every word.

  return Object.entries(counts)
    .map(([word, count]) => \`\${word}:\${count}\`)
    .join(" ");
}`,
    tests: [
      {
        input: "apple banana apple",
        expectedOutput: "apple:2 banana:1",
      },
      { input: "red red blue red", expectedOutput: "red:3 blue:1" },
      { input: "one", expectedOutput: "one:1" },
    ],
    recoveryCue:
      "Use each word as an object key. Start a missing key at 0, then add 1 for the current word.",
    takeaway:
      "An object maps a meaningful key to a value, making it useful for counts and fast lookups.",
  },
  {
    slug: "unique-tags",
    number: 4,
    title: "Keep only unique values with a set",
    structure: "Sets",
    prompt:
      "Return how many distinct tags appear in the input, even when the same tag appears more than once.",
    inputFormat: "One line of lowercase tags separated by spaces.",
    outputFormat: "One number: the distinct tag count.",
    example: { input: "js css js html", output: "3" },
    starterCode: `function solve(input) {
  const tags = input.trim().split(/\\s+/);
  const uniqueTags = new Set();

  // Add every tag to the set.

  return String(uniqueTags.size);
}`,
    tests: [
      { input: "js css js html", expectedOutput: "3" },
      { input: "array array array", expectedOutput: "1" },
      { input: "map set object map set", expectedOutput: "3" },
    ],
    recoveryCue:
      "Add every tag to uniqueTags. A set ignores a value when that value is already present.",
    takeaway:
      "A set stores each value once, so its size answers a uniqueness question without manual duplicate checks.",
  },
];
