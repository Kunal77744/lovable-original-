import { describe, expect, it } from "vitest";
import {
  FIRST_COURSE,
  FIRST_COURSE_LESSONS,
  FIRST_LESSON,
  FIRST_LESSON_QUIZ,
  FIRST_LESSON_REVISION,
  LEARNING_PATHS,
  getPublicFirstLessonQuiz,
  getPublicLesson,
  gradeFirstLessonQuiz,
} from "./first-course-content";

describe("gradeFirstLessonQuiz", () => {
  it("ships a complete authored semantic HTML revision pack", () => {
    expect(FIRST_LESSON_REVISION.summary).toHaveLength(4);
    expect(FIRST_LESSON_REVISION.flashcards).toHaveLength(5);
    expect(
      FIRST_LESSON_REVISION.flashcards.every(
        (card) => card.prompt.length > 0 && card.answer.length > 0,
      ),
    ).toBe(true);
  });

  it("defines Version 1 as one usable 18-minute course lesson", () => {
    expect(FIRST_COURSE_LESSONS).toEqual([FIRST_LESSON]);
    expect(FIRST_COURSE_LESSONS).toHaveLength(1);
    expect(FIRST_LESSON).toMatchObject({
      slug: "semantic-html",
      estimatedMinutes: 18,
    });
    expect(FIRST_LESSON_QUIZ).toHaveLength(4);
  });

  it("keeps every live course and lesson in the public learning catalog", () => {
    expect(LEARNING_PATHS).toHaveLength(1);
    expect(LEARNING_PATHS[0]).toMatchObject({
      id: FIRST_COURSE.id,
      slug: FIRST_COURSE.slug,
      lessons: FIRST_COURSE_LESSONS,
    });
    expect(
      getPublicLesson(FIRST_COURSE.slug, FIRST_LESSON.slug),
    ).toMatchObject({
      course: { slug: FIRST_COURSE.slug },
      lesson: { slug: FIRST_LESSON.slug },
    });
    expect(getPublicLesson("missing-course", FIRST_LESSON.slug)).toBeNull();
    expect(getPublicLesson(FIRST_COURSE.slug, "missing-lesson")).toBeNull();
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
