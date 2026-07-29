import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getGuidedProjectFeedbackForStudent,
  saveGuidedProjectFeedbackForStudent,
} from "@/db/guided-project";
import { auth } from "@/lib/auth";
import { GET, POST } from "./route";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/db/guided-project", () => ({
  getGuidedProjectFeedbackForStudent: vi.fn(),
  saveGuidedProjectFeedbackForStudent: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getFeedback = vi.mocked(getGuidedProjectFeedbackForStudent);
const saveFeedback = vi.mocked(saveGuidedProjectFeedbackForStudent);
const context = {
  params: Promise.resolve({ projectSlug: "semantic-html-article" }),
};

describe("project feedback route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({
      user: { id: "learner-1" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
  });

  it("returns only the signed-in learner's saved response", async () => {
    getFeedback.mockResolvedValue({
      feedback: {
        confidence: "somewhat",
        comment: "The aside check was unclear.",
        updatedAt: "2026-07-28T16:00:00.000Z",
      },
    });

    const response = await GET(
      new Request("http://localhost/private"),
      context,
    );

    expect(response.status).toBe(200);
    expect(getFeedback).toHaveBeenCalledWith(
      "learner-1",
      "semantic-html-article",
    );
    expect(await response.json()).toEqual({
      feedback: {
        confidence: "somewhat",
        comment: "The aside check was unclear.",
        updatedAt: "2026-07-28T16:00:00.000Z",
      },
    });
  });

  it("saves a bounded response only after project completion", async () => {
    saveFeedback.mockResolvedValue({
      confidence: "confident",
      comment: "The review helped.",
      updatedAt: "2026-07-28T16:05:00.000Z",
    });

    const response = await POST(
      new Request("http://localhost/private", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          confidence: "confident",
          comment: "The review helped.",
        }),
      }),
      context,
    );

    expect(response.status).toBe(200);
    expect(saveFeedback).toHaveBeenCalledWith(
      "learner-1",
      "semantic-html-article",
      "confident",
      "The review helped.",
    );
  });

  it("rejects feedback before the signed-in learner completes the project", async () => {
    saveFeedback.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/private", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          confidence: "somewhat",
          comment: "",
        }),
      }),
      context,
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Complete the project before leaving feedback.",
    });
  });
});
