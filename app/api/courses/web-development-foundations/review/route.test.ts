import { beforeEach, describe, expect, it, vi } from "vitest";
import { getOrCreateFirstCourseAssignment } from "@/db/course";
import {
  getWebFoundationsReviewResultForStudent,
  saveWebFoundationsReviewResultForStudent,
} from "@/db/web-foundations-review";
import { auth } from "@/lib/auth";
import { POST } from "./route";

vi.mock("next/headers", () => ({ headers: vi.fn().mockResolvedValue(new Headers()) }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("@/db/course", () => ({ getOrCreateFirstCourseAssignment: vi.fn() }));
vi.mock("@/db/web-foundations-review", () => ({
  getWebFoundationsReviewResultForStudent: vi.fn(),
  saveWebFoundationsReviewResultForStudent: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getCourse = vi.mocked(getOrCreateFirstCourseAssignment);
const getSavedResult = vi.mocked(getWebFoundationsReviewResultForStudent);
const saveResult = vi.mocked(saveWebFoundationsReviewResultForStudent);

function requestFor(result: { correctCount: number; totalCount: number }) {
  return new Request("http://localhost/api/courses/web-development-foundations/review", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(result),
  });
}

describe("POST /api/courses/web-development-foundations/review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ user: { id: "learner-a" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    getCourse.mockResolvedValue({ courseCompleted: true } as Awaited<
      ReturnType<typeof getOrCreateFirstCourseAssignment>
    >);
    getSavedResult.mockResolvedValue(null);
    saveResult.mockResolvedValue({
      correctCount: 5,
      totalCount: 6,
      completedAt: "2026-08-07T12:00:00.000Z",
      nextDueAt: "2026-08-14T12:00:00.000Z",
    });
  });

  it("saves only the bounded result for a completed-course learner", async () => {
    const response = await POST(requestFor({ correctCount: 5, totalCount: 6 }));

    expect(response.status).toBe(200);
    expect(saveResult).toHaveBeenCalledWith("learner-a", {
      correctCount: 5,
      totalCount: 6,
    });
    expect(JSON.stringify(saveResult.mock.calls[0])).not.toContain("answer");
  });

  it("rejects signed-out, incomplete-course, malformed, and early results", async () => {
    getSession.mockResolvedValue(null);
    expect((await POST(requestFor({ correctCount: 5, totalCount: 6 }))).status).toBe(401);

    getSession.mockResolvedValue({ user: { id: "learner-a" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    expect((await POST(requestFor({ correctCount: 7, totalCount: 6 }))).status).toBe(400);

    getCourse.mockResolvedValue({ courseCompleted: false } as Awaited<
      ReturnType<typeof getOrCreateFirstCourseAssignment>
    >);
    expect((await POST(requestFor({ correctCount: 5, totalCount: 6 }))).status).toBe(403);

    getCourse.mockResolvedValue({ courseCompleted: true } as Awaited<
      ReturnType<typeof getOrCreateFirstCourseAssignment>
    >);
    getSavedResult.mockResolvedValue({
      correctCount: 5,
      totalCount: 6,
      completedAt: "2026-08-07T12:00:00.000Z",
      nextDueAt: "2126-08-14T12:00:00.000Z",
    });
    expect((await POST(requestFor({ correctCount: 5, totalCount: 6 }))).status).toBe(409);
    expect(saveResult).not.toHaveBeenCalled();
  });
});
