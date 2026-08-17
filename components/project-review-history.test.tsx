import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProjectReviewHistory } from "./project-review-history";

const attempts = [
  {
    id: "attempt-2",
    slug: "semantic-html-article",
    stack: "Semantic HTML",
    title: "Build a semantic field guide",
    href: "/projects/semantic-html-article",
    status: "completed" as const,
    passedChecks: 6,
    totalChecks: 6,
    createdAt: new Date("2026-08-11T09:15:00.000Z"),
  },
  {
    id: "attempt-1",
    slug: "semantic-html-article",
    stack: "Semantic HTML",
    title: "Build a semantic field guide",
    href: "/projects/semantic-html-article",
    status: "needs-revision" as const,
    passedChecks: 3,
    totalChecks: 6,
    createdAt: new Date("2026-08-10T18:10:00.000Z"),
  },
];

describe("ProjectReviewHistory", () => {
  afterEach(() => cleanup());

  it("shows newest-first bounded results with exact project return links", () => {
    render(<ProjectReviewHistory attempts={attempts} />);

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1 of 3")).toBeInTheDocument();
    expect(screen.getAllByText("6/6")).toHaveLength(1);
    expect(screen.getByText("3/6 checks passed")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Reopen this project/ }),
    ).toHaveLength(2);
    expect(
      screen.getAllByRole("link", { name: /Reopen this project/ })[0],
    ).toHaveAttribute("href", "/projects/semantic-html-article");
    expect(screen.getByText(/Aug 11, 2026.*UTC/)).toBeInTheDocument();
  });

  it("keeps learner source, feedback, and identity out of the record", () => {
    render(<ProjectReviewHistory attempts={attempts} />);

    expect(document.body).not.toHaveTextContent("PRIVATE SOURCE");
    expect(document.body).not.toHaveTextContent("PRIVATE FEEDBACK");
    expect(document.body).not.toHaveTextContent("learner@example.com");
    expect(
      screen.getByText(/Your code, HTML, CSS, feedback, check details/),
    ).toBeInTheDocument();
  });

  it("shows a truthful first-review action when no attempts exist", () => {
    render(<ProjectReviewHistory attempts={[]} />);

    expect(screen.getByText("No saved reviews yet.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open your project portfolio" }),
    ).toHaveAttribute("href", "/projects");
  });
});
