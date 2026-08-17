import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES } from "@/lib/javascript-algorithm-patterns";
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
    expect(
      screen.queryByRole("region", { name: /change state/i }),
    ).not.toBeInTheDocument();
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

  it.each(
    JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES.map((exercise, index) => ({
      concept: exercise.concept,
      completedExerciseIds: JAVASCRIPT_ALGORITHM_PATTERN_EXERCISES.slice(
        0,
        index,
      ).map((item) => item.slug),
      outputs: exercise.tests.map((test) => test.expectedOutput),
      firstStep: exercise.walkthrough.steps[0].title,
      finalStep: exercise.walkthrough.steps.at(-1)?.title,
      finalResult: exercise.walkthrough.steps.at(-1)?.result,
      stepCount: exercise.walkthrough.steps.length,
    })),
  )(
    "walks through $concept state only after the result saves",
    async ({
      completedExerciseIds,
      outputs,
      firstStep,
      finalStep,
      finalResult,
      stepCount,
    }) => {
      runCodingSolution.mockResolvedValue({ status: "finished", outputs });
      render(
        <JavaScriptAlgorithmPatternsLab
          completedExerciseIds={completedExerciseIds}
        />,
      );

      expect(
        screen.queryByRole("region", { name: /change state/i }),
      ).not.toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
      });

      const walkthrough = screen.getByRole("region", { name: /change state/i });
      expect(within(walkthrough).getByText(firstStep)).toBeInTheDocument();
      expect(
        within(walkthrough).getByText(`Step 1 of ${stepCount}`),
      ).toBeInTheDocument();
      expect(
        within(walkthrough).getByRole("button", { name: "Previous step" }),
      ).toBeDisabled();

      for (let step = 1; step < stepCount; step += 1) {
        fireEvent.click(
          within(walkthrough).getByRole("button", { name: "Next step" }),
        );
      }

      expect(
        within(walkthrough).getByText(finalStep ?? ""),
      ).toBeInTheDocument();
      expect(
        within(walkthrough).getByText(finalResult ?? ""),
      ).toBeInTheDocument();
      expect(
        within(walkthrough).getByRole("button", { name: "Next step" }),
      ).toBeDisabled();
      expect(saveJavaScriptLabExercise).toHaveBeenCalledTimes(1);
    },
  );

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
