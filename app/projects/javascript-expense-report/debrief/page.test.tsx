import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getEmptyJavaScriptCapstoneChecks,
  JAVASCRIPT_CAPSTONE_STARTER,
} from "@/lib/javascript-capstone";
import JavaScriptExpenseReportDebriefPage, { metadata } from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getProject: vi.fn(),
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

vi.mock("@/db/javascript-capstone", () => ({
  getJavaScriptCapstoneForStudent: mocks.getProject,
}));

const completedProject = {
  code: JAVASCRIPT_CAPSTONE_STARTER,
  saved: true,
  updatedAt: "2026-08-07T02:00:00.000Z",
  hasUnreviewedChanges: false,
  submission: {
    status: "completed" as const,
    checks: getEmptyJavaScriptCapstoneChecks().map((check) => ({
      ...check,
      passed: true,
    })),
    passedChecks: 6,
    totalChecks: 6,
    submittedAt: "2026-08-07T02:00:00.000Z",
  },
};

describe("JavaScriptExpenseReportDebriefPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      user: { id: "learner-1" },
    });
    mocks.getProject.mockResolvedValue(completedProject);
  });

  afterEach(() => cleanup());

  it("keeps the private debrief out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("redirects before reading project data when signed out", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(JavaScriptExpenseReportDebriefPage()).rejects.toThrow(
      "REDIRECT:/account?mode=signin",
    );
    expect(mocks.getProject).not.toHaveBeenCalled();
  });

  it("keeps the debrief locked until the current code has a completed review", async () => {
    mocks.getProject.mockResolvedValue({
      ...completedProject,
      hasUnreviewedChanges: true,
    });

    render(await JavaScriptExpenseReportDebriefPage());

    expect(
      screen.getByRole("heading", {
        name: "Complete the reviewed project first.",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Continue the project" }),
    ).toHaveAttribute("href", "/projects/javascript-expense-report");
    expect(screen.queryByText("Portfolio wording")).not.toBeInTheDocument();
  });

  it("turns a saved 6 of 6 result into an explainable project record", async () => {
    render(await JavaScriptExpenseReportDebriefPage());

    expect(mocks.getProject).toHaveBeenCalledWith("learner-1");
    expect(
      screen.getByRole("heading", { name: "Explain what your 6/6 proves." }),
    ).toBeVisible();
    expect(screen.getByText("6 passed")).toBeVisible();
    expect(screen.getAllByText("Read one expense record")).toHaveLength(1);
    expect(screen.getByText("Portfolio wording")).toBeVisible();
    expect(screen.getByText("README starter")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Print project debrief" }),
    ).toBeVisible();
    expect(
      screen.getByText("Review the exact saved source"),
    ).toBeVisible();
  });
});
