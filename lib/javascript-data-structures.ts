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
  walkthrough: {
    input: string;
    stateLabel: string;
    steps: {
      title: string;
      detail: string;
      currentItem: string;
      decision: string;
      state: string[];
      result?: string;
    }[];
  };
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
    walkthrough: {
      input: "2 7 4 9",
      stateLabel: "Even values and total",
      steps: [
        {
          title: "Inspect the first value",
          detail: "Two is even, so keep it and add it to the running total.",
          currentItem: "2",
          decision: "Keep and add",
          state: ["even values [2]", "total 2"],
        },
        {
          title: "Skip the odd value",
          detail: "Seven is odd. The selected array and total stay unchanged.",
          currentItem: "7",
          decision: "Skip",
          state: ["even values [2]", "total 2"],
        },
        {
          title: "Add the next even value",
          detail: "Four joins the selected values and raises the total from two to six.",
          currentItem: "4",
          decision: "Keep and add",
          state: ["even values [2, 4]", "total 6"],
        },
        {
          title: "Finish the traversal",
          detail: "Nine is odd, so the final total remains six.",
          currentItem: "9",
          decision: "Skip",
          state: ["even values [2, 4]", "total 6"],
          result: "Return 6 after visiting every array item once.",
        },
      ],
    },
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
    walkthrough: {
      input: "Code",
      stateLabel: "Vowels found",
      steps: [
        {
          title: "Normalize before comparing",
          detail: "Lowercase c is not inside the vowel set, so the count stays zero.",
          currentItem: "c",
          decision: "Not a vowel",
          state: ["vowels []", "count 0"],
        },
        {
          title: "Count the first vowel",
          detail: "The character o matches the vowel set, so increase the count.",
          currentItem: "o",
          decision: "Count",
          state: ["vowels [o]", "count 1"],
        },
        {
          title: "Leave the count unchanged",
          detail: "The character d is not a vowel.",
          currentItem: "d",
          decision: "Not a vowel",
          state: ["vowels [o]", "count 1"],
        },
        {
          title: "Count the final vowel",
          detail: "The character e matches, bringing the final count to two.",
          currentItem: "e",
          decision: "Count",
          state: ["vowels [o, e]", "count 2"],
          result: "Return 2 after inspecting all four characters.",
        },
      ],
    },
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
    walkthrough: {
      input: "apple banana apple",
      stateLabel: "Object entries",
      steps: [
        {
          title: "Create the first key",
          detail: "Apple has no entry yet, so start its count at one.",
          currentItem: "apple",
          decision: "Create key",
          state: ["apple: 1"],
        },
        {
          title: "Create another key",
          detail: "Banana gets its own property while apple keeps its saved count.",
          currentItem: "banana",
          decision: "Create key",
          state: ["apple: 1", "banana: 1"],
        },
        {
          title: "Update an existing key",
          detail: "Apple already exists, so read one and store two under the same key.",
          currentItem: "apple",
          decision: "Increase value",
          state: ["apple: 2", "banana: 1"],
          result: "Object.entries preserves first-seen order: apple:2 banana:1.",
        },
      ],
    },
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
    walkthrough: {
      input: "js css js html",
      stateLabel: "Set contents",
      steps: [
        {
          title: "Add the first tag",
          detail: "The set is empty, so js becomes its first unique value.",
          currentItem: "js",
          decision: "Add",
          state: ["js"],
        },
        {
          title: "Add a different tag",
          detail: "CSS is not present, so the set grows to two values.",
          currentItem: "css",
          decision: "Add",
          state: ["js", "css"],
        },
        {
          title: "Ignore the duplicate",
          detail: "JS is already present. Adding it again leaves the set unchanged.",
          currentItem: "js",
          decision: "Already present",
          state: ["js", "css"],
        },
        {
          title: "Add the final unique tag",
          detail: "HTML is new, so it becomes the set's third value.",
          currentItem: "html",
          decision: "Add",
          state: ["js", "css", "html"],
          result: "The set size is 3 even though the input contains four tags.",
        },
      ],
    },
  },
];
