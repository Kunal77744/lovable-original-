import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JavaScriptLinkedListLab } from "./javascript-linked-list-lab";

const runCodingSolution = vi.fn();
const saveJavaScriptLabExercise = vi.fn();

vi.mock("@/lib/coding-runner", () => ({
  runCodingSolution: (...args: unknown[]) => runCodingSolution(...args),
}));

vi.mock("@/lib/javascript-lab-progress", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/javascript-lab-progress")
  >();
  return {
    ...actual,
    saveJavaScriptLabExercise: (...args: unknown[]) =>
      saveJavaScriptLabExercise(...args),
  };
});

describe("JavaScriptLinkedListLab", () => {
  beforeEach(() => {
    runCodingSolution.mockReset();
    saveJavaScriptLabExercise.mockReset();
    saveJavaScriptLabExercise.mockResolvedValue({ ok: true });
  });
  afterEach(cleanup);

  it("starts at the first unfinished linked-list exercise", () => {
    render(
      <JavaScriptLinkedListLab completedExerciseIds={["connect-the-next-node"]} />,
    );

    expect(
      screen.getByRole("heading", { name: "Visit every node once" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Linked-list idea 2 of 4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run 3 checks" })).toBeEnabled();
    expect(
      screen.getByRole<HTMLTextAreaElement>("textbox", {
        name: "JavaScript linked-list code",
      }).value,
    ).toContain("function sumList");
  });

  it("runs deterministic checks through the isolated worker", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["red->blue->green", "one", "a->b->c->d"],
    });
    render(<JavaScriptLinkedListLab />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(runCodingSolution).toHaveBeenCalledWith(expect.any(String), [
      "red,blue,green",
      "one",
      "a,b,c,d",
    ]);
    expect(screen.getByText("Passed 3 of 3 checks.")).toBeInTheDocument();
    expect(saveJavaScriptLabExercise).toHaveBeenCalledWith(
      "linked-lists",
      "connect-the-next-node",
    );
  });

  it("keeps the exercise retryable when completion cannot be saved", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["red->blue->green", "one", "a->b->c->d"],
    });
    saveJavaScriptLabExercise.mockResolvedValue({ ok: false });
    render(<JavaScriptLinkedListLab />);

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

  it("shows code-free recovery only after a failed or stopped run", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["red", "one", "a"],
    });
    render(<JavaScriptLinkedListLab />);

    expect(screen.queryByText(/Keep one reference to the head/)).not.toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(screen.getByText("1 of 3 checks passed.")).toBeInTheDocument();
    expect(screen.getByText(/Keep one reference to the head/)).toBeInTheDocument();
    expect(screen.queryByText("Keep this:")).not.toBeInTheDocument();
  });

  it("reveals teaching only after passing and advances in order", async () => {
    runCodingSolution.mockResolvedValue({
      status: "finished",
      outputs: ["red->blue->green", "one", "a->b->c->d"],
    });
    render(<JavaScriptLinkedListLab />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Run 3 checks" }));
    });

    expect(screen.getByText("Keep this:")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to Traversal" }),
    );

    expect(
      screen.getByRole("heading", { name: "Visit every node once" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Keep this:")).not.toBeInTheDocument();
  });

  it("shows the completion state when all four saved exercises return", () => {
    render(
      <JavaScriptLinkedListLab
        completedExerciseIds={[
          "connect-the-next-node",
          "traverse-every-node",
          "reverse-the-links",
          "choose-the-list-operation",
        ]}
      />,
    );

    expect(screen.getByText("Linked-list fundamentals complete")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start judged practice" }),
    ).toHaveAttribute("href", "/practice/sum-two-numbers");
  });
});
