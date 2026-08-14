import { describe, expect, it } from "vitest";
import { serializePracticeJournal } from "./practice-solution-note";
import { buildPracticeJournalIndex } from "./practice-journal-index";

function savedJournal(
  problemSlug: string,
  journal: Parameters<typeof serializePracticeJournal>[0],
  updatedAt = "2026-08-11T09:00:00.000Z",
) {
  return {
    problemSlug,
    content: serializePracticeJournal(journal),
    updatedAt,
  };
}

describe("buildPracticeJournalIndex", () => {
  it("sorts authored journals and reports the exact saved fields", () => {
    const result = buildPracticeJournalIndex(
      [
        savedJournal("even-or-odd", {
          inputShape: "One whole number",
          edgeCase: "Zero is even",
          steps: "Read, test the remainder, return the word",
          reflection: "Exact capitalization matters",
        }),
        savedJournal("unknown-problem", {
          inputShape: "Hidden",
          edgeCase: "Hidden",
          steps: "Hidden",
          reflection: "Hidden",
        }),
        savedJournal("sum-two-numbers", {
          inputShape: "Two integers",
          edgeCase: "Negative values",
          steps: "Split, convert, add",
          reflection: "",
        }),
      ],
      ["sum-two-numbers", "even-or-odd"],
    );

    expect(result.items.map((item) => item.slug)).toEqual([
      "sum-two-numbers",
      "even-or-odd",
    ]);
    expect(result.journalCount).toBe(2);
    expect(result.plannedCount).toBe(2);
    expect(result.reflectedCount).toBe(1);
    expect(result.items[0]).toMatchObject({
      inputShape: "Two integers",
      edgeCase: "Negative values",
      steps: "Split, convert, add",
      statusLabel: "Plan ready",
      actionLabel: "Add reflection",
    });
  });

  it("keeps the first unfinished plan as the primary continuation", () => {
    const result = buildPracticeJournalIndex(
      [
        savedJournal("even-or-odd", {
          inputShape: "One integer",
          edgeCase: "",
          steps: "",
          reflection: "",
        }),
        savedJournal("sum-two-numbers", {
          inputShape: "Two integers",
          edgeCase: "Negative values",
          steps: "Split, convert, add",
          reflection: "The input must become numbers",
        }),
      ],
      ["sum-two-numbers"],
    );

    expect(result.primaryAction).toMatchObject({
      label: "Finish problem 02 plan",
      href: "/practice/even-or-odd",
    });
  });

  it("routes an Accepted plan to its missing reflection", () => {
    const result = buildPracticeJournalIndex(
      [
        savedJournal("sum-two-numbers", {
          inputShape: "Two integers",
          edgeCase: "Negative values",
          steps: "Split, convert, add",
          reflection: "",
        }),
      ],
      ["sum-two-numbers"],
    );

    expect(result.primaryAction).toMatchObject({
      label: "Reflect on problem 01",
      href: "/practice/sum-two-numbers",
    });
  });

  it("starts an empty notebook at the first unfinished problem", () => {
    const result = buildPracticeJournalIndex([], []);

    expect(result).toMatchObject({
      journalCount: 0,
      plannedCount: 0,
      reflectedCount: 0,
      primaryAction: {
        kicker: "Start with a plan",
        label: "Open problem 01",
        href: "/practice/sum-two-numbers",
      },
    });
  });
});
