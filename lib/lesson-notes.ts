export const MAX_LESSON_NOTE_LENGTH = 2_000;

export type SavedLessonNote = {
  content: string;
  updatedAt: string;
};

export function validateLessonNote(payload: unknown) {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("content" in payload) ||
    typeof payload.content !== "string"
  ) {
    return { valid: false as const, error: "Write a note before saving." };
  }

  if (payload.content.trim().length === 0) {
    return { valid: false as const, error: "Write a note before saving." };
  }

  if (payload.content.length > MAX_LESSON_NOTE_LENGTH) {
    return {
      valid: false as const,
      error: `Keep your note within ${MAX_LESSON_NOTE_LENGTH.toLocaleString()} characters.`,
    };
  }

  return { valid: true as const, content: payload.content };
}
