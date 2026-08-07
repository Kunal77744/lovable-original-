import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCssPracticePathFeedbackForStudent,
  saveCssPracticePathFeedbackForStudent,
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
  getCssPracticePathFeedbackForStudent: vi.fn(),
  saveCssPracticePathFeedbackForStudent: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getFeedback = vi.mocked(getCssPracticePathFeedbackForStudent);
const saveFeedback = vi.mocked(saveCssPracticePathFeedbackForStudent);

describe("CSS path feedback API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ user: { id: "learner-one" } } as never);
  });

  it("restores only the signed-in learner's exact response", async () => {
    getFeedback.mockResolvedValue({
      isEligible: true,
      feedback: {
        pathSlug: "css-selectors-box-model",
        usefulness: "somewhat",
        comment: "Private learner note.",
        updatedAt: "2026-08-03T12:00:00.000Z",
      },
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(getFeedback).toHaveBeenCalledWith("learner-one");
    await expect(response.json()).resolves.toMatchObject({
      feedback: { comment: "Private learner note." },
    });

    getSession.mockResolvedValue({ user: { id: "learner-two" } } as never);
    getFeedback.mockResolvedValue({ isEligible: false, feedback: null });

    const otherLearnerResponse = await GET();

    expect(otherLearnerResponse.status).toBe(200);
    expect(getFeedback).toHaveBeenLastCalledWith("learner-two");
    await expect(otherLearnerResponse.json()).resolves.toEqual({
      isEligible: false,
      feedback: null,
    });
  });

  it("saves and revises the bounded response for the current account", async () => {
    saveFeedback.mockResolvedValue({
      pathSlug: "css-selectors-box-model",
      usefulness: "very",
      comment: "The checks helped.",
      updatedAt: "2026-08-03T12:05:00.000Z",
    });

    const response = await POST(
      new Request("http://localhost/api/practice/css/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usefulness: "very",
          comment: "The checks helped.",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(saveFeedback).toHaveBeenCalledWith(
      "learner-one",
      "very",
      "The checks helped.",
    );
  });

  it("rejects feedback before all six challenges are complete", async () => {
    saveFeedback.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/practice/css/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usefulness: "not_yet", comment: "" }),
      }),
    );

    expect(response.status).toBe(403);
  });

  it("rejects signed-out reads and writes before touching learner data", async () => {
    getSession.mockResolvedValue(null);

    const [readResponse, writeResponse] = await Promise.all([
      GET(),
      POST(
        new Request("http://localhost/api/practice/css/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usefulness: "very", comment: "private" }),
        }),
      ),
    ]);

    expect([readResponse.status, writeResponse.status]).toEqual([401, 401]);
    expect(getFeedback).not.toHaveBeenCalled();
    expect(saveFeedback).not.toHaveBeenCalled();
  });
});
