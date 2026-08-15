import type { SavedJavaScriptMixedReviewResult } from "@/db/javascript-mixed-review";
import type { SavedWebFoundationsReviewResult } from "@/db/web-foundations-review";
import {
  formatJavaScriptMixedReviewDueDate,
  isJavaScriptMixedReviewDue,
} from "@/lib/javascript-mixed-review";
import type { LearnerProfileAction } from "@/lib/learner-profile";
import {
  formatWebFoundationsReviewDueDate,
  isWebFoundationsReviewDue,
} from "@/lib/web-foundations-review";

export type LearnerReviewHubItem = {
  id: "web-foundations" | "javascript-mixed" | "javascript-repair" | "css-repair";
  kind: "due" | "repair";
  eyebrow: string;
  title: string;
  description: string;
  detail: string;
  href: string;
  label: string;
};

export type LearnerScheduledReview = {
  id: "web-foundations" | "javascript-mixed";
  title: string;
  detail: string;
  href: string;
};

export type LearnerReviewHubViewModel = {
  ready: LearnerReviewHubItem[];
  scheduled: LearnerScheduledReview[];
  continuation: LearnerProfileAction;
};

export function buildLearnerReviewHub({
  courseCompleted,
  webFoundationsResult,
  javascriptReviewItemCount,
  javascriptMixedResult,
  javascriptRepairCount,
  cssRepairCount,
  continuation,
  now = new Date(),
}: {
  courseCompleted: boolean;
  webFoundationsResult: SavedWebFoundationsReviewResult | null;
  javascriptReviewItemCount: number;
  javascriptMixedResult: SavedJavaScriptMixedReviewResult | null;
  javascriptRepairCount: number;
  cssRepairCount: number;
  continuation: LearnerProfileAction;
  now?: Date;
}): LearnerReviewHubViewModel {
  const ready: LearnerReviewHubItem[] = [];
  const scheduled: LearnerScheduledReview[] = [];

  if (courseCompleted) {
    if (isWebFoundationsReviewDue(webFoundationsResult, now)) {
      ready.push({
        id: "web-foundations",
        kind: "due",
        eyebrow: "Due recall · 4 concepts",
        title: "Web Foundations review",
        description:
          "Bring semantic HTML, heading structure, selectors, and the box model back before you build again.",
        detail: webFoundationsResult
          ? `Last recall ${webFoundationsResult.correctCount}/${webFoundationsResult.totalCount}`
          : "First review · about 4 minutes",
        href: "/courses/web-development-foundations/review",
        label: "Start Foundations review",
      });
    } else if (webFoundationsResult) {
      scheduled.push({
        id: "web-foundations",
        title: "Web Foundations",
        detail: `Next review ${formatWebFoundationsReviewDueDate(webFoundationsResult.nextDueAt)} · last recall ${webFoundationsResult.correctCount}/${webFoundationsResult.totalCount}`,
        href: "/courses/web-development-foundations/review",
      });
    }
  }

  if (javascriptReviewItemCount > 0) {
    if (isJavaScriptMixedReviewDue(javascriptMixedResult, now)) {
      ready.push({
        id: "javascript-mixed",
        kind: "due",
        eyebrow: `Due recall · ${javascriptReviewItemCount} concepts`,
        title: "JavaScript mixed review",
        description:
          "Recall rules from completed guided labs without reopening old exercises or changing saved progress.",
        detail: javascriptMixedResult
          ? `Last recall ${javascriptMixedResult.correctCount}/${javascriptMixedResult.totalCount}`
          : "First mixed review · about 4 minutes",
        href: "/practice/mixed-review",
        label: "Start JavaScript review",
      });
    } else if (javascriptMixedResult) {
      scheduled.push({
        id: "javascript-mixed",
        title: "JavaScript mixed review",
        detail: `Next review ${formatJavaScriptMixedReviewDueDate(javascriptMixedResult.nextDueAt)} · last recall ${javascriptMixedResult.correctCount}/${javascriptMixedResult.totalCount}`,
        href: "/practice/mixed-review",
      });
    }
  }

  if (javascriptRepairCount > 0) {
    ready.push({
      id: "javascript-repair",
      kind: "repair",
      eyebrow: `Saved repair · ${javascriptRepairCount} ${javascriptRepairCount === 1 ? "problem" : "problems"}`,
      title: "JavaScript weak spots",
      description:
        "Return to unresolved Wrong Answers and problems saved for another pass, newest evidence first.",
      detail: "Built from private verdicts and bookmarks",
      href: "/practice/review",
      label: "Open JavaScript repairs",
    });
  }

  if (cssRepairCount > 0) {
    ready.push({
      id: "css-repair",
      kind: "repair",
      eyebrow: `Saved repair · ${cssRepairCount} ${cssRepairCount === 1 ? "challenge" : "challenges"}`,
      title: "CSS rules to revisit",
      description:
        "Retry the exact challenges whose latest saved result still needs revision.",
      detail: "Clears after a completed result",
      href: "/practice/css/review",
      label: "Open CSS repairs",
    });
  }

  return { ready, scheduled, continuation };
}
