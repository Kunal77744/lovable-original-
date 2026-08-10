import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JavaScriptCompletionRecord } from "./javascript-completion-record";

describe("JavaScriptCompletionRecord", () => {
  it("keeps an unfinished learner on the exact next problem", () => {
    render(
      <JavaScriptCompletionRecord
        record={{
          completedCount: 7,
          totalCount: 12,
          displayName: "Asha Singh",
          completedAt: null,
          nextProblem: {
            slug: "frequency-counter",
            number: 8,
            title: "Frequency counter",
          },
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Finish the judged path first." }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("7 of 12 problems Accepted"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Continue with problem 08" }),
    ).toHaveAttribute("href", "/practice/frequency-counter");
    expect(screen.queryByText("Asha Singh")).not.toBeInTheDocument();
  });

  it("shows only the saved 12 of 12 result as a private completion record", () => {
    render(
      <JavaScriptCompletionRecord
        record={{
          completedCount: 12,
          totalCount: 12,
          displayName: "Asha Singh",
          completedAt: "2026-08-10T11:00:00.000Z",
          nextProblem: null,
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Twelve problems, kept as proof." }),
    ).toBeInTheDocument();
    expect(screen.getByText("Asha Singh")).toBeInTheDocument();
    expect(screen.getByText("12/12 Accepted")).toBeInTheDocument();
    expect(screen.getByText("August 10, 2026")).toBeInTheDocument();
    expect(
      screen.getByText(/not an accredited certificate, hiring signal/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Print completion record" }),
    ).toBeInTheDocument();
  });
});
