import { describe, expect, it } from "vitest";
import {
  MAX_COURSE_FEEDBACK_COMMENT_LENGTH,
  validateCourseFeedback,
} from "./course-feedback";

describe("course feedback validation", () => {
  it("accepts one bounded choice and trims an optional comment", () => {
    expect(
      validateCourseFeedback({
        usefulness: "very",
        comment: "  The live preview made it click.  ",
      }),
    ).toEqual({
      valid: true,
      usefulness: "very",
      comment: "The live preview made it click.",
    });
  });

  it("rejects unknown choices and comments over 500 characters", () => {
    expect(
      validateCourseFeedback({ usefulness: "perfect", comment: "" }),
    ).toEqual({
      valid: false,
      error: "Choose how useful the lesson was.",
    });
    expect(
      validateCourseFeedback({
        usefulness: "somewhat",
        comment: "x".repeat(MAX_COURSE_FEEDBACK_COMMENT_LENGTH + 1),
      }),
    ).toEqual({
      valid: false,
      error: "Keep your comment to 500 characters or fewer.",
    });
  });
});
