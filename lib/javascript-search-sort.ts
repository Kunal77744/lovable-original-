export type JavaScriptSearchSortExercise = {
  slug: string;
  number: number;
  concept: "Linear search" | "Binary search" | "Numeric sort" | "Choose a tool";
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

export const JAVASCRIPT_SEARCH_SORT_EXERCISES: JavaScriptSearchSortExercise[] = [
  {
    slug: "scan-for-first-match",
    number: 1,
    concept: "Linear search",
    title: "Scan until the first match",
    prompt:
      "Complete findFirstIndex so it checks an unsorted list from left to right and returns the first matching position, or -1 when the target is absent.",
    inputFormat: 'A target, then a "|", then comma-separated words.',
    outputFormat: "The zero-based position of the first match, or -1.",
    example: { input: "pear|apple,pear,plum", output: "1" },
    starterCode: `function findFirstIndex(values, target) {
  for (let index = 0; index < values.length; index += 1) {
    // Return index when this value matches the target.
  }

  return -1;
}

function solve(input) {
  const [target, list = ""] = input.trim().split("|");
  const values = list === "" ? [] : list.split(",");
  return String(findFirstIndex(values, target));
}`,
    tests: [
      { input: "pear|apple,pear,plum", expectedOutput: "1" },
      { input: "blue|blue,green,blue", expectedOutput: "0" },
      { input: "kiwi|apple,pear,plum", expectedOutput: "-1" },
    ],
    recoveryCue:
      "Compare the target with one value at a time. Return immediately at the first match, and let the loop finish before returning the missing-value result.",
    takeaway:
      "Linear search works on unsorted data because it checks each value in order; the first match can stop the scan early.",
  },
  {
    slug: "halve-a-sorted-list",
    number: 2,
    concept: "Binary search",
    title: "Halve a sorted search space",
    prompt:
      "Complete binarySearch so each comparison removes half of an ascending numeric list. The input is sorted before the search begins.",
    inputFormat: 'A target number, then a "|", then sorted comma-separated numbers.',
    outputFormat: "The zero-based position of the target, or -1.",
    example: { input: "13|2,5,8,13,21", output: "3" },
    starterCode: `function binarySearch(values, target) {
  let left = 0;
  let right = values.length - 1;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    const current = values[middle];
    if (current === target) return middle;

    // Move one boundary past middle based on current and target.
  }

  return -1;
}

function solve(input) {
  const [targetText, list = ""] = input.trim().split("|");
  const values = list === "" ? [] : list.split(",").map(Number);
  return String(binarySearch(values, Number(targetText)));
}`,
    tests: [
      { input: "13|2,5,8,13,21", expectedOutput: "3" },
      { input: "2|2,5,8,13,21", expectedOutput: "0" },
      { input: "7|2,5,8,13,21", expectedOutput: "-1" },
    ],
    recoveryCue:
      "This shortcut is valid only because the values are sorted. Compare the middle value with the target, then keep the half where the target could still exist.",
    takeaway:
      "Binary search requires sorted data, then repeatedly halves the remaining range instead of checking every value.",
  },
  {
    slug: "sort-numbers-with-a-comparator",
    number: 3,
    concept: "Numeric sort",
    title: "Sort numbers as numbers",
    prompt:
      "Repair sortAscending so JavaScript compares numeric values instead of sorting their text representations.",
    inputFormat: "Comma-separated positive, negative, or repeated numbers.",
    outputFormat: "The same numbers in ascending order, separated by commas.",
    example: { input: "10,2,1", output: "1,2,10" },
    starterCode: `function sortAscending(values) {
  // Repair the sort by giving it a numeric comparator.
  return [...values].sort();
}

function solve(input) {
  const values = input.trim().split(",").map(Number);
  return sortAscending(values).join(",");
}`,
    tests: [
      { input: "10,2,1", expectedOutput: "1,2,10" },
      { input: "3,-2,0,11", expectedOutput: "-2,0,3,11" },
      { input: "8,3,8,2", expectedOutput: "2,3,8,8" },
    ],
    recoveryCue:
      "JavaScript's default sort compares strings. Supply a comparison result that is negative when the first number belongs before the second.",
    takeaway:
      "A numeric comparator such as ascending difference makes sort order depend on number value rather than character order.",
  },
  {
    slug: "choose-search-or-sort",
    number: 4,
    concept: "Choose a tool",
    title: "Choose the operation before the code",
    prompt:
      "Complete chooseTool: reorder a list with numeric sort, find in sorted data with binary search, and find in unsorted data with linear search.",
    inputFormat: 'A goal and list state separated by "|": find or reorder; sorted or unsorted.',
    outputFormat: 'Exactly "linear search", "binary search", or "numeric sort".',
    example: { input: "find|sorted", output: "binary search" },
    starterCode: `function chooseTool(goal, listState) {
  if (goal === "reorder") return "numeric sort";

  // Choose the faster valid search when the list is sorted.
  // Otherwise return the search that works without a precondition.
}

function solve(input) {
  const [goal, listState] = input.trim().split("|");
  return chooseTool(goal, listState);
}`,
    tests: [
      { input: "find|unsorted", expectedOutput: "linear search" },
      { input: "find|sorted", expectedOutput: "binary search" },
      { input: "reorder|unsorted", expectedOutput: "numeric sort" },
    ],
    recoveryCue:
      "Start with the goal: changing order needs sort. For finding, binary search is valid only when the list is already sorted; otherwise scan linearly.",
    takeaway:
      "Choose by both goal and precondition: sort to reorder, binary search sorted data, and linear search data whose order gives no shortcut.",
  },
];
