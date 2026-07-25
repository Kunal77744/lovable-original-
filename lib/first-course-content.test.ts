import { describe, expect, it } from "vitest";
import {
  FIRST_LESSON_QUIZ,
  getPublicFirstLessonQuiz,
  gradeFirstLessonQuiz,
} from "./first-course-content";

describe("gradeFirstLessonQuiz", () => {
  it("passes an answer set at the 75 percent threshold", () => {
    const answers = Object.fromEntries(
      FIRST_LESSON_QUIZ.map((question, index) => [
        question.id,
        index === 0 ? "incorrect" : question.correctChoiceId,
      ]),
    );

    expect(gradeFirstLessonQuiz(answers)).toMatchObject({
      valid: true,
      score: 75,
      passed: true,
    });
  });

  it("rejects incomplete answer sets", () => {
    expect(gradeFirstLessonQuiz({})).toEqual({
      valid: false,
      error: "Answer every question before checking your work.",
    });
  });

  it("does not expose the answer key to the client quiz", () => {
    expect(getPublicFirstLessonQuiz()[0]).not.toHaveProperty("correctChoiceId");
    expect(getPublicFirstLessonQuiz()[0]).not.toHaveProperty("explanation");
  });
});
