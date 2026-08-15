import { describe, expect, it } from "vitest";
import {
  MAX_CSS_ATTEMPT_NOTE_LENGTH,
  validateCssAttemptNote,
} from "./css-attempt-notes";

describe("validateCssAttemptNote", () => {
  it("preserves the learner's exact reflection", () => {
    expect(
      validateCssAttemptNote({
        content: "  The selector misses the nested link.\nNext: target the link.\n",
      }),
    ).toEqual({
      valid: true,
      content: "  The selector misses the nested link.\nNext: target the link.\n",
    });
  });

  it("rejects missing, blank, and oversized reflections", () => {
    expect(validateCssAttemptNote({})).toEqual({
      valid: false,
      error: "Write a note before saving.",
    });
    expect(validateCssAttemptNote({ content: " \n " })).toEqual({
      valid: false,
      error: "Write a note before saving.",
    });
    expect(
      validateCssAttemptNote({
        content: "a".repeat(MAX_CSS_ATTEMPT_NOTE_LENGTH + 1),
      }),
    ).toEqual({
      valid: false,
      error: "Keep your note within 1,000 characters.",
    });
  });
});
