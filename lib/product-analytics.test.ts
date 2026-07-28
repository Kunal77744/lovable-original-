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
  captureLearnerEventOnce,
  captureProjectCompleted,
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
