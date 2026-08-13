import { describe, expect, it } from "vitest";
import {
  getJavaScriptLabDraftRecoveryKey,
  parseJavaScriptLabDraftRecovery,
  serializeJavaScriptLabDraftRecovery,
} from "./javascript-lab-draft-recovery";

describe("guided JavaScript browser draft recovery", () => {
  it("keeps keys isolated by account scope, lab, and exercise", () => {
    const key = getJavaScriptLabDraftRecoveryKey(
      "learner-a",
      "recursion",
      "base-case",
    );

    expect(key).not.toBe(
      getJavaScriptLabDraftRecoveryKey(
        "learner-b",
        "recursion",
        "base-case",
      ),
    );
    expect(key).not.toBe(
      getJavaScriptLabDraftRecoveryKey(
        "learner-a",
        "debugging",
        "base-case",
      ),
    );
    expect(key).not.toBe(
      getJavaScriptLabDraftRecoveryKey(
        "learner-a",
        "recursion",
        "smaller-input",
      ),
    );
  });

  it("round-trips valid source with its timestamp", () => {
    const updatedAt = "2026-08-13T12:00:00.000Z";

    expect(
      parseJavaScriptLabDraftRecovery(
        serializeJavaScriptLabDraftRecovery("function solve() {}", updatedAt),
        20_000,
      ),
    ).toEqual({ source: "function solve() {}", updatedAt });
  });

  it("rejects malformed, oversized, and untimestamped browser data", () => {
    expect(parseJavaScriptLabDraftRecovery("not json", 20_000)).toBeNull();
    expect(
      parseJavaScriptLabDraftRecovery(
        JSON.stringify({ source: "too long", updatedAt: new Date().toISOString() }),
        3,
      ),
    ).toBeNull();
    expect(
      parseJavaScriptLabDraftRecovery(JSON.stringify({ source: "valid" }), 20_000),
    ).toBeNull();
  });
});
