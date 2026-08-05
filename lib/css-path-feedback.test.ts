import { describe, expect, it } from "vitest";
import {
  MAX_CSS_PATH_FEEDBACK_COMMENT_LENGTH,
  validateCssPathFeedback,
} from "./css-path-feedback";

describe("CSS path feedback validation", () => {
  it("accepts one bounded choice and trims the private comment", () => {
    expect(
      validateCssPathFeedback({
        usefulness: "very",
        comment: "  The final challenge made the box model click.  ",
      }),
    ).toEqual({
      valid: true,
      usefulness: "very",
      comment: "The final challenge made the box model click.",
    });
  });

  it("rejects unsupported choices and oversized comments", () => {
    expect(
      validateCssPathFeedback({ usefulness: "amazing", comment: "" }),
    ).toEqual({ valid: false, error: "Choose how useful the CSS path felt." });

    expect(
      validateCssPathFeedback({
        usefulness: "somewhat",
        comment: "x".repeat(MAX_CSS_PATH_FEEDBACK_COMMENT_LENGTH + 1),
      }),
    ).toEqual({
      valid: false,
      error: `Keep your response to ${MAX_CSS_PATH_FEEDBACK_COMMENT_LENGTH} characters or fewer.`,
    });
  });
});
