import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { JAVASCRIPT_DEBUGGING_DRILLS } from "@/lib/debugging-lab";
import { JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES } from "@/lib/javascript-algorithm-patterns";
import { JAVASCRIPT_DATA_STRUCTURE_EXERCISES } from "@/lib/javascript-data-structures";
import { JAVASCRIPT_DOM_EXERCISES } from "@/lib/javascript-dom-exercises";
import { JAVASCRIPT_FOUNDATION_EXERCISES } from "@/lib/javascript-foundations";
import { JAVASCRIPT_FUNCTION_EXERCISES } from "@/lib/javascript-functions-scope";
import { JAVASCRIPT_LINKED_LIST_EXERCISES } from "@/lib/javascript-linked-lists";
import { JAVASCRIPT_RECURSION_EXERCISES } from "@/lib/javascript-recursion";
import { JAVASCRIPT_SEARCH_SORT_EXERCISES } from "@/lib/javascript-search-sort";
import { JAVASCRIPT_STACKS_QUEUES_EXERCISES } from "@/lib/javascript-stacks-queues";
import { JAVASCRIPT_TREES_GRAPHS_EXERCISES } from "@/lib/javascript-trees-graphs";

const labComponents = [
  ["debugging-lab.tsx", "debugging"],
  ["javascript-algorithm-patterns-lab.tsx", "algorithm-patterns"],
  ["javascript-data-structures-lab.tsx", "data-structures"],
  ["javascript-dom-lab.tsx", "dom"],
  ["javascript-foundations-warmup.tsx", "foundations"],
  ["javascript-functions-scope-lab.tsx", "functions"],
  ["javascript-linked-list-lab.tsx", "linked-lists"],
  ["javascript-recursion-lab.tsx", "recursion"],
  ["javascript-search-sort-lab.tsx", "search-sort"],
  ["javascript-stacks-queues-lab.tsx", "stacks-queues"],
  ["javascript-trees-graphs-lab.tsx", "trees-graphs"],
] as const;

const codeWritingExercises = [
  ...JAVASCRIPT_DEBUGGING_DRILLS,
  ...JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES,
  ...JAVASCRIPT_DATA_STRUCTURE_EXERCISES,
  ...JAVASCRIPT_DOM_EXERCISES,
  ...JAVASCRIPT_FOUNDATION_EXERCISES,
  ...JAVASCRIPT_FUNCTION_EXERCISES,
  ...JAVASCRIPT_LINKED_LIST_EXERCISES,
  ...JAVASCRIPT_RECURSION_EXERCISES,
  ...JAVASCRIPT_SEARCH_SORT_EXERCISES,
  ...JAVASCRIPT_STACKS_QUEUES_EXERCISES,
  ...JAVASCRIPT_TREES_GRAPHS_EXERCISES,
];

describe("guided check result coverage", () => {
  it("keeps the shared result view wired across all 11 code-writing labs", () => {
    expect(labComponents).toHaveLength(11);
    expect(codeWritingExercises).toHaveLength(42);

    for (const [component, labSlug] of labComponents) {
      const source = readFileSync(
        resolve(process.cwd(), "components", component),
        "utf8",
      );

      expect(source, component).toContain("const [checkResults, setCheckResults]");
      expect(source, component).toContain("attemptNote={{");
      expect(source, component).toContain(`labSlug: "${labSlug}"`);
      expect(source, component).toContain("exerciseId:");
      expect(source, component).toContain('kind === "failed"');
      expect(source, component).toContain('kind === "error"');
      expect(source, component).toContain("GuidedJavaScriptFileImport");
      expect(source, component).toContain("GuidedStarterRestore");
      expect(source, component).toContain("CompletedLabReviewButton");
      expect(source, component).toContain("usePrivateJavaScriptLabDraft");
    }
  });
});
