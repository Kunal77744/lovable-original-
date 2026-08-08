import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getJavaScriptMixedReviewResultForStudent,
  saveJavaScriptMixedReviewResultForStudent,
} from "@/db/javascript-mixed-review";
import { getJavaScriptLabCatalogProgress } from "@/db/javascript-lab-progress";
import { auth } from "@/lib/auth";
import { POST } from "./route";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@/db/javascript-mixed-review", () => ({
  getJavaScriptMixedReviewResultForStudent: vi.fn(),
  saveJavaScriptMixedReviewResultForStudent: vi.fn(),
}));

vi.mock("@/db/javascript-lab-progress", () => ({
  getJavaScriptLabCatalogProgress: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getSavedResult = vi.mocked(getJavaScriptMixedReviewResultForStudent);
const saveResult = vi.mocked(saveJavaScriptMixedReviewResultForStudent);
const getLabProgress = vi.mocked(getJavaScriptLabCatalogProgress);

const labProgress = {
  completedCount: 16,
  totalCount: 55,
  nextLabSlug: "test-design",
  nextLabTitle: "Test design",
  nextHref: "/practice/test-design?exercise=1",
  nextExerciseNumber: 1,
  labs: [
    { slug: "foundations", title: "Foundations", href: "/practice/foundations", completedCount: 4, totalCount: 4, nextExerciseNumber: null, state: "complete" },
    { slug: "tracing", title: "Tracing", href: "/practice/tracing", completedCount: 4, totalCount: 4, nextExerciseNumber: null, state: "complete" },
    { slug: "debugging", title: "Debugging", href: "/practice/debugging", completedCount: 4, totalCount: 4, nextExerciseNumber: null, state: "complete" },
    { slug: "test-design", title: "Test design", href: "/practice/test-design", completedCount: 4, totalCount: 4, nextExerciseNumber: null, state: "complete" },
  ],
} as Awaited<ReturnType<typeof getJavaScriptLabCatalogProgress>>;

function requestFor(result: { correctCount: number; totalCount: number }) {
  return new Request("http://localhost/api/practice/mixed-review", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(result),
  });
}

describe("POST /api/practice/mixed-review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ user: { id: "learner-a" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    getLabProgress.mockResolvedValue(labProgress);
    getSavedResult.mockResolvedValue(null);
    saveResult.mockResolvedValue({
      correctCount: 3,
      totalCount: 4,
      completedAt: "2026-08-07T12:00:00.000Z",
      nextDueAt: "2026-08-14T12:00:00.000Z",
    });
  });

  it("saves only the bounded result for the authenticated learner", async () => {
    const response = await POST(requestFor({ correctCount: 3, totalCount: 4 }));

    expect(response.status).toBe(200);
    expect(saveResult).toHaveBeenCalledWith("learner-a", {
      correctCount: 3,
      totalCount: 4,
    });
    expect(JSON.stringify(saveResult.mock.calls[0])).not.toContain("answer");
  });

  it("rejects signed-out, malformed, and premature results before persistence", async () => {
    getSession.mockResolvedValue(null);
    expect(
      (await POST(requestFor({ correctCount: 3, totalCount: 4 }))).status,
    ).toBe(401);

    getSession.mockResolvedValue({ user: { id: "learner-a" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    expect(
      (await POST(requestFor({ correctCount: 5, totalCount: 4 }))).status,
    ).toBe(400);

    getSavedResult.mockResolvedValue({
      correctCount: 3,
      totalCount: 4,
      completedAt: "2026-08-07T12:00:00.000Z",
      nextDueAt: "2126-08-14T12:00:00.000Z",
    });
    expect(
      (await POST(requestFor({ correctCount: 3, totalCount: 4 }))).status,
    ).toBe(409);
    expect(saveResult).not.toHaveBeenCalled();
  });

  it("requires the current completed-lab prompt count", async () => {
    expect(
      (await POST(requestFor({ correctCount: 3, totalCount: 3 }))).status,
    ).toBe(400);
    expect(saveResult).not.toHaveBeenCalled();
  });
});
