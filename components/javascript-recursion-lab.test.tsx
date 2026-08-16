import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JavaScriptRecursionLab } from "./javascript-recursion-lab";

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

describe("JavaScriptRecursionLab", () => {
  beforeEach(() => {
    runCodingSolution.mockReset();
    saveJavaScriptLabExercise.mockReset();
    saveJavaScriptLabExercise.mockResolvedValue({ ok: true });
  });
  afterEach(cleanup);

  it("starts at the first unfinished recursion exercise", () => {
    render(
      <JavaScriptRecursionLab
        completedExerciseIds={["stop-at-the-base-case"]}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Hand the function a smaller problem",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Recursion idea 2 of 4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run 3 checks" })).toBeEnabled();
    expect(
      screen.getByRole<HTMLTextAreaElement>("textbox", {
        name: "JavaScript recursion code",
      }).value,
    ).toContain("function sumTo");
  });

  it("runs deterministic checks through the isolated worker", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["Go", "3, 2, 1, Go", "6, 5, 4, 3, 2, 1, Go"],
    });
    render(<JavaScriptRecursionLab />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(runCodingSolution).toHaveBeenCalledWith(expect.any(String), [
      "0",
      "3",
      "6",
    ]);
    expect(screen.getByText("Passed 3 of 3 checks.")).toBeInTheDocument();
    expect(saveJavaScriptLabExercise).toHaveBeenCalledWith(
      "recursion",
      "stop-at-the-base-case",
    );
  });

  it("shows code-free recovery after a failed check or stopped run", async () => {
    runCodingSolution.mockResolvedValue({
      status: "error",
      message: "Maximum call stack size exceeded",
    });
    render(<JavaScriptRecursionLab />);

    fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));

    expect(
      await screen.findByText("Maximum call stack size exceeded"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Find the smallest input that needs no recursive work/),
    ).toBeInTheDocument();
    expect(screen.queryByText("Keep this:")).not.toBeInTheDocument();
  });

  it("reveals teaching only after passing and advances in order", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["Go", "3, 2, 1, Go", "6, 5, 4, 3, 2, 1, Go"],
    });
    render(<JavaScriptRecursionLab />);

    expect(
      screen.queryByRole("heading", {
        name: "Watch countDown(3) build and unwind.",
      }),
    ).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(screen.getByText("Keep this:")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Watch countDown(3) build and unwind.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 7")).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Current recursive call stack" }),
    ).toHaveTextContent("countDown(3)");

    fireEvent.click(screen.getByRole("button", { name: "Next stack step" }));

    expect(screen.getByText("Step 2 of 7")).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Current recursive call stack" }),
    ).toHaveTextContent("countDown(2)");

    fireEvent.click(screen.getByRole("button", { name: "Previous step" }));
    expect(screen.getByText("Step 1 of 7")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Continue to Smaller input" }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Hand the function a smaller problem",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Keep this:")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "Watch countDown(3) build and unwind.",
      }),
    ).not.toBeInTheDocument();
  });

  it("shows the completion state when all four saved exercises return", () => {
    render(
      <JavaScriptRecursionLab
        completedExerciseIds={[
          "stop-at-the-base-case",
          "reduce-toward-zero",
          "trace-calls-and-returns",
          "repair-missing-progress",
        ]}
      />,
    );

    expect(
      screen.getByText("Recursion fundamentals complete"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start judged practice" }),
    ).toHaveAttribute("href", "/practice/sum-two-numbers");
  });

  it("keeps passing checks retryable when their completion does not save", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["Go", "3, 2, 1, Go", "6, 5, 4, 3, 2, 1, Go"],
    });
    saveJavaScriptLabExercise.mockResolvedValue({ ok: false });
    render(<JavaScriptRecursionLab />);

    fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));

    expect(
      await screen.findByText(
        "The checks passed, but completion could not be saved. Run them again to retry.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    expect(screen.queryByText("Keep this:")).not.toBeInTheDocument();
  });
});
