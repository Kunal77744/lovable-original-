export type JavaScriptFoundationExercise = {
  slug: string;
  number: number;
  title: string;
  concept: string;
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

export const JAVASCRIPT_FOUNDATION_EXERCISES: JavaScriptFoundationExercise[] = [
  {
    slug: "parse-and-sum",
    number: 1,
    title: "Turn input into numbers",
    concept: "Parse",
    prompt:
      "Read every space-separated whole number and return their total. The input begins as text, even when it looks numeric.",
    inputFormat: "One line of space-separated whole numbers.",
    outputFormat: "One number: the total of every input value.",
    example: { input: "4 7 2", output: "13" },
    starterCode: `function solve(input) {
  const numbers = input.trim().split(/\\s+/).map(Number);
  let total = 0;

  // Add every number to total.

  return String(total);
}`,
    tests: [
      { input: "4 7 2", expectedOutput: "13" },
      { input: "-5 8", expectedOutput: "3" },
      { input: "0 10 20 30", expectedOutput: "60" },
    ],
    recoveryCue:
      "Visit each value in numbers and update total before the return statement.",
    takeaway:
      "Input arrives as text. Trim it, split it, convert each piece, then calculate.",
  },
  {
    slug: "choose-a-branch",
    number: 2,
    title: "Choose one exact branch",
    concept: "Decide",
    prompt:
      'Read one whole number. Return "Positive", "Negative", or "Zero" using mutually exclusive conditions.',
    inputFormat: "One whole number.",
    outputFormat: 'Exactly one word: "Positive", "Negative", or "Zero".',
    example: { input: "-9", output: "Negative" },
    starterCode: `function solve(input) {
  const number = Number(input.trim());

  // Return one exact label for number.
}`,
    tests: [
      { input: "12", expectedOutput: "Positive" },
      { input: "-9", expectedOutput: "Negative" },
      { input: "0", expectedOutput: "Zero" },
    ],
    recoveryCue:
      "Handle values above zero and below zero first. The remaining case is exactly zero.",
    takeaway:
      "Order conditions so each input reaches one branch, then return the exact required text.",
  },
  {
    slug: "build-output",
    number: 3,
    title: "Build output with a loop",
    concept: "Repeat",
    prompt:
      "Read one whole number and return its first four multiples, separated by one space.",
    inputFormat: "One whole number n.",
    outputFormat: "n, 2 × n, 3 × n, and 4 × n separated by spaces.",
    example: { input: "3", output: "3 6 9 12" },
    starterCode: `function solve(input) {
  const number = Number(input.trim());
  const multiples = [];

  // Build the first four multiples.

  return multiples.join(" ");
}`,
    tests: [
      { input: "3", expectedOutput: "3 6 9 12" },
      { input: "1", expectedOutput: "1 2 3 4" },
      { input: "-2", expectedOutput: "-2 -4 -6 -8" },
    ],
    recoveryCue:
      "Repeat from 1 through 4, pushing number multiplied by the current step into multiples.",
    takeaway:
      "Collect repeated results in an array, then join them once to control the output format.",
  },
];
