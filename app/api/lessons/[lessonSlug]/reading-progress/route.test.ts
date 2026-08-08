import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveLessonReadingProgressForStudent } from "@/db/course";
import { auth } from "@/lib/auth";
import { POST } from "./route";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@/db/course", () => ({
  saveLessonReadingProgressForStudent: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const saveProgress = vi.mocked(saveLessonReadingProgressForStudent);

function progressRequest(section: unknown) {
  return new Request(
    "http://localhost/api/lessons/semantic-html/reading-progress",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ section }),
    },
  );
}

describe("POST /api/lessons/[lessonSlug]/reading-progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ user: { id: "learner-a" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    saveProgress.mockResolvedValue({ furthestSection: 2 });
  });

  it("saves one bounded reading checkpoint to the signed-in account", async () => {
    const response = await POST(progressRequest(2), {
      params: Promise.resolve({ lessonSlug: "semantic-html" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ furthestSection: 2 });
    expect(saveProgress).toHaveBeenCalledWith("learner-a", "semantic-html", 2);
  });

  it("rejects signed-out saves before reading the checkpoint", async () => {
    getSession.mockResolvedValue(null);

    const response = await POST(progressRequest(2), {
      params: Promise.resolve({ lessonSlug: "semantic-html" }),
    });

    expect(response.status).toBe(401);
    expect(saveProgress).not.toHaveBeenCalled();
  });

  it.each([0, 4, 1.5, "2"])("rejects invalid section %s", async (section) => {
    const response = await POST(progressRequest(section), {
      params: Promise.resolve({ lessonSlug: "semantic-html" }),
    });

    expect(response.status).toBe(400);
    expect(saveProgress).not.toHaveBeenCalled();
  });

  it("returns not found when the lesson is outside the assigned course", async () => {
    saveProgress.mockResolvedValue(null);

    const response = await POST(progressRequest(1), {
      params: Promise.resolve({ lessonSlug: "missing-lesson" }),
    });

    expect(response.status).toBe(404);
  });
});
