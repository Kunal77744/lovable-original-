import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LessonStartTracker } from "./lesson-start-tracker";

const captureLearnerEventOnce = vi.hoisted(() => vi.fn());

vi.mock("@/lib/product-analytics", () => ({
  captureLearnerEventOnce,
}));

describe("LessonStartTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("captures the lesson start when an unfinished lesson opens", async () => {
    render(
      <LessonStartTracker
        courseSlug="web-development-foundations"
        lessonSlug="semantic-html"
        alreadyCompleted={false}
      />,
    );

    await waitFor(() =>
      expect(captureLearnerEventOnce).toHaveBeenCalledWith("lesson_started", {
        course_slug: "web-development-foundations",
        lesson_slug: "semantic-html",
      }),
    );
  });

  it("does not recapture a completed lesson review as a start", () => {
    render(
      <LessonStartTracker
        courseSlug="web-development-foundations"
        lessonSlug="semantic-html"
        alreadyCompleted
      />,
    );

    expect(captureLearnerEventOnce).not.toHaveBeenCalled();
  });

  it("labels the founder-warm entry without a learner identity", async () => {
    render(
      <LessonStartTracker
        courseSlug="web-development-foundations"
        lessonSlug="semantic-html"
        alreadyCompleted={false}
        entrySource="founder_warm"
      />,
    );

    await waitFor(() =>
      expect(captureLearnerEventOnce).toHaveBeenCalledWith("lesson_started", {
        course_slug: "web-development-foundations",
        lesson_slug: "semantic-html",
        entry_source: "founder_warm",
      }),
    );
  });
});
