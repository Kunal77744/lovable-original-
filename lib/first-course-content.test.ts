import { describe, expect, it } from "vitest";
import {
  FIRST_COURSE_LESSONS,
  FIRST_LESSON,
  FIRST_LESSON_QUIZ,
  FIRST_LESSON_REVISION,
  SECOND_LESSON,
  SECOND_LESSON_QUIZ,
  THIRD_LESSON,
  THIRD_LESSON_QUIZ,
  getFirstCourseLessonHref,
  getPublicLessonQuiz,
  getPublicFirstLessonQuiz,
  gradeLessonQuiz,
  gradeFirstLessonQuiz,
} from "./first-course-content";

describe("gradeFirstLessonQuiz", () => {
  it("builds the production lesson route from the authored course slug", () => {
    expect(getFirstCourseLessonHref("semantic-html")).toBe(
      "/learn/web-development-foundations/semantic-html",
    );
  });

  it("ships a complete authored semantic HTML revision pack", () => {
    expect(FIRST_LESSON_REVISION.summary).toHaveLength(4);
    expect(FIRST_LESSON_REVISION.flashcards).toHaveLength(5);
    expect(
      FIRST_LESSON_REVISION.flashcards.every(
        (card) => card.prompt.length > 0 && card.answer.length > 0,
      ),
    ).toBe(true);
  });

  it("defines three ordered, practical foundation lessons", () => {
    expect(FIRST_COURSE_LESSONS).toEqual([
      FIRST_LESSON,
      SECOND_LESSON,
      THIRD_LESSON,
    ]);
    expect(FIRST_COURSE_LESSONS).toHaveLength(3);
    expect(FIRST_LESSON).toMatchObject({
      slug: "semantic-html",
      estimatedMinutes: 18,
    });
    expect(FIRST_LESSON_QUIZ).toHaveLength(4);
    expect(SECOND_LESSON).toMatchObject({
      slug: "css-selectors-box-model",
      estimatedMinutes: 16,
    });
    expect(SECOND_LESSON_QUIZ).toHaveLength(4);
    expect(THIRD_LESSON).toMatchObject({
      slug: "responsive-css-grid",
      estimatedMinutes: 17,
    });
    expect(THIRD_LESSON_QUIZ).toHaveLength(4);
  });

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

  it("returns authored teaching for every graded concept without exposing answers", () => {
    const answers = Object.fromEntries(
      FIRST_LESSON_QUIZ.map((question, index) => [
        question.id,
        index === 0 ? "incorrect" : question.correctChoiceId,
      ]),
    );
    const result = gradeFirstLessonQuiz(answers);

    expect(result.valid).toBe(true);
    if (!result.valid) {
      throw new Error("Expected a valid quiz result.");
    }

    expect(result.review).toHaveLength(FIRST_LESSON_QUIZ.length);
    expect(result.review[0]).toEqual({
      questionId: FIRST_LESSON_QUIZ[0].id,
      correct: false,
      explanation: FIRST_LESSON_QUIZ[0].explanation,
    });
    expect(result.review.slice(1).every((item) => item.correct)).toBe(true);
    expect(JSON.stringify(result.review)).not.toContain("correctChoiceId");
    expect(JSON.stringify(result.review)).not.toContain("incorrect");
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
    expect(getPublicLessonQuiz(SECOND_LESSON.slug)?.[0]).not.toHaveProperty(
      "correctChoiceId",
    );
    expect(getPublicLessonQuiz(THIRD_LESSON.slug)?.[0]).not.toHaveProperty(
      "correctChoiceId",
    );
  });

  it("grades responsive layout recall with the shared pass threshold", () => {
    const answers = Object.fromEntries(
      THIRD_LESSON_QUIZ.map((question, index) => [
        question.id,
        index === 0 ? "incorrect" : question.correctChoiceId,
      ]),
    );

    expect(gradeLessonQuiz(THIRD_LESSON.slug, answers)).toMatchObject({
      valid: true,
      score: 75,
      passed: true,
    });
  });

  it("grades the CSS recall path with the shared pass threshold", () => {
    const answers = Object.fromEntries(
      SECOND_LESSON_QUIZ.map((question, index) => [
        question.id,
        index === 0 ? "incorrect" : question.correctChoiceId,
      ]),
    );

    expect(gradeLessonQuiz(SECOND_LESSON.slug, answers)).toMatchObject({
      valid: true,
      score: 75,
      passed: true,
    });
  });
});
