import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JAVASCRIPT_FUNCTION_EXERCISES } from "@/lib/javascript-functions-scope";
import { JavaScriptFunctionsScopeLab } from "./javascript-functions-scope-lab";

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

describe("JavaScriptFunctionsScopeLab", () => {
  beforeEach(() => {
    runCodingSolution.mockReset();
    saveJavaScriptLabExercise.mockReset();
    saveJavaScriptLabExercise.mockResolvedValue({ ok: true });
  });
  afterEach(cleanup);

  it("starts with parameters and four ordered function ideas", () => {
    render(<JavaScriptFunctionsScopeLab />);

    expect(
      screen.getByRole("heading", { name: "Pass values into a function" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Function idea 1 of 4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run 3 checks" })).toBeEnabled();
    expect(
      screen.getByRole<HTMLTextAreaElement>("textbox", {
        name: "JavaScript functions and scope code",
      }).value,
    ).toContain("function describeLearner");
    expect(
      screen.getByRole("list", { name: "Function concepts" }).querySelector("li"),
    ).toHaveAttribute("aria-current", "step");
  });

  it("runs deterministic checks through the isolated worker", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: [
        "Mina is learning JavaScript.",
        "Sam is learning CSS.",
        "Lee is learning HTML.",
      ],
    });
    render(<JavaScriptFunctionsScopeLab />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(runCodingSolution).toHaveBeenCalledWith(expect.any(String), [
      "Mina|JavaScript",
      "Sam|CSS",
      "Lee|HTML",
    ]);
    expect(screen.getByText("Passed 3 of 3 checks.")).toBeInTheDocument();
  });

  it("reviews edits against the active starter without changing the editor", () => {
    render(<JavaScriptFunctionsScopeLab />);

    const editor = screen.getByRole<HTMLTextAreaElement>("textbox", {
      name: "JavaScript functions and scope code",
    });
    const revisedSource = `${editor.value}\n// explain this change`;
    fireEvent.change(editor, { target: { value: revisedSource } });

    fireEvent.click(screen.getByText("Review changes from starter"));

    expect(screen.getByText("1 added")).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Changes from the authored starter" }),
    ).toHaveTextContent("// explain this change");
    expect(editor).toHaveValue(revisedSource);
    expect(runCodingSolution).not.toHaveBeenCalled();
    expect(saveJavaScriptLabExercise).not.toHaveBeenCalled();
  });

  it("keeps the exercise retryable when completion cannot be saved", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: [
        "Mina is learning JavaScript.",
        "Sam is learning CSS.",
        "Lee is learning HTML.",
      ],
    });
    saveJavaScriptLabExercise.mockResolvedValue({ ok: false });
    render(<JavaScriptFunctionsScopeLab />);

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

  it("shows one code-free recovery cue only after failure", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["", "", ""],
    });
    render(<JavaScriptFunctionsScopeLab />);

    fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));

    expect(await screen.findByText("0 of 3 checks passed.")).toBeInTheDocument();
    expect(
      screen.getByText(/A parameter is a local name for an incoming value/),
    ).toBeInTheDocument();
    const details = screen.getByRole("region", { name: "Check details" });
    expect(within(details).getByText("Browser only · not saved")).toBeInTheDocument();
    expect(within(details).getAllByText("Revisit")).toHaveLength(3);
    expect(within(details).getByText("Mina|JavaScript")).toBeInTheDocument();
    expect(
      within(details).getByText("Mina is learning JavaScript."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Keep this:")).not.toBeInTheDocument();
  });

  it("clears stale check details as soon as the learner edits", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["", "", ""],
    });
    render(<JavaScriptFunctionsScopeLab />);

    fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    expect(
      await screen.findByRole("region", { name: "Check details" }),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole("textbox", {
        name: "JavaScript functions and scope code",
      }),
      { target: { value: "function solve() {}" } },
    );

    expect(
      screen.queryByRole("region", { name: "Check details" }),
    ).not.toBeInTheDocument();
  });

  it("reveals teaching only after passing and advances in order", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: [
        "Mina is learning JavaScript.",
        "Sam is learning CSS.",
        "Lee is learning HTML.",
      ],
    });
    render(<JavaScriptFunctionsScopeLab />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(screen.getByText("Keep this:")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue to Return values" }));

    expect(
      screen.getByRole("heading", { name: "Send a result back to the caller" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Function idea 2 of 4")).toBeInTheDocument();
    expect(screen.queryByText("Keep this:")).not.toBeInTheDocument();
  });

  it("keeps runtime failures in one polite status region", async () => {
    runCodingSolution.mockResolvedValue({
      status: "error",
      message: "Define a function named solve(input).",
    });
    render(<JavaScriptFunctionsScopeLab />);

    fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));

    const message = await screen.findByText("Define a function named solve(input).");
    expect(message.closest('[role="status"]')).toHaveAttribute("aria-atomic", "true");
  });

  it("reopens a completed lab without writing another completion", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: [
        "Mina is learning JavaScript.",
        "Sam is learning CSS.",
        "Lee is learning HTML.",
      ],
    });
    render(
      <JavaScriptFunctionsScopeLab
        completedExerciseIds={JAVASCRIPT_FUNCTION_EXERCISES.map(
          (exercise) => exercise.slug,
        )}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Review exercises/ }));
    expect(
      screen.getByRole("heading", { name: "Pass values into a function" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "4");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(screen.getByText(/Saved completion stayed unchanged/)).toBeInTheDocument();
    expect(saveJavaScriptLabExercise).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Continue to Return values" }));
    expect(screen.getByText("Function idea 2 of 4")).toBeInTheDocument();
  });
});
