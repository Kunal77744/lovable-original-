import { describe, expect, it } from "vitest";
import { validateInterviewDrillRequest } from "./interview-drill";

describe("validateInterviewDrillRequest", () => {
  it("accepts the bounded start action", () => {
    expect(validateInterviewDrillRequest({ action: "start" })).toEqual({
      valid: true,
      action: "start",
    });
  });

  it("preserves a private answer and valid self-rating", () => {
    expect(
      validateInterviewDrillRequest({
        action: "save-answer",
        questionSlug: "closures",
        answer: "A closure keeps access to its lexical scope.",
        rating: "ready",
      }),
    ).toEqual({
      valid: true,
      action: "save-answer",
      questionSlug: "closures",
      answer: "A closure keeps access to its lexical scope.",
      rating: "ready",
    });
  });

  it("rejects blank or oversized answers", () => {
    expect(
      validateInterviewDrillRequest({
        action: "save-answer",
        questionSlug: "closures",
        answer: "   ",
        rating: "ready",
      }),
    ).toEqual({
      valid: false,
      error: "Write an answer before saving this question.",
    });

    expect(
      validateInterviewDrillRequest({
        action: "save-answer",
        questionSlug: "closures",
        answer: "x".repeat(2001),
        rating: "ready",
      }),
    ).toEqual({
      valid: false,
      error: "Keep your answer to 2,000 characters or fewer.",
    });
  });

  it("rejects invented questions and ratings", () => {
    expect(
      validateInterviewDrillRequest({
        action: "save-answer",
        questionSlug: "private-secret",
        answer: "A private answer.",
        rating: "ready",
      }),
    ).toEqual({
      valid: false,
      error: "Choose a valid interview question.",
    });

    expect(
      validateInterviewDrillRequest({
        action: "save-answer",
        questionSlug: "closures",
        answer: "A closure keeps lexical scope.",
        rating: "ai-approved",
      }),
    ).toEqual({
      valid: false,
      error: "Compare your answer with the rubric and choose one rating.",
    });
  });
});
