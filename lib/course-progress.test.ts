import { describe, expect, it } from "vitest";
import {
  buildCourseProgress,
  type CourseLessonProgressInput,
} from "./course-progress";

const lessonFixture: CourseLessonProgressInput[] = [
  {
    id: "lesson-two",
    slug: "lesson-two",
    title: "Second lesson",
    description: "Apply the foundation.",
    moduleTitle: "Module 2",
    position: 2,
    estimatedMinutes: 20,
    progressStatus: null,
    quizScore: null,
  },
  {
    id: "lesson-one",
    slug: "semantic-html",
    title: "Build a page the browser understands",
    description: "Learn the foundation.",
    moduleTitle: "Module 1",
    position: 1,
    estimatedMinutes: 18,
    progressStatus: null,
    quizScore: null,
  },
];

function withProgress(
  first: Pick<CourseLessonProgressInput, "progressStatus" | "quizScore">,
  second: Pick<CourseLessonProgressInput, "progressStatus" | "quizScore">,
) {
  return [
    { ...lessonFixture[0], ...second },
    { ...lessonFixture[1], ...first },
  ];
}

describe("buildCourseProgress", () => {
  it("preserves the current semantic HTML journey at 1/1", () => {
    const progress = buildCourseProgress([
      {
        ...lessonFixture[1],
        progressStatus: "completed",
        quizScore: 100,
      },
    ]);

    expect(progress).toMatchObject({
      completedLessons: 1,
      totalLessons: 1,
      progressPercent: 100,
      courseCompleted: true,
    });
    expect(progress.nextLesson).toMatchObject({
      slug: "semantic-html",
      completed: true,
      quizScore: 100,
    });
  });

  it("reports 0/2 and chooses the first ordered lesson", () => {
    const progress = buildCourseProgress(lessonFixture);

    expect(progress).toMatchObject({
      completedLessons: 0,
      totalLessons: 2,
      progressPercent: 0,
      courseCompleted: false,
    });
    expect(progress.lessons.map((item) => item.slug)).toEqual([
      "semantic-html",
      "lesson-two",
    ]);
    expect(progress.nextLesson?.slug).toBe("semantic-html");
  });

  it("reports 1/2, chooses the incomplete lesson, and preserves both scores", () => {
    const progress = buildCourseProgress(
      withProgress(
        { progressStatus: "completed", quizScore: 88 },
        { progressStatus: "in-progress", quizScore: 50 },
      ),
    );

    expect(progress).toMatchObject({
      completedLessons: 1,
      totalLessons: 2,
      progressPercent: 50,
      courseCompleted: false,
    });
    expect(progress.nextLesson?.slug).toBe("lesson-two");
    expect(progress.lessons.map((item) => item.quizScore)).toEqual([88, 50]);
  });

  it("reports 2/2 and keeps the final lesson available for review", () => {
    const progress = buildCourseProgress(
      withProgress(
        { progressStatus: "completed", quizScore: 100 },
        { progressStatus: "completed", quizScore: 75 },
      ),
    );

    expect(progress).toMatchObject({
      completedLessons: 2,
      totalLessons: 2,
      progressPercent: 100,
      courseCompleted: true,
    });
    expect(progress.nextLesson?.slug).toBe("lesson-two");
    expect(progress.lessons.map((item) => item.quizScore)).toEqual([100, 75]);
  });
});
