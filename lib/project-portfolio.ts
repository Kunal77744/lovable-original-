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

export type ProjectPortfolioState =
  | "not-started"
  | "in-progress"
  | "completed";

export type ProjectPortfolioSummary = {
  state: ProjectPortfolioState;
  passedChecks: number;
};

export type ProjectPortfolioCard = {
  number: string;
  stack: string;
  title: string;
  description: string;
  artifact: string;
  state: ProjectPortfolioState;
  statusLabel: string;
  progressLabel: string;
  href: string | null;
  actionLabel: string | null;
  debriefHref: string | null;
  lockedReason: string | null;
};

export type ProjectPortfolioViewModel = {
  completedCount: number;
  totalCount: number;
  primaryAction: {
    kicker: string;
    title: string;
    description: string;
    href: string;
    label: string;
  };
  projects: ProjectPortfolioCard[];
};

export function buildPortableProjectEvidence(
  portfolio: ProjectPortfolioViewModel,
) {
  const completedProjects = portfolio.projects.filter(
    (project) => project.state === "completed",
  );

  if (completedProjects.length === 0) return null;

  const projectLabel =
    completedProjects.length === 1 ? "completed project" : "completed projects";
  const sections = completedProjects.map((project) =>
    [
      `## ${project.title}`,
      `- Stack: ${project.stack}`,
      `- Artifact: ${project.artifact}`,
      `- Review result: ${project.progressLabel}`,
    ].join("\n"),
  );

  return [
    "# Coding project evidence",
    "",
    `${completedProjects.length} ${projectLabel} reviewed in Lovable Original.`,
    "",
    ...sections.flatMap((section, index) =>
      index === sections.length - 1 ? [section] : [section, ""],
    ),
  ].join("\n");
}

type PortfolioInput = {
  courseCompleted: boolean;
  courseNextHref: string;
  courseNextTitle: string;
  cssCompletedCount: number;
  cssTotalCount: number;
  cssNextHref: string;
  semanticHtml: ProjectPortfolioSummary;
  javascript: ProjectPortfolioSummary;
  htmlCss: ProjectPortfolioSummary;
};

function statusLabel(state: ProjectPortfolioState) {
  if (state === "completed") return "Completed";
  if (state === "in-progress") return "In progress";
  return "Not started";
}

function progressLabel(
  summary: ProjectPortfolioSummary,
  totalChecks: number,
) {
  if (summary.state === "not-started") return `${totalChecks} review checks`;
  return `${summary.passedChecks}/${totalChecks} checks passed`;
}

export function buildProjectPortfolio({
  courseCompleted,
  courseNextHref,
  courseNextTitle,
  cssCompletedCount,
  cssTotalCount,
  cssNextHref,
  semanticHtml,
  javascript,
  htmlCss,
}: PortfolioInput): ProjectPortfolioViewModel {
  const cssCompleted = cssCompletedCount === cssTotalCount;
  const projects: ProjectPortfolioCard[] = [
    {
      number: "01",
      stack: "Semantic HTML",
      title: GUIDED_PROJECT_TITLE,
      description:
        "Turn one lesson into a structured article with landmarks, sections, and a useful supporting note.",
      artifact: "index.html",
      state: semanticHtml.state,
      statusLabel: statusLabel(semanticHtml.state),
      progressLabel: progressLabel(
        semanticHtml,
        GUIDED_PROJECT_TOTAL_CHECKS,
      ),
      href: courseCompleted
        ? `/projects/${GUIDED_PROJECT_SLUG}`
        : semanticHtml.state === "in-progress" ||
            semanticHtml.state === "completed"
          ? `/projects/${GUIDED_PROJECT_SLUG}`
          : null,
      actionLabel:
        semanticHtml.state === "completed"
          ? "Open completed project"
          : semanticHtml.state === "in-progress"
            ? "Continue project"
            : courseCompleted
              ? "Start project"
              : null,
      debriefHref: null,
      lockedReason:
        !courseCompleted && semanticHtml.state === "not-started"
          ? "Available after Web Development Foundations"
          : null,
    },
    {
      number: "02",
      stack: "JavaScript",
      title: JAVASCRIPT_CAPSTONE_TITLE,
      description:
        "Parse expense records, transform the data, sort categories, calculate totals, and format an exact report.",
      artifact: "solution.js",
      state: javascript.state,
      statusLabel: statusLabel(javascript.state),
      progressLabel: progressLabel(
        javascript,
        JAVASCRIPT_CAPSTONE_TOTAL_CHECKS,
      ),
      href: `/projects/${JAVASCRIPT_CAPSTONE_SLUG}`,
      actionLabel:
        javascript.state === "completed"
          ? "Open completed project"
          : javascript.state === "in-progress"
            ? "Continue project"
            : "Start project",
      debriefHref:
        javascript.state === "completed"
          ? `/projects/${JAVASCRIPT_CAPSTONE_SLUG}/debrief`
          : null,
      lockedReason: null,
    },
    {
      number: "03",
      stack: "HTML + CSS",
      title: HTML_CSS_CAPSTONE_TITLE,
      description:
        "Combine semantic structure, shared class hooks, grid, spacing, and the box model in one responsive resource page.",
      artifact: "index.html + styles.css",
      state: htmlCss.state,
      statusLabel: statusLabel(htmlCss.state),
      progressLabel: progressLabel(
        htmlCss,
        HTML_CSS_CAPSTONE_TOTAL_CHECKS,
      ),
      href:
        cssCompleted || htmlCss.state !== "not-started"
          ? `/projects/${HTML_CSS_CAPSTONE_SLUG}`
          : null,
      actionLabel:
        htmlCss.state === "completed"
          ? "Open completed project"
          : htmlCss.state === "in-progress"
            ? "Continue project"
            : cssCompleted
              ? "Start project"
              : null,
      debriefHref:
        htmlCss.state === "completed"
          ? `/projects/${HTML_CSS_CAPSTONE_SLUG}/debrief`
          : null,
      lockedReason:
        !cssCompleted && htmlCss.state === "not-started"
          ? `Available after ${cssTotalCount} CSS challenges`
          : null,
    },
  ];

  const inProgressProject = projects.find(
    (project) => project.state === "in-progress",
  );
  let primaryAction: ProjectPortfolioViewModel["primaryAction"];

  if (inProgressProject?.href) {
    primaryAction = {
      kicker: "Pick up where you stopped",
      title: inProgressProject.title,
      description: `${inProgressProject.progressLabel}. Your latest private draft is ready when you return.`,
      href: inProgressProject.href,
      label: `Resume ${inProgressProject.stack} project`,
    };
  } else if (!courseCompleted && semanticHtml.state === "not-started") {
    primaryAction = {
      kicker: "Unlock your first project",
      title: courseNextTitle,
      description:
        "Finish the current course step, then use the result in your semantic HTML field guide.",
      href: courseNextHref,
      label: "Continue the course",
    };
  } else if (semanticHtml.state === "not-started") {
    primaryAction = {
      kicker: "Your next build",
      title: GUIDED_PROJECT_TITLE,
      description:
        "Apply the completed course in a private article reviewed against six concrete outcomes.",
      href: `/projects/${GUIDED_PROJECT_SLUG}`,
      label: "Start the field guide",
    };
  } else if (javascript.state === "not-started") {
    primaryAction = {
      kicker: "Your next build",
      title: JAVASCRIPT_CAPSTONE_TITLE,
      description:
        "Combine parsing, arrays, objects, sorting, and exact output formatting in one saved JavaScript project.",
      href: `/projects/${JAVASCRIPT_CAPSTONE_SLUG}`,
      label: "Start the expense report",
    };
  } else if (htmlCss.state === "not-started" && cssCompleted) {
    primaryAction = {
      kicker: "Your next build",
      title: HTML_CSS_CAPSTONE_TITLE,
      description:
        "Bring semantic HTML and six CSS challenges together in one saved frontend project.",
      href: `/projects/${HTML_CSS_CAPSTONE_SLUG}`,
      label: "Start the resource library",
    };
  } else if (htmlCss.state === "not-started") {
    primaryAction = {
      kicker: "Unlock your final project",
      title: `${cssCompletedCount}/${cssTotalCount} CSS challenges complete`,
      description:
        "Complete the next CSS challenge, then return here to build the resource library.",
      href: cssNextHref,
      label: "Continue CSS practice",
    };
  } else {
    primaryAction = {
      kicker: "All three projects complete",
      title: "Explain the work behind the result",
      description:
        "Return to your latest debrief for architecture notes, interview rehearsal, and truthful portfolio wording.",
      href: `/projects/${HTML_CSS_CAPSTONE_SLUG}/debrief`,
      label: "Review the latest debrief",
    };
  }

  return {
    completedCount: projects.filter((project) => project.state === "completed")
      .length,
    totalCount: projects.length,
    primaryAction,
    projects,
  };
}
