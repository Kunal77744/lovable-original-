import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JavaScriptSearchSortLab } from "./javascript-search-sort-lab";

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

describe("JavaScriptSearchSortLab", () => {
  beforeEach(() => {
    runCodingSolution.mockReset();
    saveJavaScriptLabExercise.mockReset();
  });
  afterEach(cleanup);

  it("starts at the first unfinished searching and sorting exercise", () => {
    render(
      <JavaScriptSearchSortLab completedExerciseIds={["scan-for-first-match"]} />,
    );

    expect(
      screen.getByRole("heading", { name: "Halve a sorted search space" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Search and sort idea 2 of 4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run 3 checks" })).toBeEnabled();
    expect(
      screen.getByRole<HTMLTextAreaElement>("textbox", {
        name: "JavaScript searching and sorting code",
      }).value,
    ).toContain("function binarySearch");
  });

  it("runs deterministic checks through the isolated worker", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["1", "0", "-1"],
    });
    render(<JavaScriptSearchSortLab />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(runCodingSolution).toHaveBeenCalledWith(expect.any(String), [
      "pear|apple,pear,plum",
      "blue|blue,green,blue",
      "kiwi|apple,pear,plum",
    ]);
    expect(screen.getByText("Passed 3 of 3 checks.")).toBeInTheDocument();
    expect(saveJavaScriptLabExercise).toHaveBeenCalledWith(
      "search-sort",
      "scan-for-first-match",
    );
  });

  it("shows code-free recovery after a failed or stopped run", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["-1", "-1", "-1"],
    });
    render(<JavaScriptSearchSortLab />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(screen.getByText("1 of 3 checks passed.")).toBeInTheDocument();
    expect(screen.getByText(/Compare the target with one value at a time/)).toBeInTheDocument();
    expect(screen.queryByText("Keep this:")).not.toBeInTheDocument();
  });

  it("reveals teaching only after passing and advances in order", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["1", "0", "-1"],
    });
    render(<JavaScriptSearchSortLab />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(screen.getByText("Keep this:")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to Binary search" }),
    );

    expect(
      screen.getByRole("heading", { name: "Halve a sorted search space" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Keep this:")).not.toBeInTheDocument();
  });

  it("shows the completion state when all four saved exercises return", () => {
    render(
      <JavaScriptSearchSortLab
        completedExerciseIds={[
          "scan-for-first-match",
          "halve-a-sorted-list",
          "sort-numbers-with-a-comparator",
          "choose-search-or-sort",
        ]}
      />,
    );

    expect(screen.getByText("Searching and sorting complete")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start judged practice" }),
    ).toHaveAttribute("href", "/practice/sum-two-numbers");
  });
});
