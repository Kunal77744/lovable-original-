export const CSS_PATH_FEEDBACK_PATH_SLUG = "css-selectors-box-model";

export const CSS_PATH_FEEDBACK_USEFULNESS = [
  "not_yet",
  "somewhat",
  "very",
] as const;

export type CssPathFeedbackUsefulness =
  (typeof CSS_PATH_FEEDBACK_USEFULNESS)[number];

export const MAX_CSS_PATH_FEEDBACK_COMMENT_LENGTH = 500;

export type SavedCssPathFeedback = {
  pathSlug: string;
  usefulness: CssPathFeedbackUsefulness;
  comment: string;
  updatedAt: string;
};

export function validateCssPathFeedback(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return {
      valid: false as const,
      error: "Choose how useful the CSS path felt.",
    };
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
    !CSS_PATH_FEEDBACK_USEFULNESS.includes(
      usefulness as CssPathFeedbackUsefulness,
    )
  ) {
    return {
      valid: false as const,
      error: "Choose how useful the CSS path felt.",
    };
  }

  if (comment.length > MAX_CSS_PATH_FEEDBACK_COMMENT_LENGTH) {
    return {
      valid: false as const,
      error: `Keep your response to ${MAX_CSS_PATH_FEEDBACK_COMMENT_LENGTH} characters or fewer.`,
    };
  }

  return {
    valid: true as const,
    usefulness: usefulness as CssPathFeedbackUsefulness,
    comment: comment || null,
  };
}
