import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getInterviewDrillForStudent: vi.fn(),
  saveInterviewDrillAnswer: vi.fn(),
  startInterviewDrill: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock("@/db/interview-drill", () => ({
  getInterviewDrillForStudent: mocks.getInterviewDrillForStudent,
  saveInterviewDrillAnswer: mocks.saveInterviewDrillAnswer,
  startInterviewDrill: mocks.startInterviewDrill,
}));

import { GET, POST } from "./route";

const context = {
  params: Promise.resolve({ drillSlug: "javascript-fundamentals" }),
};

function progress(answer: string) {
  return {
    status: "in-progress",
    currentQuestion: 1,
    answers: [
      {
        questionSlug: "const-let-var",
        answer,
        rating: "ready",
      },
    ],
    startedAt: "2026-07-27T00:00:00.000Z",
    completedAt: null,
    updatedAt: "2026-07-27T00:01:00.000Z",
  };
}

describe("interview drill route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects signed-out reads before touching private progress", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await GET(
      new Request(
        "http://localhost/api/interview/javascript-fundamentals",
      ),
      context,
    );

    expect(response.status).toBe(401);
    expect(mocks.getInterviewDrillForStudent).not.toHaveBeenCalled();
  });

  it("rejects signed-out saves before touching private progress", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await POST(
      new Request(
        "http://localhost/api/interview/javascript-fundamentals",
        {
          method: "POST",
          body: JSON.stringify({ action: "start" }),
        },
      ),
      context,
    );

    expect(response.status).toBe(401);
    expect(mocks.startInterviewDrill).not.toHaveBeenCalled();
    expect(mocks.saveInterviewDrillAnswer).not.toHaveBeenCalled();
  });

  it("scopes restored progress to the signed-in account", async () => {
    mocks.getSession
      .mockResolvedValueOnce({ user: { id: "student-a" } })
      .mockResolvedValueOnce({ user: { id: "student-b" } });
    mocks.getInterviewDrillForStudent
      .mockResolvedValueOnce(progress("Student A private answer"))
      .mockResolvedValueOnce(progress("Student B private answer"));

    const firstResponse = await GET(
      new Request(
        "http://localhost/api/interview/javascript-fundamentals",
      ),
      context,
    );
    const secondResponse = await GET(
      new Request(
        "http://localhost/api/interview/javascript-fundamentals",
      ),
      context,
    );

    await expect(firstResponse.json()).resolves.toMatchObject({
      progress: {
        answers: [{ answer: "Student A private answer" }],
      },
    });
    await expect(secondResponse.json()).resolves.toMatchObject({
      progress: {
        answers: [{ answer: "Student B private answer" }],
      },
    });
    expect(mocks.getInterviewDrillForStudent).toHaveBeenNthCalledWith(
      1,
      "student-a",
      "javascript-fundamentals",
    );
    expect(mocks.getInterviewDrillForStudent).toHaveBeenNthCalledWith(
      2,
      "student-b",
      "javascript-fundamentals",
    );
  });

  it("saves an exact private answer for the signed-in account only", async () => {
    const exactAnswer = "  const prevents reassignment, not object mutation.  ";
    const savedProgress = progress(exactAnswer);
    mocks.getSession.mockResolvedValue({ user: { id: "student-a" } });
    mocks.saveInterviewDrillAnswer.mockResolvedValue(savedProgress);

    const response = await POST(
      new Request(
        "http://localhost/api/interview/javascript-fundamentals",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save-answer",
            questionSlug: "const-let-var",
            answer: exactAnswer,
            rating: "ready",
          }),
        },
      ),
      context,
    );

    expect(response.status).toBe(200);
    expect(mocks.saveInterviewDrillAnswer).toHaveBeenCalledWith(
      "student-a",
      "javascript-fundamentals",
      "const-let-var",
      exactAnswer,
      "ready",
    );
    expect(mocks.saveInterviewDrillAnswer).toHaveBeenCalledTimes(1);
    expect(mocks.startInterviewDrill).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      progress: savedProgress,
    });
  });
});
