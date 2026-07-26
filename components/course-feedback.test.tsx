import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CourseFeedback } from "./course-feedback";

const captureLearnerEventOnce = vi.hoisted(() => vi.fn());

vi.mock("@/lib/product-analytics", () => ({
  captureLearnerEventOnce,
}));

describe("CourseFeedback", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves an optional response without sending its content to analytics", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          feedback: {
            usefulness: "very",
            comment: "The preview helped.",
            updatedAt: "2026-07-26T20:00:00.000Z",
          },
        }),
      }),
    );

    render(
      <CourseFeedback
        courseSlug="web-development-foundations"
        lessonSlug="semantic-html"
        initialFeedback={null}
      />,
    );

    fireEvent.click(screen.getByLabelText("Very useful"));
    fireEvent.change(
      screen.getByPlaceholderText(
        "One detail that felt clear, confusing, or missing",
      ),
      { target: { value: "The preview helped." } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Save feedback" }));

    await waitFor(() =>
      expect(screen.getByText(/Your feedback is saved/)).toBeInTheDocument(),
    );
    expect(captureLearnerEventOnce).toHaveBeenCalledWith(
      "feedback_submitted",
      {
        course_slug: "web-development-foundations",
        lesson_slug: "semantic-html",
      },
    );
    expect(JSON.stringify(captureLearnerEventOnce.mock.calls)).not.toContain(
      "The preview helped.",
    );
  });

  it("recovers saved feedback and allows a revision", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          feedback: {
            usefulness: "somewhat",
            comment: "Add one more example.",
            updatedAt: "2026-07-26T20:05:00.000Z",
          },
        }),
      }),
    );

    render(
      <CourseFeedback
        courseSlug="web-development-foundations"
        lessonSlug="semantic-html"
        initialFeedback={{
          usefulness: "very",
          comment: "Clear lesson.",
          updatedAt: "2026-07-26T20:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByLabelText("Very useful")).toBeChecked();
    expect(screen.getByDisplayValue("Clear lesson.")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Somewhat"));
    fireEvent.change(screen.getByDisplayValue("Clear lesson."), {
      target: { value: "Add one more example." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update feedback" }));

    await waitFor(() =>
      expect(screen.getByDisplayValue("Add one more example.")).toBeInTheDocument(),
    );
    expect(fetch).toHaveBeenCalledWith(
      "/api/courses/web-development-foundations/feedback",
      expect.objectContaining({
        body: JSON.stringify({
          usefulness: "somewhat",
          comment: "Add one more example.",
        }),
      }),
    );
  });
});
