import { render, screen, within } from "@testing-library/react";
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
  cssPractice: {
    completedCount: 4,
    totalCount: 6,
    completedSlugs: [
      "class-selector",
      "descendant-selector",
      "padding",
      "border",
    ],
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
  isFreshLearner: false,
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

    expect(screen.getByText("Private progress")).toBeInTheDocument();
    expect(screen.getAllByText("100%")).toHaveLength(2);
    expect(screen.getByText("JavaScript Accepted").parentElement).toHaveTextContent(
      "1/6",
    );
    expect(screen.getByText("CSS completed").parentElement).toHaveTextContent(
      "4/6",
    );
    expect(screen.getByText("Sum two numbers")).toBeInTheDocument();
    expect(screen.getByText("Accepted")).toBeInTheDocument();
    expect(screen.getByText("4/4 checks")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View all submissions" })).toHaveAttribute(
      "href",
      "/submissions",
    );
    expect(screen.getByRole("link", { name: "Sum two numbers" })).toHaveAttribute(
      "href",
      "/submissions/attempt-1",
    );
    expect(
      screen.getByRole("link", { name: /Solve problem 02/ }),
    ).toHaveAttribute("href", "/practice/even-or-odd");
    expect(screen.getAllByRole("link", { name: /Solve problem 02/ })).toHaveLength(
      1,
    );
    expect(
      screen.getByRole("link", { name: /View private projects/ }),
    ).toHaveAttribute("href", "/projects");
  });

  it("gives a fresh learner one accurate first step", () => {
    const freshProfile: LearnerProfileViewModel = {
      course: {
        slug: "web-development-foundations",
        title: "Web Development Foundations",
        completedLessons: 0,
        totalLessons: 1,
        progressPercent: 0,
        courseCompleted: false,
        nextLesson: {
          slug: "semantic-html",
          title: "Structure a page with semantic HTML",
          moduleTitle: "HTML foundations",
          completed: false,
          quizScore: null,
        },
      },
      practice: {
        completedCount: 0,
        totalCount: 6,
        completedSlugs: [],
      },
      cssPractice: {
        completedCount: 0,
        totalCount: 6,
        completedSlugs: [],
      },
      attempts: [],
      quizScore: null,
      isFreshLearner: true,
      nextAction: {
        label: "Start the course",
        href: "/learn/web-development-foundations/semantic-html",
        kicker: "Your first step",
        title: "Structure a page with semantic HTML",
        description:
          "Build one semantic HTML page, then complete the four-question recall check.",
      },
    };

    const { container } = render(<LearnerProfile profile={freshProfile} />);
    const freshState = within(container);

    expect(
      freshState.getByRole("heading", {
        name: "Your learning record starts here.",
      }),
    ).toBeInTheDocument();
    expect(freshState.getByText("Private progress")).toBeInTheDocument();
    expect(freshState.getByText("0/1")).toBeInTheDocument();
    expect(
      freshState.getByText("JavaScript Accepted").parentElement,
    ).toHaveTextContent("0/6");
    expect(freshState.getByText("CSS completed").parentElement).toHaveTextContent(
      "0/6",
    );
    expect(freshState.getByText("Not started")).toBeInTheDocument();
    expect(freshState.getByText("Not attempted")).toBeInTheDocument();
    expect(freshState.getAllByRole("link")).toHaveLength(2);
    expect(
      freshState.getByRole("link", { name: /Start the course/ }),
    ).toHaveAttribute(
      "href",
      "/learn/web-development-foundations/semantic-html",
    );
  });

  it("shows both practice paths as complete without combining their totals", () => {
    const { container } = render(
      <LearnerProfile
        profile={{
          ...profile,
          practice: {
            completedCount: 6,
            totalCount: 6,
            completedSlugs: profile.practice.completedSlugs,
          },
          cssPractice: {
            completedCount: 6,
            totalCount: 6,
            completedSlugs: profile.cssPractice.completedSlugs,
          },
        }}
      />,
    );

    const completeState = within(container);
    expect(completeState.getByText("JavaScript Accepted").parentElement).toHaveTextContent(
      "6/6",
    );
    expect(completeState.getByText("CSS completed").parentElement).toHaveTextContent(
      "6/6",
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
