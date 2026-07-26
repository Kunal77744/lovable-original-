import { describe, expect, it } from "vitest";
import {
  MAX_LESSON_NOTE_LENGTH,
  validateLessonNote,
} from "./lesson-notes";

describe("validateLessonNote", () => {
  it("preserves the learner's exact note", () => {
    expect(validateLessonNote({ content: "  My mental model\n" })).toEqual({
      valid: true,
      content: "  My mental model\n",
    });
  });

  it("rejects missing, blank, and oversized notes", () => {
    expect(validateLessonNote({})).toEqual({
      valid: false,
      error: "Write a note before saving.",
    });
    expect(validateLessonNote({ content: " \n " })).toEqual({
      valid: false,
      error: "Write a note before saving.",
    });
    expect(
      validateLessonNote({
        content: "a".repeat(MAX_LESSON_NOTE_LENGTH + 1),
      }),
    ).toEqual({
      valid: false,
      error: "Keep your note within 2,000 characters.",
    });
  });
});
