import { describe, expect, it } from "vitest";
import { MAX_CODING_SOLUTION_LENGTH } from "@/lib/coding-problems";
import {
  getCodingDraftRecoveryKey,
  parseCodingDraftRecovery,
  serializeCodingDraftRecovery,
} from "@/lib/coding-draft-recovery";

describe("coding draft recovery", () => {
  it("keeps browser copies isolated by account scope and problem", () => {
    expect(getCodingDraftRecoveryKey("learner-a", "sum-two-numbers")).toBe(
      "lovable:judged-draft-recovery:v1:learner-a:sum-two-numbers",
    );
    expect(getCodingDraftRecoveryKey("learner-b", "sum-two-numbers")).not.toBe(
      getCodingDraftRecoveryKey("learner-a", "sum-two-numbers"),
    );
    expect(getCodingDraftRecoveryKey("learner-a", "even-or-odd")).not.toBe(
      getCodingDraftRecoveryKey("learner-a", "sum-two-numbers"),
    );
  });

  it("round-trips the exact editor source and save time", () => {
    const stored = serializeCodingDraftRecovery(
      "function solve(input) {\n  return input;\n}",
      "2026-08-12T18:00:00.000Z",
    );

    expect(parseCodingDraftRecovery(stored)).toEqual({
      code: "function solve(input) {\n  return input;\n}",
      updatedAt: "2026-08-12T18:00:00.000Z",
    });
  });

  it("rejects malformed, oversized, and dateless browser values", () => {
    expect(parseCodingDraftRecovery("not-json")).toBeNull();
    expect(
      parseCodingDraftRecovery(
        JSON.stringify({ code: "ok", updatedAt: "not-a-date" }),
      ),
    ).toBeNull();
    expect(
      parseCodingDraftRecovery(
        serializeCodingDraftRecovery("x".repeat(MAX_CODING_SOLUTION_LENGTH + 1)),
      ),
    ).toBeNull();
  });
});
