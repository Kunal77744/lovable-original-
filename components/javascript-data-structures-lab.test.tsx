import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JavaScriptDataStructuresLab } from "./javascript-data-structures-lab";

const runCodingSolution = vi.fn();

vi.mock("@/lib/coding-runner", () => ({
  runCodingSolution: (...args: unknown[]) => runCodingSolution(...args),
}));

describe("JavaScriptDataStructuresLab", () => {
  beforeEach(() => runCodingSolution.mockReset());
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
