import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveFirstLessonQuizResult } from "@/db/course";
import { auth } from "@/lib/auth";
import { FIRST_LESSON_QUIZ } from "@/lib/first-course-content";
import { POST } from "./route";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@/db/course", () => ({
  saveFirstLessonQuizResult: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const saveResult = vi.mocked(saveFirstLessonQuizResult);

function quizRequest(firstAnswer = "incorrect") {
  return new Request("http://localhost/api/lessons/semantic-html/complete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      answers: Object.fromEntries(
        FIRST_LESSON_QUIZ.map((question, index) => [
          question.id,
          index === 0 ? firstAnswer : question.correctChoiceId,
        ]),
      ),
    }),
  });
}

describe("POST /api/lessons/[lessonSlug]/complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ user: { id: "learner-a" } } as Awaited<
      ReturnType<typeof auth.api.getSession>
    >);
    saveResult.mockResolvedValue({
      completed: true,
      quizScore: 75,
    } as Awaited<ReturnType<typeof saveFirstLessonQuizResult>>);
  });

  it("returns authored attempt teaching only after authenticated grading", async () => {
    const response = await POST(quizRequest(), {
      params: Promise.resolve({ lessonSlug: "semantic-html" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      score: 75,
      correctCount: 3,
      totalCount: 4,
      passed: true,
      completed: true,
      savedScore: 75,
    });
    expect(payload.review).toHaveLength(4);
    expect(payload.review[0]).toEqual({
      questionId: FIRST_LESSON_QUIZ[0].id,
      correct: false,
      explanation: FIRST_LESSON_QUIZ[0].explanation,
    });
    expect(saveResult).toHaveBeenCalledWith(
      "learner-a",
      "semantic-html",
      {
        score: 75,
        correctCount: 3,
        totalCount: 4,
        passed: true,
      },
    );
    expect(JSON.stringify(saveResult.mock.calls)).not.toContain("incorrect");
    expect(JSON.stringify(payload)).not.toContain("correctChoiceId");
    expect(JSON.stringify(payload)).not.toContain("incorrect");
  });

  it("keeps explanations behind the signed-in grading boundary", async () => {
    getSession.mockResolvedValue(null);

    const response = await POST(quizRequest(), {
      params: Promise.resolve({ lessonSlug: "semantic-html" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Sign in to save progress." });
    expect(JSON.stringify(payload)).not.toContain("explanation");
    expect(saveResult).not.toHaveBeenCalled();
  });
});
