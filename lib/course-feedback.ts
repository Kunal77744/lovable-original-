export const COURSE_FEEDBACK_USEFULNESS = [
  "not_yet",
  "somewhat",
  "very",
] as const;

export type CourseFeedbackUsefulness =
  (typeof COURSE_FEEDBACK_USEFULNESS)[number];

export const MAX_COURSE_FEEDBACK_COMMENT_LENGTH = 500;

export function validateCourseFeedback(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return { valid: false as const, error: "Choose how useful the lesson was." };
  }

  const usefulness =
    "usefulness" in payload && typeof payload.usefulness === "string"
      ? payload.usefulness
      : "";
  const comment =
    "comment" in payload && typeof payload.comment === "string"
      ? payload.comment.trim()
      : "";

  if (
    !COURSE_FEEDBACK_USEFULNESS.includes(
      usefulness as CourseFeedbackUsefulness,
    )
  ) {
    return { valid: false as const, error: "Choose how useful the lesson was." };
  }

  if (comment.length > MAX_COURSE_FEEDBACK_COMMENT_LENGTH) {
    return {
      valid: false as const,
      error: `Keep your comment to ${MAX_COURSE_FEEDBACK_COMMENT_LENGTH} characters or fewer.`,
    };
  }

  return {
    valid: true as const,
    usefulness: usefulness as CourseFeedbackUsefulness,
    comment: comment || null,
  };
}
