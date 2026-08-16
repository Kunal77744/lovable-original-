import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JAVASCRIPT_STACKS_QUEUES_EXERCISES } from "@/lib/javascript-stacks-queues";
import { JavaScriptStacksQueuesLab } from "./javascript-stacks-queues-lab";

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

describe("JavaScriptStacksQueuesLab", () => {
  beforeEach(() => {
    runCodingSolution.mockReset();
    saveJavaScriptLabExercise.mockReset();
    saveJavaScriptLabExercise.mockResolvedValue({ ok: true });
  });
  afterEach(cleanup);

  it("starts at the first unfinished stacks and queues exercise", () => {
    render(
      <JavaScriptStacksQueuesLab
        completedExerciseIds={["remove-the-newest-item"]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Close the latest open delimiter" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Stack and queue idea 2 of 4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run 3 checks" })).toBeEnabled();
    expect(
      screen.getByRole<HTMLTextAreaElement>("textbox", {
        name: "JavaScript stacks and queues code",
      }).value,
    ).toContain("function isBalanced");
  });

  it("runs deterministic checks through the isolated worker", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["red", "red", "two"],
    });
    render(<JavaScriptStacksQueuesLab />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(runCodingSolution).toHaveBeenCalledWith(expect.any(String), [
      "push:red,push:blue,pop",
      "push:red,push:blue,push:green,pop,pop",
      "push:one,pop,push:two",
    ]);
    expect(screen.getByText("Passed 3 of 3 checks.")).toBeInTheDocument();
    expect(saveJavaScriptLabExercise).toHaveBeenCalledWith(
      "stacks-queues",
      "remove-the-newest-item",
    );
  });

  it("keeps the exercise retryable when completion cannot be saved", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["red", "red", "two"],
    });
    saveJavaScriptLabExercise.mockResolvedValue({ ok: false });
    render(<JavaScriptStacksQueuesLab />);

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
    expect(screen.queryByText("Saved result walkthrough")).not.toBeInTheDocument();
  });

  it("shows code-free recovery only after a failed or stopped run", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["red,blue", "red,blue,green", "one,two"],
    });
    render(<JavaScriptStacksQueuesLab />);

    expect(screen.queryByText(/Treat one end of the array/)).not.toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(screen.getByText("0 of 3 checks passed.")).toBeInTheDocument();
    expect(screen.getByText(/Treat one end of the array/)).toBeInTheDocument();
    expect(screen.queryByText("Keep this:")).not.toBeInTheDocument();
  });

  it.each(JAVASCRIPT_STACKS_QUEUES_EXERCISES)(
    "reveals the authored walkthrough for $slug only after the result saves",
    async (exercise) => {
      const exerciseIndex = JAVASCRIPT_STACKS_QUEUES_EXERCISES.indexOf(exercise);
      const completedExerciseIds = JAVASCRIPT_STACKS_QUEUES_EXERCISES.slice(
        0,
        exerciseIndex,
      ).map((item) => item.slug);
      runCodingSolution.mockResolvedValue({
        status: "finished",
        outputs: exercise.tests.map((test) => test.expectedOutput),
      });
      render(
        <JavaScriptStacksQueuesLab
          completedExerciseIds={completedExerciseIds}
        />,
      );

      expect(
        screen.queryByRole("heading", {
          name: exercise.operationWalkthrough.title,
        }),
      ).not.toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
      });

      expect(saveJavaScriptLabExercise).toHaveBeenCalledTimes(1);
      expect(saveJavaScriptLabExercise).toHaveBeenCalledWith(
        "stacks-queues",
        exercise.slug,
      );
      expect(
        screen.getByRole("heading", {
          name: exercise.operationWalkthrough.title,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(`Step 1 of ${exercise.operationWalkthrough.steps.length}`),
      ).toBeInTheDocument();
      expect(
        screen.getByText(exercise.operationWalkthrough.steps[0].operation),
      ).toBeInTheDocument();
    },
  );

  it("steps forward and backward through the saved operation sequence", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["red", "red", "two"],
    });
    render(<JavaScriptStacksQueuesLab />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    const previousButton = screen.getByRole("button", {
      name: "Previous step",
    });
    const nextButton = screen.getByRole("button", { name: "Next step" });
    expect(previousButton).toBeDisabled();
    expect(nextButton).toBeEnabled();

    fireEvent.click(nextButton);
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    expect(screen.getByText('push("blue")')).toBeInTheDocument();
    expect(previousButton).toBeEnabled();

    fireEvent.click(previousButton);
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
  });

  it("reveals teaching only after passing and advances in order", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["red", "red", "two"],
    });
    render(<JavaScriptStacksQueuesLab />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(screen.getByText("Keep this:")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to Balanced delimiters" }),
    );

    expect(
      screen.getByRole("heading", { name: "Close the latest open delimiter" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Keep this:")).not.toBeInTheDocument();
  });

  it("shows the completion state when all four saved exercises return", () => {
    render(
      <JavaScriptStacksQueuesLab
        completedExerciseIds={[
          "remove-the-newest-item",
          "balance-delimiter-pairs",
          "serve-the-oldest-item",
          "choose-stack-or-queue",
        ]}
      />,
    );

    expect(screen.getByText("Stacks and queues complete")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start judged practice" }),
    ).toHaveAttribute("href", "/practice/sum-two-numbers");
  });
});
