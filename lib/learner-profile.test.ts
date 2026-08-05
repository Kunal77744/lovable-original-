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

const emptyCssPractice = {
  completedCount: 0,
  totalCount: 6,
  completedSlugs: [] as string[],
};

describe("buildLearnerProfile", () => {
  it("starts an empty learner with the course", () => {
    const profile = buildLearnerProfile({
      course: baseCourse,
      practice: emptyPractice,
      cssPractice: emptyCssPractice,
      attempts: [],
      projectCompleted: false,
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
      cssPractice: emptyCssPractice,
      attempts: [],
      projectCompleted: false,
    });

    expect(profile.quizScore).toBe(50);
    expect(profile.isFreshLearner).toBe(false);
    expect(profile.nextAction.label).toBe("Continue course");
    expect(profile.nextAction.description).toContain("75% pass mark");
  });

  it("does not call a learner fresh when only CSS progress exists", () => {
    const profile = buildLearnerProfile({
      course: baseCourse,
      practice: emptyPractice,
      cssPractice: {
        completedCount: 1,
        totalCount: 6,
        completedSlugs: ["class-selector"],
      },
      attempts: [],
      projectCompleted: false,
    });

    expect(profile.isFreshLearner).toBe(false);
    expect(profile.cssPractice.completedCount).toBe(1);
  });

  it("routes a completed course into the unfinished guided project", () => {
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
      cssPractice: emptyCssPractice,
      attempts: [],
      projectCompleted: false,
    });

    expect(profile.nextAction).toEqual(
      expect.objectContaining({
        label: "Build the field guide",
        href: "/projects/semantic-html-article",
        title: "Semantic HTML field guide",
      }),
    );
  });

  it("recommends the first unaccepted problem after project completion", () => {
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
      cssPractice: emptyCssPractice,
      attempts: [],
      projectCompleted: true,
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
      cssPractice: {
        completedCount: 6,
        totalCount: 6,
        completedSlugs: [
          "class-selector",
          "descendant-selector",
          "predictable-width",
          "inside-and-between",
          "link-hit-area",
          "centered-card",
        ],
      },
      attempts: [],
      projectCompleted: true,
    });

    expect(profile.nextAction).toEqual(
      expect.objectContaining({
        label: "Review the course",
        href: "/learn/web-development-foundations/semantic-html#revision-pack",
      }),
    );
  });

  it("continues a JavaScript completer into the next CSS challenge", () => {
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
      cssPractice: {
        completedCount: 2,
        totalCount: 6,
        completedSlugs: ["class-selector", "descendant-selector"],
      },
      attempts: [],
      projectCompleted: true,
    });

    expect(profile.nextAction).toEqual(
      expect.objectContaining({
        label: "Complete CSS 03",
        href: "/practice/css/predictable-width",
        title: "Keep the width predictable",
      }),
    );
  });
});
