import { describe, expect, it } from "vitest";
import {
  getPlaygroundDraftRecoveryKey,
  parsePlaygroundDraftRecovery,
  serializePlaygroundDraftRecovery,
} from "./playground-draft-recovery";
import {
  MAX_PLAYGROUND_CHECK_SOURCE_LENGTH,
  MAX_PLAYGROUND_CODE_LENGTH,
} from "./javascript-playground";

describe("playground draft recovery", () => {
  it("scopes a recovery copy to one learner and one private file", () => {
    expect(getPlaygroundDraftRecoveryKey("learner-1", "file-2")).toBe(
      "lovable:playground-draft-recovery:v1:learner-1:file-2",
    );
  });

  it("round-trips code and quick checks as one exact draft", () => {
    const stored = serializePlaygroundDraftRecovery(
      "const answer = 42;",
      "answer === 42",
      "2026-08-13T16:00:00.000Z",
    );

    expect(parsePlaygroundDraftRecovery(stored)).toEqual({
      code: "const answer = 42;",
      quickChecks: "answer === 42",
      updatedAt: "2026-08-13T16:00:00.000Z",
    });
  });

  it.each([
    null,
    "not-json",
    JSON.stringify({ code: "const answer = 42;" }),
    JSON.stringify({
      code: "x".repeat(MAX_PLAYGROUND_CODE_LENGTH + 1),
      quickChecks: "",
      updatedAt: "2026-08-13T16:00:00.000Z",
    }),
    JSON.stringify({
      code: "const answer = 42;",
      quickChecks: "x".repeat(MAX_PLAYGROUND_CHECK_SOURCE_LENGTH + 1),
      updatedAt: "2026-08-13T16:00:00.000Z",
    }),
    JSON.stringify({
      code: "const answer = 42;",
      quickChecks: "answer === 42",
      updatedAt: "not-a-date",
    }),
  ])("rejects malformed or oversized recovery data", (stored) => {
    expect(parsePlaygroundDraftRecovery(stored)).toBeNull();
  });
});
