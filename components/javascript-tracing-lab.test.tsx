import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { JavaScriptTracingLab } from "./javascript-tracing-lab";

describe("JavaScriptTracingLab", () => {
  afterEach(() => cleanup());

  it("starts with one unanswered trace and no teaching explanation", () => {
    render(<JavaScriptTracingLab />);

    expect(screen.getByText("Trace 1 of 4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check prediction" })).toBeDisabled();
    expect(screen.queryByText("Correct. Here is the exact trace.")).not.toBeInTheDocument();
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

  it("reveals the trace only after the correct prediction and advances", () => {
    render(<JavaScriptTracingLab />);

    fireEvent.click(screen.getByRole("radio", { name: "14" }));
    fireEvent.click(screen.getByRole("button", { name: "Check prediction" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Correct. Here is the exact trace.",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "total += 3 replaces it with 7.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Next trace" }));
    expect(screen.getByText("Trace 2 of 4")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("finishes after four correct traces and links to judged practice", () => {
    render(<JavaScriptTracingLab />);

    for (const answer of ["14", "keep going", "6", "7"]) {
      fireEvent.click(screen.getByRole("radio", { name: answer }));
      fireEvent.click(screen.getByRole("button", { name: "Check prediction" }));
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
});
