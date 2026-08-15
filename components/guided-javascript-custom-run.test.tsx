import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GuidedJavaScriptCustomRun } from "./guided-javascript-custom-run";

const runCodingSolution = vi.fn();

vi.mock("@/lib/coding-runner", () => ({
  runCodingSolution: (...args: unknown[]) => runCodingSolution(...args),
}));

describe("GuidedJavaScriptCustomRun", () => {
  beforeEach(() => runCodingSolution.mockReset());
  afterEach(cleanup);

  it("runs one learner-defined input without grading the exercise", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["Nora is learning React."],
      debugOutput: [],
    });
    render(
      <GuidedJavaScriptCustomRun
        code={'function solve(input) { return input; }'}
        inputDescription={'A learner and topic separated by "|".'}
        sampleInput="Mina|JavaScript"
      />,
    );

    fireEvent.click(screen.getByText("Try your own input"));
    fireEvent.change(screen.getByRole("textbox", { name: "Your input" }), {
      target: { value: "Nora|React" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run this input" }));
    });

    expect(runCodingSolution).toHaveBeenCalledWith(
      'function solve(input) { return input; }',
      ["Nora|React"],
    );
    expect(screen.getByText("Returned output")).toBeInTheDocument();
    expect(screen.getByText("Nora is learning React.")).toBeInTheDocument();
    expect(
      screen.getByText(/does not mark the exercise complete/),
    ).toBeInTheDocument();
  });

  it("hides stale output after the learner edits the input or code", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["old output"],
      debugOutput: [],
    });
    const { rerender } = render(
      <GuidedJavaScriptCustomRun
        code="function solve() { return 'old output'; }"
        inputDescription="One line of text."
        sampleInput="hello"
      />,
    );

    fireEvent.click(screen.getByText("Try your own input"));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run this input" }));
    });
    expect(screen.getByText("old output")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: "Your input" }), {
      target: { value: "changed input" },
    });
    expect(screen.queryByText("old output")).not.toBeInTheDocument();
    expect(
      screen.getByText("Run your current solution with the input above."),
    ).toBeInTheDocument();

    rerender(
      <GuidedJavaScriptCustomRun
        code="function solve() { return 'new output'; }"
        inputDescription="One line of text."
        sampleInput="hello"
      />,
    );

    expect(screen.queryByText("old output")).not.toBeInTheDocument();
    expect(
      screen.getByText("Run your current solution with the input above."),
    ).toBeInTheDocument();
  });

  it("keeps a stopped custom run retryable", async () => {
    runCodingSolution.mockResolvedValue({
      status: "error",
      message: "Define a function named solve(input).",
      debugOutput: [],
    });
    render(
      <GuidedJavaScriptCustomRun
        code="const answer = 42;"
        inputDescription="One whole number."
        sampleInput="4"
      />,
    );

    fireEvent.click(screen.getByText("Try your own input"));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run this input" }));
    });

    expect(
      screen.getByText("Define a function named solve(input)."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run this input" })).toBeEnabled();
  });
});
