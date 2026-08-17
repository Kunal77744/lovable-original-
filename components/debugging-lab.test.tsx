import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JAVASCRIPT_DEBUGGING_DRILLS } from "@/lib/debugging-lab";
import { DebuggingLab } from "./debugging-lab";

const runCodingSolution = vi.fn();
const saveJavaScriptLabExercise = vi.fn();

vi.mock("@/lib/coding-runner", () => ({
  runCodingSolution: (...args: unknown[]) => runCodingSolution(...args),
}));

vi.mock("@/lib/javascript-lab-progress", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/javascript-lab-progress")>();
  return {
    ...actual,
    saveJavaScriptLabExercise: (...args: unknown[]) =>
      saveJavaScriptLabExercise(...args),
  };
});

describe("DebuggingLab", () => {
  beforeEach(() => {
    runCodingSolution.mockReset();
    saveJavaScriptLabExercise.mockReset();
    saveJavaScriptLabExercise.mockResolvedValue({ ok: true });
  });
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
    expect(
      screen.getByText("All 3 checks passed. You found the defect."),
    ).toBeInTheDocument();
  });

  it("offers the account-backed debugging source as a saved JavaScript file", () => {
    render(
      <DebuggingLab
        initialDrafts={{
          "repair-a-condition": "function solve(input) { return 'Even'; }",
        }}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Download saved .js" }),
    ).toBeInTheDocument();
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
    expect(
      screen.getByText(/Trace what the true branch returns/),
    ).toBeInTheDocument();
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
    fireEvent.click(
      await screen.findByRole("button", { name: "Open next defect" }),
    );

    expect(
      screen.getByRole("heading", { name: "Reset the total" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Draft saves privately")).toBeInTheDocument();
    expect(
      screen.getByLabelText("1 of 3 defects repaired"),
    ).toBeInTheDocument();
  });

  it("does not count a repaired defect until its account save succeeds", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["Even", "Odd", "Even"],
    });
    saveJavaScriptLabExercise.mockResolvedValue({ ok: false });
    render(<DebuggingLab />);

    fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));

    expect(
      await screen.findByText(
        "The checks passed, but completion could not be saved. Run them again to retry.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("0 of 3 defects repaired"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Defect repaired")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run 3 checks" })).toBeEnabled();
  });

  it("reopens saved defects without writing another repair", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["Even", "Odd", "Even"],
    });
    render(
      <DebuggingLab
        completedExerciseIds={JAVASCRIPT_DEBUGGING_DRILLS.map(
          (drill) => drill.slug,
        )}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Review exercises/ }));
    fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));

    expect(await screen.findByText(/Saved completion stayed unchanged/)).toBeInTheDocument();
    expect(saveJavaScriptLabExercise).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Open next defect" }));
    expect(screen.getByRole("heading", { name: "Reset the total" })).toBeInTheDocument();
  });
});
