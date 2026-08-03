import type { CaptureResult } from "posthog-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const posthogMocks = vi.hoisted(() => ({
  capture: vi.fn(),
  init: vi.fn(),
}));

vi.mock("posthog-js", () => ({
  default: posthogMocks,
}));

import {
  captureAccountCreated,
  captureCssPracticeCompleted,
  captureJavaScriptPracticeCompleted,
  captureLearnerEventOnce,
  captureLessonCompleted,
  captureProjectCompleted,
  capturePracticeFeedbackSubmitted,
  capturePracticeProblemAccepted,
  capturePracticeProblemStarted,
  capturePublicPageview,
  sanitizeAnalyticsEvent,
} from "./product-analytics";

describe("product analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    process.env.NEXT_PUBLIC_ANALYTICS_TEST = "true";
  });

  it("captures one ordered, anonymous learner journey", () => {
    window.sessionStorage.setItem(
      "lovable_original_e2e_run",
      "2026-07-26-learner-journey",
    );

    capturePublicPageview("homepage", "/");
    captureAccountCreated();
    captureLearnerEventOnce("lesson_started", {
      course_slug: "web-development-foundations",
      lesson_slug: "semantic-html",
    });
    captureLearnerEventOnce("lesson_started", {
      course_slug: "web-development-foundations",
      lesson_slug: "semantic-html",
    });
    captureLearnerEventOnce("quiz_completed", {
      course_slug: "web-development-foundations",
      lesson_slug: "semantic-html",
      passed: true,
    });
    captureLearnerEventOnce("feedback_submitted", {
      course_slug: "web-development-foundations",
      lesson_slug: "semantic-html",
    });

    expect(posthogMocks.capture.mock.calls.map(([event]) => event)).toEqual([
      "$pageview",
      "account_created",
      "lesson_started",
      "quiz_completed",
      "feedback_submitted",
    ]);

    const properties = posthogMocks.capture.mock.calls.map(
      ([, eventProperties]) => eventProperties,
    );
    const journeyIds = new Set(
      properties.map((eventProperties) => eventProperties.journey_id),
    );

    expect(journeyIds.size).toBe(1);
    expect(properties).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          deployment_environment: "test",
          e2e_run: "2026-07-26-learner-journey",
          is_test: true,
        }),
      ]),
    );
    expect(JSON.stringify(properties)).not.toMatch(
      /email|password|answer|question|prompt|comment|usefulness/i,
    );
  });

  it("removes query-derived properties and query strings before sending", () => {
    const event = {
      event: "$pageview",
      properties: {
        $current_url: "https://example.com/about?email=private@example.com",
        $referrer: "https://search.example/?q=private",
        $utm_source: "newsletter",
        pathname: "/about",
      },
    } as unknown as CaptureResult;

    expect(sanitizeAnalyticsEvent(event)?.properties).toEqual({
      $current_url: "https://example.com/about",
      $referrer: "https://search.example/",
      pathname: "/about",
    });
  });

  it("captures the founder-warm lesson source without private learner fields", () => {
    const warmLessonStart = {
      course_slug: "web-development-foundations",
      lesson_slug: "semantic-html",
      entry_source: "founder_warm" as const,
      email: "learner@example.com",
      note: "private learner note",
      answer: "private learner answer",
    };

    captureLearnerEventOnce("lesson_started", warmLessonStart);

    expect(posthogMocks.capture).toHaveBeenCalledTimes(1);
    expect(posthogMocks.capture).toHaveBeenCalledWith(
      "lesson_started",
      expect.objectContaining({
        course_slug: "web-development-foundations",
        lesson_slug: "semantic-html",
        entry_source: "founder_warm",
      }),
    );

    const [, properties] = posthogMocks.capture.mock.calls[0];

    expect(Object.keys(properties).sort()).toEqual(
      [
        "course_slug",
        "deployment_environment",
        "entry_source",
        "is_test",
        "journey_id",
        "lesson_slug",
      ].sort(),
    );
    expect(JSON.stringify(properties)).not.toMatch(
      /learner@example\.com|private learner note|private learner answer/i,
    );
  });

  it("captures one privacy-safe completed project result", () => {
    const completedProject = {
      projectSlug: "semantic-html-article",
      passedCheckCount: 6,
      html: "<main>private learner HTML</main>",
      email: "learner@example.com",
      review: "private review message",
      note: "private learner note",
      certificate: "private certificate",
      feedback: "private learner feedback",
    };

    captureProjectCompleted(completedProject);
    captureProjectCompleted(completedProject);

    expect(posthogMocks.capture).toHaveBeenCalledTimes(1);
    expect(posthogMocks.capture).toHaveBeenCalledWith(
      "project_completed",
      expect.objectContaining({
        project_slug: "semantic-html-article",
        passed_check_count: 6,
      }),
    );

    const [, properties] = posthogMocks.capture.mock.calls[0];

    expect(Object.keys(properties).sort()).toEqual(
      [
        "deployment_environment",
        "is_test",
        "journey_id",
        "passed_check_count",
        "project_slug",
      ].sort(),
    );
    expect(JSON.stringify(properties)).not.toMatch(
      /private learner HTML|learner@example\.com|private review message|private learner note|private certificate|private learner feedback/i,
    );
  });

  it("captures one privacy-safe lesson completion", () => {
    const completedLesson = {
      courseSlug: "web-development-foundations",
      completionState: "completed" as const,
      note: "private learner note",
      code: "private learner code",
      answers: "private quiz answers",
      feedback: "private feedback text",
      email: "learner@example.com",
      displayName: "Private Learner",
    };

    expect(captureLessonCompleted(completedLesson)).toBe(true);
    expect(captureLessonCompleted(completedLesson)).toBe(false);

    expect(posthogMocks.capture).toHaveBeenCalledTimes(1);
    expect(posthogMocks.capture).toHaveBeenCalledWith(
      "lesson_completed",
      expect.objectContaining({
        course_slug: "web-development-foundations",
        completion_state: "completed",
      }),
    );

    const [, properties] = posthogMocks.capture.mock.calls[0];

    expect(Object.keys(properties).sort()).toEqual(
      [
        "completion_state",
        "course_slug",
        "deployment_environment",
        "is_test",
        "journey_id",
      ].sort(),
    );
    expect(JSON.stringify(properties)).not.toMatch(
      /private learner note|private learner code|private quiz answers|private feedback text|learner@example\.com|Private Learner/i,
    );
  });

  it("captures one privacy-safe Accepted result for each problem", () => {
    const acceptedResult = {
      problemSlug: "sum-two-numbers",
      passedCheckCount: 4,
      code: "private learner code",
      input: "private input",
      output: "private output",
      email: "learner@example.com",
      note: "private account note",
    };

    capturePracticeProblemAccepted(acceptedResult);
    capturePracticeProblemAccepted(acceptedResult);

    expect(posthogMocks.capture).toHaveBeenCalledTimes(1);
    expect(posthogMocks.capture).toHaveBeenCalledWith(
      "practice_problem_accepted",
      expect.objectContaining({
        problem_slug: "sum-two-numbers",
        passed_check_count: 4,
      }),
    );

    const [, properties] = posthogMocks.capture.mock.calls[0];

    expect(Object.keys(properties).sort()).toEqual(
      [
        "deployment_environment",
        "is_test",
        "journey_id",
        "passed_check_count",
        "problem_slug",
      ].sort(),
    );
    expect(JSON.stringify(properties)).not.toMatch(
      /private learner code|private input|private output|learner@example\.com|private account note/i,
    );
  });

  it("captures each completed six-step practice path once without private work", () => {
    const javascriptCompletion = {
      pathSlug: "beginner-javascript",
      completionState: "completed" as const,
      code: "private learner code",
      answers: "private learner answers",
      attempts: "private attempt history",
      feedback: "private feedback text",
      email: "learner@example.com",
      accountId: "private-account-id",
    };
    const cssCompletion = {
      pathSlug: "css-selectors-box-model",
      completionState: "completed" as const,
      css: "private learner CSS",
      answers: "private learner answers",
      attempts: "private attempt history",
      feedback: "private feedback text",
      email: "learner@example.com",
      accountId: "private-account-id",
    };

    expect(captureJavaScriptPracticeCompleted(javascriptCompletion)).toBe(true);
    expect(captureJavaScriptPracticeCompleted(javascriptCompletion)).toBe(false);
    expect(captureCssPracticeCompleted(cssCompletion)).toBe(true);
    expect(captureCssPracticeCompleted(cssCompletion)).toBe(false);

    expect(posthogMocks.capture.mock.calls.map(([event]) => event)).toEqual([
      "javascript_practice_completed",
      "css_practice_completed",
    ]);

    for (const [, properties] of posthogMocks.capture.mock.calls) {
      expect(Object.keys(properties).sort()).toEqual(
        [
          "completion_state",
          "deployment_environment",
          "is_test",
          "journey_id",
          "path_slug",
        ].sort(),
      );
    }
    expect(JSON.stringify(posthogMocks.capture.mock.calls)).not.toMatch(
      /private learner code|private learner CSS|private learner answers|private attempt history|private feedback text|learner@example\.com|private-account-id/i,
    );
  });

  it("captures only the bounded practice usefulness choice", () => {
    const privateResponse = {
      usefulness: "very",
      comment: "private feedback comment",
      code: "private learner code",
      email: "learner@example.com",
    } as const;

    capturePracticeFeedbackSubmitted(privateResponse.usefulness);

    expect(posthogMocks.capture).toHaveBeenCalledWith(
      "practice_feedback_submitted",
      expect.objectContaining({ usefulness: "very" }),
    );

    const [, properties] = posthogMocks.capture.mock.calls[0];

    expect(Object.keys(properties).sort()).toEqual(
      [
        "deployment_environment",
        "is_test",
        "journey_id",
        "usefulness",
      ].sort(),
    );
    expect(JSON.stringify(properties)).not.toMatch(
      /private feedback comment|private learner code|learner@example\.com/i,
    );
  });

  it("captures one privacy-safe first start for problem 01", () => {
    const firstStart = {
      problemSlug: "sum-two-numbers",
      code: "private learner code",
      output: "private output",
      email: "learner@example.com",
      accountId: "private-account-id",
    };

    expect(capturePracticeProblemStarted(firstStart)).toBe(true);
    expect(capturePracticeProblemStarted(firstStart)).toBe(false);

    expect(posthogMocks.capture).toHaveBeenCalledTimes(1);
    expect(posthogMocks.capture).toHaveBeenCalledWith(
      "practice_problem_started",
      expect.objectContaining({
        problem_slug: "sum-two-numbers",
      }),
    );

    const [, properties] = posthogMocks.capture.mock.calls[0];

    expect(Object.keys(properties).sort()).toEqual(
      [
        "deployment_environment",
        "is_test",
        "journey_id",
        "problem_slug",
      ].sort(),
    );
    expect(JSON.stringify(properties)).not.toMatch(
      /private learner code|private output|learner@example\.com|private-account-id/i,
    );
  });
});
