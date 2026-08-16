import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JAVASCRIPT_TRACE_EXERCISES } from "@/lib/javascript-tracing";
import { JavaScriptTracingLab } from "./javascript-tracing-lab";

const saveJavaScriptLabExercise = vi.fn();

vi.mock("@/lib/javascript-lab-progress", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/javascript-lab-progress")>();
  return {
    ...actual,
    saveJavaScriptLabExercise: (...args: unknown[]) => saveJavaScriptLabExercise(...args),
  };
});

describe("JavaScriptTracingLab", () => {
  beforeEach(() => {
    saveJavaScriptLabExercise.mockReset();
    saveJavaScriptLabExercise.mockResolvedValue({ ok: true });
  });
  afterEach(() => cleanup());

  it("starts with one unanswered trace and no teaching explanation", () => {
    render(<JavaScriptTracingLab />);

    expect(screen.getByText("Trace 1 of 4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check prediction" })).toBeDisabled();
    expect(screen.queryByText("Trace it yourself")).not.toBeInTheDocument();
    expect(screen.getByText("Your answer stays local. Completion saves privately.")).toBeInTheDocument();
  });

  it("resumes at the first exercise not completed by this account", () => {
    render(
      <JavaScriptTracingLab completedExerciseIds={["assignment-order"]} />,
    );

    expect(screen.getByText("Trace 2 of 4")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
  });

  it("gives a bounded cue after a wrong prediction", () => {
    render(<JavaScriptTracingLab />);

    fireEvent.click(screen.getByRole("radio", { name: "8" }));
    fireEvent.click(screen.getByRole("button", { name: "Check prediction" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Not yet. Trace one value at a time.",
    );
    expect(screen.getByRole("status")).not.toHaveTextContent("14");
  });

  it("rebuilds each value step before revealing the exact trace and advancing", async () => {
    render(<JavaScriptTracingLab />);

    fireEvent.click(screen.getByRole("radio", { name: "14" }));
    fireEvent.click(screen.getByRole("button", { name: "Check prediction" }));

    expect(await screen.findByText("Trace it yourself")).toBeInTheDocument();
    expect(screen.getByText("Rebuild step 1 of 3")).toBeInTheDocument();
    expect(screen.queryByText("Trace rebuilt. Here is the exact path.")).not.toBeInTheDocument();

    for (const value of ["4", "7", "14"]) {
      const practiceGroup = screen.getAllByRole("group").at(-1);
      expect(practiceGroup).toBeDefined();
      fireEvent.click(within(practiceGroup!).getByRole("radio", { name: value }));
      fireEvent.click(screen.getByRole("button", { name: "Check step" }));
      fireEvent.click(
        screen.getByRole("button", {
          name: value === "14" ? "Reveal exact trace" : "Next step",
        }),
      );
    }

    expect(screen.getByRole("status")).toHaveTextContent(
      "Trace rebuilt. Here is the exact path.",
    );
    expect(screen.getByRole("status")).toHaveTextContent("total += 3 replaces it with 7.");
    expect(saveJavaScriptLabExercise).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Next trace" }));
    expect(screen.getByText("Trace 2 of 4")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("keeps a wrong value step local and retryable without saving again", async () => {
    render(<JavaScriptTracingLab />);

    fireEvent.click(screen.getByRole("radio", { name: "14" }));
    fireEvent.click(screen.getByRole("button", { name: "Check prediction" }));
    await screen.findByText("Trace it yourself");

    const practiceGroup = screen.getAllByRole("group").at(-1);
    expect(practiceGroup).toBeDefined();
    fireEvent.click(within(practiceGroup!).getByRole("radio", { name: "3" }));
    fireEvent.click(screen.getByRole("button", { name: "Check step" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Not yet. Read the active line",
    );
    expect(saveJavaScriptLabExercise).toHaveBeenCalledTimes(1);

    fireEvent.click(within(practiceGroup!).getByRole("radio", { name: "4" }));
    fireEvent.click(screen.getByRole("button", { name: "Check step" }));

    expect(screen.getByRole("status")).toHaveTextContent("total starts at 4.");
    expect(screen.getByRole("progressbar", { name: "Trace steps rebuilt" })).toHaveAttribute(
      "aria-valuenow",
      "1",
    );
    expect(saveJavaScriptLabExercise).toHaveBeenCalledTimes(1);
  });

  it("finishes after four correct traces and links to judged practice", async () => {
    render(<JavaScriptTracingLab />);

    const traces = [
      { answer: "14", practiceValues: ["4", "7", "14"] },
      { answer: "keep going", practiceValues: ["ready", "false", "keep going"] },
      { answer: "6", practiceValues: ["1", "3", "6"] },
      { answer: "7", practiceValues: ["3", "6", "7"] },
    ];

    for (const { answer, practiceValues } of traces) {
      fireEvent.click(screen.getByRole("radio", { name: answer }));
      fireEvent.click(screen.getByRole("button", { name: "Check prediction" }));

      await screen.findByText("Trace it yourself");
      for (const [index, value] of practiceValues.entries()) {
        const practiceGroup = screen.getAllByRole("group").at(-1);
        expect(practiceGroup).toBeDefined();
        fireEvent.click(within(practiceGroup!).getByRole("radio", { name: value }));
        fireEvent.click(screen.getByRole("button", { name: "Check step" }));
        fireEvent.click(
          screen.getByRole("button", {
            name: index === practiceValues.length - 1 ? "Reveal exact trace" : "Next step",
          }),
        );
      }

      fireEvent.click(
        screen.getByRole("button", {
          name: answer === "7" ? "Finish the lab" : "Next trace",
        }),
      );
    }

    expect(screen.getByText("Tracing lab complete")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start judged practice" })).toHaveAttribute(
      "href",
      "/practice/sum-two-numbers",
    );
  });

  it("keeps a correct prediction retryable when completion does not save", async () => {
    saveJavaScriptLabExercise.mockResolvedValue({ ok: false });
    render(<JavaScriptTracingLab />);

    fireEvent.click(screen.getByRole("radio", { name: "14" }));
    fireEvent.click(screen.getByRole("button", { name: "Check prediction" }));

    expect(
      await screen.findByText(
        "That prediction is correct, but completion could not be saved.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    expect(screen.queryByText("Trace it yourself")).not.toBeInTheDocument();
  });

  it("reviews completed traces in order without another private save", async () => {
    render(
      <JavaScriptTracingLab
        completedExerciseIds={JAVASCRIPT_TRACE_EXERCISES.map(
          (exercise) => exercise.id,
        )}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Review exercises/ }));
    fireEvent.click(screen.getByRole("radio", { name: "14" }));
    fireEvent.click(screen.getByRole("button", { name: "Check prediction" }));

    expect(await screen.findByText("Correct. Here is the exact trace.")).toBeInTheDocument();
    expect(saveJavaScriptLabExercise).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Next trace" }));
    expect(screen.getByText("Trace 2 of 4")).toBeInTheDocument();
  });
});
