import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JavaScriptAlgorithmPatternsLab } from "./javascript-algorithm-patterns-lab";

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

describe("JavaScriptAlgorithmPatternsLab", () => {
  beforeEach(() => {
    runCodingSolution.mockReset();
    saveJavaScriptLabExercise.mockReset();
    saveJavaScriptLabExercise.mockResolvedValue({ ok: true });
  });
  afterEach(cleanup);

  it("starts at the first unfinished pattern implementation", () => {
    render(
      <JavaScriptAlgorithmPatternsLab
        completedExerciseIds={["count-with-a-frequency-map"]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Move in from both ends" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Pattern 2 of 4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run 3 checks" })).toBeEnabled();
    expect(
      screen.getByRole<HTMLTextAreaElement>("textbox", {
        name: "JavaScript algorithm pattern code",
      }).value,
    ).toContain("function hasPairWithSum");
  });

  it("runs deterministic checks and saves only the completed exercise id", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["2", "3", "0"],
    });
    render(<JavaScriptAlgorithmPatternsLab />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(runCodingSolution).toHaveBeenCalledWith(expect.any(String), [
      "pear|apple,pear,plum,pear",
      "blue|blue,green,blue,blue",
      "kiwi|apple,pear,plum",
    ]);
    expect(screen.getByText("Passed 3 of 3 checks.")).toBeInTheDocument();
    expect(saveJavaScriptLabExercise).toHaveBeenCalledWith(
      "algorithm-patterns",
      "count-with-a-frequency-map",
    );
  });

  it("keeps the exercise retryable when completion cannot be saved", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["2", "3", "0"],
    });
    saveJavaScriptLabExercise.mockResolvedValue({ ok: false });
    render(<JavaScriptAlgorithmPatternsLab />);

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

  it("shows code-free recovery after failure and no teaching", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["0", "0", "0"],
    });
    render(<JavaScriptAlgorithmPatternsLab />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(screen.getByText("1 of 3 checks passed.")).toBeInTheDocument();
    expect(screen.getByText(/read its current count or start at zero/)).toBeInTheDocument();
    expect(screen.queryByText("Keep this:")).not.toBeInTheDocument();
    expect(saveJavaScriptLabExercise).not.toHaveBeenCalled();
  });

  it("reveals the pattern takeaway only after passing and advances", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["2", "3", "0"],
    });
    render(<JavaScriptAlgorithmPatternsLab />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(screen.getByText("Keep this:")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to Two pointers" }),
    );
    expect(
      screen.getByRole("heading", { name: "Move in from both ends" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Keep this:")).not.toBeInTheDocument();
  });

  it("shows completion after all four saved implementations return", () => {
    render(
      <JavaScriptAlgorithmPatternsLab
        completedExerciseIds={[
          "count-with-a-frequency-map",
          "meet-with-two-pointers",
          "slide-a-fixed-window",
          "answer-with-prefix-sums",
        ]}
      />,
    );

    expect(screen.getByText("Algorithm patterns complete")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start judged practice" }),
    ).toHaveAttribute("href", "/practice/sum-two-numbers");
  });
});
