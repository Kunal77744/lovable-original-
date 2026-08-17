import { beforeEach, describe, expect, it, vi } from "vitest";
import { getLearningDataExportForStudent } from "@/db/learning-data-export";
import { auth } from "@/lib/auth";
import { GET } from "./route";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/db/learning-data-export", () => ({
  getLearningDataExportForStudent: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getExport = vi.mocked(getLearningDataExportForStudent);

describe("GET /api/settings/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects signed-out requests before reading learner data", async () => {
    getSession.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(getExport).not.toHaveBeenCalled();
  });

  it("downloads only the signed-in learner's prepared export", async () => {
    getSession.mockResolvedValue({
      session: {
        id: "session-1",
        userId: "learner-a",
        token: "private-session-token",
        expiresAt: new Date("2026-08-18T00:00:00.000Z"),
        createdAt: new Date("2026-08-11T00:00:00.000Z"),
        updatedAt: new Date("2026-08-11T00:00:00.000Z"),
      },
      user: {
        id: "learner-a",
        name: "Asha",
        email: "asha@example.com",
        emailVerified: true,
        image: null,
        createdAt: new Date("2026-08-01T00:00:00.000Z"),
        updatedAt: new Date("2026-08-01T00:00:00.000Z"),
      },
    });
    getExport.mockResolvedValue({
      schemaVersion: 1,
      account: {
        displayName: "Asha",
        email: "asha@example.com",
        joinedAt: new Date("2026-08-01T00:00:00.000Z"),
      },
      settings: [],
      courses: {
        assignments: [],
        feedback: [],
        quizAttempts: [],
        lessonProgress: [],
        lessonWorkspaces: [],
        lessonNotes: [],
        certificates: [],
        spacedReviews: [],
      },
      projects: { work: [], reviewAttempts: [], feedback: [] },
      interviewPractice: [],
      javascript: {
        problemProgress: [],
        submissions: [],
        practiceGoals: [],
        dailyChallenges: [],
        timedChallengeResults: [],
        bookmarks: [],
        problemJournals: [],
        privateTestCases: [],
        feedback: [],
        guidedExerciseProgress: [],
        guidedExerciseDrafts: [],
        guidedExerciseAttemptNotes: [],
        readinessResults: [],
        mixedReviews: [],
      },
      css: { progress: [], attempts: [], feedback: [] },
      playground: [],
    });

    const response = await GET();
    const body = await response.text();

    expect(getExport).toHaveBeenCalledWith("learner-a");
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-disposition")).toMatch(
      /^attachment; filename="lovable-original-learning-data-\d{4}-\d{2}-\d{2}\.json"$/,
    );
    expect(response.headers.get("content-type")).toBe(
      "application/json; charset=utf-8",
    );
    expect(body).toContain('"displayName":"Asha"');
    expect(body).toContain('"exportedAt"');
    expect(body).not.toContain("private-session-token");
  });
});
