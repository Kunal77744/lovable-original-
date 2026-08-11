import { describe, expect, it } from "vitest";
import { JAVASCRIPT_LABS } from "@/lib/javascript-lab-progress";
import {
  buildLearningHistory,
  type LearningHistoryInput,
} from "./learning-history";

const emptyInput: LearningHistoryInput = {
  lessons: [],
  codingSubmissions: [],
  cssAttempts: [],
  guidedJavaScript: [],
  projectReviews: [],
  reviews: [],
};

describe("buildLearningHistory", () => {
  it("combines account results in newest-first order with exact reopen routes", () => {
    const history = buildLearningHistory({
      ...emptyInput,
      lessons: [
        {
          lessonId: "web-development-foundations-semantic-html",
          quizScore: 100,
          completedAt: "2026-08-09T09:00:00.000Z",
        },
      ],
      codingSubmissions: [
        {
          id: "submission-1",
          problemSlug: "sum-two-numbers",
          verdict: "Accepted",
          passedTests: 4,
          totalTests: 4,
          createdAt: "2026-08-11T12:00:00.000Z",
        },
      ],
      cssAttempts: [
        {
          id: "css-1",
          challengeSlug: "class-selector",
          verdict: "Needs revision",
          passedChecks: 2,
          totalChecks: 3,
          createdAt: "2026-08-10T12:00:00.000Z",
        },
      ],
      guidedJavaScript: [
        {
          id: "lab-1",
          labSlug: JAVASCRIPT_LABS[0].slug,
          exerciseId: JAVASCRIPT_LABS[0].exerciseIds[0],
          completedAt: "2026-08-11T11:00:00.000Z",
        },
      ],
      projectReviews: [
        {
          id: "project-1",
          projectSlug: "semantic-html-article",
          status: "completed",
          passedChecks: 6,
          totalChecks: 6,
          submittedAt: "2026-08-10T15:00:00.000Z",
        },
      ],
      reviews: [
        {
          id: "review-1",
          title: "Mixed JavaScript review",
          result: "3/4 prompts correct",
          href: "/practice/mixed-review",
          completedAt: "2026-08-09T15:00:00.000Z",
        },
      ],
    });

    expect(history.map((item) => item.kind)).toEqual([
      "judged-javascript",
      "guided-javascript",
      "project",
      "css",
      "review",
      "course",
    ]);
    expect(history[0]).toMatchObject({
      title: "Sum two numbers",
      result: "Accepted · 4/4 checks",
      href: "/practice/sum-two-numbers",
    });
    expect(history[2]).toMatchObject({
      title: "Semantic HTML field guide",
      result: "Completed · 6/6 checks",
      href: "/projects/semantic-html-article",
    });
  });

  it("drops unknown authored records and respects the bounded result limit", () => {
    const history = buildLearningHistory(
      {
        ...emptyInput,
        codingSubmissions: [
          {
            id: "known",
            problemSlug: "sum-two-numbers",
            verdict: "Accepted",
            passedTests: 4,
            totalTests: 4,
            createdAt: "2026-08-11T12:00:00.000Z",
          },
          {
            id: "unknown",
            problemSlug: "not-authored",
            verdict: "Accepted",
            passedTests: 1,
            totalTests: 1,
            createdAt: "2026-08-12T12:00:00.000Z",
          },
        ],
        reviews: [
          {
            id: "review",
            title: "Review",
            result: "1/1 correct",
            href: "/review",
            completedAt: "2026-08-10T12:00:00.000Z",
          },
        ],
      },
      1,
    );

    expect(history).toHaveLength(1);
    expect(history[0]?.id).toBe("submission-known");
  });
});
