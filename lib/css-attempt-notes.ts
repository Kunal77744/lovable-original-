export const MAX_CSS_ATTEMPT_NOTE_LENGTH = 1_000;

export type SavedCssAttemptNote = {
  content: string;
  updatedAt: string;
};

export function validateCssAttemptNote(payload: unknown) {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("content" in payload) ||
    typeof payload.content !== "string" ||
    payload.content.trim().length === 0
  ) {
    return { valid: false as const, error: "Write a note before saving." };
  }

  if (payload.content.length > MAX_CSS_ATTEMPT_NOTE_LENGTH) {
    return {
      valid: false as const,
      error: `Keep your note within ${MAX_CSS_ATTEMPT_NOTE_LENGTH.toLocaleString()} characters.`,
    };
  }

  return { valid: true as const, content: payload.content };
}
