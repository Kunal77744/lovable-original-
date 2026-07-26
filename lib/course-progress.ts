export type CourseLessonProgressInput = {
  id: string;
  slug: string;
  title: string;
  description: string;
  moduleTitle: string;
  position: number;
  estimatedMinutes: number;
  progressStatus: string | null;
  quizScore: number | null;
};

export type CourseLessonProgress = Omit<
  CourseLessonProgressInput,
  "progressStatus"
> & {
  completed: boolean;
};

export function buildCourseProgress(
  lessonRows: readonly CourseLessonProgressInput[],
) {
  const lessons: CourseLessonProgress[] = [...lessonRows]
    .sort((first, second) => first.position - second.position)
    .map(({ progressStatus, quizScore, ...lesson }) => ({
      ...lesson,
      completed: progressStatus === "completed",
      quizScore: quizScore ?? null,
    }));
  const completedLessons = lessons.filter((item) => item.completed).length;
  const totalLessons = lessons.length;
  const nextLesson =
    lessons.find((item) => !item.completed) ?? lessons.at(-1) ?? null;

  return {
    lessons,
    completedLessons,
    totalLessons,
    progressPercent:
      totalLessons === 0
        ? 0
        : Math.round((completedLessons / totalLessons) * 100),
    courseCompleted: totalLessons > 0 && completedLessons === totalLessons,
    nextLesson,
  };
}
