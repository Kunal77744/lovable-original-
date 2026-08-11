import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CssAttemptHistory } from "./css-attempt-history";

const attempts = [
  {
    id: "attempt-2",
    challengeSlug: "predictable-width",
    challengeNumber: 2,
    challengeTitle: "Make width predictable",
    skill: "Box sizing",
    verdict: "Completed" as const,
    passedChecks: 3,
    totalChecks: 3,
    createdAt: "2026-08-10T10:30:00.000Z",
  },
  {
    id: "attempt-1",
    challengeSlug: "class-selector",
    challengeNumber: 1,
    challengeTitle: "Select one card",
    skill: "Class selectors",
    verdict: "Needs revision" as const,
    passedChecks: 2,
    totalChecks: 3,
    createdAt: "2026-08-10T10:00:00.000Z",
  },
];

afterEach(cleanup);

describe("CssAttemptHistory", () => {
  it("shows bounded private outcomes and reopens the matching challenge", () => {
    render(<CssAttemptHistory attempts={attempts} />);

    expect(
      screen.getByRole("heading", {
        name: "See recent saved results in one place.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "History summary" })).toHaveTextContent(
      "2attempts shown",
    );
    expect(screen.getByText("3/3 checks")).toBeInTheDocument();
    expect(screen.getByText("2/3 checks")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Needs revision")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Reopen Select one card from/ }),
    ).toHaveAttribute("href", "/practice/css/class-selector");
    expect(screen.getByText(/newest 50 saved challenge attempts/i)).toBeInTheDocument();
  });

  it("gives an empty record one path into CSS practice", () => {
    render(<CssAttemptHistory attempts={[]} />);

    expect(
      screen.getByRole("heading", {
        name: "Your first saved CSS result will appear here.",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: /Continue CSS practice/ })).toHaveAttribute(
      "href",
      "/practice/css",
    );
  });
});
