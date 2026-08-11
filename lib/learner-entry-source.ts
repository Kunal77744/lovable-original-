export const LEARNER_ENTRY_SOURCES = [
  "search_page",
  "directory",
  "community",
  "walkthrough",
  "founder_warm",
] as const;

export const FOUNDER_WARM_ENTRY_SOURCE = "founder_warm" as const;

export type LearnerEntrySource = (typeof LEARNER_ENTRY_SOURCES)[number];

export function parseLearnerEntrySource(
  value: string | string[] | undefined,
): LearnerEntrySource | undefined {
  return typeof value === "string" &&
    LEARNER_ENTRY_SOURCES.some((source) => source === value)
    ? (value as LearnerEntrySource)
    : undefined;
}
