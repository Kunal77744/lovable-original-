import { describe, expect, it } from "vitest";
import {
  MAX_GUIDED_JAVASCRIPT_ATTEMPT_NOTE_LENGTH,
  validateGuidedJavaScriptAttemptNote,
} from "./guided-javascript-attempt-notes";

describe("validateGuidedJavaScriptAttemptNote", () => {
  it("preserves an exact bounded note", () => {
    expect(
      validateGuidedJavaScriptAttemptNote({
        content: "  The return value is undefined.\nNext: inspect the branch.\n",
      }),
    ).toEqual({
      valid: true,
      content: "  The return value is undefined.\nNext: inspect the branch.\n",
    });
  });

  it("rejects missing and blank notes", () => {
    expect(validateGuidedJavaScriptAttemptNote({})).toEqual({
      valid: false,
      error: "Write a note before saving.",
    });
    expect(validateGuidedJavaScriptAttemptNote({ content: " \n " })).toEqual({
      valid: false,
      error: "Write a note before saving.",
    });
  });

  it("rejects notes beyond the private storage bound", () => {
    expect(
      validateGuidedJavaScriptAttemptNote({
        content: "x".repeat(MAX_GUIDED_JAVASCRIPT_ATTEMPT_NOTE_LENGTH + 1),
      }),
    ).toEqual({
      valid: false,
      error: "Keep your note within 1,000 characters.",
    });
  });
});
