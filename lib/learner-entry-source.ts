export const FOUNDER_WARM_ENTRY_SOURCE = "founder_warm" as const;

export type LearnerEntrySource = typeof FOUNDER_WARM_ENTRY_SOURCE;

export function parseLearnerEntrySource(
  value: string | string[] | undefined,
): LearnerEntrySource | undefined {
  return value === FOUNDER_WARM_ENTRY_SOURCE ? value : undefined;
}
