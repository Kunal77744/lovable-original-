export type JavaScriptAlgorithmPatternExercise = {
  slug: string;
  number: number;
  concept: "Frequency map" | "Two pointers" | "Sliding window" | "Prefix sums";
  title: string;
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
    steps: {
      title: string;
      detail: string;
      stateLabel: string;
      state: string[];
      result?: string;
    }[];
  };
};

export const JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES: JavaScriptAlgorithmPatternExercise[] = [
  {
    slug: "count-with-a-frequency-map",
    number: 1,
    concept: "Frequency map",
    title: "Count once, answer quickly",
    prompt:
      "Complete buildFrequencyMap so one pass records how often each word appears. The query should then read one saved count instead of scanning again.",
    inputFormat: 'A target word, then a "|", then comma-separated words.',
    outputFormat: "The number of times the target appears.",
    example: { input: "pear|apple,pear,plum,pear", output: "2" },
    starterCode: `function buildFrequencyMap(values) {
  const counts = new Map();

  for (const value of values) {
    // Store one more occurrence of value.
  }

  return counts;
}

function solve(input) {
  const [target, list = ""] = input.trim().split("|");
  const values = list === "" ? [] : list.split(",");
  const counts = buildFrequencyMap(values);
  return String(counts.get(target) ?? 0);
}`,
    tests: [
      { input: "pear|apple,pear,plum,pear", expectedOutput: "2" },
      { input: "blue|blue,green,blue,blue", expectedOutput: "3" },
      { input: "kiwi|apple,pear,plum", expectedOutput: "0" },
    ],
    recoveryCue:
      "For each value, read its current count or start at zero, then store that count plus one. The query should only read the finished map.",
   takeaway:
     "A frequency map pays for one full pass, then answers repeated count questions with a direct lookup.",
    walkthrough: {
      input: "pear | apple, pear, plum, pear",
      steps: [
        {
          title: "Start with an empty map",
          detail: "No value has been counted yet.",
          stateLabel: "Counts",
          state: ["empty"],
        },
        {
          title: "Read apple",
          detail: "Apple has no saved count, so start at zero and add one.",
          stateLabel: "Counts",
          state: ["apple → 1"],
        },
        {
          title: "Read pear",
          detail: "Pear also starts at one on its first visit.",
          stateLabel: "Counts",
          state: ["apple → 1", "pear → 1"],
        },
        {
          title: "Read plum",
          detail: "Each distinct word owns one entry in the map.",
          stateLabel: "Counts",
          state: ["apple → 1", "pear → 1", "plum → 1"],
        },
        {
          title: "Read pear again",
          detail: "Reuse pear's saved count and increase it from one to two.",
          stateLabel: "Counts",
          state: ["apple → 1", "pear → 2", "plum → 1"],
          result: "The direct lookup for pear returns 2.",
        },
      ],
    },
  },
  {
    slug: "meet-with-two-pointers",
    number: 2,
    concept: "Two pointers",
    title: "Move in from both ends",
    prompt:
      "Complete hasPairWithSum for an ascending list. Move the left or right pointer after comparing the current pair with the target.",
    inputFormat: 'A target number, then a "|", then ascending comma-separated numbers.',
    outputFormat: 'Exactly "Yes" when a pair reaches the target, otherwise "No".',
    example: { input: "11|1,3,4,7,9", output: "Yes" },
    starterCode: `function hasPairWithSum(values, target) {
  let left = 0;
  let right = values.length - 1;

  while (left < right) {
    const sum = values[left] + values[right];
    if (sum === target) return true;

    // Move the pointer that can bring the sum closer to target.
  }

  return false;
}

function solve(input) {
  const [targetText, list = ""] = input.trim().split("|");
  const values = list === "" ? [] : list.split(",").map(Number);
  return hasPairWithSum(values, Number(targetText)) ? "Yes" : "No";
}`,
    tests: [
      { input: "11|1,3,4,7,9", expectedOutput: "Yes" },
      { input: "5|-2,0,3,8", expectedOutput: "No" },
      { input: "6|3,3", expectedOutput: "Yes" },
    ],
    recoveryCue:
      "The values are sorted. A sum below the target needs a larger left value; a sum above it needs a smaller right value. Keep the pointers distinct.",
   takeaway:
     "Two pointers exploit sorted order by discarding one impossible end after every comparison.",
    walkthrough: {
      input: "target 11 | 1, 3, 4, 7, 9",
      steps: [
        {
          title: "Compare both ends",
          detail:
            "1 + 9 is 10. The sum is too small, so the left value cannot help.",
          stateLabel: "Pointers",
          state: ["left 1", "right 9", "sum 10"],
        },
        {
          title: "Move left inward",
          detail:
            "3 + 9 is 12. The sum is now too large, so discard the right value.",
          stateLabel: "Pointers",
          state: ["left 3", "right 9", "sum 12"],
        },
        {
          title: "Move right inward",
          detail: "3 + 7 is 10. Increase the sum by moving left again.",
          stateLabel: "Pointers",
          state: ["left 3", "right 7", "sum 10"],
        },
        {
          title: "The pointers find the pair",
          detail: "4 + 7 reaches the target exactly.",
          stateLabel: "Pointers",
          state: ["left 4", "right 7", "sum 11"],
          result: "The search returns Yes after four comparisons.",
        },
      ],
    },
  },
  {
    slug: "slide-a-fixed-window",
    number: 3,
    concept: "Sliding window",
    title: "Reuse the previous window",
    prompt:
      "Complete maxWindowSum. Add the first k values once, then slide by adding the new value and removing the value that just left.",
    inputFormat: 'A window size k, then a "|", then comma-separated integers.',
    outputFormat: "The largest sum of any contiguous window of k values.",
    example: { input: "3|2,1,5,1,3,2", output: "9" },
    starterCode: `function maxWindowSum(values, size) {
  let windowSum = 0;
  for (let index = 0; index < size; index += 1) {
    windowSum += values[index];
  }

  let best = windowSum;
  for (let right = size; right < values.length; right += 1) {
    // Add values[right], remove the value that left, then update best.
  }

  return best;
}

function solve(input) {
  const [sizeText, list = ""] = input.trim().split("|");
  const values = list.split(",").map(Number);
  return String(maxWindowSum(values, Number(sizeText)));
}`,
    tests: [
      { input: "3|2,1,5,1,3,2", expectedOutput: "9" },
      { input: "2|-4,-2,-7", expectedOutput: "-6" },
      { input: "1|8,3,6", expectedOutput: "8" },
    ],
    recoveryCue:
      "When right enters, the value at right minus the window size leaves. Update the running sum before comparing it with the best seen sum.",
   takeaway:
     "A fixed sliding window reuses almost all previous work, so each new range costs one addition and one subtraction.",
    walkthrough: {
      input: "window 3 | 2, 1, 5, 1, 3, 2",
      steps: [
        {
          title: "Build the first window",
          detail: "Add 2, 1, and 5 once. This becomes the first best sum.",
          stateLabel: "Window",
          state: ["2", "1", "5", "sum 8", "best 8"],
        },
        {
          title: "Slide one place",
          detail:
            "Remove 2 and add 1. Reuse the previous total instead of summing all three values again.",
          stateLabel: "Window",
          state: ["1", "5", "1", "sum 7", "best 8"],
        },
        {
          title: "A stronger window arrives",
          detail: "Remove 1 and add 3. The new sum of nine becomes the best.",
          stateLabel: "Window",
          state: ["5", "1", "3", "sum 9", "best 9"],
        },
        {
          title: "Finish the final slide",
          detail:
            "Remove 5 and add 2. The last sum is six, so the best stays nine.",
          stateLabel: "Window",
          state: ["1", "3", "2", "sum 6", "best 9"],
          result: "The largest three-value window sums to 9.",
        },
      ],
    },
  },
  {
    slug: "answer-with-prefix-sums",
    number: 4,
    concept: "Prefix sums",
    title: "Turn a range into two lookups",
    prompt:
      "Complete buildPrefixSums and rangeSum. Prefix position i should store the total before i, so an inclusive range becomes one subtraction.",
    inputFormat:
      'Inclusive left and right positions, then a "|", then comma-separated integers.',
    outputFormat: "The sum from the left position through the right position.",
    example: { input: "1,3|4,2,7,1,5", output: "10" },
    starterCode: `function buildPrefixSums(values) {
  const prefix = [0];

  for (const value of values) {
    // Append the previous total plus value.
  }

  return prefix;
}

function rangeSum(prefix, left, right) {
  // Subtract the total before left from the total through right.
}

function solve(input) {
  const [range, list = ""] = input.trim().split("|");
  const [left, right] = range.split(",").map(Number);
  const values = list.split(",").map(Number);
  return String(rangeSum(buildPrefixSums(values), left, right));
}`,
    tests: [
      { input: "1,3|4,2,7,1,5", expectedOutput: "10" },
      { input: "0,0|9,-2,4", expectedOutput: "9" },
      { input: "0,3|-3,5,2,6", expectedOutput: "10" },
    ],
    recoveryCue:
      "Start the prefix array with zero. The total through right is stored one position later, while prefix[left] is exactly the total before the range.",
   takeaway:
     "Prefix sums spend one pass preparing cumulative totals, then answer each inclusive range sum with two lookups and one subtraction.",
    walkthrough: {
      input: "range 1–3 | 4, 2, 7, 1, 5",
      steps: [
        {
          title: "Keep a zero before the list",
          detail: "The leading zero represents the total before any value.",
          stateLabel: "Prefix totals",
          state: ["0"],
        },
        {
          title: "Add 4",
          detail: "Append the previous total plus the current value.",
          stateLabel: "Prefix totals",
          state: ["0", "4"],
        },
        {
          title: "Add 2",
          detail: "The first two values now total six.",
          stateLabel: "Prefix totals",
          state: ["0", "4", "6"],
        },
        {
          title: "Add 7 and 1",
          detail:
            "Keep extending the cumulative totals through the requested right edge.",
          stateLabel: "Prefix totals",
          state: ["0", "4", "6", "13", "14"],
        },
        {
          title: "Subtract the total before left",
          detail:
            "prefix[4] is 14 and prefix[1] is 4. Their difference isolates positions 1 through 3.",
          stateLabel: "Range lookup",
          state: ["14 through right", "− 4 before left", "= 10"],
          result: "The inclusive range sum is 10.",
        },
      ],
    },
  },
];
