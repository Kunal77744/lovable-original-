import type { RecentCodingAttempt } from "@/db/coding-practice";
import { CODING_PROBLEMS } from "@/lib/coding-problems";

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
  attempts: RecentCodingAttempt[];
  quizScore: number | null;
  nextAction: LearnerProfileAction;
};

export function buildLearnerProfile({
  course,
  practice,
  attempts,
}: {
  course: LearnerProfileCourse;
  practice: LearnerProfilePractice;
  attempts: RecentCodingAttempt[];
}): LearnerProfileViewModel {
  const quizScore = course.nextLesson?.quizScore ?? null;

  if (!course.courseCompleted && course.nextLesson) {
    const hasQuizAttempt = quizScore !== null;

    return {
      course,
      practice,
      attempts,
      quizScore,
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

  const completedSlugs = new Set(practice.completedSlugs);
  const nextProblem = CODING_PROBLEMS.find(
    (problem) => !completedSlugs.has(problem.slug),
  );

  if (nextProblem) {
    return {
      course,
      practice,
      attempts,
      quizScore,
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

  return {
    course,
    practice,
    attempts,
    quizScore,
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
