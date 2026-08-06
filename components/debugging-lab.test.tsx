import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DebuggingLab } from "./debugging-lab";

const runCodingSolution = vi.fn();

vi.mock("@/lib/coding-runner", () => ({
  runCodingSolution: (...args: unknown[]) => runCodingSolution(...args),
}));

describe("DebuggingLab", () => {
  beforeEach(() => runCodingSolution.mockReset());
  afterEach(cleanup);

  it("runs the learner's local repair against three browser checks", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["Even", "Odd", "Even"],
    });
    render(<DebuggingLab />);

    const editor = screen.getByRole("textbox", {
      name: "JavaScript source for Repair the condition",
    });
    fireEvent.change(editor, {
      target: { value: "function solve(input) { return 'fixed'; }" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));

    expect(runCodingSolution).toHaveBeenCalledWith(
      "function solve(input) { return 'fixed'; }",
      ["24", "17", "0"],
    );
    expect(await screen.findByText("Defect repaired")).toBeInTheDocument();
    expect(screen.getByText("All 3 checks passed. You found the defect.")).toBeInTheDocument();
  });

  it("shows only bounded concept guidance after a failed run", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["Odd", "Odd", "Even"],
    });
    render(<DebuggingLab />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(screen.getByText("Keep debugging")).toBeInTheDocument();
    expect(screen.getByText(/Trace what the true branch returns/)).toBeInTheDocument();
    expect(
      screen.queryByText('return number % 2 === 0 ? "Even" : "Odd";'),
    ).not.toBeInTheDocument();
  });

  it("moves through one defect at a time and keeps the work local", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["Even", "Odd", "Even"],
    });
    render(<DebuggingLab />);

    fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    fireEvent.click(await screen.findByRole("button", { name: "Open next defect" }));

    expect(screen.getByRole("heading", { name: "Reset the total" })).toBeInTheDocument();
    expect(screen.getByText("Browser only")).toBeInTheDocument();
    expect(screen.getByLabelText("1 of 3 defects repaired")).toBeInTheDocument();
  });
});
