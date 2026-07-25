import { describe, expect, it } from "vitest";
import {
  normalizeEmail,
  validateEarlyAccessEmail,
} from "./early-access-validation";

describe("early-access email validation", () => {
  it("normalizes a usable email address", () => {
    expect(normalizeEmail("  Student@Example.com ")).toBe(
      "student@example.com",
    );
    expect(validateEarlyAccessEmail("student@example.com")).toBeNull();
  });

  it("rejects malformed email addresses", () => {
    expect(validateEarlyAccessEmail("student-at-example")).toBe(
      "Enter a valid email address.",
    );
  });

  it("rejects addresses over the storage-safe limit", () => {
    const longEmail = `${"a".repeat(244)}@example.com`;

    expect(validateEarlyAccessEmail(longEmail)).toBe(
      "Keep your email address under 255 characters.",
    );
  });
});
