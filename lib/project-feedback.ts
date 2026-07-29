export const PROJECT_FEEDBACK_CONFIDENCE = [
  "not_yet",
  "somewhat",
  "confident",
] as const;

export type ProjectFeedbackConfidence =
  (typeof PROJECT_FEEDBACK_CONFIDENCE)[number];

export const MAX_PROJECT_FEEDBACK_COMMENT_LENGTH = 500;

export type SavedProjectFeedback = {
  confidence: ProjectFeedbackConfidence;
  comment: string;
  updatedAt: string;
};

export function validateProjectFeedback(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return {
      valid: false as const,
      error: "Choose how confident you feel after this project.",
    };
  }

  const confidence =
    "confidence" in payload && typeof payload.confidence === "string"
      ? payload.confidence
      : "";
  const comment =
    "comment" in payload && typeof payload.comment === "string"
      ? payload.comment.trim()
      : "";

  if (
    !PROJECT_FEEDBACK_CONFIDENCE.includes(
      confidence as ProjectFeedbackConfidence,
    )
  ) {
    return {
      valid: false as const,
      error: "Choose how confident you feel after this project.",
    };
  }

  if (comment.length > MAX_PROJECT_FEEDBACK_COMMENT_LENGTH) {
    return {
      valid: false as const,
      error: `Keep your response to ${MAX_PROJECT_FEEDBACK_COMMENT_LENGTH} characters or fewer.`,
    };
  }

  return {
    valid: true as const,
    confidence: confidence as ProjectFeedbackConfidence,
    comment: comment || null,
  };
}
