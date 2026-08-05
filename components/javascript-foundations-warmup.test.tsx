import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JavaScriptFoundationsWarmup } from "./javascript-foundations-warmup";

const runCodingSolution = vi.fn();

vi.mock("@/lib/coding-runner", () => ({
  runCodingSolution: (...args: unknown[]) => runCodingSolution(...args),
}));

describe("JavaScriptFoundationsWarmup", () => {
  beforeEach(() => runCodingSolution.mockReset());
  afterEach(cleanup);

  it("starts with one unfinished parsing exercise and three ordered concepts", () => {
    render(<JavaScriptFoundationsWarmup />);

    expect(
      screen.getByRole("heading", { name: "Turn input into numbers" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Warm-up 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run 3 checks" })).toBeEnabled();
    expect(
      screen.getByRole<HTMLTextAreaElement>("textbox", {
        name: "JavaScript warm-up code",
      }).value,
    ).toContain("// Add every number");
    expect(
      screen.getByRole("list", { name: "Warm-up concepts" }).querySelector("li"),
    ).toHaveAttribute("aria-current", "step");
  });

  it("resumes at the first exercise not completed by this account", () => {
    render(
      <JavaScriptFoundationsWarmup completedExerciseIds={["parse-and-sum"]} />,
    );

    expect(screen.getByText("Warm-up 2 of 3")).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Warm-up concepts" }).querySelector("li"),
    ).toHaveClass("is-complete");
  });

  it("shows bounded recovery after a failed local run", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["0", "0", "0"],
    });
    render(<JavaScriptFoundationsWarmup />);

    fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));

    expect(await screen.findByText("0 of 3 checks passed.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Visit each value in numbers and update total before the return statement.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Keep this:")).not.toBeInTheDocument();
  });

  it("reveals the teaching takeaway only after passing and advances one step", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["13", "3", "60"],
    });
    render(<JavaScriptFoundationsWarmup />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(screen.getByText("Passed 3 of 3 checks. Exercise progress saved.")).toBeInTheDocument();
    expect(screen.getByText("Keep this:")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to warm-up 2" }),
    );

    expect(
      screen.getByRole("heading", { name: "Choose one exact branch" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Warm-up 2 of 3")).toBeInTheDocument();
  });

  it("keeps runtime failures in the same polite status region", async () => {
    runCodingSolution.mockResolvedValue({
      status: "error",
      message: "Define a function named solve(input).",
    });
    render(<JavaScriptFoundationsWarmup />);

    fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));

    const message = await screen.findByText("Define a function named solve(input).");
    expect(message.closest('[role="status"]')).toHaveAttribute(
      "aria-atomic",
      "true",
    );
  });
});
