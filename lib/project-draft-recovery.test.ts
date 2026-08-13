import { describe, expect, it } from "vitest";
import {
  getProjectDraftRecoveryKey,
  parseProjectDraftRecovery,
  serializeProjectDraftRecovery,
} from "@/lib/project-draft-recovery";

describe("project draft recovery", () => {
  it("scopes each browser copy to the account, project, and exact file", () => {
    expect(
      getProjectDraftRecoveryKey(
        "learner-a",
        "html-css-resource-library",
        "styles.css",
      ),
    ).toBe(
      "lovable:project-draft-recovery:v1:learner-a:html-css-resource-library:styles.css",
    );
  });

  it("round-trips a bounded source with its update time", () => {
    expect(
      parseProjectDraftRecovery(
        serializeProjectDraftRecovery("const answer = 42;", "2026-08-13T10:00:00.000Z"),
        1_000,
      ),
    ).toEqual({
      source: "const answer = 42;",
      updatedAt: "2026-08-13T10:00:00.000Z",
    });
  });

  it("rejects malformed, oversized, and undated browser copies", () => {
    expect(parseProjectDraftRecovery("not-json", 1_000)).toBeNull();
    expect(
      parseProjectDraftRecovery(
        JSON.stringify({ source: "too long", updatedAt: "2026-08-13T10:00:00.000Z" }),
        3,
      ),
    ).toBeNull();
    expect(
      parseProjectDraftRecovery(
        JSON.stringify({ source: "safe", updatedAt: "not-a-date" }),
        1_000,
      ),
    ).toBeNull();
  });
});
