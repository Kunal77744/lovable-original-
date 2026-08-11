import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getEmptyGuidedProjectChecks,
  GUIDED_PROJECT_STARTER,
} from "@/lib/guided-project";
import SemanticHtmlArticleDebriefPage, { metadata } from "./page";

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

vi.mock("@/db/guided-project", () => ({
  getGuidedProjectForStudent: mocks.getProject,
}));

const completedProject = {
  html: GUIDED_PROJECT_STARTER,
  saved: true,
  updatedAt: "2026-08-11T16:00:00.000Z",
  hasUnreviewedChanges: false,
  submission: {
    status: "completed" as const,
    checks: getEmptyGuidedProjectChecks().map((check) => ({
      ...check,
      passed: true,
    })),
    passedChecks: 6,
    totalChecks: 6,
    submittedAt: "2026-08-11T16:00:00.000Z",
  },
};

describe("SemanticHtmlArticleDebriefPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: "learner-1" } });
    mocks.getProject.mockResolvedValue(completedProject);
  });

  afterEach(() => cleanup());

  it("keeps the private debrief out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("redirects before reading project data when signed out", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(SemanticHtmlArticleDebriefPage()).rejects.toThrow(
      "REDIRECT:/account?mode=signin",
    );
    expect(mocks.getProject).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: "the learner has newer edits",
      project: { ...completedProject, hasUnreviewedChanges: true },
    },
    {
      name: "the saved review needs revision",
      project: {
        ...completedProject,
        submission: {
          ...completedProject.submission,
          status: "needs-revision" as const,
          passedChecks: 5,
          checks: completedProject.submission.checks.map((check, index) => ({
            ...check,
            passed: index !== 0,
          })),
        },
      },
    },
  ])("keeps the debrief locked when $name", async ({ project }) => {
    mocks.getProject.mockResolvedValue(project);

    render(await SemanticHtmlArticleDebriefPage());

    expect(
      screen.getByRole("heading", {
        name: "Complete the reviewed project first.",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Continue the project" }),
    ).toHaveAttribute("href", "/projects/semantic-html-article");
    expect(screen.queryByText("Portfolio wording")).not.toBeInTheDocument();
  });

  it("turns a current saved 6 of 6 result into an explainable project record", async () => {
    render(await SemanticHtmlArticleDebriefPage());

    expect(mocks.getProject).toHaveBeenCalledWith(
      "learner-1",
      "semantic-html-article",
    );
    expect(
      screen.getByRole("heading", {
        name: "Explain how the page structure carries meaning.",
      }),
    ).toBeVisible();
    expect(screen.getByText("6 passed")).toBeVisible();
    expect(
      screen.getByText("Frame the page with ordered landmarks"),
    ).toBeVisible();
    expect(screen.getByText("Portfolio wording")).toBeVisible();
    expect(screen.getByText("README starter")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Print project debrief" }),
    ).toBeVisible();
    expect(screen.getByText("Review the exact saved HTML")).toBeVisible();
  });
});
