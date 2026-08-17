import { describe, expect, it } from "vitest";
import {
  parseGuidedPlaygroundTransfer,
  serializeGuidedPlaygroundTransfer,
} from "./guided-playground-transfer";

describe("guided playground transfer", () => {
  it("keeps only a bounded authored exercise and resolves its trusted labels", () => {
    const serialized = serializeGuidedPlaygroundTransfer({
      labSlug: "functions",
      exerciseId: "return-a-result",
      source: "function applyDiscount(price) { return price * 0.9; }",
    });

    expect(parseGuidedPlaygroundTransfer(serialized)).toMatchObject({
      labSlug: "functions",
      labTitle: "Functions and scope",
      exerciseId: "return-a-result",
      exerciseTitle: "Send a result back to the caller",
      returnHref: "/practice/functions",
      source: "function applyDiscount(price) { return price * 0.9; }",
    });
  });

  it("rejects unknown exercises, malformed values, and oversized source", () => {
    expect(
      serializeGuidedPlaygroundTransfer({
        labSlug: "functions",
        exerciseId: "not-authored",
        source: "function solve() {}",
      }),
    ).toBeNull();
    expect(parseGuidedPlaygroundTransfer("not-json")).toBeNull();
    expect(
      serializeGuidedPlaygroundTransfer({
        labSlug: "functions",
        exerciseId: "return-a-result",
        source: "x".repeat(20_001),
      }),
    ).toBeNull();
  });
});
