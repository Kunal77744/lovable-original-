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
  },
];
