import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JavaScriptAlgorithmEfficiencyLab } from "./javascript-algorithm-efficiency-lab";

const saveJavaScriptLabExercise = vi.fn();

vi.mock("@/lib/javascript-lab-progress", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/javascript-lab-progress")>();
  return {
    ...actual,
    saveJavaScriptLabExercise: (...args: unknown[]) => saveJavaScriptLabExercise(...args),
  };
});

describe("JavaScriptAlgorithmEfficiencyLab", () => {
  beforeEach(() => {
    saveJavaScriptLabExercise.mockReset();
    saveJavaScriptLabExercise.mockResolvedValue({ ok: true });
  });
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

  it("reveals the explanation only after the stronger approach", async () => {
    render(<JavaScriptAlgorithmEfficiencyLab />);

    fireEvent.click(screen.getByRole("radio", { name: /Use the id key/ }));
    fireEvent.click(screen.getByRole("button", { name: "Check this approach" }));

    expect(await screen.findByText("Better growth")).toBeInTheDocument();
    expect(screen.getByText(/O\(1\) means/)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    expect(screen.getByRole("button", { name: "Next decision" })).toBeInTheDocument();
  });

  it("reveals browser-only growth comparison after the correct result saves", async () => {
    render(<JavaScriptAlgorithmEfficiencyLab />);

    expect(screen.queryByText("Watch the work separate.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: /Use the id key/ }));
    fireEvent.click(screen.getByRole("button", { name: "Check this approach" }));

    expect(await screen.findByText("Watch the work separate.")).toBeInTheDocument();
    expect(screen.getByLabelText("O(n²): 100 operations")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "10,000" }));

    expect(screen.getByLabelText("O(log n): 14 operations")).toBeInTheDocument();
    expect(screen.getByLabelText("O(n): 10,000 operations")).toBeInTheDocument();
    expect(screen.getByLabelText("O(n²): 100,000,000 operations")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "10,000" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(saveJavaScriptLabExercise).toHaveBeenCalledTimes(1);
  });

  it("completes all four decisions and offers judged practice next", async () => {
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
        await screen.findByRole("button", {
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

  it("keeps correct progress unsaved and retryable when the account save fails", async () => {
    saveJavaScriptLabExercise.mockResolvedValue({ ok: false });
    render(<JavaScriptAlgorithmEfficiencyLab />);

    fireEvent.click(screen.getByRole("radio", { name: /Use the id key/ }));
    fireEvent.click(screen.getByRole("button", { name: "Check this approach" }));

    expect(
      await screen.findByText(
        "That answer is correct, but completion could not be saved.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    expect(screen.queryByText("Better growth")).not.toBeInTheDocument();
    expect(screen.queryByText("Watch the work separate.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check this approach" })).toBeEnabled();
  });
});
