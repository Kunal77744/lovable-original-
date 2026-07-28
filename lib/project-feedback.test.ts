import { describe, expect, it } from "vitest";
import {
  MAX_PROJECT_FEEDBACK_COMMENT_LENGTH,
  validateProjectFeedback,
} from "./project-feedback";

describe("project feedback validation", () => {
  it("accepts one bounded confidence response", () => {
    expect(
      validateProjectFeedback({
        confidence: "confident",
        comment: "The six checks made the structure clear.",
      }),
    ).toEqual({
      valid: true,
      confidence: "confident",
      comment: "The six checks made the structure clear.",
    });
  });

  it("requires a known confidence choice", () => {
    expect(
      validateProjectFeedback({ confidence: "perfect", comment: "" }),
    ).toEqual({
      valid: false,
      error: "Choose how confident you feel after this project.",
    });
  });

  it("keeps private text within the response limit", () => {
    expect(
      validateProjectFeedback({
        confidence: "somewhat",
        comment: "x".repeat(MAX_PROJECT_FEEDBACK_COMMENT_LENGTH + 1),
      }),
    ).toEqual({
      valid: false,
      error: `Keep your response to ${MAX_PROJECT_FEEDBACK_COMMENT_LENGTH} characters or fewer.`,
    });
  });
});
