import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveCodingPracticeGoalForStudent } from "@/db/coding-practice-goal";
import { auth } from "@/lib/auth";
import { POST } from "./route";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@/db/coding-practice-goal", () => ({
  saveCodingPracticeGoalForStudent: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const saveGoal = vi.mocked(saveCodingPracticeGoalForStudent);

function requestFor(targetActiveDays: unknown) {
  return new Request("http://localhost/api/practice/goal", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ targetActiveDays }),
  });
}

describe("POST /api/practice/goal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ user: { id: "learner-goal-1" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    saveGoal.mockResolvedValue({
      targetActiveDays: 3,
      updatedAt: "2026-08-08T12:00:00.000Z",
    });
  });

  it("saves one bounded target for the authenticated learner", async () => {
    const response = await POST(requestFor(3));

    expect(response.status).toBe(200);
    expect(saveGoal).toHaveBeenCalledWith("learner-goal-1", 3);
    expect(await response.json()).toEqual({
      targetActiveDays: 3,
      updatedAt: "2026-08-08T12:00:00.000Z",
    });
  });

  it("rejects signed-out and unbounded targets before persistence", async () => {
    getSession.mockResolvedValue(null);
    expect((await POST(requestFor(3))).status).toBe(401);

    getSession.mockResolvedValue({ user: { id: "learner-goal-1" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    expect((await POST(requestFor(7))).status).toBe(400);
    expect((await POST(requestFor("3"))).status).toBe(400);
    expect(saveGoal).not.toHaveBeenCalled();
  });

  it("fails closed when persistence does not confirm the target", async () => {
    saveGoal.mockResolvedValue(null);

    expect((await POST(requestFor(3))).status).toBe(500);
  });
});
