import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCodingCatalogProgress } from "@/db/coding-practice";
import { saveTimedCodingChallengeResultForStudent } from "@/db/timed-coding-challenge";
import { auth } from "@/lib/auth";
import { POST } from "./route";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@/db/coding-practice", () => ({
  getCodingCatalogProgress: vi.fn(),
}));

vi.mock("@/db/timed-coding-challenge", () => ({
  saveTimedCodingChallengeResultForStudent: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getProgress = vi.mocked(getCodingCatalogProgress);
const saveResult = vi.mocked(saveTimedCodingChallengeResultForStudent);

function requestFor(body: Record<string, unknown>) {
  return new Request("http://localhost/api/practice/challenge/results", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/practice/challenge/results", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ user: { id: "timed-learner-a" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    getProgress.mockResolvedValue({
      completedCount: 3,
      totalCount: 12,
      completedSlugs: ["count-vowels", "unique-values", "even-or-odd"],
    });
    saveResult.mockResolvedValue({
      id: "result-1",
      challengeSetId: "collections",
      solvedCount: 2,
      elapsedSeconds: 754,
      completedAt: "2026-08-10T12:00:00.000Z",
    });
  });

  it("derives the Accepted count on the server and saves bounded fields", async () => {
    const response = await POST(
      requestFor({
        challengeSetId: "collections",
        elapsedSeconds: 754,
        solvedCount: 3,
      }),
    );

    expect(response.status).toBe(200);
    expect(saveResult).toHaveBeenCalledWith("timed-learner-a", {
      challengeSetId: "collections",
      solvedCount: 2,
      elapsedSeconds: 754,
    });
  });

  it("keeps result saves isolated by the authenticated account", async () => {
    await POST(requestFor({ challengeSetId: "collections", elapsedSeconds: 4 }));
    getSession.mockResolvedValue({ user: { id: "timed-learner-b" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    await POST(requestFor({ challengeSetId: "collections", elapsedSeconds: 7 }));

    expect(saveResult.mock.calls.map(([userId]) => userId)).toEqual([
      "timed-learner-a",
      "timed-learner-b",
    ]);
  });

  it("rejects signed-out and malformed results before learner reads or saves", async () => {
    getSession.mockResolvedValue(null);
    expect(
      (
        await POST(
          requestFor({ challengeSetId: "collections", elapsedSeconds: 12 }),
        )
      ).status,
    ).toBe(401);

    getSession.mockResolvedValue({ user: { id: "timed-learner-a" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    expect(
      (
        await POST(
          requestFor({ challengeSetId: "unknown", elapsedSeconds: 12 }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await POST(
          requestFor({ challengeSetId: "collections", elapsedSeconds: 1_801 }),
        )
      ).status,
    ).toBe(400);
    expect(getProgress).not.toHaveBeenCalled();
    expect(saveResult).not.toHaveBeenCalled();
  });

  it("fails closed when persistence does not confirm a result", async () => {
    saveResult.mockResolvedValue(null);

    expect(
      (
        await POST(
          requestFor({ challengeSetId: "collections", elapsedSeconds: 754 }),
        )
      ).status,
    ).toBe(500);
  });
});
