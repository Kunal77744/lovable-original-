import type { RecentCodingAttempt } from "@/db/coding-practice";
import { CODING_PROBLEMS } from "@/lib/coding-problems";
import { CSS_PRACTICE_CHALLENGES } from "@/lib/css-practice-challenges";
import {
  GUIDED_PROJECT_SLUG,
  GUIDED_PROJECT_TITLE,
} from "@/lib/guided-project";

type CourseLesson = {
  slug: string;
  title: string;
  moduleTitle: string;
  completed: boolean;
  quizScore: number | null;
};

export type LearnerProfileCourse = {
  slug: string;
  title: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  courseCompleted: boolean;
  nextLesson: CourseLesson | null;
};

export type LearnerProfilePractice = {
  completedCount: number;
  totalCount: number;
  completedSlugs: string[];
};

export type LearnerProfileAction = {
  label: string;
  href: string;
  kicker: string;
  title: string;
  description: string;
};

export type LearnerProfileViewModel = {
  course: LearnerProfileCourse;
  practice: LearnerProfilePractice;
  cssPractice: LearnerProfilePractice;
  attempts: RecentCodingAttempt[];
  quizScore: number | null;
  isFreshLearner: boolean;
  nextAction: LearnerProfileAction;
};

export function buildLearnerProfile({
  course,
  practice,
  cssPractice,
  attempts,
  projectCompleted,
  htmlCssCapstone = { state: "completed", passedChecks: 6 },
}: {
  course: LearnerProfileCourse;
  practice: LearnerProfilePractice;
  cssPractice: LearnerProfilePractice;
  attempts: RecentCodingAttempt[];
  projectCompleted: boolean;
  htmlCssCapstone?: {
    state: "not-started" | "in-progress" | "completed";
    passedChecks: number;
  };
}): LearnerProfileViewModel {
  const quizScore = course.nextLesson?.quizScore ?? null;
  const isFreshLearner =
    course.completedLessons === 0 &&
    practice.completedCount === 0 &&
    cssPractice.completedCount === 0 &&
    attempts.length === 0 &&
    quizScore === null;

  if (!course.courseCompleted && course.nextLesson) {
    const hasQuizAttempt = quizScore !== null;

    return {
      course,
      practice,
      cssPractice,
      attempts,
      quizScore,
      isFreshLearner,
      nextAction: {
        label: hasQuizAttempt ? "Continue course" : "Start the course",
        href: `/learn/${course.slug}/${course.nextLesson.slug}`,
        kicker: hasQuizAttempt ? "Finish what you started" : "Your first step",
        title: course.nextLesson.title,
        description: hasQuizAttempt
          ? `Your best quiz result is ${quizScore}%. Return to the lesson and reach the 75% pass mark.`
          : "Build one semantic HTML page, then complete the four-question recall check.",
      },
    };
  }

  if (!projectCompleted) {
    return {
      course,
      practice,
      cssPractice,
      attempts,
      quizScore,
      isFreshLearner,
      nextAction: {
        label: "Build the field guide",
        href: `/projects/${GUIDED_PROJECT_SLUG}`,
        kicker: "Your practical next step",
        title: GUIDED_PROJECT_TITLE,
        description:
          "Turn the completed lesson into a private saved article, then revise it against six review checks.",
      },
    };
  }

  const completedSlugs = new Set(practice.completedSlugs);
  const nextProblem = CODING_PROBLEMS.find(
    (problem) => !completedSlugs.has(problem.slug),
  );

  if (nextProblem) {
    return {
      course,
      practice,
      cssPractice,
      attempts,
      quizScore,
      isFreshLearner,
      nextAction: {
        label: `Solve problem ${String(nextProblem.number).padStart(2, "0")}`,
        href: `/practice/${nextProblem.slug}`,
        kicker:
          practice.completedCount === 0
            ? "Keep the loop moving"
            : "Continue your practice streak",
        title: nextProblem.title,
        description: `Practice ${nextProblem.skill.toLowerCase()} and keep the accepted result on this record.`,
      },
    };
  }

  const completedCssSlugs = new Set(cssPractice.completedSlugs);
  const nextCssChallenge = CSS_PRACTICE_CHALLENGES.find(
    (challenge) => !completedCssSlugs.has(challenge.slug),
  );

  if (nextCssChallenge) {
    return {
      course,
      practice,
      cssPractice,
      attempts,
      quizScore,
      isFreshLearner,
      nextAction: {
        label: `Complete CSS ${String(nextCssChallenge.number).padStart(2, "0")}`,
        href: `/practice/css/${nextCssChallenge.slug}`,
        kicker:
          cssPractice.completedCount === 0
            ? "Finish the coding path"
            : "Continue your CSS practice",
        title: nextCssChallenge.title,
        description: `Practice ${nextCssChallenge.skill.toLowerCase()} and keep the completed result on this record.`,
      },
    };
  }

  if (htmlCssCapstone.state !== "completed") {
    return {
      course,
      practice,
      cssPractice,
      attempts,
      quizScore,
      isFreshLearner,
      nextAction: {
        label:
          htmlCssCapstone.state === "in-progress"
            ? "Resume the capstone"
            : "Build the capstone",
        href: "/projects/html-css-resource-library",
        kicker:
          htmlCssCapstone.state === "in-progress"
            ? `${htmlCssCapstone.passedChecks}/6 outcomes passing`
            : "Your integrated front-end result",
        title: "Learning resource library",
        description:
          "Combine semantic HTML, CSS grid, scoped selectors, and the box model in one private saved project.",
      },
    };
  }

  return {
    course,
    practice,
    cssPractice,
    attempts,
    quizScore,
    isFreshLearner,
    nextAction: {
      label: "Review the course",
      href: `/learn/${course.slug}/${course.nextLesson?.slug ?? ""}#revision-pack`,
      kicker: "Beginner set complete",
      title: "Make the result stick.",
      description:
        "Return to the revision summary and flashcards before starting your next learning goal.",
    },
  };
}
