import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CodingSkillRecord } from "./coding-skill-record";

const record = {
  acceptedCount: 1,
  totalCount: 2,
  attemptCount: 3,
  practiceDays: 2,
  lastPracticedAt: "2026-08-05T09:00:00.000Z",
  nextAction: {
    kicker: "Your next practice",
    title: "Retry Even or odd.",
    description: "3/4 checks passed on your latest saved attempt.",
    label: "Retry problem 02",
    href: "/practice/even-or-odd",
  },
  skills: [
    {
      slug: "sum-two-numbers",
      number: 1,
      title: "Sum two numbers",
      skill: "Input handling",
      state: "accepted" as const,
      resultLabel: "4/4 checks",
      lastAttemptedAt: "2026-08-04T09:00:00.000Z",
    },
    {
      slug: "even-or-odd",
      number: 2,
      title: "Even or odd",
      skill: "Conditions",
      state: "retry" as const,
      resultLabel: "3/4 checks",
      lastAttemptedAt: "2026-08-05T09:00:00.000Z",
    },
  ],
};

const labProgress = {
  completedCount: 5,
  totalCount: 7,
  nextLabSlug: "tracing" as const,
  nextLabTitle: "Code tracing",
  nextHref: "/practice/tracing",
  nextExerciseNumber: 3,
  labs: [
    {
      slug: "foundations" as const,
      title: "JavaScript foundations",
      href: "/practice/foundations",
      completedCount: 3,
      totalCount: 3,
      nextExerciseNumber: null,
      state: "complete" as const,
    },
    {
      slug: "tracing" as const,
      title: "Code tracing",
      href: "/practice/tracing",
      completedCount: 2,
      totalCount: 4,
      nextExerciseNumber: 3,
      state: "in-progress" as const,
    },
  ],
};

describe("CodingSkillRecord", () => {
  it("shows private skill evidence and one recommended action", () => {
    render(<CodingSkillRecord record={record} labProgress={labProgress} />);

    expect(
      screen.getByRole("heading", {
        name: "See the skill behind every verdict.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Private to your account.")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByText("Judged attempts").parentElement).toHaveTextContent(
      "3",
    );
    expect(
      screen.getByRole("link", { name: "Retry problem 02" }),
    ).toHaveAttribute("href", "/practice/even-or-odd");
    expect(screen.getByRole("link", { name: "Review Sum two numbers" })).toHaveAttribute(
      "href",
      "/practice/sum-two-numbers",
    );
    expect(
      screen.getByRole("heading", { name: "Your saved practice record" }),
    ).toBeInTheDocument();
    expect(screen.getByText("5/7")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Review JavaScript foundations" }),
    ).toHaveAttribute("href", "/practice/foundations");
    expect(
      screen.getByRole("link", {
        name: "Continue Code tracing at exercise 3",
      }),
    ).toHaveAttribute("href", "/practice/tracing");
  });
});
