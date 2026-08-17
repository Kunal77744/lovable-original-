import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PracticeJournalIndex as PracticeJournalIndexViewModel } from "@/lib/practice-journal-index";
import { PracticeJournalIndex } from "./practice-journal-index";

const populatedJournal: PracticeJournalIndexViewModel = {
  journalCount: 2,
  plannedCount: 1,
  reflectedCount: 1,
  primaryAction: {
    kicker: "First unfinished journal",
    title: "Finish your Even or odd plan.",
    description: "1 of 3 planning prompts are saved.",
    label: "Finish problem 02 plan",
    href: "/practice/even-or-odd",
  },
  items: [
    {
      slug: "sum-two-numbers",
      number: 1,
      title: "Sum two numbers",
      skill: "Input handling",
      inputShape: "Two integers",
      edgeCase: "Negative values",
      steps: "Split, convert, then add",
      reflection: "Raw tokens must become numbers",
      planCompletedCount: 3,
      hasReflection: true,
      statusLabel: "Plan + reflection",
      actionLabel: "Review in problem",
      updatedAt: "2026-08-11T09:00:00.000Z",
    },
    {
      slug: "even-or-odd",
      number: 2,
      title: "Even or odd",
      skill: "Conditions",
      inputShape: "One integer",
      edgeCase: "",
      steps: "",
      reflection: "",
      planCompletedCount: 1,
      hasReflection: false,
      statusLabel: "Plan 1/3",
      actionLabel: "Finish plan",
      updatedAt: "2026-08-11T10:00:00.000Z",
    },
  ],
};

describe("PracticeJournalIndex", () => {
  it("shows saved private reasoning and one exact primary continuation", () => {
    render(<PracticeJournalIndex journal={populatedJournal} />);

    expect(
      screen.getByRole("heading", {
        name: "Keep the reasoning behind every result.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Finish problem 02 plan" }),
    ).toHaveAttribute("href", "/practice/even-or-odd");
    expect(screen.getByText("Two integers")).toBeInTheDocument();
    expect(screen.getByText("Raw tokens must become numbers")).toBeInTheDocument();
    expect(screen.getAllByText("Not saved yet")).toHaveLength(3);
    expect(
      screen.getByRole("link", {
        name: "Review in problem for Sum two numbers",
      }),
    ).toHaveAttribute("href", "/practice/sum-two-numbers");
    expect(screen.queryByText(/email/i)).not.toBeInTheDocument();
  });

  it("keeps the empty state truthful and starts at problem 01", () => {
    render(
      <PracticeJournalIndex
        journal={{
          journalCount: 0,
          plannedCount: 0,
          reflectedCount: 0,
          items: [],
          primaryAction: {
            kicker: "Start with a plan",
            title: "Plan before you code Sum two numbers.",
            description: "Capture the input shape before you submit.",
            label: "Open problem 01",
            href: "/practice/sum-two-numbers",
          },
        }}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Your first plan starts beside the editor.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open problem 01" })).toHaveAttribute(
      "href",
      "/practice/sum-two-numbers",
    );
  });
});
