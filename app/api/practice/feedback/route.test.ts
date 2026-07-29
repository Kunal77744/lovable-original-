import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getPracticeFeedbackForStudent,
  savePracticeFeedbackForStudent,
} from "@/db/coding-practice";
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

vi.mock("@/db/coding-practice", () => ({
  getPracticeFeedbackForStudent: vi.fn(),
  savePracticeFeedbackForStudent: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getFeedback = vi.mocked(getPracticeFeedbackForStudent);
const saveFeedback = vi.mocked(savePracticeFeedbackForStudent);

describe("practice feedback API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({
      user: { id: "learner-one" },
    } as never);
  });

  it("reads only the signed-in learner's first-Accepted response", async () => {
    getFeedback.mockResolvedValue({
      isEligible: true,
      feedback: {
        problemSlug: "sum-two-numbers",
        usefulness: "somewhat",
        comment: "Private learner note.",
        updatedAt: "2026-07-29T03:00:00.000Z",
      },
    });

    const response = await GET(
      new Request(
        "http://localhost/api/practice/feedback?problemSlug=sum-two-numbers",
      ),
    );

    expect(response.status).toBe(200);
    expect(getFeedback).toHaveBeenCalledWith(
      "learner-one",
      "sum-two-numbers",
    );
  });

  it("saves a validated response for the signed-in learner", async () => {
    saveFeedback.mockResolvedValue({
      problemSlug: "sum-two-numbers",
      usefulness: "very",
      comment: "The checks helped.",
      updatedAt: "2026-07-29T03:05:00.000Z",
    });

    const response = await POST(
      new Request("http://localhost/api/practice/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemSlug: "sum-two-numbers",
          usefulness: "very",
          comment: "The checks helped.",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(saveFeedback).toHaveBeenCalledWith(
      "learner-one",
      "sum-two-numbers",
      "very",
      "The checks helped.",
    );
  });

  it("keeps another signed-in account isolated from the response", async () => {
    getSession.mockResolvedValue({
      user: { id: "learner-two" },
    } as never);
    getFeedback.mockResolvedValue({
      isEligible: false,
      feedback: null,
    });

    const response = await GET(
      new Request(
        "http://localhost/api/practice/feedback?problemSlug=sum-two-numbers",
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      isEligible: false,
      feedback: null,
    });
    expect(getFeedback).toHaveBeenCalledWith(
      "learner-two",
      "sum-two-numbers",
    );
  });

  it("rejects feedback before the learner's first Accepted result", async () => {
    saveFeedback.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/practice/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemSlug: "sum-two-numbers",
          usefulness: "not_yet",
          comment: "",
        }),
      }),
    );

    expect(response.status).toBe(403);
  });
});
