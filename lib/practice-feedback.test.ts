import { describe, expect, it } from "vitest";
import {
  MAX_PRACTICE_FEEDBACK_COMMENT_LENGTH,
  validatePracticeFeedback,
} from "./practice-feedback";

describe("practice feedback validation", () => {
  it("accepts and trims one bounded response", () => {
    expect(
      validatePracticeFeedback({
        problemSlug: "sum-two-numbers",
        usefulness: "very",
        comment: "  The examples helped.  ",
      }),
    ).toEqual({
      valid: true,
      problemSlug: "sum-two-numbers",
      usefulness: "very",
      comment: "The examples helped.",
    });
  });

  it("rejects unsupported choices and oversized comments", () => {
    expect(
      validatePracticeFeedback({
        problemSlug: "sum-two-numbers",
        usefulness: "amazing",
        comment: "",
      }),
    ).toEqual({
      valid: false,
      error: "Choose how useful that first Accepted result felt.",
    });

    expect(
      validatePracticeFeedback({
        problemSlug: "sum-two-numbers",
        usefulness: "somewhat",
        comment: "x".repeat(MAX_PRACTICE_FEEDBACK_COMMENT_LENGTH + 1),
      }),
    ).toEqual({
      valid: false,
      error: `Keep your response to ${MAX_PRACTICE_FEEDBACK_COMMENT_LENGTH} characters or fewer.`,
    });
  });
});
