import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SubmissionsPage, { metadata } from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getHistory: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
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

vi.mock("@/db/coding-practice", () => ({
  getCodingSubmissionHistoryForStudent: mocks.getHistory,
}));

describe("SubmissionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getHistory.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps private source history out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(JSON.stringify(metadata)).toContain("read-only source snapshot");
  });

  it("redirects before reading history when signed out", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(SubmissionsPage()).rejects.toThrow(
      "REDIRECT:/account?mode=signin&next=%2Fsubmissions",
    );
    expect(mocks.getHistory).not.toHaveBeenCalled();
  });

  it("reads only the signed-in learner's submissions", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "learner-1", name: "Learner", email: "private@example.com" },
    });

    render(await SubmissionsPage());

    expect(mocks.getHistory).toHaveBeenCalledWith("learner-1");
    expect(
      screen.getByRole("heading", { name: "See the code behind every result." }),
    ).toBeInTheDocument();
    expect(screen.queryByText("private@example.com")).not.toBeInTheDocument();
  });

  it("passes only single bounded filter values into the private history view", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "learner-1", name: "Learner", email: "private@example.com" },
    });
    mocks.getHistory.mockResolvedValue([
      {
        id: "submission-1",
        problemSlug: "sum-two-numbers",
        problemNumber: 1,
        problemTitle: "Sum two numbers",
        verdict: "Accepted",
        passedTests: 4,
        totalTests: 4,
        createdAt: "2026-08-10T10:00:00.000Z",
        hasSource: true,
      },
    ]);

    render(
      await SubmissionsPage({
        searchParams: Promise.resolve({
          problem: "sum-two-numbers",
          verdict: "accepted",
        }),
      }),
    );

    expect(screen.getByLabelText("Problem")).toHaveValue("sum-two-numbers");
    expect(screen.getByLabelText("Verdict")).toHaveValue("accepted");
    const summary = screen.getByRole("region", { name: "History summary" });
    expect(summary).toHaveTextContent("of 1 saved attempt");
  });
});
