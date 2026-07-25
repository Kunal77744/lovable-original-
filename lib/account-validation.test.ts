import { describe, expect, it } from "vitest";
import {
  PASSWORD_MIN_LENGTH,
  validateEmail,
  validateName,
  validatePassword,
} from "./account-validation";

describe("account validation", () => {
  it("accepts a usable account", () => {
    expect(validateName("Asha Patel")).toBeNull();
    expect(validateEmail("asha@example.com")).toBeNull();
    expect(validatePassword("a".repeat(PASSWORD_MIN_LENGTH))).toBeNull();
  });

  it("rejects missing names and malformed email addresses", () => {
    expect(validateName(" ")).toBe("Enter your name.");
    expect(validateEmail("student-at-example")).toBe(
      "Enter a valid email address.",
    );
  });

  it("enforces the password bounds used by the server", () => {
    expect(validatePassword("short")).toBe("Use at least 10 characters.");
    expect(validatePassword("a".repeat(129))).toBe(
      "Keep your password under 129 characters.",
    );
  });
});
