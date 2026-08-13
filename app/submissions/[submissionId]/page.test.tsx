import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SubmissionPage, { metadata } from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getSubmission: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  notFound: mocks.notFound,
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@/db/coding-practice", () => ({
  getCodingSubmissionForStudent: mocks.getSubmission,
}));

describe("SubmissionPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps each private source snapshot out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("redirects before reading a submission when signed out", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(
      SubmissionPage({ params: Promise.resolve({ submissionId: "attempt-1" }) }),
    ).rejects.toThrow("REDIRECT:/account?mode=signin");
    expect(mocks.getSubmission).not.toHaveBeenCalled();
  });

  it("returns not found for a submission outside the learner's account", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "learner-1", name: "Learner", email: "private@example.com" },
    });
    mocks.getSubmission.mockResolvedValue(null);

    await expect(
      SubmissionPage({ params: Promise.resolve({ submissionId: "attempt-2" }) }),
    ).rejects.toThrow("NOT_FOUND");
    expect(mocks.getSubmission).toHaveBeenCalledWith("learner-1", "attempt-2");
  });

  it("renders the exact immutable source selected for this learner", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "learner-1", name: "Learner", email: "private@example.com" },
    });
    mocks.getSubmission.mockResolvedValue({
      id: "attempt-1",
      problemSlug: "sum-two-numbers",
      problemNumber: 1,
      problemTitle: "Sum two numbers",
      verdict: "Wrong Answer",
      passedTests: 3,
      totalTests: 4,
      createdAt: "2026-08-04T10:30:00.000Z",
      hasSource: true,
      code: "function sum(a, b) { return a + b; }",
      previousSubmission: null,
      nextSubmission: null,
    });

    render(
      await SubmissionPage({
        params: Promise.resolve({ submissionId: "attempt-1" }),
      }),
    );

    expect(mocks.getSubmission).toHaveBeenCalledWith("learner-1", "attempt-1");
    expect(screen.getByText(/function sum/)).toBeInTheDocument();
    expect(screen.getByText("Use this source in the editor")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Download this submission .js",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText("private@example.com")).not.toBeInTheDocument();
  });

  it("keeps the download absent for an older result without saved source", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "learner-1", name: "Learner", email: "private@example.com" },
    });
    mocks.getSubmission.mockResolvedValue({
      id: "attempt-legacy",
      problemSlug: "sum-two-numbers",
      problemNumber: 1,
      problemTitle: "Sum two numbers",
      verdict: "Wrong Answer",
      passedTests: 1,
      totalTests: 4,
      createdAt: "2026-08-03T10:30:00.000Z",
      hasSource: false,
      code: null,
      previousSubmission: null,
      nextSubmission: null,
    });

    render(
      await SubmissionPage({
        params: Promise.resolve({ submissionId: "attempt-legacy" }),
      }),
    );

    expect(
      screen.getByText("This earlier result has no source snapshot."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Download this submission .js",
      }),
    ).not.toBeInTheDocument();
  });
});
