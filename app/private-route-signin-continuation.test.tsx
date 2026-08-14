import { beforeEach, describe, expect, it, vi } from "vitest";
import CertificatePage from "./certificate/page";
import JavaScriptInterviewDrillPage from "./interview/javascript-fundamentals/page";
import PlaygroundPage from "./playground/page";
import CodingActivityPage from "./practice/activity/page";
import CssReviewPage from "./practice/css/review/page";
import JavaScriptDebuggingLabPage from "./practice/debugging/page";
import PracticeProgressPage from "./practice/progress/page";
import PracticeReviewPage from "./practice/review/page";
import ProfilePage from "./profile/page";
import HtmlCssResourceLibraryDebriefPage from "./projects/html-css-resource-library/debrief/page";
import HtmlCssResourceLibraryPage from "./projects/html-css-resource-library/page";
import JavaScriptExpenseReportDebriefPage from "./projects/javascript-expense-report/debrief/page";
import JavaScriptExpenseReportPage from "./projects/javascript-expense-report/page";
import ProjectsPage from "./projects/page";
import SemanticHtmlProjectPage from "./projects/semantic-html-article/page";
import SettingsPage from "./settings/page";
import SubmissionPage from "./submissions/[submissionId]/page";
import SubmissionsPage from "./submissions/page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
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
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

describe("private route sign-in continuation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(null);
  });

  it.each([
    ["settings", SettingsPage, "/settings"],
    ["profile", ProfilePage, "/profile"],
    ["project", SemanticHtmlProjectPage, "/projects/semantic-html-article"],
    ["certificate", CertificatePage, "/certificate"],
    [
      "interview drill",
      JavaScriptInterviewDrillPage,
      "/interview/javascript-fundamentals",
    ],
    ["playground", PlaygroundPage, "/playground"],
    ["coding activity", CodingActivityPage, "/practice/activity"],
    ["CSS review", CssReviewPage, "/practice/css/review"],
    ["debugging lab", JavaScriptDebuggingLabPage, "/practice/debugging"],
    ["practice progress", PracticeProgressPage, "/practice/progress"],
    ["practice review", PracticeReviewPage, "/practice/review"],
    [
      "HTML and CSS project debrief",
      HtmlCssResourceLibraryDebriefPage,
      "/projects/html-css-resource-library/debrief",
    ],
    [
      "HTML and CSS project",
      HtmlCssResourceLibraryPage,
      "/projects/html-css-resource-library",
    ],
    [
      "JavaScript project debrief",
      JavaScriptExpenseReportDebriefPage,
      "/projects/javascript-expense-report/debrief",
    ],
    [
      "JavaScript project",
      JavaScriptExpenseReportPage,
      "/projects/javascript-expense-report",
    ],
    ["project portfolio", ProjectsPage, "/projects"],
    ["submission history", SubmissionsPage, "/submissions"],
  ])("keeps the requested %s route through account entry", async (_, page, path) => {
    await expect(page()).rejects.toThrow(
      `REDIRECT:/account?mode=signin&next=${encodeURIComponent(path)}`,
    );
  });

  it("keeps the requested submission snapshot through account entry", async () => {
    await expect(
      SubmissionPage({
        params: Promise.resolve({ submissionId: "submission-42" }),
      }),
    ).rejects.toThrow(
      `REDIRECT:/account?mode=signin&next=${encodeURIComponent("/submissions/submission-42")}`,
    );
  });
});
