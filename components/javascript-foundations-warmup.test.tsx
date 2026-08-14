import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JAVASCRIPT_FOUNDATION_EXERCISES } from "@/lib/javascript-foundations";
import { JavaScriptFoundationsWarmup } from "./javascript-foundations-warmup";

const runCodingSolution = vi.fn();
const { saveJavaScriptLabExercise } = vi.hoisted(() => ({
  saveJavaScriptLabExercise: vi.fn(),
}));

vi.mock("@/lib/coding-runner", () => ({
  runCodingSolution: (...args: unknown[]) => runCodingSolution(...args),
}));

vi.mock("@/lib/javascript-lab-progress", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/javascript-lab-progress")>()),
  saveJavaScriptLabExercise: (...args: unknown[]) =>
    saveJavaScriptLabExercise(...args),
}));

describe("JavaScriptFoundationsWarmup", () => {
  beforeEach(() => {
    runCodingSolution.mockReset();
    saveJavaScriptLabExercise.mockReset();
    saveJavaScriptLabExercise.mockResolvedValue({ ok: true });
  });
  afterEach(cleanup);

  it("starts with the first unfinished program in one four-step unit", () => {
    render(
      <JavaScriptFoundationsWarmup
        completedExerciseIds={["understand-the-judge"]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Turn input into numbers" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Unit step 2 of 4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run 3 checks" })).toBeEnabled();
    expect(
      screen.getByRole<HTMLTextAreaElement>("textbox", {
        name: "JavaScript warm-up code",
      }).value,
    ).toContain("// Add every number");
    expect(
      screen
        .getByRole("list", { name: "Foundations unit steps" })
        .querySelector("li"),
    ).toHaveClass("is-complete");
    expect(
      screen
        .getByRole("list", { name: "Foundations unit steps" })
        .querySelectorAll("li")[1],
    ).toHaveAttribute("aria-current", "step");
  });

  it("resumes at the first exercise not completed by this account", () => {
    render(
      <JavaScriptFoundationsWarmup completedExerciseIds={["parse-and-sum"]} />,
    );

    expect(screen.getByText("Unit step 3 of 4")).toBeInTheDocument();
    expect(
      screen
        .getByRole("list", { name: "Foundations unit steps" })
        .querySelectorAll("li")[1],
    ).toHaveClass("is-complete");
  });

  it("shows bounded recovery after a failed local run", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["0", "0", "0"],
    });
    render(
      <JavaScriptFoundationsWarmup
        completedExerciseIds={["understand-the-judge"]}
      />,
    );

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
    render(
      <JavaScriptFoundationsWarmup
        completedExerciseIds={["understand-the-judge"]}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(screen.getByText("Passed 3 of 3 checks. Exercise progress saved.")).toBeInTheDocument();
    expect(screen.getByText("Keep this:")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to step 3" }),
    );

    expect(
      screen.getByRole("heading", { name: "Choose one exact branch" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Unit step 3 of 4")).toBeInTheDocument();
  });

  it("keeps runtime failures in the same polite status region", async () => {
    runCodingSolution.mockResolvedValue({
      status: "error",
      message: "Define a function named solve(input).",
    });
    render(
      <JavaScriptFoundationsWarmup
        completedExerciseIds={["understand-the-judge"]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));

    const message = await screen.findByText("Define a function named solve(input).");
    expect(message.closest('[role="status"]')).toHaveAttribute(
      "aria-atomic",
      "true",
    );
  });

  it("does not claim completion when private saving fails", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["13", "3", "60"],
    });
    saveJavaScriptLabExercise.mockResolvedValue(null);
    render(
      <JavaScriptFoundationsWarmup
        completedExerciseIds={["understand-the-judge"]}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(screen.getByText(/completion could not be saved/i)).toBeInTheDocument();
    expect(screen.queryByText("Keep this:")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Continue to step 3" }),
    ).not.toBeInTheDocument();
  });

  it("separates the judge review from repeat coding practice", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["13", "3", "60"],
    });
    render(
      <JavaScriptFoundationsWarmup
        completedExerciseIds={JAVASCRIPT_FOUNDATION_EXERCISES.map(
          (exercise) => exercise.slug,
        )}
      />,
    );

    expect(screen.getByRole("link", { name: "Review the judge checkpoint" })).toHaveAttribute(
      "href",
      "/practice/judge-basics",
    );
    fireEvent.click(screen.getByRole("button", { name: "Review coding exercises" }));
    expect(screen.getByText("Unit step 2 of 4")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(screen.getByText(/Saved completion stayed unchanged/)).toBeInTheDocument();
    expect(saveJavaScriptLabExercise).not.toHaveBeenCalled();
  });
});
