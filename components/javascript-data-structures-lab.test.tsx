import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JavaScriptDataStructuresLab } from "./javascript-data-structures-lab";
import { JAVASCRIPT_DATA_STRUCTURE_EXERCISES } from "@/lib/javascript-data-structures";

const runCodingSolution = vi.fn();
const saveJavaScriptLabExercise = vi.fn();

vi.mock("@/lib/coding-runner", () => ({
  runCodingSolution: (...args: unknown[]) => runCodingSolution(...args),
}));

vi.mock("@/lib/javascript-lab-progress", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/javascript-lab-progress")>();
  return {
    ...actual,
    saveJavaScriptLabExercise: (...args: unknown[]) => saveJavaScriptLabExercise(...args),
  };
});

describe("JavaScriptDataStructuresLab", () => {
  beforeEach(() => {
    runCodingSolution.mockReset();
    saveJavaScriptLabExercise.mockReset();
    saveJavaScriptLabExercise.mockResolvedValue({ ok: true });
  });
  afterEach(cleanup);

  it("starts with an unfinished arrays exercise and four ordered structures", () => {
    render(<JavaScriptDataStructuresLab />);

    expect(
      screen.getByRole("heading", { name: "Select values from an array" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Structure 1 of 4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run 3 checks" })).toBeEnabled();
    expect(
      screen.getByRole<HTMLTextAreaElement>("textbox", {
        name: "JavaScript data-structure code",
      }).value,
    ).toContain("// Visit the array");
    expect(
      screen.getByRole("list", { name: "Data structures" }).querySelector("li"),
    ).toHaveAttribute("aria-current", "step");
  });

  it("runs deterministic checks through the shared isolated runner", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["6", "0", "6"],
    });
    render(<JavaScriptDataStructuresLab />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(runCodingSolution).toHaveBeenCalledWith(expect.any(String), [
      "2 7 4 9",
      "1 3 5",
      "-2 -3 8",
    ]);
    expect(screen.getByText("Passed 3 of 3 checks.")).toBeInTheDocument();
  });

  it("keeps the exercise retryable when completion cannot be saved", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["6", "0", "6"],
    });
    saveJavaScriptLabExercise.mockResolvedValue({ ok: false });
    render(<JavaScriptDataStructuresLab />);

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
    expect(
      screen.queryByRole("heading", { name: /change state/i }),
    ).not.toBeInTheDocument();
  });

  it("shows one code-free recovery cue only after a failed run", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["0", "0", "0"],
    });
    render(<JavaScriptDataStructuresLab />);

    fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));

    expect(await screen.findByText("1 of 3 checks passed.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Visit each number. Add it to total only when dividing by 2 leaves no remainder.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Keep this:")).not.toBeInTheDocument();
  });

  it.each([
    {
      name: "arrays",
      completedExerciseIds: [],
      outputs: ["6", "0", "6"],
      heading: "Watch arrays change state",
      firstDecision: "Keep and add",
      finalResult: "Return 6 after visiting every array item once.",
    },
    {
      name: "strings",
      completedExerciseIds: ["sum-even-values"],
      outputs: ["3", "0", "5"],
      heading: "Watch strings change state",
      firstDecision: "Not a vowel",
      finalResult: "Return 2 after inspecting all four characters.",
    },
    {
      name: "objects",
      completedExerciseIds: ["sum-even-values", "count-vowels"],
      outputs: ["apple:2 banana:1", "red:3 blue:1", "one:1"],
      heading: "Watch objects change state",
      firstDecision: "Create key",
      finalResult:
        "Object.entries preserves first-seen order: apple:2 banana:1.",
    },
    {
      name: "sets",
      completedExerciseIds: [
        "sum-even-values",
        "count-vowels",
        "word-frequency",
      ],
      outputs: ["3", "1", "3"],
      heading: "Watch sets change state",
      firstDecision: "Add",
      finalResult:
        "The set size is 3 even though the input contains four tags.",
    },
  ])(
    "reveals the authored $name walkthrough only after a correct result saves",
    async ({
      completedExerciseIds,
      outputs,
      heading,
      firstDecision,
      finalResult,
    }) => {
      runCodingSolution.mockResolvedValue({
        status: "finished",
        outputs,
      });
      render(
        <JavaScriptDataStructuresLab
          completedExerciseIds={completedExerciseIds}
        />,
      );

      expect(
        screen.queryByRole("heading", { name: heading }),
      ).not.toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
      });

      expect(saveJavaScriptLabExercise).toHaveBeenCalledWith(
        "data-structures",
        JAVASCRIPT_DATA_STRUCTURE_EXERCISES[completedExerciseIds.length].slug,
      );
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
      expect(screen.getByText(firstDecision)).toBeInTheDocument();

      const stepCount =
        JAVASCRIPT_DATA_STRUCTURE_EXERCISES[completedExerciseIds.length]
          .walkthrough.steps.length;
      for (let step = 1; step < stepCount; step += 1) {
        fireEvent.click(screen.getByRole("button", { name: "Next step" }));
      }

      expect(screen.getByText(finalResult)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Next step" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Previous step" })).toBeEnabled();
    },
  );

  it("reveals the takeaway only after passing and advances in order", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["6", "0", "6"],
    });
    render(<JavaScriptDataStructuresLab />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(screen.getByText("Keep this:")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue to Strings" }));

    expect(
      screen.getByRole("heading", {
        name: "Inspect a string one character at a time",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Structure 2 of 4")).toBeInTheDocument();
    expect(screen.queryByText("Keep this:")).not.toBeInTheDocument();
  });

  it("keeps runtime failures in one polite status region", async () => {
    runCodingSolution.mockResolvedValue({
      status: "error",
      message: "Define a function named solve(input).",
    });
    render(<JavaScriptDataStructuresLab />);

    fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));

    const message = await screen.findByText(
      "Define a function named solve(input).",
    );
    expect(message.closest('[role="status"]')).toHaveAttribute(
      "aria-atomic",
      "true",
    );
  });
});
