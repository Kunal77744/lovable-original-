import { describe, expect, it } from "vitest";
import { MAX_CSS_CHALLENGE_LENGTH } from "@/lib/css-practice-challenges";
import {
  getCssChallengeDraftRecoveryKey,
  parseCssChallengeDraftRecovery,
  serializeCssChallengeDraftRecovery,
} from "./css-challenge-draft-recovery";

describe("CSS challenge draft recovery", () => {
  it("scopes browser work to one account and challenge", () => {
    expect(getCssChallengeDraftRecoveryKey("account-a", "class-selector")).toBe(
      "lovable:css-challenge-draft-recovery:v1:account-a:class-selector",
    );
    expect(
      getCssChallengeDraftRecoveryKey("account-b", "class-selector"),
    ).not.toBe(
      getCssChallengeDraftRecoveryKey("account-a", "class-selector"),
    );
    expect(
      getCssChallengeDraftRecoveryKey("account-a", "descendant-selector"),
    ).not.toBe(
      getCssChallengeDraftRecoveryKey("account-a", "class-selector"),
    );
  });

  it("round-trips bounded CSS with its browser timestamp", () => {
    const updatedAt = "2026-08-14T10:00:00.000Z";
    const storedValue = serializeCssChallengeDraftRecovery(
      ".learning-card { color: #287652; }",
      updatedAt,
    );

    expect(parseCssChallengeDraftRecovery(storedValue)).toEqual({
      css: ".learning-card { color: #287652; }",
      updatedAt,
    });
  });

  it("rejects malformed, oversized, and undated browser values", () => {
    expect(parseCssChallengeDraftRecovery("not-json")).toBeNull();
    expect(
      parseCssChallengeDraftRecovery(
        JSON.stringify({
          css: "a".repeat(MAX_CSS_CHALLENGE_LENGTH + 1),
          updatedAt: "2026-08-14T10:00:00.000Z",
        }),
      ),
    ).toBeNull();
    expect(
      parseCssChallengeDraftRecovery(
        JSON.stringify({ css: ".card {}", updatedAt: "not-a-date" }),
      ),
    ).toBeNull();
  });
});
