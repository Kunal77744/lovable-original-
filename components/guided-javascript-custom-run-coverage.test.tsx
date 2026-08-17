import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { JavaScriptAlgorithmPatternsLab } from "./javascript-algorithm-patterns-lab";
import { JavaScriptDataStructuresLab } from "./javascript-data-structures-lab";
import { JavaScriptFunctionsScopeLab } from "./javascript-functions-scope-lab";
import { JavaScriptLinkedListLab } from "./javascript-linked-list-lab";
import { JavaScriptRecursionLab } from "./javascript-recursion-lab";
import { JavaScriptSearchSortLab } from "./javascript-search-sort-lab";
import { JavaScriptStacksQueuesLab } from "./javascript-stacks-queues-lab";
import { JavaScriptTreesGraphsLab } from "./javascript-trees-graphs-lab";

const labs = [
  JavaScriptFunctionsScopeLab,
  JavaScriptDataStructuresLab,
  JavaScriptRecursionLab,
  JavaScriptSearchSortLab,
  JavaScriptStacksQueuesLab,
  JavaScriptLinkedListLab,
  JavaScriptTreesGraphsLab,
  JavaScriptAlgorithmPatternsLab,
];

describe("guided JavaScript custom input coverage", () => {
  afterEach(cleanup);

  it.each(labs)("offers a browser-only transfer run in %s", (Lab) => {
    render(<Lab />);

    expect(screen.getByText("Try your own input")).toBeInTheDocument();
    expect(
      screen.getByText(/does not mark the exercise complete/),
    ).toBeInTheDocument();
  });
});
