import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PracticeProgressPage, { metadata } from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  getRecord: vi.fn(),
  getLabProgress: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock("@/db/coding-skill-record", () => ({
  getCodingSkillRecordForStudent: mocks.getRecord,
}));
vi.mock("@/db/javascript-lab-progress", () => ({
  getJavaScriptLabCatalogProgress: mocks.getLabProgress,
}));

describe("PracticeProgressPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRecord.mockResolvedValue({
      completedSlugs: [],
      attempts: [],
    });
    mocks.getLabProgress.mockResolvedValue({
      completedCount: 0,
      totalCount: 51,
      nextLabSlug: "foundations",
      nextLabTitle: "JavaScript foundations",
      nextHref: "/practice/judge-basics",
      nextExerciseNumber: 1,
      labs: [
        {
          slug: "foundations",
          title: "JavaScript foundations",
          href: "/practice/judge-basics",
          completedCount: 0,
          totalCount: 4,
          nextExerciseNumber: 1,
          state: "not-started",
        },
      ],
    });
  });

  it("keeps the private record out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("redirects before reading attempts when signed out", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(PracticeProgressPage()).rejects.toThrow(
      "REDIRECT:/account?mode=signin",
    );
    expect(mocks.getRecord).not.toHaveBeenCalled();
    expect(mocks.getLabProgress).not.toHaveBeenCalled();
  });

  it("loads only the signed-in learner record", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "learner-1", email: "private@example.com" },
    });

    render(await PracticeProgressPage());

    expect(mocks.getRecord).toHaveBeenCalledWith("learner-1");
    expect(mocks.getLabProgress).toHaveBeenCalledWith("learner-1");
    expect(
      screen.getByRole("heading", {
        name: "See the skill behind every verdict.",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText("private@example.com")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Your saved practice record" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start problem 01" })).toHaveAttribute(
      "href",
      "/practice/sum-two-numbers",
    );
  });
});
