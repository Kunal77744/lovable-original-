import {
  CODING_PROBLEMS,
  type CodingProblem,
} from "./coding-problems";

const UTC_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export function toUtcDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function isUtcDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !UTC_DATE_PATTERN.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && toUtcDateKey(parsed) === value;
}

export function getDailyCodingChallenge(
  date: Date = new Date(),
): CodingProblem {
  const utcDay = Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) /
      DAY_MS,
  );

  return CODING_PROBLEMS[utcDay % CODING_PROBLEMS.length];
}

export function getDailyCodingChallengeForDateKey(dateKey: string) {
  if (!isUtcDateKey(dateKey)) return null;

  return getDailyCodingChallenge(new Date(`${dateKey}T00:00:00.000Z`));
}

export function isCurrentDailyCodingChallenge({
  dateKey,
  problemSlug,
  now = new Date(),
}: {
  dateKey: unknown;
  problemSlug: string;
  now?: Date;
}) {
  if (!isUtcDateKey(dateKey) || dateKey !== toUtcDateKey(now)) return false;

  return getDailyCodingChallenge(now).slug === problemSlug;
}

export function formatDailyCodingChallengeDate(dateKey: string) {
  if (!isUtcDateKey(dateKey)) return "today";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${dateKey}T00:00:00.000Z`));
}
