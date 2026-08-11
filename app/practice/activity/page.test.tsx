import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CodingActivityPage, { metadata } from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  getActivityDays: vi.fn(),
  getProgress: vi.fn(),
  getGoal: vi.fn(),
  getLabActivity: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@/db/coding-activity", () => ({
  getCodingActivityDaysForStudent: mocks.getActivityDays,
}));

vi.mock("@/db/coding-practice", () => ({
  getCodingCatalogProgress: mocks.getProgress,
}));

vi.mock("@/db/coding-practice-goal", () => ({
  getCodingPracticeGoalForStudent: mocks.getGoal,
}));

vi.mock("@/db/javascript-lab-progress", () => ({
  getJavaScriptLabActivityForStudent: mocks.getLabActivity,
}));

describe("CodingActivityPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getActivityDays.mockResolvedValue([]);
    mocks.getProgress.mockResolvedValue({
      completedCount: 0,
      totalCount: 12,
      completedSlugs: [],
    });
    mocks.getGoal.mockResolvedValue(null);
    mocks.getLabActivity.mockResolvedValue({
      completedCount: 0,
      totalCount: 55,
      recentCompletions: [],
      nextAction: {
        title: "Continue JavaScript foundations, exercise 1.",
        description:
          "This is the first unfinished guided exercise in your private lab record.",
        label: "Continue guided practice",
        href: "/practice/judge-basics",
      },
    });
  });

  afterEach(() => cleanup());

  it("keeps the private activity route out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("redirects signed-out visitors before reading private activity", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(CodingActivityPage()).rejects.toThrow(
      "REDIRECT:/account?mode=signin",
    );
    expect(mocks.getActivityDays).not.toHaveBeenCalled();
    expect(mocks.getProgress).not.toHaveBeenCalled();
    expect(mocks.getGoal).not.toHaveBeenCalled();
    expect(mocks.getLabActivity).not.toHaveBeenCalled();
  });

  it("loads only the signed-in learner's saved activity", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "learner-activity-1" } });
    mocks.getActivityDays.mockResolvedValue([
      { date: "2026-08-05", attemptCount: 2, acceptedCount: 1 },
    ]);
    mocks.getProgress.mockResolvedValue({
      completedCount: 1,
      totalCount: 12,
      completedSlugs: ["sum-two-numbers"],
    });
    mocks.getGoal.mockResolvedValue({
      targetActiveDays: 3,
      updatedAt: "2026-08-05T12:00:00.000Z",
    });
    mocks.getLabActivity.mockResolvedValue({
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
    });

    render(await CodingActivityPage());

    expect(
      screen.getByRole("heading", { name: "See when you actually practiced." }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Continue problem 02/ })[0],
    ).toHaveAttribute("href", "/practice/even-or-odd");
    expect(mocks.getActivityDays).toHaveBeenCalledWith("learner-activity-1");
    expect(mocks.getProgress).toHaveBeenCalledWith("learner-activity-1");
    expect(mocks.getGoal).toHaveBeenCalledWith("learner-activity-1");
    expect(mocks.getLabActivity).toHaveBeenCalledWith("learner-activity-1");
    expect(
      screen.getByRole("heading", { name: /practice days? to go/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "2 of 55 guided steps" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Turn input into numbers")).toBeInTheDocument();
    expect(screen.queryByText("learner-activity-1")).not.toBeInTheDocument();
  });
});
