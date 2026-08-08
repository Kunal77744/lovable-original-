import {
  CODING_PROBLEMS,
  getCodingProblem,
  getNextUnfinishedCodingProblemSlug,
} from "@/lib/coding-problems";

export type CodingActivityDayInput = {
  date: string;
  attemptCount: number;
  acceptedCount: number;
};

export type CodingActivityDay = CodingActivityDayInput & {
  intensity: 0 | 1 | 2 | 3 | 4;
  isToday: boolean;
};

export type CodingActivity = {
  windowDays: number;
  days: CodingActivityDay[];
  activeDays: number;
  attemptCount: number;
  acceptedCount: number;
  consecutiveDays: number;
  longestRun: number;
  lastActiveDate: string | null;
  nextAction: {
    title: string;
    description: string;
    label: string;
    href: string;
  };
};

const WINDOW_DAYS = 28;
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

function getIntensity(attemptCount: number): CodingActivityDay["intensity"] {
  if (attemptCount <= 0) return 0;
  if (attemptCount === 1) return 1;
  if (attemptCount <= 3) return 2;
  if (attemptCount <= 5) return 3;
  return 4;
}

function countConsecutiveDays(
  activeDateKeys: Set<string>,
  startDate: Date,
) {
  let count = 0;
  let cursor = startDate;

  while (activeDateKeys.has(toUtcDateKey(cursor))) {
    count += 1;
    cursor = shiftUtcDate(cursor, -1);
  }

  return count;
}

function getLongestRun(activeDateKeys: string[]) {
  let longest = 0;
  let current = 0;
  let previous: Date | null = null;

  for (const dateKey of activeDateKeys) {
    const date = fromUtcDateKey(dateKey);
    const isConsecutive =
      previous !== null && date.getTime() - previous.getTime() === DAY_MS;
    current = isConsecutive ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = date;
  }

  return longest;
}

export function buildCodingActivity({
  activityDays,
  completedSlugs,
  now = new Date(),
}: {
  activityDays: CodingActivityDayInput[];
  completedSlugs: string[];
  now?: Date;
}): CodingActivity {
  const today = fromUtcDateKey(toUtcDateKey(now));
  const relevantActivity = activityDays
    .filter(
      (day) =>
        /^\d{4}-\d{2}-\d{2}$/.test(day.date) &&
        day.attemptCount > 0 &&
        fromUtcDateKey(day.date).getTime() <= today.getTime(),
    )
    .sort((left, right) => left.date.localeCompare(right.date));
  const activityByDate = new Map(
    relevantActivity.map((day) => [day.date, day]),
  );
  const activeDateKeys = new Set(activityByDate.keys());
  const windowStart = shiftUtcDate(today, -(WINDOW_DAYS - 1));
  const days = Array.from({ length: WINDOW_DAYS }, (_, index) => {
    const date = shiftUtcDate(windowStart, index);
    const dateKey = toUtcDateKey(date);
    const saved = activityByDate.get(dateKey);
    const attemptCount = saved?.attemptCount ?? 0;

    return {
      date: dateKey,
      attemptCount,
      acceptedCount: saved?.acceptedCount ?? 0,
      intensity: getIntensity(attemptCount),
      isToday: dateKey === toUtcDateKey(today),
    } satisfies CodingActivityDay;
  });
  const latestDateKey = relevantActivity.at(-1)?.date ?? null;
  const latestDate = latestDateKey ? fromUtcDateKey(latestDateKey) : null;
  const daysSinceLatest = latestDate
    ? Math.floor((today.getTime() - latestDate.getTime()) / DAY_MS)
    : null;
  const consecutiveDays =
    latestDate && daysSinceLatest !== null && daysSinceLatest <= 1
      ? countConsecutiveDays(activeDateKeys, latestDate)
      : 0;
  const nextProblemSlug =
    getNextUnfinishedCodingProblemSlug(completedSlugs) ??
    CODING_PROBLEMS[0].slug;
  const nextProblem = getCodingProblem(nextProblemSlug) ?? CODING_PROBLEMS[0];
  const completedSlugSet = new Set(completedSlugs);
  const completedAll = CODING_PROBLEMS.every((problem) =>
    completedSlugSet.has(problem.slug),
  );
  const windowActivity = days.filter((day) => day.attemptCount > 0);

  return {
    windowDays: WINDOW_DAYS,
    days,
    activeDays: windowActivity.length,
    attemptCount: days.reduce((sum, day) => sum + day.attemptCount, 0),
    acceptedCount: days.reduce((sum, day) => sum + day.acceptedCount, 0),
    consecutiveDays,
    longestRun: getLongestRun([...activeDateKeys].sort()),
    lastActiveDate: latestDateKey,
    nextAction: {
      title: completedAll
        ? `Review ${nextProblem.title}.`
        : `Continue with ${nextProblem.title}.`,
      description: completedAll
        ? `All ${CODING_PROBLEMS.length} problems have an Accepted result. Reopen problem 01 for another independent attempt.`
        : `This is the first unfinished step in your saved ${CODING_PROBLEMS.length}-problem path: ${nextProblem.skill.toLowerCase()}.`,
      label: `${completedAll ? "Review" : "Continue"} problem ${String(nextProblem.number).padStart(2, "0")}`,
      href: `/practice/${nextProblem.slug}`,
    },
  };
}
