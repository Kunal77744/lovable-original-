import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getEmptyHtmlCssCapstoneChecks,
  HTML_CSS_CAPSTONE_STARTER_CSS,
  HTML_CSS_CAPSTONE_STARTER_HTML,
} from "@/lib/html-css-capstone";
import HtmlCssResourceLibraryDebriefPage, { metadata } from "./page";

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

vi.mock("@/db/html-css-capstone", () => ({
  getHtmlCssCapstoneForStudent: mocks.getProject,
}));

const completedProject = {
  html: HTML_CSS_CAPSTONE_STARTER_HTML,
  css: HTML_CSS_CAPSTONE_STARTER_CSS,
  saved: true,
  updatedAt: "2026-08-07T03:00:00.000Z",
  hasUnreviewedChanges: false,
  submission: {
    status: "completed" as const,
    checks: getEmptyHtmlCssCapstoneChecks().map((check) => ({
      ...check,
      passed: true,
    })),
    passedChecks: 6,
    totalChecks: 6,
    submittedAt: "2026-08-07T03:00:00.000Z",
  },
};

describe("HtmlCssResourceLibraryDebriefPage", () => {
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

    await expect(HtmlCssResourceLibraryDebriefPage()).rejects.toThrow(
      "REDIRECT:/account?mode=signin&next=%2Fprojects%2Fhtml-css-resource-library%2Fdebrief",
    );
    expect(mocks.getProject).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: "the learner has newer edits",
      project: { ...completedProject, hasUnreviewedChanges: true },
    },
    {
      name: "the saved review is unfinished",
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

    render(await HtmlCssResourceLibraryDebriefPage());

    expect(
      screen.getByRole("heading", {
        name: "Complete the reviewed project first.",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Continue the project" }),
    ).toHaveAttribute("href", "/projects/html-css-resource-library");
    expect(screen.queryByText("Portfolio wording")).not.toBeInTheDocument();
  });

  it("turns a current saved 6 of 6 result into an explainable two-file record", async () => {
    render(await HtmlCssResourceLibraryDebriefPage());

    expect(mocks.getProject).toHaveBeenCalledWith("learner-1");
    expect(
      screen.getByRole("heading", {
        name: "Explain how both files work together.",
      }),
    ).toBeVisible();
    expect(screen.getByText("6 passed")).toBeVisible();
    expect(
      screen.getByText("Frame the library with semantic landmarks"),
    ).toBeVisible();
    expect(screen.getByText("Portfolio wording")).toBeVisible();
    expect(screen.getByText("README starter")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Print project debrief" }),
    ).toBeVisible();
    expect(
      screen.getByText("Review the exact saved HTML and CSS"),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "index.html", hidden: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "styles.css", hidden: true }),
    ).toBeInTheDocument();
  });
});
