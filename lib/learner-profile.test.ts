import { describe, expect, it } from "vitest";
import { buildLearnerProfile } from "./learner-profile";

const baseCourse = {
  slug: "web-development-foundations",
  title: "Web Development Foundations",
  completedLessons: 0,
  totalLessons: 1,
  progressPercent: 0,
  courseCompleted: false,
  nextLesson: {
    slug: "semantic-html",
    title: "Structure a page with semantic HTML",
    moduleTitle: "HTML foundations",
    completed: false,
    quizScore: null,
  },
};

const emptyPractice = {
  completedCount: 0,
  totalCount: 6,
  completedSlugs: [] as string[],
};

describe("buildLearnerProfile", () => {
  it("starts an empty learner with the course", () => {
    const profile = buildLearnerProfile({
      course: baseCourse,
      practice: emptyPractice,
      attempts: [],
    });

    expect(profile.quizScore).toBeNull();
    expect(profile.isFreshLearner).toBe(true);
    expect(profile.nextAction).toEqual(
      expect.objectContaining({
        label: "Start the course",
        href: "/learn/web-development-foundations/semantic-html",
      }),
    );
  });

  it("returns a partial learner to an unfinished quiz", () => {
    const profile = buildLearnerProfile({
      course: {
        ...baseCourse,
        nextLesson: { ...baseCourse.nextLesson, quizScore: 50 },
      },
      practice: {
        completedCount: 1,
        totalCount: 6,
        completedSlugs: ["sum-two-numbers"],
      },
      attempts: [],
    });

    expect(profile.quizScore).toBe(50);
    expect(profile.isFreshLearner).toBe(false);
    expect(profile.nextAction.label).toBe("Continue course");
    expect(profile.nextAction.description).toContain("75% pass mark");
  });

  it("recommends the first unaccepted problem after course completion", () => {
    const profile = buildLearnerProfile({
      course: {
        ...baseCourse,
        completedLessons: 1,
        progressPercent: 100,
        courseCompleted: true,
        nextLesson: {
          ...baseCourse.nextLesson,
          completed: true,
          quizScore: 100,
        },
      },
      practice: {
        completedCount: 1,
        totalCount: 6,
        completedSlugs: ["sum-two-numbers"],
      },
      attempts: [],
    });

    expect(profile.nextAction).toEqual(
      expect.objectContaining({
        label: "Solve problem 02",
        href: "/practice/even-or-odd",
      }),
    );
  });

  it("sends a completed learner to revision", () => {
    const profile = buildLearnerProfile({
      course: {
        ...baseCourse,
        completedLessons: 1,
        progressPercent: 100,
        courseCompleted: true,
        nextLesson: {
          ...baseCourse.nextLesson,
          completed: true,
          quizScore: 100,
        },
      },
      practice: {
        completedCount: 6,
        totalCount: 6,
        completedSlugs: [
          "sum-two-numbers",
          "even-or-odd",
          "multiplication-table",
          "largest-value",
          "reverse-a-word",
          "fizz-buzz",
        ],
      },
      attempts: [],
    });

    expect(profile.nextAction).toEqual(
      expect.objectContaining({
        label: "Review the course",
        href: "/learn/web-development-foundations/semantic-html#revision-pack",
      }),
    );
  });
});
