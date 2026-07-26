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

    expect(posthogMocks.capture.mock.calls.map(([event]) => event)).toEqual([
      "$pageview",
      "account_created",
      "lesson_started",
      "quiz_completed",
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
      /email|password|answer|question|prompt/i,
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
});
