import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCssPracticeCatalogProgress } from "@/db/css-practice";
import {
  getCssSpacedReviewResultForStudent,
  saveCssSpacedReviewResultForStudent,
} from "@/db/css-spaced-review";
import { auth } from "@/lib/auth";
import { POST } from "./route";

vi.mock("next/headers", () => ({ headers: vi.fn().mockResolvedValue(new Headers()) }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("@/db/css-practice", () => ({ getCssPracticeCatalogProgress: vi.fn() }));
vi.mock("@/db/css-spaced-review", () => ({
  getCssSpacedReviewResultForStudent: vi.fn(),
  saveCssSpacedReviewResultForStudent: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getProgress = vi.mocked(getCssPracticeCatalogProgress);
const getSavedResult = vi.mocked(getCssSpacedReviewResultForStudent);
const saveResult = vi.mocked(saveCssSpacedReviewResultForStudent);

function requestFor(result: { correctCount: number; totalCount: number }) {
  return new Request("http://localhost/api/practice/css/spaced-review", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(result),
  });
}

describe("POST /api/practice/css/spaced-review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ user: { id: "learner-a" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    getProgress.mockResolvedValue({ completedCount: 6, totalCount: 6 } as Awaited<
      ReturnType<typeof getCssPracticeCatalogProgress>
    >);
    getSavedResult.mockResolvedValue(null);
    saveResult.mockResolvedValue({
      correctCount: 3,
      totalCount: 4,
      completedAt: "2026-08-15T12:00:00.000Z",
      nextDueAt: "2026-08-22T12:00:00.000Z",
    });
  });

  it("saves only the bounded result for a completed CSS learner", async () => {
    const response = await POST(requestFor({ correctCount: 3, totalCount: 4 }));

    expect(response.status).toBe(200);
    expect(saveResult).toHaveBeenCalledWith("learner-a", {
      correctCount: 3,
      totalCount: 4,
    });
    expect(JSON.stringify(saveResult.mock.calls[0])).not.toContain("answer");
  });

  it("rejects signed-out, incomplete-path, malformed, and early results", async () => {
    getSession.mockResolvedValue(null);
    expect((await POST(requestFor({ correctCount: 3, totalCount: 4 }))).status).toBe(401);

    getSession.mockResolvedValue({ user: { id: "learner-a" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    expect((await POST(requestFor({ correctCount: 5, totalCount: 4 }))).status).toBe(400);

    getProgress.mockResolvedValue({ completedCount: 5, totalCount: 6 } as Awaited<
      ReturnType<typeof getCssPracticeCatalogProgress>
    >);
    expect((await POST(requestFor({ correctCount: 3, totalCount: 4 }))).status).toBe(403);

    getProgress.mockResolvedValue({ completedCount: 6, totalCount: 6 } as Awaited<
      ReturnType<typeof getCssPracticeCatalogProgress>
    >);
    getSavedResult.mockResolvedValue({
      correctCount: 3,
      totalCount: 4,
      completedAt: "2026-08-15T12:00:00.000Z",
      nextDueAt: "2126-08-22T12:00:00.000Z",
    });
    expect((await POST(requestFor({ correctCount: 3, totalCount: 4 }))).status).toBe(409);
    expect(saveResult).not.toHaveBeenCalled();
  });
});
