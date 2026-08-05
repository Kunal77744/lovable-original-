import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { JavaScriptAlgorithmEfficiencyLab } from "./javascript-algorithm-efficiency-lab";

describe("JavaScriptAlgorithmEfficiencyLab", () => {
  afterEach(() => cleanup());

  it("starts with teaching hidden and the primary action disabled", () => {
    render(<JavaScriptAlgorithmEfficiencyLab />);

    expect(screen.getByText("Find one learner by id")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check this approach" })).toBeDisabled();
    expect(screen.queryByText(/O\(1\) means/)).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("gives one bounded cue after a less efficient choice", () => {
    render(<JavaScriptAlgorithmEfficiencyLab />);

    fireEvent.click(screen.getByRole("radio", { name: /Scan the list/ }));
    fireEvent.click(screen.getByRole("button", { name: "Check this approach" }));

    expect(screen.getByText("That approach repeats more work.")).toBeInTheDocument();
    expect(screen.getByText(/go straight to the id/)).toBeInTheDocument();
    expect(screen.queryByText(/O\(1\) means/)).not.toBeInTheDocument();
  });

  it("reveals the explanation only after the stronger approach", () => {
    render(<JavaScriptAlgorithmEfficiencyLab />);

    fireEvent.click(screen.getByRole("radio", { name: /Use the id key/ }));
    fireEvent.click(screen.getByRole("button", { name: "Check this approach" }));

    expect(screen.getByText("Better growth")).toBeInTheDocument();
    expect(screen.getByText(/O\(1\) means/)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    expect(screen.getByRole("button", { name: "Next decision" })).toBeInTheDocument();
  });

  it("completes all four decisions and offers judged practice next", () => {
    render(<JavaScriptAlgorithmEfficiencyLab />);

    const choices = [
      /Use the id key/,
      /Add in one pass/,
      /Remember names already seen/,
      /Build one lookup set/,
    ];

    for (const [index, choice] of choices.entries()) {
      fireEvent.click(screen.getByRole("radio", { name: choice }));
      fireEvent.click(screen.getByRole("button", { name: "Check this approach" }));
      fireEvent.click(
        screen.getByRole("button", {
          name: index === choices.length - 1 ? "Finish the lab" : "Next decision",
        }),
      );
    }

    expect(screen.getByText("Algorithm efficiency lab complete")).toBeInTheDocument();
    expect(screen.getByText("4/4")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Start judged practice/ })).toHaveAttribute(
      "href",
      "/practice/sum-two-numbers",
    );
  });
});
