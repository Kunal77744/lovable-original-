import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
    expect(screen.queryByText("Keep this:")).not.toBeInTheDocument();
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
});
