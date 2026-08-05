export const PRACTICE_FEEDBACK_USEFULNESS = [
  "not_yet",
  "somewhat",
  "very",
] as const;

export type PracticeFeedbackUsefulness =
  (typeof PRACTICE_FEEDBACK_USEFULNESS)[number];

export const MAX_PRACTICE_FEEDBACK_COMMENT_LENGTH = 500;

export type SavedPracticeFeedback = {
  problemSlug: string;
  usefulness: PracticeFeedbackUsefulness;
  comment: string;
  updatedAt: string;
};

export function validatePracticeFeedback(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return {
      valid: false as const,
      error: "Choose how useful that first Accepted result felt.",
    };
  }

  const problemSlug =
    "problemSlug" in payload && typeof payload.problemSlug === "string"
      ? payload.problemSlug
      : "";
  const usefulness =
    "usefulness" in payload && typeof payload.usefulness === "string"
      ? payload.usefulness
      : "";
  const comment =
    "comment" in payload && typeof payload.comment === "string"
      ? payload.comment.trim()
      : "";

  if (!problemSlug) {
    return {
      valid: false as const,
      error: "The completed problem could not be identified.",
    };
  }

  if (
    !PRACTICE_FEEDBACK_USEFULNESS.includes(
      usefulness as PracticeFeedbackUsefulness,
    )
  ) {
    return {
      valid: false as const,
      error: "Choose how useful that first Accepted result felt.",
    };
  }

  if (comment.length > MAX_PRACTICE_FEEDBACK_COMMENT_LENGTH) {
    return {
      valid: false as const,
      error: `Keep your response to ${MAX_PRACTICE_FEEDBACK_COMMENT_LENGTH} characters or fewer.`,
    };
  }

  return {
    valid: true as const,
    problemSlug,
    usefulness: usefulness as PracticeFeedbackUsefulness,
    comment: comment || null,
  };
}
