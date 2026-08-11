import {
  GUIDED_PROJECT_SLUG,
  GUIDED_PROJECT_TITLE,
  GUIDED_PROJECT_TOTAL_CHECKS,
} from "@/lib/guided-project";
import {
  HTML_CSS_CAPSTONE_SLUG,
  HTML_CSS_CAPSTONE_TITLE,
  HTML_CSS_CAPSTONE_TOTAL_CHECKS,
} from "@/lib/html-css-capstone";
import {
  JAVASCRIPT_CAPSTONE_SLUG,
  JAVASCRIPT_CAPSTONE_TITLE,
  JAVASCRIPT_CAPSTONE_TOTAL_CHECKS,
} from "@/lib/javascript-capstone";

export type ProjectReviewStatus = "completed" | "needs-revision";

export type ProjectReviewDefinition = {
  slug: string;
  stack: string;
  title: string;
  href: string;
  totalChecks: number;
};

export type ProjectReviewAttempt = ProjectReviewDefinition & {
  id: string;
  status: ProjectReviewStatus;
  passedChecks: number;
  createdAt: Date;
};

const PROJECT_REVIEW_DEFINITIONS: Record<string, ProjectReviewDefinition> = {
  [GUIDED_PROJECT_SLUG]: {
    slug: GUIDED_PROJECT_SLUG,
    stack: "Semantic HTML",
    title: GUIDED_PROJECT_TITLE,
    href: `/projects/${GUIDED_PROJECT_SLUG}`,
    totalChecks: GUIDED_PROJECT_TOTAL_CHECKS,
  },
  [JAVASCRIPT_CAPSTONE_SLUG]: {
    slug: JAVASCRIPT_CAPSTONE_SLUG,
    stack: "JavaScript",
    title: JAVASCRIPT_CAPSTONE_TITLE,
    href: `/projects/${JAVASCRIPT_CAPSTONE_SLUG}`,
    totalChecks: JAVASCRIPT_CAPSTONE_TOTAL_CHECKS,
  },
  [HTML_CSS_CAPSTONE_SLUG]: {
    slug: HTML_CSS_CAPSTONE_SLUG,
    stack: "HTML + CSS",
    title: HTML_CSS_CAPSTONE_TITLE,
    href: `/projects/${HTML_CSS_CAPSTONE_SLUG}`,
    totalChecks: HTML_CSS_CAPSTONE_TOTAL_CHECKS,
  },
};

export function getProjectReviewDefinition(projectSlug: string) {
  return PROJECT_REVIEW_DEFINITIONS[projectSlug] ?? null;
}

export function isProjectReviewStatus(
  status: string,
): status is ProjectReviewStatus {
  return status === "completed" || status === "needs-revision";
}
