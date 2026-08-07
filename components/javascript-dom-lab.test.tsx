import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JavaScriptDomLab } from "./javascript-dom-lab";

const runDomLabCode = vi.fn();
const saveJavaScriptLabExercise = vi.fn();

vi.mock("@/lib/dom-lab-runner", () => ({
  runDomLabCode: (...args: unknown[]) => runDomLabCode(...args),
}));

vi.mock("@/lib/javascript-lab-progress", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/javascript-lab-progress")>();
  return {
    ...actual,
    saveJavaScriptLabExercise: (...args: unknown[]) => saveJavaScriptLabExercise(...args),
  };
});

describe("JavaScriptDomLab", () => {
  beforeEach(() => {
    runDomLabCode.mockReset();
    saveJavaScriptLabExercise.mockReset();
    saveJavaScriptLabExercise.mockResolvedValue({ ok: true });
  });
  afterEach(cleanup);

  it("starts with an unfinished selector exercise and four ordered moves", () => {
    render(<JavaScriptDomLab />);

    expect(
      screen.getByRole("heading", { name: "Find one element on the page" }),
    ).toBeInTheDocument();
    expect(screen.getByText("DOM move 1 of 4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run 3 checks" })).toBeEnabled();
    expect(
      screen.getByRole<HTMLTextAreaElement>("textbox", {
        name: "JavaScript DOM code",
      }).value,
    ).toContain("return null");
    expect(
      screen.getByRole("list", { name: "DOM fundamentals" }).querySelector("li"),
    ).toHaveAttribute("aria-current", "step");
  });

  it("runs the current source and exact exercise through the isolated runner", async () => {
    runDomLabCode.mockResolvedValue({
      status: "finished",
      checks: [true, true, true],
    });
    render(<JavaScriptDomLab />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(runDomLabCode).toHaveBeenCalledWith(
      expect.stringContaining("findLessonTitle"),
      "select-an-element",
    );
    expect(screen.getByText("Passed 3 of 3 checks.")).toBeInTheDocument();
  });

  it("keeps the exercise retryable when completion cannot be saved", async () => {
    runDomLabCode.mockResolvedValue({
      status: "finished",
      checks: [true, true, true],
    });
    saveJavaScriptLabExercise.mockResolvedValue({ ok: false });
    render(<JavaScriptDomLab />);

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

  it("shows one code-free recovery cue only after a failed run", async () => {
    runDomLabCode.mockResolvedValue({
      status: "finished",
      checks: [false, false, false],
    });
    render(<JavaScriptDomLab />);

    fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));

    expect(await screen.findByText("0 of 3 checks passed.")).toBeInTheDocument();
    expect(
      screen.getByText(
        'Ask document for the selector "#lesson-title", then return the element it gives you.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Keep this:")).not.toBeInTheDocument();
  });

  it("reveals one takeaway only after passing and advances in order", async () => {
    runDomLabCode.mockResolvedValue({
      status: "finished",
      checks: [true, true, true],
    });
    render(<JavaScriptDomLab />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(screen.getByText("Keep this:")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue to Text" }));
    expect(
      screen.getByRole("heading", { name: "Replace an element's text" }),
    ).toBeInTheDocument();
    expect(screen.getByText("DOM move 2 of 4")).toBeInTheDocument();
    expect(screen.queryByText("Keep this:")).not.toBeInTheDocument();
  });

  it("keeps runtime failures in one polite status region", async () => {
    runDomLabCode.mockResolvedValue({
      status: "error",
      message: "Keep the provided function name so the checks can call it.",
    });
    render(<JavaScriptDomLab />);

    fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));

    const message = await screen.findByText(
      "Keep the provided function name so the checks can call it.",
    );
    expect(message.closest('[role="status"]')).toHaveAttribute(
      "aria-atomic",
      "true",
    );
  });
});
