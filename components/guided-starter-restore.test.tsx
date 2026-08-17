import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, describe, expect, it } from "vitest";
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
import { DebuggingLab } from "./debugging-lab";
import { GuidedStarterRestore } from "./guided-starter-restore";
import { JavaScriptAlgorithmPatternsLab } from "./javascript-algorithm-patterns-lab";
import { JavaScriptDataStructuresLab } from "./javascript-data-structures-lab";
import { JavaScriptDomLab } from "./javascript-dom-lab";
import { JavaScriptFoundationsWarmup } from "./javascript-foundations-warmup";
import { JavaScriptFunctionsScopeLab } from "./javascript-functions-scope-lab";
import { JavaScriptLinkedListLab } from "./javascript-linked-list-lab";
import { JavaScriptRecursionLab } from "./javascript-recursion-lab";
import { JavaScriptSearchSortLab } from "./javascript-search-sort-lab";
import { JavaScriptStacksQueuesLab } from "./javascript-stacks-queues-lab";
import { JavaScriptTreesGraphsLab } from "./javascript-trees-graphs-lab";

type GuidedLab = ComponentType<{ completedExerciseIds?: string[] }>;

const guidedLabs: Array<[string, GuidedLab, string]> = [
  ["debugging", DebuggingLab, JAVASCRIPT_DEBUGGING_DRILLS[0].starterCode],
  [
    "foundations",
    JavaScriptFoundationsWarmup,
    JAVASCRIPT_FOUNDATION_EXERCISES[0].starterCode,
  ],
  [
    "data structures",
    JavaScriptDataStructuresLab,
    JAVASCRIPT_DATA_STRUCTURE_EXERCISES[0].starterCode,
  ],
  ["DOM", JavaScriptDomLab, JAVASCRIPT_DOM_EXERCISES[0].starterCode],
  [
    "functions and scope",
    JavaScriptFunctionsScopeLab,
    JAVASCRIPT_FUNCTION_EXERCISES[0].starterCode,
  ],
  [
    "recursion",
    JavaScriptRecursionLab,
    JAVASCRIPT_RECURSION_EXERCISES[0].starterCode,
  ],
  [
    "search and sort",
    JavaScriptSearchSortLab,
    JAVASCRIPT_SEARCH_SORT_EXERCISES[0].starterCode,
  ],
  [
    "stacks and queues",
    JavaScriptStacksQueuesLab,
    JAVASCRIPT_STACKS_QUEUES_EXERCISES[0].starterCode,
  ],
  [
    "linked lists",
    JavaScriptLinkedListLab,
    JAVASCRIPT_LINKED_LIST_EXERCISES[0].starterCode,
  ],
  [
    "trees and graphs",
    JavaScriptTreesGraphsLab,
    JAVASCRIPT_TREES_GRAPHS_EXERCISES[0].starterCode,
  ],
  [
    "algorithm patterns",
    JavaScriptAlgorithmPatternsLab,
    JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES[0].starterCode,
  ],
];

afterEach(cleanup);

describe("GuidedStarterRestore", () => {
  it("keeps the current editor text when restoration is cancelled", () => {
    const onRestore = () => undefined;
    render(
      <GuidedStarterRestore isStarterLoaded={false} onRestore={onRestore} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Restore starter" }));
    expect(screen.getByText("Restore the authored starter?")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.queryByText("Restore the authored starter?"),
    ).not.toBeInTheDocument();
  });

  it.each(guidedLabs)(
    "restores the authored starter only after confirmation in the %s lab",
    (_name, Lab, starterCode) => {
      render(<Lab />);
      const editor = screen.getByRole<HTMLTextAreaElement>("textbox", {
        name: /JavaScript/i,
      });

      fireEvent.change(editor, { target: { value: "const learnerWork = true;" } });
      fireEvent.click(
        screen.getByRole("button", { name: "Restore starter" }),
      );

      expect(editor.value).toBe("const learnerWork = true;");
      expect(screen.getByText("Restore the authored starter?")).toBeVisible();

      fireEvent.click(
        screen.getByRole("button", { name: "Restore starter" }),
      );

      expect(editor.value).toBe(starterCode);
      expect(
        screen.queryByText("Restore the authored starter?"),
      ).not.toBeInTheDocument();
      expect(screen.getByText(/Starter restored/)).toBeVisible();
    },
  );
});
