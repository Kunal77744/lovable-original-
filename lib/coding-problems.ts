export type CodingProblemDifficulty = "Beginner" | "Intermediate";

export type CodingProblemExample = {
  input: string;
  output: string;
  explanation: string;
};

export type CodingProblemTestCase = {
  label: string;
  input: string;
  expectedOutput: string;
};

export type CodingProblemExplanation = {
  concept: string;
  whyItWorks: string;
  commonMistake: string;
  efficiency: {
    time: string;
    space: string;
    explanation: string;
  };
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
  recoveryHint: string;
  recoveryHints: [string, string];
  acceptedExplanation: CodingProblemExplanation;
  examples: CodingProblemExample[];
  starterCode: string;
  tests: CodingProblemTestCase[];
};

export const CODING_SOLUTION_SCAFFOLD = `function solve(input) {
  // Read the problem, use input, and return the exact output.
  return "";
}`;

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
    recoveryHint:
      "Trace both values from the input to the returned number. Check number conversion, zero, and negative signs instead of testing only the sample.",
    recoveryHints: [
      "Inspect the two input tokens before you add them. If either still behaves like text, arithmetic will not produce the intended total.",
      "Use one negative case and the zero case from your private tests. The same conversion and return path should handle both without a special branch.",
    ],
    acceptedExplanation: {
      concept: "Parse text before arithmetic",
      whyItWorks:
        "Browser input arrives as text. Converting both tokens to numbers makes addition work for positive values, negatives, and zero.",
      commonMistake:
        'Adding the raw tokens joins strings, so "4" and "9" become "49" instead of 13.',
      efficiency: {
        time: "O(1)",
        space: "O(1)",
        explanation:
          "A direct solution converts and adds exactly two values, so the amount of work and working memory stay constant.",
      },
    },
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
    starterCode: CODING_SOLUTION_SCAFFOLD,
    tests: [
      { label: "Positive values", input: "4 9", expectedOutput: "13" },
      { label: "Negative result", input: "-8 3", expectedOutput: "-5" },
      { label: "Zero values", input: "0 0", expectedOutput: "0" },
      { label: "Larger total", input: "120 880", expectedOutput: "1000" },
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
    recoveryHint:
      "Trace the remainder for zero, an even positive number, and a negative odd number. Then check the exact capitalization of the word you return.",
    recoveryHints: [
      "Write down the remainder produced by dividing the input by 2. Only one remainder should map to Even.",
      "Check the exact returned word after the condition. The judge compares capitalization as well as the branch.",
    ],
    acceptedExplanation: {
      concept: "Remainders reveal divisibility",
      whyItWorks:
        "Every even integer leaves a remainder of zero when divided by 2. Odd integers do not, including negative ones.",
      commonMistake:
        'Testing only positive numbers or returning "even" and "odd" with the wrong capitalization.',
      efficiency: {
        time: "O(1)",
        space: "O(1)",
        explanation:
          "One remainder check decides the answer without a loop or any storage that grows with the input value.",
      },
    },
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
    starterCode: CODING_SOLUTION_SCAFFOLD,
    tests: [
      { label: "Positive odd", input: "17", expectedOutput: "Odd" },
      { label: "Positive even", input: "24", expectedOutput: "Even" },
      { label: "Zero", input: "0", expectedOutput: "Even" },
      { label: "Negative odd", input: "-11", expectedOutput: "Odd" },
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
    recoveryHint:
      "Count your loop boundaries. The result needs exactly ten values, starting with the first multiple and ending with the tenth, separated by single spaces.",
    recoveryHints: [
      "List the first and last multiplier your loop visits. They should account for ten results, not nine or eleven.",
      "Build the ten values first, then join them once. Extra separators or line breaks change the judged output.",
    ],
    acceptedExplanation: {
      concept: "Loop boundaries define the sequence",
      whyItWorks:
        "Visiting multipliers 1 through 10 once creates ten ordered values. Joining them once keeps the spacing exact.",
      commonMistake:
        "Stopping before 10 misses the final multiple, while starting at 0 adds an extra value.",
      efficiency: {
        time: "O(1)",
        space: "O(1)",
        explanation:
          "The problem always produces exactly ten multiples, so both the work and output size have a fixed upper bound.",
      },
    },
    examples: [
      {
        input: "5",
        output: "5 10 15 20 25 30 35 40 45 50",
        explanation: "These are 5 multiplied by 1 through 10.",
      },
    ],
    starterCode: CODING_SOLUTION_SCAFFOLD,
    tests: [
      { label: "Standard table", input: "5", expectedOutput: "5 10 15 20 25 30 35 40 45 50" },
      { label: "Identity table", input: "1", expectedOutput: "1 2 3 4 5 6 7 8 9 10" },
      { label: "Zero table", input: "0", expectedOutput: "0 0 0 0 0 0 0 0 0 0" },
      { label: "Negative table", input: "-2", expectedOutput: "-2 -4 -6 -8 -10 -12 -14 -16 -18 -20" },
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
    recoveryHint:
      "Separate the leading count from the values you compare. Test an all-negative list so a starting value of zero cannot hide the mistake.",
    recoveryHints: [
      "Ignore the first token after using it as the count. Only the values on the list should compete for the maximum.",
      "Choose the first list value as your starting comparison. That keeps an all-negative list below zero instead of inventing zero.",
    ],
    acceptedExplanation: {
      concept: "Compare only the data values",
      whyItWorks:
        "Separating the leading count leaves only the values that should compete for the maximum, including values below zero.",
      commonMistake:
        "Starting the maximum at 0 gives the wrong answer when every value in the list is negative.",
      efficiency: {
        time: "O(n)",
        space: "O(1)",
        explanation:
          "A direct scan compares each of the n values once and needs only the best value seen so far after parsing.",
      },
    },
    examples: [
      {
        input: "5\n7 2 19 4 11",
        output: "19",
        explanation: "19 is greater than every other value in the list.",
      },
    ],
    starterCode: CODING_SOLUTION_SCAFFOLD,
    tests: [
      { label: "Mixed values", input: "5\n7 2 19 4 11", expectedOutput: "19" },
      { label: "All negative", input: "4\n-8 -3 -21 -6", expectedOutput: "-3" },
      { label: "Single value", input: "1\n42", expectedOutput: "42" },
      { label: "Repeated maximum", input: "6\n5 5 5 4 5 3", expectedOutput: "5" },
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
    recoveryHint:
      "Trace one character from each end of the word. Check that every character appears once and that the returned text has no extra spaces.",
    recoveryHints: [
      "Check the index of the first character you append and the last character you append. They should be opposite ends of the word.",
      "Compare the output length with the input length. A mismatch means a character was skipped, repeated, or joined with extra text.",
    ],
    acceptedExplanation: {
      concept: "Order can change without changing characters",
      whyItWorks:
        "Reversing the character order once and joining it back together preserves the word's length. Palindromes naturally stay unchanged.",
      commonMistake:
        "Dropping an end character or returning extra spaces instead of the exact reversed word.",
      efficiency: {
        time: "O(n)",
        space: "O(n)",
        explanation:
          "Every character must appear in the reversed result, so the work and returned string both grow with the word length.",
      },
    },
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
    starterCode: CODING_SOLUTION_SCAFFOLD,
    tests: [
      { label: "Standard word", input: "semantic", expectedOutput: "citnames" },
      { label: "Palindrome", input: "level", expectedOutput: "level" },
      { label: "Longer word", input: "javascript", expectedOutput: "tpircsavaj" },
      { label: "Single character", input: "a", expectedOutput: "a" },
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
    recoveryHint:
      "Check the overlap before either single divisibility case. A multiple of both 3 and 5 needs one token, and the sequence still needs to include n.",
    recoveryHints: [
      "For 15, decide which condition should win before you handle divisibility by only 3 or only 5.",
      "Count from 1 through the input, including the final value, and collect one token per number before joining the sequence.",
    ],
    acceptedExplanation: {
      concept: "Handle overlapping rules first",
      whyItWorks:
        "Checking the shared 3-and-5 case first protects FizzBuzz. The single rules and number fallback then cover every other value.",
      commonMistake:
        "Checking divisibility by 3 or 5 first hides the combined case when the value is divisible by both.",
      efficiency: {
        time: "O(n)",
        space: "O(n)",
        explanation:
          "The sequence visits every number from 1 through n once and stores n output tokens before joining them.",
      },
    },
    examples: [
      {
        input: "5",
        output: "1 2 Fizz 4 Buzz",
        explanation: "3 becomes Fizz and 5 becomes Buzz.",
      },
    ],
    starterCode: CODING_SOLUTION_SCAFFOLD,
    tests: [
      { label: "Fizz and Buzz", input: "5", expectedOutput: "1 2 Fizz 4 Buzz" },
      {
        label: "Combined rule",
        input: "15",
        expectedOutput:
          "1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz",
      },
      { label: "Smallest sequence", input: "1", expectedOutput: "1" },
      {
        label: "Sequence after FizzBuzz",
        input: "20",
        expectedOutput:
          "1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz 16 17 Fizz 19 Buzz",
      },
    ],
  },
  {
    slug: "count-vowels",
    number: 7,
    title: "Count vowels",
    skill: "String traversal",
    difficulty: "Beginner",
    statement:
      "Read one lowercase word and return how many characters are vowels. Treat a, e, i, o, and u as vowels.",
    inputFormat: "One lowercase word with no spaces.",
    outputFormat: "One integer: the number of vowels in the word.",
    recoveryHint:
      "Visit every character once and compare it with the complete five-vowel set. Test a word with repeated vowels and a word with none.",
    recoveryHints: [
      "Trace the counter after every character in a word such as queue. It should change for each vowel, including repeated vowels.",
      "Keep all five lowercase vowels in one membership check. A word with no matching characters should return zero without a special case.",
    ],
    acceptedExplanation: {
      concept: "Traverse and classify each character",
      whyItWorks:
        "Checking each character against the vowel set counts every match once, including repeated vowels, while consonants leave the total unchanged.",
      commonMistake:
        "Checking only whether a word contains a vowel returns a yes-or-no result instead of counting every occurrence.",
      efficiency: {
        time: "O(n)",
        space: "O(1)",
        explanation:
          "One pass checks each of the n characters, while the five-vowel lookup and running count stay fixed in size.",
      },
    },
    examples: [
      {
        input: "javascript",
        output: "3",
        explanation: "The vowels are a, a, and i.",
      },
      {
        input: "rhythm",
        output: "0",
        explanation: "None of the five lowercase vowels appears.",
      },
    ],
    starterCode: CODING_SOLUTION_SCAFFOLD,
    tests: [
      { label: "Mixed characters", input: "javascript", expectedOutput: "3" },
      { label: "No vowels", input: "rhythm", expectedOutput: "0" },
      { label: "Repeated vowels", input: "queue", expectedOutput: "4" },
      { label: "Single vowel", input: "a", expectedOutput: "1" },
    ],
  },
  {
    slug: "unique-values",
    number: 8,
    title: "Keep unique values",
    skill: "Sets",
    difficulty: "Beginner",
    statement:
      "Read a list of whole numbers and return each value only the first time it appears, preserving the original order.",
    inputFormat:
      "The first line contains n. The second line contains n space-separated integers.",
    outputFormat: "The unique values in their original order, separated by one space.",
    recoveryHint:
      "Separate the leading count from the values, then track what you have already emitted. Test repeated negatives and a list containing only one value.",
    recoveryHints: [
      "Walk from left to right and decide whether each value has appeared earlier. Preserve the value only on its first visit.",
      "Do not sort the values before removing duplicates. The required order is the same order as each value's first appearance.",
    ],
    acceptedExplanation: {
      concept: "Use a set to remember prior values",
      whyItWorks:
        "A set answers whether a value was seen before, while the left-to-right traversal preserves first-appearance order in the result.",
      commonMistake:
        "Converting the list to a sorted set changes the required order even when the unique values are correct.",
      efficiency: {
        time: "O(n) average",
        space: "O(n)",
        explanation:
          "A set gives an average constant-time seen check for each value, and may retain every value when all n are unique.",
      },
    },
    examples: [
      {
        input: "7\n4 2 4 3 2 3 9",
        output: "4 2 3 9",
        explanation: "Only the first appearance of each value remains.",
      },
    ],
    starterCode: CODING_SOLUTION_SCAFFOLD,
    tests: [
      { label: "Repeated values", input: "7\n4 2 4 3 2 3 9", expectedOutput: "4 2 3 9" },
      { label: "Repeated negatives", input: "5\n-1 -1 2 -1 2", expectedOutput: "-1 2" },
      { label: "Single value", input: "1\n8", expectedOutput: "8" },
      { label: "Already unique", input: "6\n1 2 3 4 5 6", expectedOutput: "1 2 3 4 5 6" },
    ],
  },
  {
    slug: "balanced-brackets",
    number: 9,
    title: "Balanced brackets",
    skill: "Stacks",
    difficulty: "Intermediate",
    statement:
      'Read a string containing only (), [], and {}. Return "Balanced" when every opening bracket closes in the correct order, otherwise return "Not balanced".',
    inputFormat: "One non-empty string containing only bracket characters.",
    outputFormat: 'The exact words "Balanced" or "Not balanced".',
    recoveryHint:
      "Track the most recent unmatched opening bracket. Test crossed pairs, an early closing bracket, and leftover openings after the input ends.",
    recoveryHints: [
      "When a closing bracket arrives, compare it with the most recent unmatched opening bracket rather than any earlier opening.",
      "A correct traversal can still finish with unmatched openings. Check that the stored opening-bracket stack is empty at the end.",
    ],
    acceptedExplanation: {
      concept: "Last opened means first closed",
      whyItWorks:
        "A stack keeps the most recent unmatched opening bracket on top, so each closing bracket can be checked against the only valid partner.",
      commonMistake:
        "Counting opening and closing brackets can miss crossed pairs such as ([)] because the totals still match.",
      efficiency: {
        time: "O(n)",
        space: "O(n)",
        explanation:
          "Each bracket is pushed or checked once, while a string of only opening brackets can grow the stack to n entries.",
      },
    },
    examples: [
      {
        input: "{[()]}",
        output: "Balanced",
        explanation: "Every closing bracket matches the latest unmatched opening.",
      },
      {
        input: "([)]",
        output: "Not balanced",
        explanation: "The pairs cross instead of closing in stack order.",
      },
    ],
    starterCode: CODING_SOLUTION_SCAFFOLD,
    tests: [
      { label: "Nested pairs", input: "{[()]}", expectedOutput: "Balanced" },
      { label: "Crossed pairs", input: "([)]", expectedOutput: "Not balanced" },
      { label: "Early closing bracket", input: "]", expectedOutput: "Not balanced" },
      { label: "Adjacent nested groups", input: "(([]){})", expectedOutput: "Balanced" },
      { label: "Unclosed opening bracket", input: "(()", expectedOutput: "Not balanced" },
    ],
  },
  {
    slug: "first-unique-character",
    number: 10,
    title: "First unique character",
    skill: "Frequency maps",
    difficulty: "Intermediate",
    statement:
      'Read one lowercase word and return its first character that appears exactly once. Return "None" when every character repeats.',
    inputFormat: "One lowercase word with no spaces.",
    outputFormat: 'The first non-repeating character, or the exact word "None".',
    recoveryHint:
      "Count every character before choosing the answer, then scan in the original order. Test a unique character near the end and a word with no answer.",
    recoveryHints: [
      "Build the complete frequency count first. A character that looks unique early may appear again later in the word.",
      "Use a second left-to-right pass to choose the answer. Iterating map keys alone can make the intended original-order rule less explicit.",
    ],
    acceptedExplanation: {
      concept: "Separate counting from ordered selection",
      whyItWorks:
        "The frequency map proves which characters occur once, and the second pass preserves the word's order when selecting the first one.",
      commonMistake:
        "Returning the first character before the complete count is known can choose a character that repeats later.",
      efficiency: {
        time: "O(n)",
        space: "O(k)",
        explanation:
          "Two linear passes count and select in order, while the frequency map stores k distinct characters, at most 26 here.",
      },
    },
    examples: [
      {
        input: "swiss",
        output: "w",
        explanation: "s repeats, while w is the first character seen exactly once.",
      },
      {
        input: "aabb",
        output: "None",
        explanation: "Every character appears more than once.",
      },
    ],
    starterCode: CODING_SOLUTION_SCAFFOLD,
    tests: [
      { label: "Unique near the start", input: "swiss", expectedOutput: "w" },
      { label: "No unique character", input: "aabb", expectedOutput: "None" },
      { label: "Unique near the middle", input: "level", expectedOutput: "v" },
      { label: "Single character", input: "z", expectedOutput: "z" },
    ],
  },
  {
    slug: "binary-search-index",
    number: 11,
    title: "Binary search index",
    skill: "Binary search",
    difficulty: "Intermediate",
    statement:
      "Read a sorted list of distinct whole numbers and a target. Return the zero-based index of the target, or -1 when it is absent.",
    inputFormat:
      "The first line contains n. The second line contains n sorted integers. The third line contains the target.",
    outputFormat: "The target's zero-based index, or -1 when the target is absent.",
    recoveryHint:
      "Keep an inclusive left and right boundary, recompute the midpoint after each change, and test the first, last, missing, and single-value cases.",
    recoveryHints: [
      "After comparing the midpoint with the target, discard the midpoint itself from the half that cannot contain the answer.",
      "Use a loop condition that still checks a one-value search range. The first and last positions should both remain reachable.",
    ],
    acceptedExplanation: {
      concept: "Discard half of a sorted range",
      whyItWorks:
        "Comparing the target with the midpoint proves which half cannot contain it, shrinking the remaining sorted range until found or empty.",
      commonMistake:
        "Keeping the midpoint inside the next range can cause an infinite loop when only one or two positions remain.",
      efficiency: {
        time: "O(log n) search",
        space: "O(1)",
        explanation:
          "After parsing, each comparison halves the remaining range and an iterative search keeps only its boundaries and midpoint.",
      },
    },
    examples: [
      {
        input: "6\n-4 0 3 7 12 20\n7",
        output: "3",
        explanation: "7 appears at zero-based index 3.",
      },
      {
        input: "4\n2 5 8 11\n6",
        output: "-1",
        explanation: "6 does not appear in the sorted list.",
      },
    ],
    starterCode: CODING_SOLUTION_SCAFFOLD,
    tests: [
      { label: "Target in the middle", input: "6\n-4 0 3 7 12 20\n7", expectedOutput: "3" },
      { label: "Missing target", input: "4\n2 5 8 11\n6", expectedOutput: "-1" },
      { label: "First position", input: "5\n1 4 9 15 22\n1", expectedOutput: "0" },
      { label: "Last position", input: "5\n1 4 9 15 22\n22", expectedOutput: "4" },
      { label: "Single-value range", input: "1\n-3\n-3", expectedOutput: "0" },
    ],
  },
  {
    slug: "maximum-window-sum",
    number: 12,
    title: "Maximum window sum",
    skill: "Sliding windows",
    difficulty: "Intermediate",
    statement:
      "Read a list of whole numbers and a window size k. Return the largest sum among all contiguous groups of exactly k values.",
    inputFormat:
      "The first line contains n and k. The second line contains n space-separated integers, where 1 ≤ k ≤ n.",
    outputFormat: "One integer: the largest sum of any contiguous window of size k.",
    recoveryHint:
      "Build the first complete window, then move one position at a time by removing the outgoing value and adding the incoming value. Test all-negative data.",
    recoveryHints: [
      "Compute the sum of exactly the first k values before comparing windows. Each later step should exchange one outgoing value for one incoming value.",
      "Initialize the best sum from a real window rather than zero. Otherwise an all-negative list can produce a sum that no window actually has.",
    ],
    acceptedExplanation: {
      concept: "Reuse overlapping window work",
      whyItWorks:
        "Adjacent windows share all but two values, so subtracting the outgoing value and adding the incoming one updates each sum in constant time.",
      commonMistake:
        "Starting the best sum at zero gives the wrong answer when every valid window has a negative sum.",
      efficiency: {
        time: "O(n)",
        space: "O(1)",
        explanation:
          "The first window is summed once, then each remaining value enters and one leaves while only the current and best sums are kept.",
      },
    },
    examples: [
      {
        input: "6 3\n2 1 5 1 3 2",
        output: "9",
        explanation: "The window 5 1 3 has the largest sum, 9.",
      },
      {
        input: "4 2\n-5 -2 -8 -1",
        output: "-7",
        explanation: "The first two values form the least-negative window sum.",
      },
    ],
    starterCode: CODING_SOLUTION_SCAFFOLD,
    tests: [
      { label: "Overlapping windows", input: "6 3\n2 1 5 1 3 2", expectedOutput: "9" },
      { label: "All-negative windows", input: "4 2\n-5 -2 -8 -1", expectedOutput: "-7" },
      { label: "One-value window", input: "5 1\n4 9 2 7 3", expectedOutput: "9" },
      { label: "Whole-list window", input: "5 5\n1 2 3 4 5", expectedOutput: "15" },
      { label: "Best window at the end", input: "7 2\n3 3 3 10 -5 8 8", expectedOutput: "16" },
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
    description: `${problem.title}: solve this ${problem.difficulty.toLowerCase()} JavaScript problem with browser-run checks. Sign in to save your code, attempts, and Accepted result.`,
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
  const checks = problem.tests.map((test, index) => ({
    label: test.label,
    passed:
      normalizedOutputs[index] === normalizeCodingOutput(test.expectedOutput),
  }));
  const passedTests = checks.filter((check) => check.passed).length;

  return {
    verdict:
      passedTests === problem.tests.length
        ? ("Accepted" as const)
        : ("Wrong Answer" as const),
    passedTests,
    totalTests: problem.tests.length,
    checks,
  };
}

export function hasValidCodingSolutionLength(code: string) {
  return code.trim().length > 0 && code.length <= MAX_CODING_SOLUTION_LENGTH;
}
