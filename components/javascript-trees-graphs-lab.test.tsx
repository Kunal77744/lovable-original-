import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JavaScriptTreesGraphsLab } from "./javascript-trees-graphs-lab";

const runCodingSolution = vi.fn();
const saveJavaScriptLabExercise = vi.fn();

vi.mock("@/lib/coding-runner", () => ({
  runCodingSolution: (...args: unknown[]) => runCodingSolution(...args),
}));

vi.mock("@/lib/javascript-lab-progress", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/javascript-lab-progress")
  >();
  return {
    ...actual,
    saveJavaScriptLabExercise: (...args: unknown[]) =>
      saveJavaScriptLabExercise(...args),
  };
});

describe("JavaScriptTreesGraphsLab", () => {
  beforeEach(() => {
    runCodingSolution.mockReset();
    saveJavaScriptLabExercise.mockReset();
    saveJavaScriptLabExercise.mockResolvedValue({ ok: true });
  });
  afterEach(cleanup);

  it("starts at the exact first unfinished exercise", () => {
    render(
      <JavaScriptTreesGraphsLab
        completedExerciseIds={["walk-a-tree-depth-first"]}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Visit the tree one level at a time",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Traversal idea 2 of 4")).toBeInTheDocument();
    expect(
      screen.getByRole<HTMLTextAreaElement>("textbox", {
        name: "JavaScript trees and graphs code",
      }).value,
    ).toContain("function levelOrder");
  });

  it("runs deterministic checks and saves only the completed step", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["A B D E C", "1 2 4 3", "root"],
    });
    render(<JavaScriptTreesGraphsLab />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(runCodingSolution).toHaveBeenCalledWith(expect.any(String), [
      "A,B,C,D,E",
      "1,2,3,-,4",
      "root",
    ]);
    expect(saveJavaScriptLabExercise).toHaveBeenCalledWith(
      "trees-graphs",
      "walk-a-tree-depth-first",
    );
    expect(screen.getByText("Passed 3 of 3 checks.")).toBeInTheDocument();
  });

  it("keeps the exercise retryable when completion cannot be saved", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["A B D E C", "1 2 4 3", "root"],
    });
    saveJavaScriptLabExercise.mockResolvedValue({ ok: false });
    render(<JavaScriptTreesGraphsLab />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(
      screen.getByText(
        "The checks passed, but completion could not be saved. Run them again to retry.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run 3 checks" })).toBeEnabled();
    expect(screen.queryByText("Keep this:")).not.toBeInTheDocument();
  });

  it("shows recovery after failure and teaching only after success", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["A", "1", "root"],
    });
    render(<JavaScriptTreesGraphsLab />);

    expect(screen.queryByText(/Give each recursive call/)).not.toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(screen.getByText("1 of 3 checks passed.")).toBeInTheDocument();
    expect(screen.getByText(/Give each recursive call/)).toBeInTheDocument();
    expect(screen.queryByText("Keep this:")).not.toBeInTheDocument();
  });

  it("restores the saved completion state", () => {
    render(
      <JavaScriptTreesGraphsLab
        completedExerciseIds={[
          "walk-a-tree-depth-first",
          "walk-a-tree-by-level",
          "find-a-path-through-a-graph",
          "choose-the-traversal",
        ]}
      />,
    );

    expect(screen.getByText("Trees and graphs complete")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start judged practice" }),
    ).toHaveAttribute("href", "/practice/sum-two-numbers");
  });
});
