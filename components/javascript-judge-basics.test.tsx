import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { JavaScriptJudgeBasics } from "./javascript-judge-basics";

describe("JavaScriptJudgeBasics", () => {
  afterEach(() => cleanup());

  it("traces the judge contract before offering judged practice", () => {
    render(<JavaScriptJudgeBasics />);

    expect(screen.getByText("solve(\"5 7\")")).toBeInTheDocument();
    expect(screen.getByText("Parsed values")).toBeInTheDocument();
    expect(screen.getByText("Exact return")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Start problem 01" })).not.toBeInTheDocument();
    expect(screen.getByText(/creates no judged attempt or progress record/i)).toBeInTheDocument();
  });

  it("gives bounded recovery for an incorrect answer", () => {
    render(<JavaScriptJudgeBasics />);

    fireEvent.click(screen.getByLabelText('It returns "12"'));
    fireEvent.click(screen.getByRole("button", { name: "Check my reasoning" }));

    expect(screen.getByText("Look at the values before the plus sign.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Start problem 01" })).not.toBeInTheDocument();
  });

  it("opens problem 01 only after the learner identifies string concatenation", () => {
    render(<JavaScriptJudgeBasics />);

    fireEvent.click(screen.getByLabelText('It returns "57"'));
    fireEvent.click(screen.getByRole("button", { name: "Check my reasoning" }));

    expect(screen.getByText("Strings join. Numbers add.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start problem 01" })).toHaveAttribute(
      "href",
      "/practice/sum-two-numbers",
    );
  });
});
