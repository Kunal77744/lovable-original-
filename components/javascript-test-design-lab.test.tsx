import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { JavaScriptTestDesignLab } from "./javascript-test-design-lab";

describe("JavaScriptTestDesignLab", () => {
  afterEach(() => cleanup());

  it("starts with one unanswered test and no defect explanation", () => {
    render(<JavaScriptTestDesignLab />);

    expect(screen.getByText("Test 1 of 4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check this test" })).toBeDisabled();
    expect(
      screen.queryByText("This test exposes the defect."),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Your answer stays local. Completion saves privately."),
    ).toBeInTheDocument();
  });

  it("gives a bounded cue after choosing a case that still passes", () => {
    render(<JavaScriptTestDesignLab />);

    fireEvent.click(screen.getByRole("radio", { name: /Input 4 9/ }));
    fireEvent.click(screen.getByRole("button", { name: "Check this test" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "That case still passes.",
    );
    expect(screen.getByRole("status")).not.toHaveTextContent(
      "The code reads fixed characters",
    );
  });

  it("reveals expected and faulty outputs only after the breaking case", () => {
    render(<JavaScriptTestDesignLab />);

    fireEvent.click(screen.getByRole("radio", { name: /Input 12 3/ }));
    fireEvent.click(screen.getByRole("button", { name: "Check this test" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "This test exposes the defect.",
    );
    expect(screen.getByRole("status")).toHaveTextContent("Expected15");
    expect(screen.getByRole("status")).toHaveTextContent("Faulty result1");

    fireEvent.click(screen.getByRole("button", { name: "Next test" }));
    expect(screen.getByText("Test 2 of 4")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("finishes after four breaking tests and links to judged practice", () => {
    render(<JavaScriptTestDesignLab />);

    for (const answer of ["12 3", "-3", "3\\n-8 -3 -5", "15"]) {
      fireEvent.click(
        screen.getByRole("radio", {
          name: new RegExp(`Input ${answer.replace("\\n", " ")}`),
        }),
      );
      fireEvent.click(screen.getByRole("button", { name: "Check this test" }));
      fireEvent.click(
        screen.getByRole("button", {
          name: answer === "15" ? "Finish the lab" : "Next test",
        }),
      );
    }

    expect(screen.getByText("Test-design lab complete")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start judged practice" })).toHaveAttribute(
      "href",
      "/practice/sum-two-numbers",
    );
  });
});
