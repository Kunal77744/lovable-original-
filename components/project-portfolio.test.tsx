import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectPortfolio } from "./project-portfolio";
import {
  buildProjectPortfolio,
  type ProjectPortfolioSummary,
} from "@/lib/project-portfolio";

const completed = { state: "completed" as const, passedChecks: 6 };
const notStarted = { state: "not-started" as const, passedChecks: 0 };

function buildPortfolio(semanticHtml: ProjectPortfolioSummary = completed) {
  return buildProjectPortfolio({
    courseCompleted: true,
    courseNextHref: "/dashboard",
    courseNextTitle: "Web Development Foundations",
    cssCompletedCount: 0,
    cssTotalCount: 6,
    cssNextHref: "/practice/css/class-selector",
    semanticHtml,
    javascript: notStarted,
    htmlCss: notStarted,
  });
}

describe("ProjectPortfolio", () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    writeText.mockClear();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });

  afterEach(cleanup);

  it("copies a private-safe summary of completed work", async () => {
    render(<ProjectPortfolio portfolio={buildPortfolio()} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Copy completed-project summary",
      }),
    );

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0][0]).toContain("## Semantic HTML field guide");
    expect(writeText.mock.calls[0][0]).not.toContain("JavaScript");
    expect(
      screen.getByRole("button", { name: "Project summary copied" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("1 completed project is ready to paste."),
    ).toBeInTheDocument();
  });

  it("keeps the copy action hidden until a project is complete", () => {
    render(<ProjectPortfolio portfolio={buildPortfolio(notStarted)} />);

    expect(
      screen.queryByRole("button", {
        name: "Copy completed-project summary",
      }),
    ).not.toBeInTheDocument();
  });

  it("keeps a failed copy retryable", async () => {
    writeText.mockRejectedValueOnce(new Error("clipboard unavailable"));
    render(<ProjectPortfolio portfolio={buildPortfolio()} />);

    const button = screen.getByRole("button", {
      name: "Copy completed-project summary",
    });
    fireEvent.click(button);

    expect(
      await screen.findByText("The summary could not be copied. Try again."),
    ).toBeInTheDocument();
    expect(button).toBeEnabled();
  });
});
