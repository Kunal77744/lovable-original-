import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { LearnerProfileViewModel } from "@/lib/learner-profile";
import { LearnerProfile } from "./learner-profile";

const profile: LearnerProfileViewModel = {
  course: {
    slug: "web-development-foundations",
    title: "Web Development Foundations",
    completedLessons: 1,
    totalLessons: 1,
    progressPercent: 100,
    courseCompleted: true,
    nextLesson: {
      slug: "semantic-html",
      title: "Structure a page with semantic HTML",
      moduleTitle: "HTML foundations",
      completed: true,
      quizScore: 100,
    },
  },
  practice: {
    completedCount: 1,
    totalCount: 6,
    completedSlugs: ["sum-two-numbers"],
  },
  attempts: [
    {
      id: "attempt-1",
      problemSlug: "sum-two-numbers",
      problemNumber: 1,
      problemTitle: "Sum two numbers",
      verdict: "Accepted",
      passedTests: 4,
      totalTests: 4,
      createdAt: "2026-07-26T22:00:00.000Z",
    },
  ],
  quizScore: 100,
  nextAction: {
    label: "Solve problem 02",
    href: "/practice/even-or-odd",
    kicker: "Continue your practice streak",
    title: "Even or odd",
    description: "Practice conditions and keep the accepted result.",
  },
};

describe("LearnerProfile", () => {
  it("shows cumulative progress, safe attempt details, and one primary action", () => {
    render(<LearnerProfile profile={profile} />);

    expect(screen.getAllByText("100%")).toHaveLength(2);
    expect(screen.getByText("problems accepted").parentElement).toHaveTextContent(
      "1/6",
    );
    expect(screen.getByText("Sum two numbers")).toBeInTheDocument();
    expect(screen.getByText("Accepted")).toBeInTheDocument();
    expect(screen.getByText("4/4 checks")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Solve problem 02/ }),
    ).toHaveAttribute("href", "/practice/even-or-odd");
    expect(screen.getAllByRole("link", { name: /Solve problem 02/ })).toHaveLength(
      1,
    );
  });

  it("does not render private account or work content", () => {
    const { container } = render(<LearnerProfile profile={profile} />);

    expect(container).not.toHaveTextContent("@");
    expect(container).not.toHaveTextContent("<main>");
    expect(container).not.toHaveTextContent("feedback");
    expect(container).not.toHaveTextContent("notes");
  });
});
