import type { LearnerProfileAction } from "./learner-profile";
import {
  formatJavaScriptMixedReviewDueDate,
  isJavaScriptMixedReviewDue,
} from "./javascript-mixed-review";
import {
  formatWebFoundationsReviewDueDate,
  isWebFoundationsReviewDue,
} from "./web-foundations-review";

type SavedReviewResult = {
  correctCount: number;
  totalCount: number;
  nextDueAt: string;
};

export type DailyLearningPlanItem = {
  id: "web-review" | "javascript-review" | "daily-challenge";
  label: string;
  title: string;
  detail: string;
  href: string;
  state: "due" | "scheduled" | "complete";
};

export type DailyLearningPlan = {
  dateLabel: string;
  continuation: LearnerProfileAction;
  items: DailyLearningPlanItem[];
};

export function buildDailyLearningPlan({
  continuation,
  courseCompleted,
  foundationsReview,
  javascriptReviewAvailable,
  javascriptReview,
  dailyChallenge,
  now = new Date(),
}: {
  continuation: LearnerProfileAction;
  courseCompleted: boolean;
  foundationsReview: SavedReviewResult | null;
  javascriptReviewAvailable: boolean;
  javascriptReview: SavedReviewResult | null;
  dailyChallenge: {
    number: number;
    title: string;
    completed: boolean;
  } | null;
  now?: Date;
}): DailyLearningPlan {
  const items: DailyLearningPlanItem[] = [];

  if (courseCompleted) {
    const due = isWebFoundationsReviewDue(foundationsReview, now);
    items.push({
      id: "web-review",
      label: due
        ? "Due today"
        : `Next ${formatWebFoundationsReviewDueDate(foundationsReview!.nextDueAt)}`,
      title: "Web Foundations review",
      detail: due
        ? "Bring four HTML and CSS decisions back before they fade."
        : `Last recall ${foundationsReview!.correctCount}/${foundationsReview!.totalCount}.`,
      href: "/courses/web-development-foundations/review",
      state: due ? "due" : "scheduled",
    });
  }

  if (javascriptReviewAvailable) {
    const due = isJavaScriptMixedReviewDue(javascriptReview, now);
    items.push({
      id: "javascript-review",
      label: due
        ? "Due today"
        : `Next ${formatJavaScriptMixedReviewDueDate(javascriptReview!.nextDueAt)}`,
      title: "JavaScript mixed review",
      detail: due
        ? "Retrieve four concepts from guided labs you already completed."
        : `Last recall ${javascriptReview!.correctCount}/${javascriptReview!.totalCount}.`,
      href: "/practice/mixed-review",
      state: due ? "due" : "scheduled",
    });
  }

  if (dailyChallenge) {
    items.push({
      id: "daily-challenge",
      label: dailyChallenge.completed ? "Completed today" : "Open today",
      title: `Daily problem ${String(dailyChallenge.number).padStart(2, "0")}`,
      detail: dailyChallenge.title,
      href: "/practice/daily",
      state: dailyChallenge.completed ? "complete" : "due",
    });
  }

  const stateOrder = { due: 0, complete: 1, scheduled: 2 } as const;
  items.sort((a, b) => stateOrder[a.state] - stateOrder[b.state]);

  return {
    dateLabel: new Intl.DateTimeFormat("en", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(now),
    continuation,
    items,
  };
}
