export type CodingProblemDifficulty = "Beginner";

export type CodingProblemExample = {
  input: string;
  output: string;
  explanation: string;
};

export type CodingProblemTestCase = {
  input: string;
  expectedOutput: string;
};

export type CodingProblem = {
  slug: string;
  number: number;
  title: string;
  skill: string;
  difficulty: CodingProblemDifficulty;
  statement: string;
  inputFormat: string;
  outputFormat: string;
  examples: CodingProblemExample[];
  starterCode: string;
  tests: CodingProblemTestCase[];
};

export const CODING_PROBLEMS: CodingProblem[] = [
  {
    slug: "sum-two-numbers",
    number: 1,
    title: "Sum two numbers",
    skill: "Input handling",
    difficulty: "Beginner",
    statement:
      "Read two whole numbers from one line and return their sum. The numbers may be positive, negative, or zero.",
    inputFormat: "One line containing two space-separated integers: a b.",
    outputFormat: "One integer: a + b.",
    examples: [
      {
        input: "4 9",
        output: "13",
        explanation: "4 + 9 equals 13.",
      },
      {
        input: "-8 3",
        output: "-5",
        explanation: "Adding 3 to -8 gives -5.",
      },
    ],
    starterCode: `function solve(input) {
  const [a, b] = input.trim().split(/\\s+/).map(Number);

  return String(a + b);
}`,
    tests: [
      { input: "4 9", expectedOutput: "13" },
      { input: "-8 3", expectedOutput: "-5" },
      { input: "0 0", expectedOutput: "0" },
      { input: "120 880", expectedOutput: "1000" },
    ],
  },
  {
    slug: "even-or-odd",
    number: 2,
    title: "Even or odd",
    skill: "Conditions",
    difficulty: "Beginner",
    statement:
      'Read one whole number. Return "Even" when it is divisible by 2 and "Odd" otherwise.',
    inputFormat: "One integer n.",
    outputFormat: 'The exact word "Even" or "Odd".',
    examples: [
      {
        input: "17",
        output: "Odd",
        explanation: "17 is not divisible by 2.",
      },
      {
        input: "24",
        output: "Even",
        explanation: "24 is divisible by 2.",
      },
    ],
    starterCode: `function solve(input) {
  const number = Number(input.trim());

  return number % 2 === 0 ? "Even" : "Odd";
}`,
    tests: [
      { input: "17", expectedOutput: "Odd" },
      { input: "24", expectedOutput: "Even" },
      { input: "0", expectedOutput: "Even" },
      { input: "-11", expectedOutput: "Odd" },
    ],
  },
  {
    slug: "multiplication-table",
    number: 3,
    title: "Multiplication table",
    skill: "Loops",
    difficulty: "Beginner",
    statement:
      "Read one whole number and return its first ten multiples, from 1 × n through 10 × n.",
    inputFormat: "One integer n.",
    outputFormat: "Ten multiples separated by a single space.",
    examples: [
      {
        input: "5",
        output: "5 10 15 20 25 30 35 40 45 50",
        explanation: "These are 5 multiplied by 1 through 10.",
      },
    ],
    starterCode: `function solve(input) {
  const number = Number(input.trim());
  const multiples = [];

  for (let step = 1; step <= 10; step += 1) {
    multiples.push(number * step);
  }

  return multiples.join(" ");
}`,
    tests: [
      { input: "5", expectedOutput: "5 10 15 20 25 30 35 40 45 50" },
      { input: "1", expectedOutput: "1 2 3 4 5 6 7 8 9 10" },
      { input: "0", expectedOutput: "0 0 0 0 0 0 0 0 0 0" },
      { input: "-2", expectedOutput: "-2 -4 -6 -8 -10 -12 -14 -16 -18 -20" },
    ],
  },
  {
    slug: "largest-value",
    number: 4,
    title: "Largest value",
    skill: "Arrays",
    difficulty: "Beginner",
    statement:
      "Read a list of whole numbers and return the largest value. The first input line tells you how many values follow.",
    inputFormat:
      "The first line contains n. The second line contains n space-separated integers.",
    outputFormat: "The largest integer in the list.",
    examples: [
      {
        input: "5\n7 2 19 4 11",
        output: "19",
        explanation: "19 is greater than every other value in the list.",
      },
    ],
    starterCode: `function solve(input) {
  const values = input.trim().split(/\\s+/).map(Number);
  const numbers = values.slice(1);

  return String(Math.max(...numbers));
}`,
    tests: [
      { input: "5\n7 2 19 4 11", expectedOutput: "19" },
      { input: "4\n-8 -3 -21 -6", expectedOutput: "-3" },
      { input: "1\n42", expectedOutput: "42" },
      { input: "6\n5 5 5 4 5 3", expectedOutput: "5" },
    ],
  },
  {
    slug: "reverse-a-word",
    number: 5,
    title: "Reverse a word",
    skill: "Strings",
    difficulty: "Beginner",
    statement:
      "Read one lowercase word and return its characters in reverse order.",
    inputFormat: "One lowercase word with no spaces.",
    outputFormat: "The same word reversed.",
    examples: [
      {
        input: "semantic",
        output: "citnames",
        explanation: "Reading semantic from right to left produces citnames.",
      },
      {
        input: "level",
        output: "level",
        explanation: "A palindrome is unchanged when reversed.",
      },
    ],
    starterCode: `function solve(input) {
  const word = input.trim();

  return word.split("").reverse().join("");
}`,
    tests: [
      { input: "semantic", expectedOutput: "citnames" },
      { input: "level", expectedOutput: "level" },
      { input: "javascript", expectedOutput: "tpircsavaj" },
      { input: "a", expectedOutput: "a" },
    ],
  },
  {
    slug: "fizz-buzz",
    number: 6,
    title: "FizzBuzz sequence",
    skill: "Simple algorithms",
    difficulty: "Beginner",
    statement:
      'Return the numbers from 1 to n. Replace multiples of 3 with "Fizz", multiples of 5 with "Buzz", and multiples of both with "FizzBuzz".',
    inputFormat: "One positive integer n.",
    outputFormat: "The sequence from 1 to n, separated by a single space.",
    examples: [
      {
        input: "5",
        output: "1 2 Fizz 4 Buzz",
        explanation: "3 becomes Fizz and 5 becomes Buzz.",
      },
    ],
    starterCode: `function solve(input) {
  const limit = Number(input.trim());
  const answer = [];

  for (let number = 1; number <= limit; number += 1) {
    if (number % 15 === 0) answer.push("FizzBuzz");
    else if (number % 3 === 0) answer.push("Fizz");
    else if (number % 5 === 0) answer.push("Buzz");
    else answer.push(String(number));
  }

  return answer.join(" ");
}`,
    tests: [
      { input: "5", expectedOutput: "1 2 Fizz 4 Buzz" },
      {
        input: "15",
        expectedOutput:
          "1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz",
      },
      { input: "1", expectedOutput: "1" },
      {
        input: "20",
        expectedOutput:
          "1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz 16 17 Fizz 19 Buzz",
      },
    ],
  },
];

export const CODING_PROBLEM_COUNT = CODING_PROBLEMS.length;
export const MAX_CODING_SOLUTION_LENGTH = 12_000;
export const CODING_RUN_TIMEOUT_MS = 1_000;

export function getCodingProblem(slug: string) {
  return CODING_PROBLEMS.find((problem) => problem.slug === slug) ?? null;
}

export function getCodingProblemPreview(slug: string) {
  const problem = getCodingProblem(slug);

  if (!problem) return null;

  return {
    title: `${problem.title} JavaScript problem | Lovable Original`,
    description: `${problem.title}: solve this beginner JavaScript problem with browser-run checks. Sign in to save your code, attempts, and Accepted result.`,
  };
}

export function getNextUnfinishedCodingProblemSlug(completedSlugs: string[]) {
  const completed = new Set(completedSlugs);

  return (
    CODING_PROBLEMS.find((problem) => !completed.has(problem.slug))?.slug ?? null
  );
}

export function normalizeCodingOutput(output: string) {
  return output.replace(/\r\n/g, "\n").trim();
}

export function gradeCodingOutputs(slug: string, outputs: unknown) {
  const problem = getCodingProblem(slug);

  if (
    !problem ||
    !Array.isArray(outputs) ||
    outputs.length !== problem.tests.length ||
    outputs.some((output) => typeof output !== "string")
  ) {
    return null;
  }

  const normalizedOutputs = outputs.map((output) =>
    normalizeCodingOutput(output as string),
  );
  const passedTests = problem.tests.reduce(
    (count, test, index) =>
      count +
      (normalizedOutputs[index] === normalizeCodingOutput(test.expectedOutput)
        ? 1
        : 0),
    0,
  );

  return {
    verdict:
      passedTests === problem.tests.length
        ? ("Accepted" as const)
        : ("Wrong Answer" as const),
    passedTests,
    totalTests: problem.tests.length,
  };
}

export function hasValidCodingSolutionLength(code: string) {
  return code.trim().length > 0 && code.length <= MAX_CODING_SOLUTION_LENGTH;
}
