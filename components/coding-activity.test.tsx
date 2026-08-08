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

    render(<CodingActivity activity={activity} />);

    expect(
      screen.getByRole("heading", { name: "See when you actually practiced." }),
    ).toBeInTheDocument();
    expect(screen.getByText("1", { selector: ".coding-activity-summary strong" })).toBeInTheDocument();
    expect(screen.getByText("active day")).toBeInTheDocument();
    expect(screen.getByText("2", { selector: "dd" })).toBeInTheDocument();
    expect(screen.getByText("Consecutive active days")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "28-day coding activity" }).children).toHaveLength(28);
    expect(
      screen.getAllByRole("link", { name: /Continue problem 02/ }),
    ).toHaveLength(2);
    expect(
      screen.getAllByRole("link", { name: /Continue problem 02/ })[0],
    ).toHaveAttribute("href", "/practice/even-or-odd");
    expect(screen.queryByText(/rank|leaderboard|public profile/i)).not.toBeInTheDocument();
  });
});
