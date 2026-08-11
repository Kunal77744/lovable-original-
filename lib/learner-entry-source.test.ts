import { describe, expect, it } from "vitest";
import {
  FOUNDER_WARM_ENTRY_SOURCE,
  LEARNER_ENTRY_SOURCES,
  parseLearnerEntrySource,
} from "./learner-entry-source";

describe("learner entry source", () => {
  it("accepts only the bounded anonymous source labels", () => {
    expect(parseLearnerEntrySource("founder_warm")).toBe(
      FOUNDER_WARM_ENTRY_SOURCE,
    );
    expect(
      LEARNER_ENTRY_SOURCES.map((source) => parseLearnerEntrySource(source)),
    ).toEqual([...LEARNER_ENTRY_SOURCES]);
  });

  it("rejects arbitrary values and repeated query values", () => {
    expect(parseLearnerEntrySource("learner@example.com")).toBeUndefined();
    expect(
      parseLearnerEntrySource("https://example.com/private"),
    ).toBeUndefined();
    expect(parseLearnerEntrySource("search")).toBeUndefined();
    expect(parseLearnerEntrySource(["founder_warm"])).toBeUndefined();
    expect(
      parseLearnerEntrySource(["directory", "community"]),
    ).toBeUndefined();
    expect(parseLearnerEntrySource(undefined)).toBeUndefined();
  });
});
