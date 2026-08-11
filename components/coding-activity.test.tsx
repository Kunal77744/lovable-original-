import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { buildCodingActivity } from "@/lib/coding-activity";
import { CodingActivity } from "./coding-activity";

describe("CodingActivity", () => {
  afterEach(() => cleanup());

  it("shows saved facts and one exact primary continuation", () => {
    const activity = buildCodingActivity({
      now: new Date("2026-08-05T12:00:00.000Z"),
      completedSlugs: ["sum-two-numbers"],
      activityDays: [
        { date: "2026-08-04", attemptCount: 2, acceptedCount: 1 },
      ],
    });

    render(
      <CodingActivity
        activity={activity}
        labActivity={{
          completedCount: 2,
          totalCount: 55,
          recentCompletions: [
            {
              labSlug: "foundations",
              labTitle: "JavaScript foundations",
              exerciseId: "parse-and-sum",
              exerciseTitle: "Turn input into numbers",
              exerciseNumber: 2,
              exerciseCount: 4,
              completedAt: "2026-08-05T12:00:00.000Z",
              href: "/practice/foundations",
            },
          ],
          nextAction: {
            title: "Continue JavaScript foundations, exercise 3.",
            description:
              "This is the first unfinished guided exercise in your private lab record.",
            label: "Continue guided practice",
            href: "/practice/foundations",
          },
        }}
        weeklyGoal={{
          targetActiveDays: 3,
          currentActiveDays: 1,
          weekStart: "2026-08-03",
          weekEnd: "2026-08-09",
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "See when you actually practiced." }),
    ).toBeInTheDocument();
    expect(screen.getByText("1", { selector: ".coding-activity-summary strong" })).toBeInTheDocument();
    expect(screen.getByText("active day")).toBeInTheDocument();
    expect(screen.getByText("2", { selector: "dd" })).toBeInTheDocument();
    expect(screen.getByText("Consecutive active days")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "2 practice days to go." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "28-day coding activity" }).children).toHaveLength(28);
    expect(
      screen.getAllByRole("link", { name: /Continue problem 02/ }),
    ).toHaveLength(2);
    expect(
      screen.getAllByRole("link", { name: /Continue problem 02/ })[0],
    ).toHaveAttribute("href", "/practice/even-or-odd");
    expect(screen.queryByText(/rank|leaderboard|public profile/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "2 of 55 guided steps" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Turn input into numbers")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Continue guided practice/ }),
    ).toHaveAttribute("href", "/practice/foundations");
  });
});
