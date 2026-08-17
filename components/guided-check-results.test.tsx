import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildGuidedCheckResults,
  GuidedCheckResults,
} from "./guided-check-results";

describe("GuidedCheckResults", () => {
  afterEach(cleanup);

  it("builds exact browser-only output comparisons", () => {
    const results = buildGuidedCheckResults(
      [
        { input: "4 7 2", expectedOutput: "13" },
        { input: "-5 8", expectedOutput: "3" },
      ],
      ["13\n", "4"],
    );

    render(<GuidedCheckResults results={results} />);

    expect(screen.getByText("Browser only · not saved")).toBeInTheDocument();
    const checks = screen.getAllByRole("listitem");
    expect(within(checks[0]).getByText("Matched")).toBeInTheDocument();
    expect(within(checks[1]).getByText("Revisit")).toBeInTheDocument();
    expect(within(checks[1]).getByText("-5 8")).toBeInTheDocument();
    expect(within(checks[1]).getByText("3")).toBeInTheDocument();
    expect(within(checks[1]).getByText("4")).toBeInTheDocument();
  });

  it("shows bounded status-only checks for DOM scenarios", () => {
    render(
      <GuidedCheckResults
        results={[
          { label: "Scenario 01", passed: true },
          { label: "Scenario 02", passed: false },
        ]}
      />,
    );

    expect(screen.getByText("Scenario 01")).toBeInTheDocument();
    expect(screen.getByText("Scenario 02")).toBeInTheDocument();
    expect(screen.queryByText("Expected")).not.toBeInTheDocument();
  });
});
