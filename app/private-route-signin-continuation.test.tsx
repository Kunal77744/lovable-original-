import { beforeEach, describe, expect, it, vi } from "vitest";
import CertificatePage from "./certificate/page";
import CourseQuizHistoryPage from "./courses/web-development-foundations/quiz-history/page";
import JavaScriptInterviewDrillPage from "./interview/javascript-fundamentals/page";
import LearningHistoryPage from "./learning-history/page";
import PlaygroundPage from "./playground/page";
import ProfilePage from "./profile/page";
import SemanticHtmlProjectDebriefPage from "./projects/semantic-html-article/debrief/page";
import SemanticHtmlProjectPage from "./projects/semantic-html-article/page";
import SettingsPage from "./settings/page";

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
    [
      "course quiz history",
      CourseQuizHistoryPage,
      "/courses/web-development-foundations/quiz-history",
    ],
    ["learning history", LearningHistoryPage, "/learning-history"],
    ["project", SemanticHtmlProjectPage, "/projects/semantic-html-article"],
    [
      "project debrief",
      SemanticHtmlProjectDebriefPage,
      "/projects/semantic-html-article/debrief",
    ],
    ["certificate", CertificatePage, "/certificate"],
    [
      "interview drill",
      JavaScriptInterviewDrillPage,
      "/interview/javascript-fundamentals",
    ],
    ["playground", PlaygroundPage, "/playground"],
  ])("keeps the requested %s route through account entry", async (_, page, path) => {
    await expect(page()).rejects.toThrow(
      `REDIRECT:/account?mode=signin&next=${encodeURIComponent(path)}`,
    );
  });
});
