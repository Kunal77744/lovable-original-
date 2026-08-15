import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JavaScriptJudgeBasics } from "./javascript-judge-basics";

const saveJavaScriptLabExercise = vi.fn();

vi.mock("@/lib/javascript-lab-progress", () => ({
  saveJavaScriptLabExercise: (...args: unknown[]) =>
    saveJavaScriptLabExercise(...args),
}));

describe("JavaScriptJudgeBasics", () => {
  beforeEach(() => {
    saveJavaScriptLabExercise.mockReset();
    saveJavaScriptLabExercise.mockResolvedValue({ ok: true });
  });
  afterEach(() => cleanup());

  it("traces the judge contract before offering judged practice", () => {
    render(<JavaScriptJudgeBasics />);

    expect(screen.getByText("solve(\"5 7\")")).toBeInTheDocument();
    expect(screen.getByText("Parsed values")).toBeInTheDocument();
    expect(screen.getByText("Exact return")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Start problem 01" })).not.toBeInTheDocument();
    expect(screen.getByText(/without creating a judged attempt/i)).toBeInTheDocument();
  });

  it("gives bounded recovery for an incorrect answer", () => {
    render(<JavaScriptJudgeBasics />);

    fireEvent.click(screen.getByLabelText('It returns "12"'));
    fireEvent.click(screen.getByRole("button", { name: "Check my reasoning" }));

    expect(screen.getByText("Look at the values before the plus sign.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Start problem 01" })).not.toBeInTheDocument();
  });

  it("saves step 1 before opening the next foundations exercise", async () => {
    render(<JavaScriptJudgeBasics />);

    fireEvent.click(screen.getByLabelText('It returns "57"'));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Check my reasoning" }));
    });

    expect(screen.getByText("Strings join. Numbers add.")).toBeInTheDocument();
    expect(saveJavaScriptLabExercise).toHaveBeenCalledWith(
      "foundations",
      "understand-the-judge",
    );
    expect(screen.getByRole("link", { name: "Continue to step 2" })).toHaveAttribute(
      "href",
      "/practice/foundations",
    );
  });

  it("keeps the next step locked when private saving fails", async () => {
    saveJavaScriptLabExercise.mockResolvedValue(null);
    render(<JavaScriptJudgeBasics />);

    fireEvent.click(screen.getByLabelText('It returns "57"'));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Check my reasoning" }));
    });

    expect(screen.getByText(/could not be saved/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry private save" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Continue to step 2" })).not.toBeInTheDocument();
  });

  it("restores the saved checkpoint after sign-in", () => {
    render(<JavaScriptJudgeBasics initialCompleted />);

    expect(screen.getByRole("link", { name: "Continue to step 2" })).toHaveAttribute(
      "href",
      "/practice/foundations",
    );
    expect(saveJavaScriptLabExercise).not.toHaveBeenCalled();
  });

  it("lets a completed learner retry the reasoning without another record", async () => {
    render(<JavaScriptJudgeBasics initialCompleted />);

    fireEvent.click(screen.getByLabelText('It returns "12"'));
    fireEvent.click(screen.getByRole("button", { name: "Check my reasoning" }));
    expect(screen.getByText("Look at the values before the plus sign.")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('It returns "57"'));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Check my reasoning" }));
    });

    expect(screen.getByText("Strings join. Numbers add.")).toBeInTheDocument();
    expect(saveJavaScriptLabExercise).not.toHaveBeenCalled();
    expect(screen.getByText(/reviewing it creates no new record/i)).toBeInTheDocument();
  });
});
