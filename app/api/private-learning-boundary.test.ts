import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getFirstLessonNote: vi.fn(),
  saveFirstLessonNote: vi.fn(),
  getFirstLessonArtifact: vi.fn(),
  saveFirstLessonArtifact: vi.fn(),
  saveFirstLessonQuizResult: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock("@/db/course", () => ({
  getFirstLessonNote: mocks.getFirstLessonNote,
  saveFirstLessonNote: mocks.saveFirstLessonNote,
  getFirstLessonArtifact: mocks.getFirstLessonArtifact,
  saveFirstLessonArtifact: mocks.saveFirstLessonArtifact,
  saveFirstLessonQuizResult: mocks.saveFirstLessonQuizResult,
}));

import { GET as getNote } from "./lessons/[lessonSlug]/notes/route";
import { POST as saveWorkspace } from "./lessons/[lessonSlug]/workspace/route";
import { POST as saveQuiz } from "./lessons/[lessonSlug]/complete/route";

const context = {
  params: Promise.resolve({ lessonSlug: "semantic-html" }),
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSession.mockResolvedValue(null);
});

describe("private learning data boundary", () => {
  it("rejects signed-out reads of private lesson notes", async () => {
    const response = await getNote(new Request("http://localhost"), context);

    expect(response.status).toBe(401);
    expect(mocks.getFirstLessonNote).not.toHaveBeenCalled();
  });

  it("rejects signed-out saves of private workspace code", async () => {
    const response = await saveWorkspace(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ html: "<main />" }),
      }),
      context,
    );

    expect(response.status).toBe(401);
    expect(mocks.saveFirstLessonArtifact).not.toHaveBeenCalled();
  });

  it("rejects signed-out quiz-result saves", async () => {
    const response = await saveQuiz(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ answers: {} }),
      }),
      context,
    );

    expect(response.status).toBe(401);
    expect(mocks.saveFirstLessonQuizResult).not.toHaveBeenCalled();
  });
});
