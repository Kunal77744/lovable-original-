export type EfficiencyApproach = {
  id: string;
  title: string;
  code: string;
  workAtScale: string;
  growth: string;
};

export type AlgorithmEfficiencyExercise = {
  id: string;
  number: number;
  concept: "Constant time" | "Linear time" | "Quadratic time" | "Space-time tradeoff";
  title: string;
  scenario: string;
  scale: string;
  approaches: [EfficiencyApproach, EfficiencyApproach];
  correctApproachId: string;
  recoveryCue: string;
  explanation: string;
  takeaway: string;
};

export const ALGORITHM_EFFICIENCY_EXERCISES: AlgorithmEfficiencyExercise[] = [
  {
    id: "direct-lookup",
    number: 1,
    concept: "Constant time",
    title: "Find one learner by id",
    scenario:
      "A dashboard needs one learner record. The records are already available by id as well as in a list.",
    scale: "With 10,000 learner records",
    approaches: [
      {
        id: "scan-list",
        title: "Scan the list",
        code: `const learner = learners.find(
  (item) => item.id === targetId
);`,
        workAtScale: "Up to 10,000 checks",
        growth: "O(n)",
      },
      {
        id: "direct-key",
        title: "Use the id key",
        code: `const learner = learnersById[targetId];`,
        workAtScale: "1 lookup",
        growth: "O(1)",
      },
    ],
    correctApproachId: "direct-key",
    recoveryCue:
      "Ask whether the program can go straight to the id or must inspect records one by one.",
    explanation:
      "The keyed object goes directly to the requested id. Its lookup work stays roughly the same as the collection grows, while a list scan may inspect every record.",
    takeaway:
      "O(1) means the amount of work does not grow with the input size. Direct access by a known key is a common constant-time operation.",
  },
  {
    id: "one-pass-total",
    number: 2,
    concept: "Linear time",
    title: "Total every score once",
    scenario:
      "A progress view needs the sum of all scores. Each score contributes exactly once to the answer.",
    scale: "With 10,000 scores",
    approaches: [
      {
        id: "single-pass",
        title: "Add in one pass",
        code: `let total = 0;

for (const score of scores) {
  total += score;
}`,
        workAtScale: "10,000 additions",
        growth: "O(n)",
      },
      {
        id: "prefix-recount",
        title: "Recount every prefix",
        code: `let total = 0;

for (let end = 1; end <= scores.length; end++) {
  total = scores.slice(0, end).reduce(add, 0);
}`,
        workAtScale: "About 50,005,000 additions",
        growth: "O(n²)",
      },
    ],
    correctApproachId: "single-pass",
    recoveryCue:
      "Count how many times each score is added. One approach revisits earlier scores whenever the prefix grows.",
    explanation:
      "The single loop touches each score once. Rebuilding every prefix repeats earlier additions, turning one growing list into a triangular number of operations.",
    takeaway:
      "O(n) work grows in step with the input. When every item matters once, a single pass is often the clearest efficient approach.",
  },
  {
    id: "duplicate-check",
    number: 3,
    concept: "Quadratic time",
    title: "Detect a repeated username",
    scenario:
      "A signup import must report whether any username appears more than once.",
    scale: "With 10,000 usernames",
    approaches: [
      {
        id: "compare-pairs",
        title: "Compare every pair",
        code: `for (let left = 0; left < names.length; left++) {
  for (let right = left + 1; right < names.length; right++) {
    if (names[left] === names[right]) return true;
  }
}`,
        workAtScale: "Up to 49,995,000 comparisons",
        growth: "O(n²)",
      },
      {
        id: "remember-seen",
        title: "Remember names already seen",
        code: `const seen = new Set();

for (const name of names) {
  if (seen.has(name)) return true;
  seen.add(name);
}`,
        workAtScale: "About 10,000 lookups",
        growth: "O(n)",
      },
    ],
    correctApproachId: "remember-seen",
    recoveryCue:
      "A loop inside a loop can compare each item with many others. Look for an approach that remembers earlier work.",
    explanation:
      "The nested loops can compare almost every pair. A Set trades some memory for one pass, checking each username against the names already seen.",
    takeaway:
      "O(n²) often appears when each item is compared with every other item. At larger inputs, avoiding that repeated work matters quickly.",
  },
  {
    id: "shared-course",
    number: 4,
    concept: "Space-time tradeoff",
    title: "Find a course shared by two learners",
    scenario:
      "Two learners each have a course list. The program only needs to know whether the lists share at least one course.",
    scale: "With 5,000 courses in each list",
    approaches: [
      {
        id: "nested-membership",
        title: "Search the second list repeatedly",
        code: `const shared = firstCourses.some(
  (course) => secondCourses.includes(course)
);`,
        workAtScale: "Up to 25,000,000 comparisons",
        growth: "O(n × m)",
      },
      {
        id: "set-membership",
        title: "Build one lookup set",
        code: `const secondSet = new Set(secondCourses);
const shared = firstCourses.some(
  (course) => secondSet.has(course)
);`,
        workAtScale: "About 10,000 operations",
        growth: "O(n + m)",
      },
    ],
    correctApproachId: "set-membership",
    recoveryCue:
      "One approach uses extra memory once. Check whether that prevents a full second-list search for every first-list course.",
    explanation:
      "Building the Set costs one pass and extra memory, but membership checks then stay roughly constant. The alternative may scan the second list again for every course in the first.",
    takeaway:
      "Extra memory can remove repeated work. State both costs: the Set makes time closer to O(n + m) while using O(m) additional space.",
  },
];
