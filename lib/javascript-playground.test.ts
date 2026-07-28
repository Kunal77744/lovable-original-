import { describe, expect, it } from "vitest";
import {
  MAX_PLAYGROUND_CODE_LENGTH,
  validatePlaygroundCode,
} from "./javascript-playground";

describe("validatePlaygroundCode", () => {
  it("preserves an exact JavaScript file", () => {
    const code = "  const answer = 42;\nconsole.log(answer);  ";

    expect(validatePlaygroundCode({ code })).toEqual({
      valid: true,
      code,
    });
  });

  it("rejects missing, empty, and oversized files", () => {
    expect(validatePlaygroundCode(null).valid).toBe(false);
    expect(validatePlaygroundCode({ code: "" }).valid).toBe(false);
    expect(
      validatePlaygroundCode({
        code: "x".repeat(MAX_PLAYGROUND_CODE_LENGTH + 1),
      }).valid,
    ).toBe(false);
  });
});
