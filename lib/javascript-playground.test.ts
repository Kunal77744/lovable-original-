import { describe, expect, it } from "vitest";
import {
  MAX_PLAYGROUND_CHECK_LENGTH,
  MAX_PLAYGROUND_CHECKS,
  MAX_PLAYGROUND_CHECK_SOURCE_LENGTH,
  MAX_PLAYGROUND_CODE_LENGTH,
  validatePlaygroundFile,
  validatePlaygroundCode,
  validatePlaygroundChecks,
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

describe("validatePlaygroundFile", () => {
  it("preserves the exact private quick-check source beside valid code", () => {
    const quickChecks = "  double(4) === 8\n\ndouble(0) === 0  ";

    expect(
      validatePlaygroundFile({
        code: "const double = (value) => value * 2;",
        quickChecks,
      }),
    ).toEqual({
      valid: true,
      code: "const double = (value) => value * 2;",
      quickChecks,
    });
  });

  it("rejects more than six saved checks", () => {
    expect(
      validatePlaygroundFile({
        code: "const value = true;",
        quickChecks: Array.from(
          { length: MAX_PLAYGROUND_CHECKS + 1 },
          (_, index) => `value === ${index}`,
        ).join("\n"),
      }),
    ).toEqual({
      valid: false,
      error: `Run up to ${MAX_PLAYGROUND_CHECKS} quick checks at a time.`,
    });
  });

  it("bounds the complete saved check source", () => {
    expect(
      validatePlaygroundFile({
        code: "const value = true;",
        quickChecks: "x".repeat(MAX_PLAYGROUND_CHECK_SOURCE_LENGTH + 1),
      }),
    ).toEqual({
      valid: false,
      error: `Keep saved quick checks under ${MAX_PLAYGROUND_CHECK_SOURCE_LENGTH.toLocaleString()} characters.`,
    });
  });
});

describe("validatePlaygroundChecks", () => {
  it("normalizes one expression per non-empty line", () => {
    expect(
      validatePlaygroundChecks(
        '  add(2, 3) === 5\n\nformatName("ada") === "Ada"  ',
      ),
    ).toEqual({
      valid: true,
      checks: ['add(2, 3) === 5', 'formatName("ada") === "Ada"'],
    });
  });

  it("requires at least one expression", () => {
    expect(validatePlaygroundChecks("  \n\n ")).toEqual({
      valid: false,
      error: "Add at least one true-or-false JavaScript expression.",
    });
  });

  it("bounds the number and length of expressions", () => {
    expect(
      validatePlaygroundChecks(
        Array.from(
          { length: MAX_PLAYGROUND_CHECKS + 1 },
          (_, index) => `${index} === ${index}`,
        ).join("\n"),
      ),
    ).toEqual({
      valid: false,
      error: `Run up to ${MAX_PLAYGROUND_CHECKS} quick checks at a time.`,
    });

    expect(
      validatePlaygroundChecks("x".repeat(MAX_PLAYGROUND_CHECK_LENGTH + 1)),
    ).toEqual({
      valid: false,
      error: `Keep each quick check under ${MAX_PLAYGROUND_CHECK_LENGTH} characters.`,
    });
  });
});
