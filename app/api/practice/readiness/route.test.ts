import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveJavaScriptReadinessResultForStudent } from "@/db/javascript-readiness";
import { auth } from "@/lib/auth";
import { JAVASCRIPT_READINESS_QUESTIONS } from "@/lib/javascript-readiness";
import { POST } from "./route";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@/db/javascript-readiness", () => ({
  saveJavaScriptReadinessResultForStudent: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const saveResult = vi.mocked(saveJavaScriptReadinessResultForStudent);

function requestFor(optionOverrides: Record<string, string> = {}) {
  return new Request("http://localhost/api/practice/readiness", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      answers: JAVASCRIPT_READINESS_QUESTIONS.map((question) => ({
        questionId: question.id,
        optionId: optionOverrides[question.id] ?? question.correctOptionId,
      })),
    }),
  });
}

describe("POST /api/practice/readiness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ user: { id: "learner-a" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    saveResult.mockImplementation(async (_userId, result) => ({
      ...result,
      completedAt: "2026-08-07T12:00:00.000Z",
    }));
  });

  it("grades on the server and saves only the bounded result", async () => {
    const response = await POST(requestFor({ "trace-values": "seven" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      correctCount: 5,
      totalCount: 6,
      recommendedLabSlug: "tracing",
      completedAt: "2026-08-07T12:00:00.000Z",
    });
    expect(saveResult).toHaveBeenCalledWith("learner-a", {
      correctCount: 5,
      totalCount: 6,
      recommendedLabSlug: "tracing",
    });
    expect(JSON.stringify(saveResult.mock.calls[0])).not.toContain("seven");
  });

  it("keeps results isolated by the authenticated account", async () => {
    await POST(requestFor());
    getSession.mockResolvedValue({ user: { id: "learner-b" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    await POST(requestFor({ "choose-edge-case": "positive" }));

    expect(saveResult.mock.calls.map(([userId]) => userId)).toEqual([
      "learner-a",
      "learner-b",
    ]);
  });

  it("rejects signed-out and incomplete submissions before persistence", async () => {
    getSession.mockResolvedValue(null);
    expect((await POST(requestFor())).status).toBe(401);
    expect(saveResult).not.toHaveBeenCalled();

    getSession.mockResolvedValue({ user: { id: "learner-a" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    const incomplete = new Request("http://localhost/api/practice/readiness", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answers: [] }),
    });
    expect((await POST(incomplete)).status).toBe(400);
    expect(saveResult).not.toHaveBeenCalled();
  });
});
