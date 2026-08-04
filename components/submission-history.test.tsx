import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  SubmissionHistory,
  SubmissionSnapshot,
} from "./submission-history";

const submissions = [
  {
    id: "submission-2",
    problemSlug: "sum-two-numbers",
    problemNumber: 1,
    problemTitle: "Sum two numbers",
    verdict: "Accepted",
    passedTests: 4,
    totalTests: 4,
    createdAt: "2026-08-04T10:30:00.000Z",
    hasSource: true,
  },
  {
    id: "submission-1",
    problemSlug: "even-or-odd",
    problemNumber: 2,
    problemTitle: "Even or odd",
    verdict: "Wrong Answer",
    passedTests: 2,
    totalTests: 4,
    createdAt: "2026-08-04T10:00:00.000Z",
    hasSource: false,
  },
];

afterEach(cleanup);

describe("SubmissionHistory", () => {
  it("shows bounded result context and opens an immutable submission record", () => {
    render(<SubmissionHistory submissions={submissions} />);

    expect(
      screen.getByRole("heading", { name: "See the code behind every result." }),
    ).toBeInTheDocument();
    const summary = screen.getByRole("region", { name: "History summary" });
    expect(summary).toHaveTextContent("2");
    expect(summary).toHaveTextContent("attempts shown");
    expect(screen.getByText("4/4 checks")).toBeInTheDocument();
    expect(screen.getByText("2/4 checks")).toBeInTheDocument();
    expect(screen.getByText("Source saved")).toBeInTheDocument();
    expect(screen.getByText("Result only")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /Review Sum two numbers submission from/,
      }),
    ).toHaveAttribute("href", "/submissions/submission-2");
    expect(screen.getByRole("link", { name: /Continue practice/ })).toHaveAttribute(
      "href",
      "/practice",
    );
    expect(screen.getByText(/newest 50 judged submissions/i)).toBeInTheDocument();
  });

  it("gives an empty private record one concrete next step", () => {
    render(<SubmissionHistory submissions={[]} />);

    expect(
      screen.getByRole("heading", {
        name: "Your first judged solution will appear here.",
      }),
    ).toBeInTheDocument();
    const summary = screen.getByRole("region", { name: "History summary" });
    expect(summary).toHaveTextContent("0");
    expect(summary).toHaveTextContent("attempts shown");
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});

describe("SubmissionSnapshot", () => {
  it("confirms before loading exact source into an unsaved editor copy", () => {
    const { container } = render(
      <SubmissionSnapshot
        submission={{
          ...submissions[0],
          code: "function sum(a, b) {\n  return a + b;\n}",
          previousSubmission: {
            id: "submission-0",
            code: "function sum(a, b) {\n  return a - b;\n}",
            verdict: "Wrong Answer",
            passedTests: 1,
            totalTests: 4,
            createdAt: "2026-08-04T10:15:00.000Z",
          },
          nextSubmission: null,
        }}
      />,
    );
    const snapshot = within(container);

    expect(snapshot.getAllByText("Accepted")).toHaveLength(2);
    expect(snapshot.getByText("4/4 checks passed")).toBeInTheDocument();
    expect(snapshot.getByLabelText("Submitted JavaScript source")).toHaveTextContent(
      "function sum",
    );
    expect(snapshot.getByText("Read-only snapshot")).toBeInTheDocument();
    expect(
      snapshot.getByRole("heading", {
        name: "What changed since the previous try",
      }),
    ).toBeInTheDocument();
    expect(
      snapshot.getByRole("table", {
        name: "Previous and selected JavaScript source comparison",
      }),
    ).toHaveTextContent("return a - b");
    const attemptTrail = snapshot.getByRole("navigation", {
      name: "Submission trail for Sum two numbers",
    });
    expect(
      within(attemptTrail).getByRole("link", {
        name: "Review earlier submission: Wrong Answer, 1 of 4 checks",
      }),
    ).toHaveAttribute("href", "/submissions/submission-0");
    expect(within(attemptTrail).getByText("Latest saved try")).toBeInTheDocument();
    expect(
      snapshot.getByLabelText("Checks changed from 1 of 4 to 4 of 4"),
    ).toHaveTextContent("1/4 → 4/4");
    expect(snapshot.getByText(/current work stays untouched/i)).toBeInTheDocument();
    expect(
      snapshot.getByRole("link", { name: /Open current problem/ }),
    ).toHaveAttribute("href", "/practice/sum-two-numbers");
    fireEvent.click(snapshot.getByText("Use this source in the editor"));
    expect(snapshot.getByText("Load this exact submission?")).toBeInTheDocument();
    expect(
      snapshot.getByText(/Loading alone does not change your saved code/),
    ).toBeInTheDocument();
    expect(
      snapshot.getByRole("link", { name: /Load in editor/ }),
    ).toHaveAttribute(
      "href",
      "/practice/sum-two-numbers?submission=submission-2",
    );
    expect(snapshot.queryByRole("button")).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent("private@example.com");
  });

  it("keeps legacy verdict context when no source snapshot exists", () => {
    render(
      <SubmissionSnapshot
        submission={{
          ...submissions[1],
          code: null,
          previousSubmission: null,
          nextSubmission: {
            id: "submission-2",
            verdict: "Accepted",
            passedTests: 4,
            totalTests: 4,
            createdAt: "2026-08-04T10:30:00.000Z",
          },
        }}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "This earlier result has no source snapshot.",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Wrong Answer")).toHaveLength(2);
    expect(screen.getByText("2/4 checks passed")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Review later submission: Accepted, 4 of 4 checks",
      }),
    ).toHaveAttribute("href", "/submissions/submission-2");
    expect(
      screen.queryByText("Use this source in the editor"),
    ).not.toBeInTheDocument();
  });

  it("stays uncluttered when a problem has only one saved try", () => {
    render(
      <SubmissionSnapshot
        submission={{
          ...submissions[0],
          code: "function solve(input) { return input; }",
          previousSubmission: null,
          nextSubmission: null,
        }}
      />,
    );

    expect(
      screen.queryByRole("navigation", { name: /submission trail/i }),
    ).not.toBeInTheDocument();
  });
});
