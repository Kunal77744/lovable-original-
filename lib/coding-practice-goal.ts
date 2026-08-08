import type { CodingActivityDayInput } from "@/lib/coding-activity";

export const CODING_PRACTICE_GOAL_OPTIONS = [1, 3, 5] as const;

export type CodingPracticeGoalTarget =
  (typeof CODING_PRACTICE_GOAL_OPTIONS)[number];

export type WeeklyCodingPracticeGoal = {
  targetActiveDays: CodingPracticeGoalTarget | null;
  currentActiveDays: number;
  weekStart: string;
  weekEnd: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function toUtcDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function fromUtcDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function shiftUtcDate(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

export function isCodingPracticeGoalTarget(
  value: unknown,
): value is CodingPracticeGoalTarget {
  return CODING_PRACTICE_GOAL_OPTIONS.includes(
    value as CodingPracticeGoalTarget,
  );
}

export function buildWeeklyCodingPracticeGoal({
  activityDays,
  targetActiveDays,
  now = new Date(),
}: {
  activityDays: CodingActivityDayInput[];
  targetActiveDays: number | null;
  now?: Date;
}): WeeklyCodingPracticeGoal {
  const today = fromUtcDateKey(toUtcDateKey(now));
  const daysSinceMonday = (today.getUTCDay() + 6) % 7;
  const weekStart = shiftUtcDate(today, -daysSinceMonday);
  const weekEnd = shiftUtcDate(weekStart, 6);
  const activeDateKeys = new Set(
    activityDays
      .filter((day) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || day.attemptCount <= 0) {
          return false;
        }

        const date = fromUtcDateKey(day.date);
        return date >= weekStart && date <= today;
      })
      .map((day) => day.date),
  );

  return {
    targetActiveDays: isCodingPracticeGoalTarget(targetActiveDays)
      ? targetActiveDays
      : null,
    currentActiveDays: activeDateKeys.size,
    weekStart: toUtcDateKey(weekStart),
    weekEnd: toUtcDateKey(weekEnd),
  };
}
