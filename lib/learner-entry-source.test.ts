import { describe, expect, it } from "vitest";
import {
  FOUNDER_WARM_ENTRY_SOURCE,
  parseLearnerEntrySource,
} from "./learner-entry-source";

describe("learner entry source", () => {
  it("accepts the single anonymous founder-warm source", () => {
    expect(parseLearnerEntrySource("founder_warm")).toBe(
      FOUNDER_WARM_ENTRY_SOURCE,
    );
  });

  it("rejects arbitrary values and repeated query values", () => {
    expect(parseLearnerEntrySource("learner@example.com")).toBeUndefined();
    expect(parseLearnerEntrySource(["founder_warm"])).toBeUndefined();
    expect(parseLearnerEntrySource(undefined)).toBeUndefined();
  });
});
