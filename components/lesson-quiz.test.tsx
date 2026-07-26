import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LessonQuiz } from "./lesson-quiz";

const captureLearnerEventOnce = vi.hoisted(() => vi.fn());

vi.mock("@/lib/product-analytics", () => ({
  captureLearnerEventOnce,
}));

const questions = [
  {
    id: "q1",
    prompt: "First question",
    choices: [
      { id: "a", label: "First answer" },
      { id: "b", label: "Second answer" },
    ],
  },
  {
    id: "q2",
    prompt: "Second question",
    choices: [
      { id: "a", label: "Third answer" },
      { id: "b", label: "Fourth answer" },
    ],
  },
] as const;

describe("LessonQuiz analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          score: 100,
          correctCount: 2,
          totalCount: 2,
          passed: true,
          completed: true,
          savedScore: 100,
        }),
      }),
    );
  });

  it("captures quiz completion after the result is saved without quiz content", async () => {
    render(
      <LessonQuiz
        courseTitle="Web Development Foundations"
        courseLessonCount={1}
        completesCourse
        courseSlug="web-development-foundations"
        lessonSlug="semantic-html"
        questions={questions}
        passPercent={75}
        initialCompleted={false}
        initialScore={null}
        initialFeedback={null}
      />,
    );

    fireEvent.click(screen.getByLabelText("First answer"));
    fireEvent.click(screen.getByLabelText("Third answer"));
    fireEvent.click(screen.getByRole("button", { name: "Check my answers" }));

    await waitFor(() =>
      expect(captureLearnerEventOnce).toHaveBeenCalledWith("quiz_completed", {
        course_slug: "web-development-foundations",
        lesson_slug: "semantic-html",
        passed: true,
      }),
    );

    expect(JSON.stringify(captureLearnerEventOnce.mock.calls)).not.toMatch(
      /First question|First answer|q1/i,
    );
    expect(
      screen.getByRole("heading", {
        name: "You completed Web Development Foundations.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 of 1 lesson complete/)).toBeInTheDocument();
  });
});
