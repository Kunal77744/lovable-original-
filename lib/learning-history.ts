import { getCodingProblem } from "@/lib/coding-problems";
import { CSS_PRACTICE_CHALLENGES } from "@/lib/css-practice-challenges";
import {
  FIRST_COURSE_LESSONS,
  getFirstCourseLessonHref,
} from "@/lib/first-course-content";
import { GUIDED_PROJECT_SLUG } from "@/lib/guided-project";
import { HTML_CSS_CAPSTONE_SLUG } from "@/lib/html-css-capstone";
import { getJavaScriptLab } from "@/lib/javascript-lab-progress";
import { JAVASCRIPT_CAPSTONE_SLUG } from "@/lib/javascript-capstone";

export type LearningHistoryKind =
  | "course"
  | "css"
  | "guided-javascript"
  | "judged-javascript"
  | "project"
  | "review";

export type LearningHistoryItem = {
  id: string;
  kind: LearningHistoryKind;
  category: string;
  title: string;
  result: string;
  occurredAt: string;
  href: string;
  actionLabel: string;
};

type DatedValue = string | Date;

export type LearningHistoryInput = {
  lessons: Array<{
    lessonId: string;
    quizScore: number;
    completedAt: DatedValue;
  }>;
  codingSubmissions: Array<{
    id: string;
    problemSlug: string;
    verdict: string;
    passedTests: number;
    totalTests: number;
    createdAt: DatedValue;
  }>;
  cssAttempts: Array<{
    id: string;
    challengeSlug: string;
    verdict: string;
    passedChecks: number;
    totalChecks: number;
    createdAt: DatedValue;
  }>;
  guidedJavaScript: Array<{
    id: string;
    labSlug: string;
    exerciseId: string;
    completedAt: DatedValue;
  }>;
  projectReviews: Array<{
    id: string;
    projectSlug: string;
    status: string;
    passedChecks: number;
    totalChecks: number;
    submittedAt: DatedValue;
  }>;
  reviews: Array<{
    id: string;
    title: string;
    result: string;
    href: string;
    completedAt: DatedValue;
  }>;
};

const projectDetails = {
  [GUIDED_PROJECT_SLUG]: {
    title: "Semantic HTML field guide",
    href: `/projects/${GUIDED_PROJECT_SLUG}`,
  },
  [JAVASCRIPT_CAPSTONE_SLUG]: {
    title: "JavaScript expense report",
    href: `/projects/${JAVASCRIPT_CAPSTONE_SLUG}`,
  },
  [HTML_CSS_CAPSTONE_SLUG]: {
    title: "HTML/CSS resource library",
    href: `/projects/${HTML_CSS_CAPSTONE_SLUG}`,
  },
} as const;

function toIsoString(value: DatedValue) {
  return value instanceof Date ? value.toISOString() : value;
}

function compareNewestFirst(a: LearningHistoryItem, b: LearningHistoryItem) {
  return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
}

export function buildLearningHistory(
  input: LearningHistoryInput,
  limit = 30,
): LearningHistoryItem[] {
  const items: LearningHistoryItem[] = [];

  for (const row of input.lessons) {
    const lesson = FIRST_COURSE_LESSONS.find(
      (candidate) => candidate.id === row.lessonId,
    );
    if (!lesson) continue;

    items.push({
      id: `lesson-${row.lessonId}`,
      kind: "course",
      category: "Course lesson",
      title: lesson.title,
      result: `Completed · Quiz ${row.quizScore}%`,
      occurredAt: toIsoString(row.completedAt),
      href: getFirstCourseLessonHref(lesson.slug),
      actionLabel: "Reopen lesson",
    });
  }

  for (const row of input.codingSubmissions) {
    const problem = getCodingProblem(row.problemSlug);
    if (!problem) continue;

    items.push({
      id: `submission-${row.id}`,
      kind: "judged-javascript",
      category: `Judged JavaScript · Problem ${String(problem.number).padStart(2, "0")}`,
      title: problem.title,
      result: `${row.verdict} · ${row.passedTests}/${row.totalTests} checks`,
      occurredAt: toIsoString(row.createdAt),
      href: `/practice/${problem.slug}`,
      actionLabel: "Reopen problem",
    });
  }

  for (const row of input.cssAttempts) {
    const challenge = CSS_PRACTICE_CHALLENGES.find(
      (candidate) => candidate.slug === row.challengeSlug,
    );
    if (!challenge) continue;

    items.push({
      id: `css-${row.id}`,
      kind: "css",
      category: `CSS practice · Challenge ${String(challenge.number).padStart(2, "0")}`,
      title: challenge.title,
      result: `${row.verdict} · ${row.passedChecks}/${row.totalChecks} checks`,
      occurredAt: toIsoString(row.createdAt),
      href: `/practice/css/${challenge.slug}`,
      actionLabel: "Reopen challenge",
    });
  }

  for (const row of input.guidedJavaScript) {
    const lab = getJavaScriptLab(row.labSlug);
    if (!lab) continue;
    const exerciseIndex = lab.exerciseIds.findIndex(
      (exerciseId) => exerciseId === row.exerciseId,
    );
    if (exerciseIndex === -1) continue;

    items.push({
      id: `guided-${row.id}`,
      kind: "guided-javascript",
      category: "Guided JavaScript",
      title: lab.title,
      result: `Exercise ${exerciseIndex + 1}/${lab.exerciseIds.length} saved`,
      occurredAt: toIsoString(row.completedAt),
      href: lab.href,
      actionLabel: "Open lab",
    });
  }

  for (const row of input.projectReviews) {
    const project = projectDetails[row.projectSlug as keyof typeof projectDetails];
    if (!project) continue;
    const status = row.status === "completed" ? "Completed" : "Needs revision";

    items.push({
      id: `project-${row.id}`,
      kind: "project",
      category: "Project review",
      title: project.title,
      result: `${status} · ${row.passedChecks}/${row.totalChecks} checks`,
      occurredAt: toIsoString(row.submittedAt),
      href: project.href,
      actionLabel: "Reopen project",
    });
  }

  for (const row of input.reviews) {
    items.push({
      id: `review-${row.id}`,
      kind: "review",
      category: "Saved review",
      title: row.title,
      result: row.result,
      occurredAt: toIsoString(row.completedAt),
      href: row.href,
      actionLabel: "Open review",
    });
  }

  return items
    .filter((item) => Number.isFinite(new Date(item.occurredAt).getTime()))
    .sort(compareNewestFirst)
    .slice(0, Math.max(1, Math.min(limit, 50)));
}
