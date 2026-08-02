import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCssPracticeChallengeForStudent,
  saveCssPracticeAttempt,
  saveCssPracticeDraft,
} from "@/db/css-practice";
import { auth } from "@/lib/auth";
import { GET, POST } from "./route";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@/db/css-practice", () => ({
  getCssPracticeChallengeForStudent: vi.fn(),
  saveCssPracticeAttempt: vi.fn(),
  saveCssPracticeDraft: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getChallenge = vi.mocked(getCssPracticeChallengeForStudent);
const saveAttempt = vi.mocked(saveCssPracticeAttempt);
const saveDraft = vi.mocked(saveCssPracticeDraft);
const context = { params: Promise.resolve({ challengeSlug: "class-selector" }) };

describe("CSS practice API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ user: { id: "learner-one" } } as never);
  });

  it("restores only the signed-in learner's saved challenge", async () => {
    getChallenge.mockResolvedValue({
      css: ".learning-card { color: #17231e; }",
      bestVerdict: "Needs revision",
      attempts: [],
    });

    const response = await GET(
      new Request("http://localhost/api/practice/css/class-selector"),
      context,
    );

    expect(response.status).toBe(200);
    expect(getChallenge).toHaveBeenCalledWith("learner-one", "class-selector");
  });

  it("saves exact draft CSS without creating an attempt", async () => {
    saveDraft.mockResolvedValue({ savedAt: "2026-08-02T00:00:00.000Z" });
    const css = ".learning-card { color: #17231e; }";

    const response = await POST(
      new Request("http://localhost/api/practice/css/class-selector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "draft", css }),
      }),
      context,
    );

    expect(response.status).toBe(200);
    expect(saveDraft).toHaveBeenCalledWith("learner-one", "class-selector", css);
    expect(saveAttempt).not.toHaveBeenCalled();
  });

  it("grades and saves one submitted attempt", async () => {
    const css = ".learning-card { background: white; color: #17231e; }";
    saveAttempt.mockResolvedValue({
      id: "attempt-one",
      verdict: "Completed",
      bestVerdict: "Completed",
      checks: [],
      passedChecks: 3,
      totalChecks: 3,
      completedCount: 1,
      totalCount: 6,
      nextChallengeSlug: "descendant-selector",
      createdAt: "2026-08-02T00:00:00.000Z",
    });

    const response = await POST(
      new Request("http://localhost/api/practice/css/class-selector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "submit", css }),
      }),
      context,
    );

    expect(response.status).toBe(200);
    expect(saveAttempt).toHaveBeenCalledWith("learner-one", "class-selector", css);
  });

  it("rejects signed-out reads and writes before touching learner data", async () => {
    getSession.mockResolvedValue(null);

    const [readResponse, writeResponse] = await Promise.all([
      GET(new Request("http://localhost/api/practice/css/class-selector"), context),
      POST(
        new Request("http://localhost/api/practice/css/class-selector", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ css: ".x {}" }),
        }),
        context,
      ),
    ]);

    expect([readResponse.status, writeResponse.status]).toEqual([401, 401]);
    expect(getChallenge).not.toHaveBeenCalled();
    expect(saveDraft).not.toHaveBeenCalled();
    expect(saveAttempt).not.toHaveBeenCalled();
  });
});
