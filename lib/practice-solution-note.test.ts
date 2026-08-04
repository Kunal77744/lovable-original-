import { describe, expect, it } from "vitest";
import {
  MAX_PRACTICE_SOLUTION_NOTE_LENGTH,
  validatePracticeSolutionNote,
} from "./practice-solution-note";

describe("validatePracticeSolutionNote", () => {
  it("preserves the learner's exact reflection", () => {
    expect(
      validatePracticeSolutionNote({ content: "  I split, convert, then add.\n" }),
    ).toEqual({
      valid: true,
      content: "  I split, convert, then add.\n",
    });
  });

  it("rejects missing, blank, and oversized reflections", () => {
    expect(validatePracticeSolutionNote({})).toEqual({
      valid: false,
      error: "Write a note before saving.",
    });
    expect(validatePracticeSolutionNote({ content: " \n " })).toEqual({
      valid: false,
      error: "Write a note before saving.",
    });
    expect(
      validatePracticeSolutionNote({
        content: "a".repeat(MAX_PRACTICE_SOLUTION_NOTE_LENGTH + 1),
      }),
    ).toEqual({
      valid: false,
      error: "Keep your note within 1,000 characters.",
    });
  });
});
